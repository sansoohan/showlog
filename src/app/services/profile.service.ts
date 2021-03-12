import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ToastHelper } from '../helper/toast.helper';
import { ProfileContent } from '../view/profile/profile.content';
import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase/app';
import { CommonService } from './abstract/common.service';
import { AuthService } from './auth.service';

const FieldPath = firebase.default.firestore.FieldPath;

@Injectable({
  providedIn: 'root'
})
export class ProfileService extends CommonService {
  constructor(
    public firestore: AngularFirestore,
    public authService: AuthService,
    public storage: AngularFireStorage,
  ) {
    super(authService, firestore, storage);
  }

  getUserEmailCollisionObserver(userEmail: string): Observable<ProfileContent[]> {
    return this.firestore
    .collection<ProfileContent>('profiles', ref => ref
    .where(new FieldPath('email'), '==', userEmail))
    .valueChanges();
  }

  getUserNameCollisionObserver(userName: string): Observable<ProfileContent[]> {
    return this.firestore
    .collection<ProfileContent>('profiles', ref => ref
    .where(new FieldPath('userName'), '==', userName))
    .valueChanges();
  }

  getProfileContentsObserver(params: any): Observable<ProfileContent[]>|undefined {
    const queryUserName = params?.userName;
    if (!queryUserName) {
      return;
    }
    return this.firestore
    .collection<ProfileContent>('profiles', ref => ref
    .where(new FieldPath('userName'), '==', queryUserName))
    .valueChanges();
  }
}
