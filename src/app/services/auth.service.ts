import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastHelper } from '../helper/toast.helper';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userSub: Subscription;

  constructor(
    private router: Router,
    private toastHelper: ToastHelper,
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

  signInSuccess(event): void {
    const currentUser = {
      providerData: event.providerData,
      email: event.email,
      emailVerified: event.emailVerified,
      phoneNumber: event.phoneNumber,
      photoURL: event.photoURL,
      displayName: event.displayName,
      uid: event.uid
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    this.toastHelper.showSuccess(`Hello ${currentUser.displayName || currentUser.email}`, null);
    this.router.navigate(['/profile']);
  }

  setUsernameFromContent(content: any): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.userName = content?.userName;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
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
