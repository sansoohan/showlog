import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { PostContent } from '../post/post.content';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, merge } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from '../blog.content';
import { CategoryContent } from '../category/category.content';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import * as firebase from 'firebase/app';
import { CommentContent } from '../post/comment/comment.content';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-blog-category',
  templateUrl: './category.component.html',
  styleUrls: ['../blog.component.scss', './category.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {
  @Input() canEdit?: boolean;
  @Input() isCreatingPost?: boolean;

  postListObservers?: Array<Observable<PostContent[]>>;
  postList?: PostContent[];
  postListSub?: Subscription;
  postListForm: any;

  blogId?: string;
  paramSub: Subscription;
  queryParamSub: Subscription;
  params: any;
  queryParams: any;
  selectedCategory?: CategoryContent;

  pageSize = 0;
  pageIndex = 0;
  postCreatedAtList: Array<number> = [];

  isPage = true;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    public authService: AuthService,
    public routerHelper: RouterHelper,
    private formHelper: FormHelper,
    public dataTransferHelper: DataTransferHelper,
  ) {
    this.isPage = true;
    this.isLoading = true;
    this.paramSub = this.route.params.subscribe(params => {
      this.params = params;
    });
    this.queryParamSub = this.route.queryParams.subscribe(queryParams => {
      this.queryParams = queryParams;
      this.pageIndex = queryParams?.pageIndex || 0;
      this.pageSize = 20;
      this.isCreatingPost = !!queryParams.isCreatingPost;
    });
  }

  @Input()
  get blogContent(): BlogContent|undefined { return this._blogContent; }
  set blogContent(blogContent: BlogContent|undefined) {
    if (!blogContent){
      return;
    }
    this.isPage = true;
    this.isLoading = true;
    this._blogContent = blogContent;
    this.blogId = blogContent.id;

    if (this.params.categoryId){
      const [category] = this.blogService.getCategory(this.params.categoryId, blogContent.categoryMap);
      this.selectedCategory = category;
      this.postCreatedAtList = this.getCategoryPageList(category);
      this.changePageList(null);
    }
  }
  // tslint:disable-next-line: variable-name
  private _blogContent?: BlogContent;

  getCategoryPageList(category: CategoryContent): Array<number> {
    if (category?.postCreatedAtList instanceof firebase.default.firestore.FieldValue) {
      return [];
    }

    let results: Array<number> = [...(category?.postCreatedAtList as number[] || [])];
    for (const child of category?.children || []) {
      results = [...results, ...this.getCategoryPageList(child)];
    }
    return results;
  }

  getCategoryTitle(categoryId: string): string {
    const [category] = this.blogService.getCategory(categoryId, this.blogContent?.categoryMap);
    return category.name;
  }

  changePageList(event: any): void {
    if (event) {
      this.pageIndex = event?.pageIndex;
      this.pageSize = event?.pageSize;
    }
    if (this.postListSub) {
      this.postListSub.unsubscribe();
    }

    const startIndex = this.pageIndex * this.pageSize;
    const selectedCreatedAtList = Object.assign([], this.postCreatedAtList)
    .sort((createdA, createdB) => createdB - createdA)
    .splice(startIndex, startIndex + this.pageSize);

    this.postListObservers = [];
    for (let index = 0; index < selectedCreatedAtList.length; index += 10) {
      const createdAtList = Object.assign([], selectedCreatedAtList).splice(index, index + 10);
      const postListObserver = this.blogService.select<PostContent>(
        `blogs/${this.blogId}/posts`,
        {
          where: [{
            fieldPath: new FieldPath('createdAt'),
            operator: 'in',
            value: createdAtList.length ? createdAtList : [-1],
          }]
        } as CollectionSelect
      );

      this.postListObservers.push(postListObserver);
    }

    this.postList = [];
    this.postListSub = merge(...this.postListObservers)?.subscribe(postList => {
      this.postList = [...this.postList || [], ...postList];
      this.postList.sort((postA, postB) => postB.createdAt - postA.createdAt);
      this.postListForm = this.formHelper.buildFormRecursively({postList: this.postList});
      this.isLoading = false;
    });
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.queryParamSub?.unsubscribe();
    this.postListSub?.unsubscribe();
  }
}
