import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { FormGroup } from '@angular/forms';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { Subscription, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import Identicon from 'identicon.js';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProfileContent } from '../profile.content';
import Swal from 'sweetalert2';
import { ProfileService } from 'src/app/services/profile.service';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { ImageContent } from 'src/app/helper/image.helper';
import { ImageStorage } from 'src/app/storages/image.storage';

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

  imageContentsObserver: Observable<ImageContent[]>;
  imageContents: ImageContent[];
  imageContentsSub: Subscription;

  constructor(
    public profileService: ProfileService,
    private toastHelper: ToastHelper,
    private route: ActivatedRoute,
    private domSanitizer: DomSanitizer,
    public authService: AuthService,
    public dataTransferHelper: DataTransferHelper,
    public routerHelper: RouterHelper,
    public formHelper: FormHelper,
    private imageStorage: ImageStorage,
  ) { }

  @Input()
  get profileForm(): FormGroup { return this._profileForm; }
  set profileForm(profileForm: FormGroup) {
    this._profileForm = profileForm;
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      this.isLoading = true;
      this.params = params;
      this.profileContent = profileForm.value;

      this.imageContentsObserver = this.imageStorage.getImageContentsObserver(
        `profiles/${this.profileContent.id}/images`
      );
      this.imageContentsSub = this.imageContentsObserver.subscribe((imageContents) => {
        this.imageContents = imageContents;
        if (imageContents.length === 0) {
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
        else {
          this.defaultSrc = imageContents[0].attributes.src;
        }
        this.isLoading = false;
      });
    });
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
        const _URL = window.URL || window.webkitURL;
        const img = new Image();
        const objectUrl = _URL.createObjectURL(data.value);
        img.src = objectUrl;
        img.onload = async () => {
          const path = `profiles/${this.profileContent.id}/images`;
          let profileImageContent = new ImageContent();
          profileImageContent.attributes.style = [
            `width:${img.width}px`,
            `height:${img.height}px`,
            `max-width:100%`,
            `object-fit:contain`,
          ].join(';');
          profileImageContent = await this.imageStorage.addImage(
            data.value, path, profileImageContent
          );
          profileImageContent.attributes.id = profileImageContent.id;
          _URL.revokeObjectURL(objectUrl);
          this.toastHelper.showSuccess('Profile Image Upload', 'Success!');
        };
      }
      else if (data.dismiss === Swal.DismissReason.cancel) {
        const path = `profiles/${this.profileContent.id}/images/${this.imageContents[0].id}`;
        this.toastHelper.askYesNo('Remove Profile Image', 'Are you sure?').then(result => {
          if (result.value) {
            Promise.all([
              this.imageStorage.delete(path),
              this.profileService.delete(path),
            ])
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
    this.imageContentsSub?.unsubscribe();
  }
}
