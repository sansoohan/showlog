import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { PostContent } from '../post/post.content';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from '../blog.content';
import { CategoryContent } from '../category/category.content';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';

@Component({
  selector: 'app-blog-category',
  templateUrl: './category.component.html',
  styleUrls: ['../blog.component.scss', './category.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {
  @Input() canEdit?: boolean;
  @Input() isCreatingPost?: boolean;

  postListObserver?: Observable<PostContent[]>;
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
  get blogContents(): Array<BlogContent>|undefined { return this._blogContents; }
  set blogContents(blogContents: Array<BlogContent>|undefined) {
    if (!blogContents || blogContents.length === 0){
      return;
    }
    this.isPage = true;
    this.isLoading = true;
    this._blogContents = blogContents;
    this.blogId = blogContents[0].id;

    if (this.params.categoryId){
      const [category] = this.blogService.getCategory(this.params.categoryId, blogContents[0].categoryMap);
      this.selectedCategory = category;
      this.postCreatedAtList = this.getCategoryPageList(category);
      this.changePageList(null);
    }
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle, id-blacklist, id-match
  private _blogContents?: Array<BlogContent>;

  getCategoryPageList(category: CategoryContent): Array<number> {
    let results: Array<number> = [...(category?.postCreatedAtList || [])];
    for (const child of category.children) {
      results = [...results, ...this.getCategoryPageList(child)];
    }
    return results;
  }

  getCategoryTitle(categoryId: string): string {
    const [category] = this.blogService.getCategory(categoryId, this.blogContents?.[0].categoryMap);
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
    const selectedCreatedAtList = this.postCreatedAtList
    .sort((createdA, createdB) => createdA - createdB)
    .splice(this.pageIndex * this.pageSize, this.pageSize);
    this.postListObserver = this.blogService.getCategoryPostListObserver(
      this.blogId, selectedCreatedAtList
    );
    this.postListSub = this.postListObserver?.subscribe(postList => {
      this.postList = postList;
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
