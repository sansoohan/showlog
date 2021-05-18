import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastHelper } from '../helper/toast.helper';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { ProfileContent } from '../view/profile/profile.content';
import { BlogContent } from '../view/blog/blog.content';
import { TalkContent } from '../view/talk/talk.content';
import { CategoryContent } from '../view/blog/category/category.content';
import { environment } from 'src/environments/environment';
import * as firebase from 'firebase/app';
const FieldPath = firebase.default.firestore.FieldPath;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    public firestore: AngularFirestore,
    private router: Router,
    private toastHelper: ToastHelper,
    private afAuth: AngularFireAuth,
  ) { }

  resetPassword(): void {
    this.toastHelper.showPrompt('Reset Password', 'Please Enter your email').then(email => {
      this.afAuth.sendPasswordResetEmail(`${email}`, { url: `${window.location.origin}/sign-in` })
      .then(
        () => this.toastHelper.showInfo('Reset Password', 'A password reset link has been sent to your email address'),
        (rejectionReason) => this.toastHelper.showError('An error occurred while attempting to reset your password', rejectionReason))
      .catch(e => {
        this.toastHelper.showError('An error occurred while attempting to reset your password', e);
      });
    });
  }

  isSignedIn(): any {
    if (localStorage.getItem('currentUser')){
      return true;
    }
    else{
      return false;
    }
  }

  getAuthUserObserver(): Observable<any> {
    return this.afAuth.authState;
  }

  getAuthUser(): Promise<any> {
    return this.afAuth.currentUser;
  }

  async makeCollectionIfNotExist(uid: string): Promise<void> {
    const isExists = await this.isExists([
      environment.rootPath,
      'profiles',
      uid,
    ].join('/'));
    if (!isExists) {
      const authUser = await this.getAuthUser();

      // Init Profile Data
      await this.set([
        environment.rootPath,
        'profiles',
        authUser.uid,
      ].join('/'), new ProfileContent());

      // Init Profile Data
      await this.set([
        environment.rootPath,
        'talks',
        authUser.uid,
      ].join('/'), new TalkContent());

      // Init Blog Data
      await this.set([
        environment.rootPath,
        'blogs',
        authUser.uid,
      ].join('/'), new BlogContent());
      const newCategoryContent = new CategoryContent();
      newCategoryContent.id = this.newId();
      const newBlogContent = new BlogContent();
      newBlogContent.categoryMap = [newCategoryContent];
      await this.set([
        environment.rootPath,
        'blogs',
        authUser.uid
      ].join('/'), newBlogContent);
    }
  }

  async signInSuccess(event: any): Promise<void> {
    if (!event?.user) {
      return;
    }

    const profile: any = await this.firestore.doc([
      environment.rootPath,
      'profiles',
      event.user.uid,
    ].join('/')).get().toPromise();
    const currentUser = {
      providerData: event.user.providerData,
      email: event.user.email,
      emailVerified: event.user.emailVerified,
      phoneNumber: event.user.phoneNumber,
      photoURL: event.user.photoURL,
      displayName: event.user.displayName,
      uid: event.user.uid,
      userName: profile.data()?.userName || event.user.uid,
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    await this.makeCollectionIfNotExist(event.user.uid);
    this.toastHelper.showSuccess(`Hello ${currentUser.userName}`, '');
    this.router.navigate(['/profile', currentUser.userName]);
  }

  async getSlackSyncs(): Promise<any> {
    const {uid} = this.getCurrentUser();
    const ref = await this.firestore.doc<ProfileContent>([
      environment.rootPath,
      'profiles',
      uid,
    ].join('/')).get().toPromise();

    const res = ref?.data();
    return res?.slackSyncs || [];
  }

  async updateSlackSyncs(slackSyncs: Array<any>, updatedFrom: any): Promise<void> {
    const {uid} = this.getCurrentUser();
    await this.firestore.doc<ProfileContent>([
      environment.rootPath,
      'profiles',
      uid,
    ].join('/')).update({slackSyncs, updatedFrom});
  }

  getCurrentUser(): any {
    return JSON.parse(localStorage.getItem('currentUser') || '{}');
  }

  signInFailed(event: any): void {
    this.toastHelper.showError('Sign In failed', event.toast);
  }

  signUpSuccess(): void {
    this.toastHelper.showSuccess('Sign Up Success', '');
    this.router.navigate(['/sign-in']);
  }

  signUpFailed(event: any): void {
    if (event.code){
      this.toastHelper.showError('Sign up failed', event.toast);
    }
    else{
      this.signUpSuccess();
    }
  }

  onSignOut(): void {
    this.afAuth.signOut().then(() => {
      localStorage.removeItem('currentUser');
      this.router.navigate(['/sign-in']);
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
    const {uid, userName} = await this.getAuthUser() || {};
    content.id = uid;
    content.ownerId = uid;
    content.userName = userName || uid;
    return await this.firestore.doc(path).set(JSON.parse(JSON.stringify(content)));
  }

  async isExists(path: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const exists = (await this.firestore.doc(path).get().toPromise()).exists;
      resolve(exists);
    });
  }
}
