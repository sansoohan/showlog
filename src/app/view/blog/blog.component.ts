import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from './blog.content';
import { AuthService } from 'src/app/services/auth.service';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import * as firebase from 'firebase/app';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
import { environment } from 'src/environments/environment';
const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit, OnDestroy {
  blogContentsObserver?: Observable<BlogContent[]>;
  blogContentsSub?: Subscription;
  blogContent?: BlogContent;

  blogId?: string;
  isPage = true;
  canEdit = false;

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
      this.params = params;
      this.blogContentsObserver = this.blogService.select<BlogContent>(
        [
          environment.rootPath,
          `blogs`,
        ].join('/'),
        {
          where: [{
            fieldPath: new FieldPath('userName'),
            operator: '==',
            value: params.userName,
          }]
        } as CollectionSelect
      );
      this.blogContentsSub = this.blogContentsObserver?.subscribe((blogContents) => {
        if (!blogContents || blogContents.length === 0) {
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToBlogPrologue({userName: currentUser?.userName || 'sansoohan'});
          return;
        }

        this.blogContent = blogContents[0];
        this.authService.getAuthUser().then((authUser) => {
          this.canEdit = authUser?.uid === blogContents[0].ownerId;
        });
      });
      if (!this.blogContentsSub) {
        const currentUser = this.authService.getCurrentUser();
        this.routerHelper.goToBlogPrologue({userName: currentUser?.userName || 'sansoohan'});
      }
    });
  }

  ngOnInit(): void  {

  }

  ngOnDestroy(): void {
    this.blogContentsSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }
}
