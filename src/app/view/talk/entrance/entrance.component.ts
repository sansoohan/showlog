import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { TalkService } from 'src/app/services/talk.service';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
import * as firebase from 'firebase/app';
import { TalkContent } from '../talk.content';
import { RoomContent } from '../room/room.content';
import { AuthService } from 'src/app/services/auth.service';
const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-talk-entrance',
  templateUrl: './entrance.component.html',
  styleUrls: ['./entrance.component.scss']
})
export class EntranceComponent implements OnInit, OnDestroy {
  @Input() roomContents?: Array<RoomContent>;

  params: any;
  paramSub: Subscription;
  roomContentsObserver: any;
  roomContentsSub?: Subscription;
  blogId?: string;
  talkId?: string;

  dataDebugFlag = false;
  isPage = true;
  pageIndex = 0;
  pageSize = 20;
  roomCreatedAtList: Array<number> = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private talkService: TalkService,
    private authService: AuthService,
    private routerHelper: RouterHelper,
    public dataTransferHelper: DataTransferHelper,
  ) {
    this.paramSub = this.route.params.subscribe((params) => {
      this.params = params;
    });
  }

  @Input()
  get talkContent(): TalkContent|undefined { return this._talkContent; }
  set talkContent(talkContent: TalkContent|undefined) {
    if (!talkContent){
      this.isPage = false;
      return;
    }
    this.paramSub = this.route.params.subscribe((params) => {
      this.params = params;
      this._talkContent = talkContent;
      this.talkId = talkContent.id;
      this.roomCreatedAtList = talkContent?.roomCreatedAtList || [];
      // this.databaseRoot = `talks/${talkContent.id}/rooms/`;
      this.isPage = true;
      this.changePageList(null);
    });
  }
  // tslint:disable-next-line: variable-name
  private _talkContent?: TalkContent;

  async clickRemoveRoom(roomContent: RoomContent): Promise<void> {
    const roomCreatedAtList = Object.assign([], this.roomCreatedAtList).filter((createdAt) =>
      createdAt !== roomContent.createdAt);
    try {
      await Promise.all([
        this.talkService.delete(`talks/${this.talkId}/rooms/${roomContent.id}`, {}),
        this.talkService.update(`talks/${this.talkId}`, {roomCreatedAtList}),
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  goToRoom(roomId: string): void {
    if (!roomId) {
      return;
    }
    this.router.navigate(['talk', this.params.userName, 'room', roomId]);
  }

  async handleClickCreateRoom(): Promise<void> {
    const newRoom = new RoomContent();
    const {uid, userName} = this.authService.getCurrentUser();
    newRoom.userName = userName || '';
    newRoom.ownerId = uid || '';
    try {
      await Promise.all([
        this.talkService.create(`talks/${this.talkId}/rooms`, newRoom),
        this.talkService.update(`talks/${this.talkId}`, {
          roomCreatedAtList: [...this.roomCreatedAtList, newRoom.createdAt]
        }),
      ]);
      const params = Object.assign({}, this.params);
      params.roomId = newRoom.id;
      this.routerHelper.goToTalk(params);
    } catch (error) {
      console.error(error);
    }
  }

  changePageList(event: any): void {
    this.pageIndex = 0;
    this.pageSize = 20;
    if (event) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
    }

    if (this.roomContentsSub) {
      this.roomContentsSub.unsubscribe();
    }
    const selectedCreatedAtList = Object.assign([], this.roomCreatedAtList)
    .sort((createdA, createdB) => createdA - createdB)
    .splice(this.pageIndex * this.pageSize, this.pageSize);
    this.roomContentsObserver = this.talkService.select<RoomContent>(
      `talks/${this.talkId}/rooms`,
      {
        where: [{
          fieldPath: new FieldPath('createdAt'),
          operator: 'in',
          value: selectedCreatedAtList.length ? selectedCreatedAtList : [-1],
        }]
      } as CollectionSelect
    );
    this.roomContentsSub = this.roomContentsObserver?.subscribe((roomContents: any) => {
      this.roomContents = roomContents;
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.roomContentsSub?.unsubscribe();
  }
}
