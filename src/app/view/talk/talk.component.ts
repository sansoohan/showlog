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
  styleUrls: ['./talk.component.css']
})

export class TalkComponent implements OnInit, OnDestroy {
  paramSub: Subscription;
  params: any;

  talkContentsObserver: Observable<TalkContent[]>;
  talkContents: Array<TalkContent>;
  talkSub: Subscription;

  isPage: boolean;
  isLoading: boolean;

  constructor(
    public authService: AuthService,
    public routerHelper: RouterHelper,
    private talkService: TalkService,
    private route: ActivatedRoute,
  ) {
    this.paramSub = this.route.params.subscribe((params) => {
      this.isPage = true;
      this.isLoading = true;
      this.params = params;
      this.talkContentsObserver = this.talkService.getTalkContentsObserver({params});
      this.talkSub = this.talkContentsObserver?.subscribe(async (talkContents) => {
        this.talkContents = talkContents;
        if (this.talkContents.length === 0) {
          const authUser = await this.authService.getAuthUser();
          const isExists = await this.talkService.isExists(`talks/${authUser.uid}`);
          if (!isExists) {
            await this.talkService.set(`talks/${authUser.uid}`, new TalkContent());
          }
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToTalk({userName: currentUser?.userName || 'sansoohan'});
        }
        this.isLoading = false;
      });
      if (!this.talkSub) {
        const currentUser = this.authService.getCurrentUser();
        this.routerHelper.goToTalk({userName: currentUser?.userName || 'sansoohan'});
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
