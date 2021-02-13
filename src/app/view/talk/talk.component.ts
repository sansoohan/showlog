import { Component, OnInit, OnDestroy } from '@angular/core';
import { TalkService } from 'src/app/services/talk.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { TalkContent } from './talk.content';
import { AuthService } from 'src/app/services/auth.service';

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
    private talkService: TalkService,
    private route: ActivatedRoute,
  ) {
    this.paramSub = this.route.params.subscribe((params) => {
      this.isPage = true;
      this.isLoading = true;
      this.params = params;
      this.talkContentsObserver = this.talkService.getTalkContentsObserver({params});
      this.talkSub = this.talkContentsObserver.subscribe(async (talkContents) => {
        this.talkContents = talkContents;
        if (this.talkContents.length === 0){
          const userUid = JSON.parse(localStorage.currentUser || null)?.uid;
          const isOwner = await this.authService.isOwner();
          if (!isOwner) {
            this.isPage = false;
            return;
          }
          this.talkService.set(`talks/${userUid}`, new TalkContent());
        }
        this.isLoading = false;
      });
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.talkSub?.unsubscribe();
  }
}
