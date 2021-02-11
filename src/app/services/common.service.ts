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
    return this.firestore.doc(path).update(Object.assign({}, content));
  }
  async delete(path: string): Promise<void> {
    return this.firestore.doc(path).delete();
  }
  async create(path: string, content: any): Promise<void> {
    content.ownerId = JSON.parse(localStorage.currentUser).uid;
    return this.firestore.collection(path).add(content)
    .then(async (collection) => {
      content.id = collection.id;
      return collection.update(Object.assign({}, content));
    });
  }
  async set(path: string, content: any): Promise<void> {
    content.id = JSON.parse(localStorage.currentUser).uid;
    content.ownerId = JSON.parse(localStorage.currentUser).uid;
    content.userName = JSON.parse(localStorage.currentUser).uid;
    return await this.firestore.doc(path).set(Object.assign({}, content));
  }
}
