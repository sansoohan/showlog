import { Component, OnInit, OnDestroy } from '@angular/core';
import { TalkService } from 'src/app/services/talk.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { TalkContent } from './talk.content';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';
import * as firebase from 'firebase/app';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-talk',
  templateUrl: './talk.component.html',
  styleUrls: ['./talk.component.scss']
})

export class TalkComponent implements OnInit, OnDestroy {
  paramSub: Subscription;
  params: any;

  talkContentsObserver?: Observable<TalkContent[]>;
  talkContentsSub?: Subscription;
  talkContent?: TalkContent;

  isPage = true;
  isLoading = true;

  constructor(
    public authService: AuthService,
    public routerHelper: RouterHelper,
    private talkService: TalkService,
    private route: ActivatedRoute,
  ) {
    this.paramSub = this.route.params.subscribe((params) => {
      this.params = params;
      this.talkContentsObserver = this.talkService.select<TalkContent>(
        `talks`,
        {
          where: [{
            fieldPath: new FieldPath('userName'),
            operator: '==',
            value: params?.userName,
          }]
        } as CollectionSelect
      );
      this.talkContentsSub = this.talkContentsObserver?.subscribe((talkContents) => {
        if (talkContents.length === 0) {
          this.isPage = false;
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToTalk({userName: currentUser?.userName || 'sansoohan'});
          return;
        }

        this.talkContent = talkContents[0];
        this.isLoading = false;
      });
      if (!this.talkContentsSub) {
        const currentUser = this.authService.getCurrentUser();
        this.routerHelper.goToTalk({userName: currentUser?.userName || 'sansoohan'});
        return;
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.talkContentsSub?.unsubscribe();
  }
}
