import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from 'src/app/services/profile.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProfileContent } from './profile.content';
import Swal from 'sweetalert2';
import { AdditaionProfileContent } from './additional-profiles/additional-profile.content';
import { FormHelper } from 'src/app/helper/form.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { ToastHelper } from 'src/app/helper/toast.helper';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileContentsObserver: Observable<ProfileContent[]>;
  profileContents: ProfileContent[];
  defaultSrc: any;
  isEditing: boolean;
  isPage: boolean;
  isLoading: boolean;
  hasUserNameCollision: boolean;
  hasUserEmailCollision: boolean;
  userEmail: string;
  validateUserName: string;
  validateUserEmail: string;
  paramSub: Subscription;
  profileSub: Subscription;
  params: any;
  profileForm: any;
  public newAdditaionProfileContent: AdditaionProfileContent = new AdditaionProfileContent();

  constructor(
    public profileService: ProfileService,
    private toastHelper: ToastHelper,
    public authService: AuthService,
    private route: ActivatedRoute,
    private formHelper: FormHelper,
    public routerHelper: RouterHelper,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.isLoading = true;
      this.isEditing = false;
      this.isPage = true;
      this.hasUserNameCollision = false;
      this.hasUserEmailCollision = false;
      this.params = params;
      this.profileContentsObserver = this.profileService.getProfileContentsObserver({params});
      this.profileSub = this.profileContentsObserver?.subscribe(async (profileContents) => {
        this.profileContents = profileContents;
        if (this.profileContents.length === 0) {
          const authUser = await this.authService.getAuthUser();
          const isExists = await this.profileService.isExists(`profiles/${authUser.uid}`);
          if (!isExists) {
            await this.profileService.set(`profiles/${authUser.uid}`, new ProfileContent());
          }
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToProfile({userName: currentUser?.userName || 'sansoohan'});
        }
        this.profileForm = this.formHelper.buildFormRecursively(this.profileContents[0]);
        this.isLoading = false;
      });
      if (!this.profileSub) {
        const currentUser = this.authService.getCurrentUser();
        this.routerHelper.goToProfile({userName: currentUser?.userName || 'sansoohan'});
      }
    });
  }

  handleAddAdditionalProfile(){
    this.profileForm?.controls.additaionProfilesContent.push(
      this.formHelper.buildFormRecursively(this.newAdditaionProfileContent)
    );
  }

  handleRemoveAdditionalProfile(index){
    this.toastHelper.askYesNo('Remove Profile Category', 'Are you sure?').then((result) => {
      if (result.value) {
        this.profileForm?.controls.additaionProfilesContent.removeAt(index);
      }
      else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    });
  }

  handleClickEditProfileStart() {
    this.isEditing = true;
  }

  handleClickEditProfileAbort() {
    this.isEditing = false;
  }

  handleKeyupUserName(hasCollision: boolean) {
    this.hasUserNameCollision = hasCollision;
  }

  async handleClickEditProfileUpdate() {
    this.toastHelper.askYesNo('Update Profile', 'Are you sure?').then((result) => {
      if (this.hasUserNameCollision) {
        this.toastHelper.showError('Upate Fail', 'User Name is already registered.');
        return;
      }

      if (result.value) {
        if (this.isEditing){
          this.profileService
          .update(
            `profiles/${this.profileForm.value.id}`,
            this.profileForm.value
          )
          .then(() => {
            this.toastHelper.showSuccess('Profile Update', 'Success!');
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

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }
}
