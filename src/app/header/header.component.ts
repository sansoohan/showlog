import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import * as firebase from 'firebase';
import Identicon, { IdenticonOptions } from 'identicon.js';
import { Subscription } from 'rxjs';
import { RouterHelper } from 'src/app/helper/router.helper';
import { DomSanitizer } from '@angular/platform-browser';

const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  params: any;
  paramSub?: Subscription;

  selectedSearchName?: string;
  searchValue: string;
  searchResults: any;

  isPage = true;
  isSearchValueSelected = false;

  // eslint-disable-next-line no-shadow
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

  blurSearchListDropDown(event: any): void {
    const beforeValue = event?.target?.value;
    setTimeout(() => {
      if (beforeValue === this.searchValue) {
        this.closeSearchListDropDown();
      }
    }, 100);
  }

  closeSearchListDropDown(): void {
    this.searchValue = '';
    this.isSearchValueSelected = false;
  }

  setSearchValue(searchValue: string): void {
    this.isSearchValueSelected = true;
    this.searchValue = searchValue;
  }

  getSearchProfileImage(searchProfile: any): void {
    let profileImageSrc;
    if (searchProfile.profileImageSrc !== '') {
      profileImageSrc = searchProfile.profileImageSrc;
    }
    else {
      const hash = searchProfile.ownerId;
      const options: IdenticonOptions = {
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
      .orderBy(new FieldPath('userName'))
      .limit(10)
      .startAt(this.searchValue)
      .endAt(this.searchValue + '\uf8ff'))
      .valueChanges();
    }
  }
  toggleSearchValueSelected(isSelected: boolean): void{
    this.isSearchValueSelected = isSelected;
  }
  goToProfile(params: any): void {
    this.closeSearchListDropDown();
    this.routerHelper.goToProfile(params);
  }
  goToBlogPrologue(params: any): void {
    this.closeSearchListDropDown();
    this.routerHelper.goToBlogPrologue(params);
  }
  goToTalk(params: any): void {
    this.closeSearchListDropDown();
    this.routerHelper.goToTalk(params);
  }
}
