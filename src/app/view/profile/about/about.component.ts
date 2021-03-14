import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AboutContent, AboutSocial } from './about.content';
import { ProfileService } from 'src/app/services/profile.service';
import { ProfileContent } from '../profile.content';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
import * as firebase from 'firebase/app';
const FieldPath = firebase.default.firestore.FieldPath;

export type UserNameValidationError = {
  hasUserNameCollisionError?: boolean,
  hasUserNameCharacterError?: boolean,
};

@Component({
  selector: 'app-profile-about',
  templateUrl: './about.component.html',
  styleUrls: ['../profile.component.scss', './about.component.scss']
})
export class AboutComponent implements OnInit {
  @Input() aboutContent?: AboutContent;
  @Input() isEditing?: boolean;
  @Input() profileForm: any;
  @Output() validateUserName: EventEmitter<any> = new EventEmitter();

  userNameValidationError: UserNameValidationError;
  availableServiceURLs: Array<string>;
  newAboutSocial: AboutSocial = new AboutSocial();

  constructor(
    private profileService: ProfileService,
  ) {
    this.availableServiceURLs = [
      `${location.origin}/#/profile/`,
      `${location.origin}/#/blog/`,
      `${location.origin}/#/talk/`,
    ];
    this.userNameValidationError = {
      hasUserNameCollisionError: false,
      hasUserNameCharacterError: false,
    };
  }

  ngOnInit(): void {

  }

  async handleValidateUserName(event: any): Promise<any> {
    this.userNameValidationError.hasUserNameCollisionError = false;
    this.userNameValidationError.hasUserNameCharacterError
    = !/^[0-9a-zA-Z-_]{6,30}$/g.test(this.profileForm.value.userName);

    if (event.target.value) {
      await new Promise<void>((resolve) => {
        const tmpSubscription = this.profileService.select<ProfileContent>(
          `profiles`,
          {
            where: [{
              fieldPath: new FieldPath('userName'),
              operator: '==',
              value: event.target.value,
            }]
          } as CollectionSelect
        ).subscribe(
          ([profileContent]) => {
            if (profileContent && profileContent?.ownerId !== this.profileForm.value.ownerId){
              this.userNameValidationError.hasUserNameCollisionError = true;
            }
            tmpSubscription.unsubscribe();
          }
        );
        resolve();
      });
      this.validateUserName.emit(this.userNameValidationError);
    }
  }
}
