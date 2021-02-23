import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class CommonStorage {
  storage: AngularFireStorage;
  constructor(
    storage: AngularFireStorage,
  ) {
    this.storage = storage;
  }

  newId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  }

  delete(path: string): Promise<void> {
    return this.storage.storage.ref(path).delete();
  }
  async upload(path: string, file: any): Promise<string> {
    await this.storage.upload(path, file);
    return await new Promise((resolve, reject) => {
      const fileRefSubscribe = this.storage.ref(path)
      .getDownloadURL().subscribe(postImageUrl => {
        fileRefSubscribe.unsubscribe();
        resolve(postImageUrl);
      });
    });
  }
}
