import { Component, OnInit, OnDestroy } from '@angular/core';
import { TalkService } from 'src/app/services/talk.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { TalkContent } from './talk.content';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';

@Component({
  selector: 'app-talk',
  templateUrl: './talk.component.html',
  styleUrls: ['./talk.component.scss']
})

export class TalkComponent implements OnInit, OnDestroy {
  paramSub: Subscription;
  params: any;

  talkContentsObserver?: Observable<TalkContent[]>;
  talkContents: Array<TalkContent> = [];
  talkSub?: Subscription;

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
      this.talkContentsObserver = this.talkService.getTalkContentsObserver(params);
      this.talkSub = this.talkContentsObserver?.subscribe(async (talkContents) => {
        this.talkContents = talkContents;
        if (this.talkContents.length === 0) {
          this.isPage = false;
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToTalk({userName: currentUser?.userName || 'sansoohan'});
          return;
        }
        this.isLoading = false;
      });
      if (!this.talkSub) {
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
    this.talkSub?.unsubscribe();
  }
}
