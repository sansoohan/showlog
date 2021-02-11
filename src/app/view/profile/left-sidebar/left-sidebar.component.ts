import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { FormGroup } from '@angular/forms';
import { DataTransferHelper } from 'src/app/helper/data-transefer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import Identicon from 'identicon.js';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProfileContent } from '../profile.content';
import Swal from 'sweetalert2';
import { ProfileService } from 'src/app/services/profile.service';
import { ToastHelper } from 'src/app/helper/toast.helper';

@Component({
  selector: 'app-profile-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['../profile.component.css', './left-sidebar.component.css']
})
export class LeftSidebarComponent implements OnInit, OnDestroy {
  @Output() clickEditProfileStart: EventEmitter<null> = new EventEmitter();
  @Output() clickEditProfileUpdate: EventEmitter<null> = new EventEmitter();
  @Output() clickEditProfileAbort: EventEmitter<null> = new EventEmitter();
  @Output() clickAddAdditionalProfile: EventEmitter<null> = new EventEmitter();
  @Output() clickRemoveAdditionalProfile: EventEmitter<number> = new EventEmitter();
  @Input() isEditing: boolean;

  paramSub: Subscription;
  params: any;
  isPage: boolean;
  isLoading: boolean;
  defaultSrc: string | SafeUrl;
  profileContent: ProfileContent;

  constructor(
    public profileService: ProfileService,
    private toastHelper: ToastHelper,
    private route: ActivatedRoute,
    private domSanitizer: DomSanitizer,
    public authService: AuthService,
    public dataTransferHelper: DataTransferHelper,
    public routerHelper: RouterHelper,
    public formHelper: FormHelper,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      this.isLoading = true;
      this.params = params;
      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    });
  }

  @Input()
  get profileForm(): FormGroup { return this._profileForm; }
  set profileForm(profileForm: FormGroup) {
    this._profileForm = profileForm;
    this.profileContent = profileForm.value;
    if (profileForm.value.profileImageSrc !== ''){
      this.defaultSrc = profileForm.value.profileImageSrc;
    }
    else {
      const hash = profileForm.value.ownerId;
      const options = {
        // foreground: [0, 0, 0, 255],               // rgba black
        background: [230, 230, 230, 230],         // rgba white
        margin: 0.2,                              // 20% margin
        size: 420,                                // 420px square
        format: 'png'                             // use SVG instead of PNG
      };
      const data = new Identicon(hash, options).toString();
      this.defaultSrc = this.domSanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${data}`);
    }
  }
  // tslint:disable-next-line: variable-name
  _profileForm: FormGroup;

  handleClickEditProfileStart() {
    this.clickEditProfileStart.emit();
  }

  handleClickEditProfileAbort(){
    this.clickEditProfileAbort.emit();
  }

  handleClickEditProfileUpdate(){
    this.clickEditProfileUpdate.emit();
  }

  handleAddAdditionalProfile(){
    this.clickAddAdditionalProfile.emit();
  }

  handleRemoveAdditionalProfile(index){
    this.clickRemoveAdditionalProfile.emit(index);
  }

  handleClickStartUploadProfileImageSrc() {
    this.toastHelper.uploadImage('Select Your Profile Image', true).then(async (data) => {
      if (data.value) {
        this.profileService.uploadProfileImage(data.value, this.profileContent);
      }
      else if (data.dismiss === Swal.DismissReason.cancel) {
        this.toastHelper.askYesNo('Remove Profile Image', 'Are you sure?').then(result => {
          if (result.value) {
            this.profileService.removeProfileImage(this.profileContent)
            .then(() => {
              this.toastHelper.showSuccess('Profile Image Remove', 'Success!');
            })
            .catch(e => {
              this.toastHelper.showWarning('Profile Image Remove Failed.', e);
            });
          }
          else if (result.dismiss === Swal.DismissReason.cancel){

          }
        });
      }
    });
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }
}
