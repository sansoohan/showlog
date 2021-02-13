import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastHelper } from '../helper/toast.helper';
import { first } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  firestore: AngularFirestore;
  constructor(
    firestore: AngularFirestore,
  ) {
    this.firestore = firestore;
  }

  async update(path: string, content: any): Promise<void> {
    return this.firestore.doc(path).update(JSON.parse(JSON.stringify(content)));
  }
  async delete(path: string): Promise<void> {
    return this.firestore.doc(path).delete();
  }
  async create(path: string, content: any): Promise<void> {
    content.ownerId = JSON.parse(localStorage.currentUser).uid;
    return this.firestore.collection(path).add(JSON.parse(JSON.stringify(content)))
    .then(async (collection) => {
      content.id = collection.id;
      return collection.update(JSON.parse(JSON.stringify(content)));
    });
  }
  async set(path: string, content: any): Promise<void> {
    const {uid, userName} = JSON.parse(localStorage.currentUser);
    content.id = uid;
    content.ownerId = uid;
    content.userName = userName || uid;
    return await this.firestore.doc(path).set(JSON.parse(JSON.stringify(content)));
  }
}
