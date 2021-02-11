import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataTransferHelper } from 'src/app/helper/data-transefer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TalkContent } from '../talk.content';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-talk-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['../talk.component.css', './left-sidebar.component.css']
})
export class LeftSidebarComponent implements OnInit, OnDestroy {
  @Output() clickCreateRoom: EventEmitter<null> = new EventEmitter();
  @Output() clickJoinRoom: EventEmitter<null> = new EventEmitter();
  @Output() clickLeaveRoom: EventEmitter<null> = new EventEmitter();
  @Output() clickStartScreenSharing: EventEmitter<null> = new EventEmitter();
  @Output() clickStopScreenSharing: EventEmitter<null> = new EventEmitter();

  @Input() isInRoom: boolean;
  @Input() isScreenSharing: boolean;
  @Input() isMobileDevice: boolean;

  paramSub: Subscription;
  params: any;
  isPage: boolean;
  isLoading: boolean;
  talkContent: TalkContent;
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

  handleClickCreateRoom() {
    this.clickCreateRoom.emit();
  }

  handleClickJoinRoom() {
    this.clickJoinRoom.emit();
  }

  handleClickLeaveRoom() {
    this.clickLeaveRoom.emit();
  }

  handleClickStartScreenSharing() {
    this.clickStartScreenSharing.emit();
  }

  handleClickStopScreenSharing() {
    this.clickStopScreenSharing.emit();
  }

  clickBackToRoom() {
    const roomId = sessionStorage.getItem('beforeRoomId');
    this.routerHelper.goToUrl(
      `${window.location.origin}/#/talk/${this.params.userName}/room/${roomId}`
    );
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub.unsubscribe();
  }
}
