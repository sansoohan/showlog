import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export abstract class CommonService {
  authService: AuthService;
  firestore: AngularFirestore;
  constructor(
    authService: AuthService,
    firestore: AngularFirestore,
  ) {
    this.authService = authService;
    this.firestore = firestore;
  }
  async update(path: string, content: any): Promise<void> {
    return this.firestore.doc(path).update(JSON.parse(JSON.stringify(content)));
  }
  async delete(path: string): Promise<void> {
    return this.firestore.doc(path).delete();
  }
  async create(path: string, content: any): Promise<void> {
    content.ownerId = this.authService.getCurrentUser()?.uid;
    return this.firestore.collection(path).add(JSON.parse(JSON.stringify(content)))
    .then(async (collection) => {
      content.id = collection.id;
      return collection.update(JSON.parse(JSON.stringify(content)));
    });
  }
  async set(path: string, content: any): Promise<void> {
    const {uid, userName} = this.authService.getCurrentUser() || {};
    content.id = uid;
    content.ownerId = uid;
    content.userName = userName || uid;
    return await this.firestore.doc(path).set(JSON.parse(JSON.stringify(content)));
  }
  async isExists(path: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const content = await this.firestore.doc(path).get().toPromise();
      resolve(content.exists);
    });
  }
}
