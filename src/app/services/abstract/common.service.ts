import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import * as firebase from 'firebase/app';
import FieldPath = firebase.firestore.FieldPath;
import { AngularFireStorage } from '@angular/fire/storage';
import { CommonStorage } from 'src/app/storages/abstract/common.storage';

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
  async update(path: string, content: any): Promise<void> {
    return this.firestore.doc(path).update(JSON.parse(JSON.stringify(content)));
  }
  async delete(path = '', {
    parentKeyName = null, collectionPath = '', childrenStorage = [], children = []
  }): Promise<void> {
    const splitedPath = path.split(/\//g);
    const docId = splitedPath[splitedPath.length - 1];
    if (childrenStorage.length !== 0) {
      for (const childStorage of childrenStorage) {
        this.commonStorage.deleteFolderContents(`${path}/${childStorage}`);
        this.firestore.collection(`${path}/${childStorage}`).get().toPromise().then((querySnapshot) => {
          querySnapshot.docs.forEach((doc) => {
            doc.ref.delete();
          });
        });
      }
    }
    await this.firestore.doc(path).delete();
    children.forEach(async (child) => {
      const tmpObserver = this.firestore.collection(child.collectionPath,
        ref => ref.where(new FieldPath(child.parentKeyName), '==', docId)
      ).valueChanges();
      const tmpSubscriber = tmpObserver.subscribe(async (childContents: Array<any>) => {
        for (const childContent of childContents) {
          const nextPath = `${child.collectionPath}/${childContent.id}`;
          await this.delete(nextPath, child);
        }
        tmpSubscriber?.unsubscribe();
      });
    });
  }
  async create(path: string, content: any): Promise<void> {
    content.ownerId = this.authService.getCurrentUser()?.uid;
    return this.firestore.collection(path).add(JSON.parse(JSON.stringify(content)))
    .then(async (collection) => {
      content.id = collection.id;
      return collection.update(JSON.parse(JSON.stringify(content)));
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
    return await this.firestore.doc(path).set(JSON.parse(JSON.stringify(content)));
  }
  async isExists(path: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const content = await this.firestore.doc(path).get().toPromise();
      resolve(content.exists);
    });
  }
}
