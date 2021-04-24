import { Injectable, defineInjectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import * as firebase from 'firebase/app';
import { AngularFireStorage } from '@angular/fire/storage';
import { CommonStorage } from 'src/app/storages/abstract/common.storage';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const FieldPath = firebase.default.firestore.FieldPath;

export interface CollectionSelect {
  where: Array<CollectionWhere>;
  orderBy: Array<CollectionOrderBy>;
  limit: number;
}

interface CollectionWhere {
  fieldPath?: firebase.default.firestore.FieldPath;
  operator?: any;
  value?: any;
}

interface CollectionOrderBy {
  fieldPath: firebase.default.firestore.FieldPath;
  direction: string;
}

export interface CascadeDeleteOption {
  parentKeyName?: string|null;
  collectionPath?: string;
  childrenStorage?: Array<string>;
  children?: Array<CascadeDeleteOption|never>;
}

@Injectable({
  providedIn: 'root'
})
export abstract class CommonService {
  authService: AuthService;
  firestore: AngularFirestore;
  storage: AngularFireStorage;
  commonStorage: CommonStorage;
  constructor(
    authService: AuthService,
    firestore: AngularFirestore,
    storage: AngularFireStorage,
  ) {
    this.authService = authService;
    this.firestore = firestore;
    this.storage = storage;
    this.commonStorage = new CommonStorage(storage);
  }
  select<T>(path: string, clause?: CollectionSelect): Observable<T[]> {
    console.log(environment.rootPath + path);
    return this.firestore
    .collection<T>(environment.rootPath + path, ref => {
      let nextRef: any = ref;

      for (const where of clause?.where || []) {
        nextRef = nextRef?.where(
          where.fieldPath,
          where.operator,
          where.value,
        );
      }
      for (const orderBy of clause?.orderBy || []) {
        nextRef = nextRef?.orderBy(
          orderBy.fieldPath,
          orderBy.direction,
        );
      }
      if (clause?.limit) {
        nextRef = nextRef?.limit(clause.limit);
      }

      return nextRef;
    }
    ).valueChanges();
  }
  observe<T>(path: string): Observable<T|undefined> {
    console.log(path);
    return this.firestore.doc<T>(environment.rootPath + path).valueChanges();
  }
  async update(path: string, content: any): Promise<void> {
    return this.firestore.doc(environment.rootPath + path).update(JSON.parse(JSON.stringify(content)));
  }
  async delete(path = '', cascadeDeleteOption: CascadeDeleteOption): Promise<void> {
    const {
      parentKeyName,
      collectionPath,
      childrenStorage = [],
      children = [],
    } = cascadeDeleteOption;
    const splitedPath = path.split(/\//g);
    const docId = splitedPath[splitedPath.length - 1];
    if (childrenStorage.length !== 0) {
      for (const childStorage of childrenStorage) {
        this.commonStorage.deleteFolderContents(`${environment.rootPath + path}/${childStorage}`);
        this.firestore.collection(`${environment.rootPath + path}/${childStorage}`)
        .get().toPromise().then((querySnapshot) => {
          querySnapshot.docs.forEach((doc) => {
            doc.ref.delete();
          });
        });
      }
    }
    await this.firestore.doc(environment.rootPath + path).delete();
    children.forEach(async (child) => {
      if (child.collectionPath) {
        const tmpObserver = this.firestore.collection(environment.rootPath + child.collectionPath,
          ref => ref.where(new FieldPath(child?.parentKeyName || ''), '==', docId)
        ).valueChanges();
        const tmpSubscriber = tmpObserver.subscribe(async (childContents: Array<any>) => {
          for (const childContent of childContents) {
            const nextPath = `${child.collectionPath}/${childContent.id}`;
            await this.delete(nextPath, child);
          }
          tmpSubscriber?.unsubscribe();
        });
      }
    });
  }
  async create(path: string, content: any): Promise<void> {
    content.ownerId = this.authService.getCurrentUser()?.uid;
    return this.firestore.collection(environment.rootPath + path).add(JSON.parse(JSON.stringify(content)))
    .then(async (collection) => {
      content.id = collection.id;
      await collection.update(JSON.parse(JSON.stringify(content)));
    });
  }
  newId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  }
  async set(path: string, content: any): Promise<void> {
    const {uid} = this.authService.getCurrentUser() || {};
    content.ownerId = uid;
    await this.firestore.doc(environment.rootPath + path).set(JSON.parse(JSON.stringify(content)));
  }
  async get(path: string): Promise<any> {
    return this.firestore.doc(environment.rootPath + path).get().toPromise();
  }
  async isExists(path: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const content = await this.firestore.doc(environment.rootPath + path).get().toPromise();
      resolve(content.exists);
    });
  }
}
