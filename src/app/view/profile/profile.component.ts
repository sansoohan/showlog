import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from 'src/app/services/profile.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProfileContent } from './profile.content';
import Swal from 'sweetalert2';
import { AdditionalProfileContent } from './additional-profiles/additional-profile.content';
import { FormHelper } from 'src/app/helper/form.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { BlogService } from 'src/app/services/blog.service';
import { TalkService } from 'src/app/services/talk.service';
import { UserNameValidationError } from './about/about.component';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
import * as firebase from 'firebase/app';
import { environment } from 'src/environments/environment';
const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileContentsObserver?: Observable<ProfileContent[]>;
  profileContents?: ProfileContent[];
  userNameValidationError?: UserNameValidationError;
  paramSub: Subscription;
  profileSub?: Subscription;
  params: any;
  profileForm: any;

  isEditing = false;
  isPage = true;
  isLoading = true;

  public newAdditionalProfileContent: AdditionalProfileContent = new AdditionalProfileContent();

  constructor(
    public profileService: ProfileService,
    public blogService: BlogService,
    public talkService: TalkService,
    private toastHelper: ToastHelper,
    public authService: AuthService,
    private route: ActivatedRoute,
    private formHelper: FormHelper,
    public routerHelper: RouterHelper,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.params = params;
      this.profileContentsObserver = this.profileService.select<ProfileContent>(
        [
          environment.rootPath,
          `profiles`,
        ].join('/'),
        {
          where: [{
            fieldPath: new FieldPath('userName'),
            operator: '==',
            value: params?.userName,
          }]
        } as CollectionSelect
      );
      this.profileSub = this.profileContentsObserver?.subscribe((profileContents) => {
        this.profileContents = profileContents;

        if (this.profileContents.length === 0) {
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToProfile({userName: currentUser?.userName || 'sansoohan'});
          return;
        }

        this.profileContents[0]?.projectsContent.projects.sort((a, b) => {
          if ((a.finishedAt || '9999-99') < (b.finishedAt || '9999-99')) {
            return 1;
          } else if ((a.finishedAt || '9999-99') > (b.finishedAt || '9999-99')) {
            return -1;
          } else {
            if ((a.startedAt || '9999-99') > (b.startedAt || '9999-99')) {
              return 1;
            } else if ((a.startedAt || '9999-99') < (b.startedAt || '9999-99')) {
              return -1;
            } else {
              return 0;
            }
          }
        });

        this.profileForm = this.formHelper.buildFormRecursively(this.profileContents[0]);
        this.isLoading = false;
      });
      if (!this.profileSub) {
        const currentUser = this.authService.getCurrentUser();
        this.routerHelper.goToProfile({userName: currentUser?.userName || 'sansoohan'});
      }
    });
  }

  handleAddAdditionalProfile(): void {
    this.profileForm?.controls.additionalProfilesContent.push(
      this.formHelper.buildFormRecursively(this.newAdditionalProfileContent)
    );
  }

  handleRemoveAdditionalProfile(index: number): void{
    this.toastHelper.askYesNo('Remove Profile Category', 'Are you sure?').then((result) => {
      if (result.value) {
        this.profileForm?.controls.additionalProfilesContent.removeAt(index);
      }
      else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    });
  }

  handleClickEditProfileStart(): void {
    this.isEditing = true;
  }

  handleClickEditProfileAbort(): void {
    this.isEditing = false;
  }

  handleValidateUserName(error: UserNameValidationError): void {
    this.userNameValidationError = error;
  }

  async handleClickEditProfileUpdate(): Promise<void> {
    this.toastHelper.askYesNo('Update Profile', 'Are you sure?').then((result) => {
      if (this.userNameValidationError?.hasUserNameCollisionError) {
        this.toastHelper.showError('Upate Fail', 'User URL is already registered.');
        return;
      }

      if (this.userNameValidationError?.hasUserNameCharacterError) {
        this.toastHelper.showError('Upate Fail', '(6 to 20 Length of Upper/Lower Alphabet, Number, -, _ can be used for Site Name)');
        return;
      }

      if (result.value) {
        if (this.isEditing) {
          const profileData = Object.assign({}, this.profileForm.value);
          const { uid } = this.authService.getCurrentUser();
          profileData.updatedFrom = {
            source: 'webclient',
            name: 'handleClickEditProfileUpdate',
            uid,
          };
          const { userName, ownerId, id } = profileData;
          Promise.all([
            this.isUserNameChanged() ? this.blogService.update(
              [
                environment.rootPath,
                'blogs',
                id,
              ].join('/'),
              {userName, ownerId}
            ) : null,

            this.isUserNameChanged() ? this.talkService.update(
              [
                environment.rootPath,
                'talks',
                id,
              ].join('/'),
              {userName, ownerId}
            ) : null,

            this.profileService
            .update(
              [
                environment.rootPath,
                `profiles/${id}`,
              ].join('/'),
              profileData,
            )
          ]
          .filter(Boolean))
          .then(() => {
            this.toastHelper.showSuccess('Profile Update', 'Success!');
            const currentUser = JSON.parse(localStorage.currentUser || null);
            currentUser.userName = this.profileForm.value.userName;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            this.routerHelper.goToProfile({});
          })
          .catch(e => {
            console.error(e);
            this.toastHelper.showWarning('Profile Update Failed.', e);
          });
        }
        this.isEditing = false;
      }
      else if (result.dismiss === Swal.DismissReason.cancel){

      }
    });
  }

  isUserNameChanged(): boolean {
    return this.profileForm.value.userName !== this.profileContents?.[0].userName;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }
}
