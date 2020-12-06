import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
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
  searchValue: string;
  results: any;
  exampleUserName: string;

  isPage: boolean;
  params: any;
  paramSub: Subscription;

  isSearchValueSelected: boolean;
  selectedSearchName: string;

  // tslint:disable-next-line:no-shadowed-variable
  constructor(
    private firestore: AngularFirestore,
    private route: ActivatedRoute,
    public authService: AuthService,
    public routerHelper: RouterHelper,
    private domSanitizer: DomSanitizer,
  ) {
    this.searchValue = '';
    this.exampleUserName = 'sansoohan';
    this.isSearchValueSelected = false;
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      if (this.authService.isSignedIn()) {
        this.params = params;
      } else {
        this.params = { userName: 'sansoohan' };
      }
    });
  }

  closeSearchListDropDown() {
    this.searchValue = '';
    this.isSearchValueSelected = false;
  }
  closeProfileLinkDropDown() {
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
        this.results = null;
        return;
      }

      this.results = this.firestore.collection('profiles', ref => ref
      .orderBy(new firebase.firestore.FieldPath('aboutContent', 'userName'))
      .limit(10)
      .startAt(this.searchValue)
      .endAt(this.searchValue + '\uf8ff'))
      .valueChanges();
    }
  }
  toggleSearchValueSelected(isSelected: boolean): void{
    this.isSearchValueSelected = isSelected;
  }
}