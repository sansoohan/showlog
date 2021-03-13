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
import * as firebase from 'firebase/app';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
const FieldPath = firebase.default.firestore.FieldPath;

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
  get blogContent(): BlogContent|undefined { return this._blogContent; }
  set blogContent(blogContent: BlogContent|undefined) {
    if (!blogContent) {
      this.isEmptyBlog = true;
      this.isLoading = false;
      return;
    }
    this._blogContent = blogContent;
    this.blogId = blogContent.id;

    this.postListObserver = this.blogService.select<PostContent>(
      `blogs/${this.blogId}/posts`,
      {
        orderBy: [{
          fieldPath: new FieldPath('createdAt'),
          direction: 'desc',
        }],
        limit: 10,
      } as CollectionSelect
    );
    this.postListSub = this.postListObserver?.subscribe(postList => {
      this.postList = postList;
      this.postListForm = this.formHelper.buildFormRecursively({postList: this.postList});
      this.isLoading = false;
    });
  }
  // tslint:disable-next-line: variable-name
  private _blogContent?: BlogContent;

  getCategoryTitle(categoryId: string): string {
    const [category] = this.blogService.getCategory(categoryId, this.blogContent?.categoryMap);
    return category?.name || '';
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.queryParamSub.unsubscribe();
  }
}
