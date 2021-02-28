import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ToastHelper } from '../helper/toast.helper';
import { ProfileContent } from '../view/profile/profile.content';
import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase/app';
import FieldPath = firebase.firestore.FieldPath;
import { CommonService } from './abstract/common.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService extends CommonService {
  profileUpdateState: string = null;
  constructor(
    public firestore: AngularFirestore,
    public authService: AuthService,
    public storage: AngularFireStorage,
  ) {
    super(authService, firestore, storage);
  }

  getUserEmailCollisionObserver(userEmail: string): Observable<ProfileContent[]> {
    let userEmailCollisionObserver: Observable<ProfileContent[]>;
    userEmailCollisionObserver = this.firestore
    .collection<ProfileContent>('profiles', ref => ref
    .where(new FieldPath('email'), '==', userEmail))
    .valueChanges();
    return userEmailCollisionObserver;
  }

  getUserNameCollisionObserver(userName: string): Observable<ProfileContent[]> {
    return this.firestore
    .collection<ProfileContent>('profiles', ref => ref
    .where(new FieldPath('userName'), '==', userName))
    .valueChanges();
  }

  getProfileContentsObserver({params = null}): Observable<ProfileContent[]> {
    let profileContentsObserver: Observable<ProfileContent[]>;
    const queryUserName = params?.userName;
    if (queryUserName){
      profileContentsObserver = this.firestore
      .collection<ProfileContent>('profiles', ref => ref
      .where(new FieldPath('userName'), '==', queryUserName))
      .valueChanges();
    }
    return profileContentsObserver;
  }
}
