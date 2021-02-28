import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import * as firebase from 'firebase';
import Identicon from 'identicon.js';
import { Subscription } from 'rxjs';
import { RouterHelper } from 'src/app/helper/router.helper';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isPage: boolean;
  params: any;
  paramSub: Subscription;

  // Search
  isSearchValueSelected: boolean;
  selectedSearchName: string;
  searchValue: string;
  searchResults: any;

  // tslint:disable-next-line:no-shadowed-variable
  constructor(
    private firestore: AngularFirestore,
    public authService: AuthService,
    public routerHelper: RouterHelper,
    private domSanitizer: DomSanitizer,
    public router: Router,
  ) {
    this.searchValue = '';
    this.isSearchValueSelected = false;
  }

  blurSearchListDropDown(event) {
    const beforeValue = event?.target?.value;
    setTimeout(() => {
      if (beforeValue === this.searchValue) {
        this.closeSearchListDropDown();
      }
    }, 100);
  }

  closeSearchListDropDown() {
    this.searchValue = '';
    this.isSearchValueSelected = false;
  }

  async setSearchValue(searchValue) {
    this.isSearchValueSelected = true;
    this.searchValue = searchValue;
  }

  getSearchProfileImage(searchProfile) {
    let profileImageSrc;
    if (searchProfile.profileImageSrc !== '') {
      profileImageSrc = searchProfile.profileImageSrc;
    }
    else {
      const hash = searchProfile.ownerId;
      const options = {
        // foreground: [0, 0, 0, 255],               // rgba black
        background: [230, 230, 230, 230],         // rgba white
        margin: 0.2,                              // 20% margin
        size: 420,                                // 420px square
        format: 'png'                             // use SVG instead of PNG
      };
      const data = new Identicon(hash, options).toString();
      profileImageSrc = this.domSanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${data}`);
    }
    return profileImageSrc;
  }

  changeSearch(event: any): void{
    this.isSearchValueSelected = false;
    if (!event.key){
      this.isSearchValueSelected = true;
      this.searchValue = event.target.value;
      return;
    }

    if (event.target.value){
      this.searchValue = event.target.value;
      if (this.searchValue === ''){
        this.searchResults = null;
        return;
      }

      this.searchResults = this.firestore.collection('profiles', ref => ref
      .orderBy(new firebase.firestore.FieldPath('userName'))
      .limit(10)
      .startAt(this.searchValue)
      .endAt(this.searchValue + '\uf8ff'))
      .valueChanges();
    }
  }
  toggleSearchValueSelected(isSelected: boolean): void{
    this.isSearchValueSelected = isSelected;
  }
  goToProfile(params): void {
    this.closeSearchListDropDown();
    this.routerHelper.goToProfile(params);
  }
  goToBlogPrologue(params): void {
    this.closeSearchListDropDown();
    this.routerHelper.goToBlogPrologue(params);
  }
  goToTalk(params): void {
    this.closeSearchListDropDown();
    this.routerHelper.goToTalk(params);
  }
}
