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

  getAuthUserObserver(): Observable<firebase.User> {
    return this.afAuth.authState;
  }

  getAuthUser(): Promise<firebase.User> {
    return this.afAuth.currentUser;
  }

  async makeCollectionIfNotExist(uid: string): Promise<void> {
    const isExists = await this.isExists(`profiles/${uid}`);
    if (!isExists) {
      const authUser = await this.getAuthUser();

      // Init Profile Data
      await this.set(`profiles/${authUser.uid}`, new ProfileContent());

      // Init Profile Data
      await this.set(`talks/${authUser.uid}`, new TalkContent());

      // Init Blog Data
      await this.set(`blogs/${authUser.uid}`, new BlogContent());
      const newCategoryContent = new CategoryContent();
      newCategoryContent.blogId = authUser.uid;
      await this.create(`blogs/${authUser.uid}/categories`, newCategoryContent);
      const newBlogContent = new BlogContent();
      newBlogContent.categoryOrder.push(newCategoryContent.id);
      await this.set(`blogs/${authUser.uid}`, newBlogContent);
    }
  }

  async signInSuccess(event): Promise<void> {
    const profile: any = await this.firestore.doc(`profiles/${event.uid}`).get().toPromise();
    const currentUser = {
      providerData: event.providerData,
      email: event.email,
      emailVerified: event.emailVerified,
      phoneNumber: event.phoneNumber,
      photoURL: event.photoURL,
      displayName: event.displayName,
      uid: event.uid,
      userName: profile.data()?.userName || event.uid,
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    await this.makeCollectionIfNotExist(event.uid);
    this.toastHelper.showSuccess(`Hello ${currentUser.userName}`, null);
    this.router.navigate(['/profile', currentUser.userName]);
  }

  getCurrentUser(): any {
    return JSON.parse(localStorage.getItem('currentUser') || null);
  }

  signInFailed(event): void {
    this.toastHelper.showError('Sign In failed', event.toast);
  }

  signUpSuccess(): void {
    this.toastHelper.showSuccess('Sign Up Success', null);
    this.router.navigate(['/sign-in']);
  }

  signUpFailed(event): void {
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

  async create(path: string, content: any): Promise<void> {
    content.ownerId = this.getCurrentUser()?.uid;
    return this.firestore.collection(path).add(JSON.parse(JSON.stringify(content)))
    .then(async (collection) => {
      content.id = collection.id;
      return collection.update(JSON.parse(JSON.stringify(content)));
    });
  }

  async set(path: string, content: any): Promise<void> {
    const {uid, userName} = this.getCurrentUser() || {};
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
