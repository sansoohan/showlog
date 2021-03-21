import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TalkContent } from '../talk.content';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-talk-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['../talk.component.scss', './left-sidebar.component.scss']
})
export class LeftSidebarComponent implements OnInit, OnDestroy {
  // In Entrance
  @Output() clickCreateRoom: EventEmitter<null> = new EventEmitter();

  // In Room
  @Output() clickLeaveRoom: EventEmitter<null> = new EventEmitter();
  @Output() clickStartScreenSharing: EventEmitter<null> = new EventEmitter();
  @Output() clickStopScreenSharing: EventEmitter<null> = new EventEmitter();
  @Output() clickStartRecording: EventEmitter<null> = new EventEmitter();
  @Output() clickStopRecording: EventEmitter<null> = new EventEmitter();
  @Output() clickDownloadRecord: EventEmitter<null> = new EventEmitter();
  @Input() isInRoom?: boolean;
  @Input() isScreenSharing?: boolean;
  @Input() isRecording?: boolean;
  @Input() isFinishedRecording?: boolean;
  @Input() isMobileDevice?: boolean;

  paramSub: Subscription;
  params: any;
  isPage?: boolean;
  isLoading?: boolean;
  talkContent?: TalkContent;
  sessionStorage: Storage;

  constructor(
    public profileService: ProfileService,
    private route: ActivatedRoute,
    public authService: AuthService,
    public dataTransferHelper: DataTransferHelper,
    public routerHelper: RouterHelper,
    public formHelper: FormHelper,
  ) {
    this.sessionStorage = window.sessionStorage;
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      this.isLoading = true;
      this.params = params;
      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    });
  }

  // In Entrance
  handleClickCreateRoom(): void {
    this.clickCreateRoom.emit();
  }

  // In Room
  handleClickLeaveRoom(): void {
    this.clickLeaveRoom.emit();
  }

  handleClickStartScreenSharing(): void {
    this.clickStartScreenSharing.emit();
  }

  handleClickStopScreenSharing(): void {
    this.clickStopScreenSharing.emit();
  }

  handleClickStartRecording(): void {
    this.clickStartRecording.emit();
  }

  handleClickStopRecording(): void {
    this.clickStopRecording.emit();
  }

  handleClickDownloadRecord(): void {
    this.clickDownloadRecord.emit();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub.unsubscribe();
  }
}
