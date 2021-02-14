import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ToastHelper } from '../helper/toast.helper';
import { ProfileContent } from '../view/profile/profile.content';
import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase/app';
import FieldPath = firebase.firestore.FieldPath;
import { CommonService } from './common.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService extends CommonService {
  profileUpdateState: string = null;
  constructor(
    public firestore: AngularFirestore,
    public authService: AuthService,
    private toastHelper: ToastHelper,
    private storage: AngularFireStorage,
  ) {
    super(authService, firestore);
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
    let userNameCollisionObserver: Observable<ProfileContent[]>;
    userNameCollisionObserver = this.firestore
    .collection<ProfileContent>('profiles', ref => ref
    .where(new FieldPath('userName'), '==', userName))
    .valueChanges();
    return userNameCollisionObserver;
  }

  getProfileContentsObserver({params = null}): Observable<ProfileContent[]> {
    let profileContentsObserver: Observable<ProfileContent[]>;
    const currentUser = this.authService.getCurrentUser();
    const queryUserName = currentUser?.userName || params?.userName;
    if (queryUserName){
      profileContentsObserver = this.firestore
      .collection<ProfileContent>('profiles', ref => ref
      .where(new FieldPath('userName'), '==', queryUserName))
      .valueChanges();
    }
    else if (currentUser?.uid){
      profileContentsObserver = this.firestore
      .collection<ProfileContent>('profiles', ref => ref.where('ownerId', '==', currentUser?.uid))
      .valueChanges();
    }

    return profileContentsObserver;
  }

  async uploadProfileImage(file: File, profileContent: ProfileContent): Promise<void> {
    const filePath = `profiles/${JSON.parse(localStorage.currentUser).uid}/profileImage/${file.name}`;
    const MB = 1024 * 1024;
    if (file.size > 4 * MB) {
      this.toastHelper.showError('Profile Image', 'Please Upload under 4MB');
      return;
    }

    const fileRef = this.storage.ref(filePath);
    await this.storage.upload(filePath, file);
    const fileRefSubscribe = fileRef.getDownloadURL().subscribe(imageUrl => {
      profileContent.profileImageSrc = imageUrl;
      this.update(
        `profiles/${profileContent.id}`,
        profileContent
      );
      this.toastHelper.showSuccess('Profile Image', 'Your Profile Image is uploaded!');
      fileRefSubscribe.unsubscribe();
    });
  }

  async removeProfileImage(profileContent: ProfileContent): Promise<void> {
    const dirPath = `profiles/${JSON.parse(localStorage.currentUser).uid}/profileImage`;
    const dirRef = this.storage.ref(dirPath);
    const dirRefSubscribe = dirRef.listAll().subscribe(dir => {
      dir.items.forEach(item => item.delete());
      profileContent.profileImageSrc = '';
      this.update(
        `profiles/${profileContent.id}`,
        profileContent
      );
      this.toastHelper.showInfo('Profile Image', 'Your Profile Image is removed!');
      dirRefSubscribe.unsubscribe();
    });
  }
}
