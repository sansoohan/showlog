import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PostContent } from '../post/post.content';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from '../blog.content';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
// import 'moment/locale/de';

@Component({
  selector: 'app-blog-prologue',
  templateUrl: './prologue.component.html',
  styleUrls: ['../blog.component.scss', './prologue.component.scss']
})
export class PrologueComponent implements OnInit, OnDestroy {
  @Input() canEdit?: boolean;

  postListObserver?: Observable<PostContent[]>;
  postList?: PostContent[];
  postListSub?: Subscription;
  postListForm: any;

  blogId?: string;
  newPostConent = new PostContent();
  paramSub: Subscription;
  queryParamSub: Subscription;
  params: any;
  queryParams: any;

  isPage = true;
  isLoading = true;
  isEmptyBlog = false;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    public authService: AuthService,
    public routerHelper: RouterHelper,
    private formHelper: FormHelper,
    public dataTransferHelper: DataTransferHelper,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.params = params;
    });
    this.queryParamSub = this.route.queryParams.subscribe(queryParams => {
      this.queryParams = queryParams;
    });
  }

  @Input()
  get blogContents(): Array<BlogContent>|undefined { return this._blogContents; }
  set blogContents(blogContents: Array<BlogContent>|undefined) {
    if (!blogContents || blogContents.length === 0) {
      this.isEmptyBlog = true;
      this.isLoading = false;
      return;
    }
    this._blogContents = blogContents;
    this.blogId = blogContents[0].id;

    this.postListObserver = this.blogService.getProloguePostListObserver(this.blogId);
    this.postListSub = this.postListObserver?.subscribe(postList => {
      this.postList = postList;
      this.postListForm = this.formHelper.buildFormRecursively({postList: this.postList});
      this.isLoading = false;
    });
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle, id-blacklist, id-match
  private _blogContents?: Array<BlogContent>;

  getCategoryTitle(categoryId: string): string {
    const [category] = this.blogService.getCategory(categoryId, this.blogContents?.[0].categoryMap);
    return category?.name || '';
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.queryParamSub.unsubscribe();
  }
}
