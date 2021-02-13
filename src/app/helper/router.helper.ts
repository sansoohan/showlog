import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class RouterHelper {
  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller,
  ) { }

  goToUrl(url: string): void {
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate([url.replace(`${window.location.origin}/#`, '')]).finally(() => {
      this.router.onSameUrlNavigation = 'ignore'; // Restore config after navigation completes
    });
  }

  goToTalk(params: any): void {
    this.router.onSameUrlNavigation = 'reload';
    const currentUser = JSON.parse(localStorage.currentUser || null);
    const queryUser = currentUser?.userName || currentUser?.uid || params?.userName || 'sansoohan';
    this.router.navigate([
      '/talk', queryUser, params.roomId ? 'room' : null, params.roomId,
    ].filter(Boolean)).finally(() => {
      // this.router.onSameUrlNavigation = 'ignore'; // Restore config after navigation completes
    });
  }

  goToProfile(params: any): void {
    this.router.onSameUrlNavigation = 'reload';
    const currentUser = JSON.parse(localStorage.currentUser || null);
    const queryUser = currentUser?.userName || currentUser?.uid || params?.userName || 'sansoohan';
    this.router.navigate(['/profile', queryUser]).finally(() => {
      this.router.onSameUrlNavigation = 'ignore'; // Restore config after navigation completes
    });
  }

  goToBlogPrologue(params: any): void {
    this.router.onSameUrlNavigation = 'reload';
    const currentUser = JSON.parse(localStorage.currentUser || null);
    const queryUser = currentUser?.userName || currentUser?.uid || params?.userName || 'sansoohan';
    this.router.navigate(['/blog', queryUser]).finally(() => {
      this.router.onSameUrlNavigation = 'ignore'; // Restore config after navigation completes
    });
  }

  goToBlogCategory(params: any, categoryId: string): void {
    this.router.onSameUrlNavigation = 'reload';
    const currentUser = JSON.parse(localStorage.currentUser || null);
    const queryUser = currentUser?.userName || currentUser?.uid || params?.userName;
    this.router.navigate(['/blog', queryUser, 'category', categoryId]).finally(() => {
      this.router.onSameUrlNavigation = 'ignore'; // Restore config after navigation completes
    });
  }

  goToBlogCategoryNewPost(params: any, categoryId: string): void {
    this.router.onSameUrlNavigation = 'reload';
    const currentUser = JSON.parse(localStorage.currentUser || null);
    const queryUser = currentUser?.userName || currentUser?.uid || params?.userName;
    this.router.navigate(
      ['/blog', queryUser, 'category', categoryId],
      {
        queryParams: { isCreatingPost: 'true' },
      }
      ).finally(() => {
        this.router.onSameUrlNavigation = 'ignore'; // Restore config after navigation completes
      }
    );
  }

  goToBlogPost(params: any, postId: string): void {
    this.router.onSameUrlNavigation = 'reload';
    const currentUser = JSON.parse(localStorage.currentUser || null);
    const queryUser = currentUser?.userName || currentUser?.uid || params?.userName;
    this.router.navigate(['/blog', queryUser, 'post', postId]).finally(() => {
      this.router.onSameUrlNavigation = 'ignore'; // Restore config after navigation completes
    });
  }

  scrollToIdElement(profileTitle: string): void {
    setTimeout(() => {
      this.viewportScroller.scrollToAnchor(profileTitle);
    }, 10);
  }
}
