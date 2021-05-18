import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, zip, Observable } from 'rxjs';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { TalkService } from 'src/app/services/talk.service';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
import * as firebase from 'firebase/app';
import { TalkContent } from '../talk.content';
import { RoomContent } from '../room/room.content';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-talk-entrance',
  templateUrl: './entrance.component.html',
  styleUrls: ['./entrance.component.scss']
})
export class EntranceComponent implements OnInit, OnDestroy {
  params: any;
  paramSub: Subscription;
  roomContentsObservers?: Array<Observable<RoomContent[]>>;
  roomContentsSub?: Subscription;
  roomContents?: Array<RoomContent>;
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
        this.talkService.delete([
          environment.rootPath,
          `talks/${this.talkId}`,
          'rooms',
          roomContent.id,
        ].join('/'), {}),
        this.talkService.update([
          environment.rootPath,
          `talks/${this.talkId}`,
        ].join('/'), {roomCreatedAtList}),
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
        this.talkService.create([
          environment.rootPath,
          `talks/${this.talkId}`,
          'rooms',
        ].join('/'), newRoom),
        this.talkService.update([
          environment.rootPath,
          `talks/${this.talkId}`,
        ].join('/'), {
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

    const startIndex = this.pageIndex * this.pageSize;
    const selectedCreatedAtList = Object.assign([], this.roomCreatedAtList)
    .sort((createdA, createdB) => createdA - createdB)
    .splice(startIndex, startIndex + this.pageSize);

    this.roomContentsObservers = [];
    for (let index = 0; index < selectedCreatedAtList.length; index += 10) {
      const createdAtList = Object.assign([], selectedCreatedAtList).splice(index, index + 10);
      const commentContentsObserver = this.talkService.select<RoomContent>(
        [
          environment.rootPath,
          `talks/${this.talkId}`,
          'rooms',
        ].join('/'),
        {
          where: [{
            fieldPath: new FieldPath('createdAt'),
            operator: 'in',
            value: createdAtList.length ? createdAtList : [-1],
          }]
        } as CollectionSelect
      );

      this.roomContentsObservers.push(commentContentsObserver);
    }

    this.roomContents = [];
    this.roomContentsSub = zip(...this.roomContentsObservers)?.subscribe((roomContentsList) => {
      this.roomContents = [];
      roomContentsList.forEach((roomContents) => {
        this.roomContents = [...this.roomContents || [], ...roomContents];
        this.roomContents.sort((commentA: any, commentB: any) => commentB.createdAt - commentA.createdAt);
      });
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.roomContentsSub?.unsubscribe();
  }
}
