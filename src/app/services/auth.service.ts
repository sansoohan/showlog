import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastHelper } from '../helper/toast.helper';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
import { CommonService } from './common.service';
import { ProfileService } from './profile.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { first } from 'rxjs/operators';
import { ProfileContent } from '../view/profile/profile.content';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userSub: Subscription;

  constructor(
    private router: Router,
    private toastHelper: ToastHelper,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) { }

  /**
   * Initiate the password reset process for this user
   * @param email email of the user
   */
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

  async isOwner(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.isSignedIn()) {
        return resolve(false);
      }

      this.userSub?.unsubscribe();
      const authUser = await this.getAuthUser();
      const currentUser = this.getCurrentUser();
      resolve(currentUser?.uid === authUser?.uid);
    });
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
}
