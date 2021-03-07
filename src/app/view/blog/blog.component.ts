import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from './blog.content';
import { AuthService } from 'src/app/services/auth.service';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit, OnDestroy {
  blogContentsObserver: Observable<BlogContent[]>;
  blogContents: BlogContent[];
  blogContensSub: Subscription;

  blogId: string;
  isPage: boolean;
  canEdit: boolean;

  paramSub: Subscription;
  params: any;

  constructor(
    private route: ActivatedRoute,
    public formHelper: FormHelper,
    public dataTransferHelper: DataTransferHelper,
    public routerHelper: RouterHelper,
    private blogService: BlogService,
    public authService: AuthService,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      this.params = params;

      this.blogContentsObserver = this.blogService.getBlogContentsObserver({params});
      this.blogContensSub = this.blogContentsObserver?.subscribe(async (blogContents) => {
        this.blogContents = blogContents;
        this.blogContents = blogContents;
        if (this.blogContents.length === 0) {
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToBlogPrologue({userName: currentUser?.userName || 'sansoohan'});
          return;
        }

        this.canEdit = false;
        this.authService.getAuthUser().then((authUser) => {
          this.canEdit = authUser?.uid === blogContents[0].ownerId;
        });

        this.blogId = this.blogContents[0].id;
      });
      if (!this.blogContensSub) {
        const currentUser = this.authService.getCurrentUser();
        this.routerHelper.goToBlogPrologue({userName: currentUser?.userName || 'sansoohan'});
      }
    });
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.blogContensSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }
}
