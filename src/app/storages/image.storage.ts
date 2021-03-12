import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ToastHelper } from '../helper/toast.helper';
import { AngularFireStorage } from '@angular/fire/storage';
import { ImageContent } from '../helper/image.helper';
import { AuthService } from '../services/auth.service';
import { CommonStorage } from './abstract/common.storage';

@Injectable({
  providedIn: 'root'
})
export class ImageStorage extends CommonStorage {
  constructor(
    public firestore: AngularFirestore,
    public storage: AngularFireStorage,
    private authService: AuthService,
    private toastHelper: ToastHelper,
  ) {
    super(storage);
  }

  async addImage(file: File, path: string, content: ImageContent): Promise<ImageContent> {
    return new Promise(async (resolve, reject) => {
      if (!this.authService.isSignedIn()) {
        reject('SignIn Error');
      }

      const MB = 1024 * 1024;
      if (file.size > 10 * MB) {
        this.toastHelper.showError('Image', 'Please Upload under 10MB');
        reject('Please Upload under 10MB');
      }

      content.ownerId = this.authService.getCurrentUser()?.uid;
      content.id = this.newId();
      const filePath = `${path}/${content.id}`;
      const src = await this.upload(filePath, file).catch((e) => reject(e));
      content.attributes.src = src;
      await this.firestore.doc<ImageContent>(filePath).set(Object.assign({}, content)).catch((e) => reject(e));
      resolve(content);
    });
  }

  getImageContentsObserver(path: string): Observable<any[]> {
    return this.firestore.collection<ImageContent>(path).valueChanges();
  }
}
