import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AboutContent, AboutSocial } from './about.content';
import { ProfileService } from 'src/app/services/profile.service';

export type UserNameValidationError = {
  hasUserNameCollisionError?: boolean,
  hasUserNameCharacterError?: boolean,
};

@Component({
  selector: 'app-profile-about',
  templateUrl: './about.component.html',
  styleUrls: ['../profile.component.css', './about.component.css']
})
export class AboutComponent implements OnInit {
  @Input() aboutContent: AboutContent;
  @Input() isEditing: boolean;
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

  ngOnInit() {
  }

  async handleValidateUserName(event): Promise<void> {
    this.userNameValidationError.hasUserNameCollisionError = false;
    this.userNameValidationError.hasUserNameCharacterError
    = !/^[0-9a-zA-Z-_]{6,30}$/g.test(this.profileForm.value.userName);

    if (event.target.value) {
      await new Promise((resolve) => {
        const tmpSubscription = this.profileService.getUserNameCollisionObserver(event.target.value).subscribe(
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
