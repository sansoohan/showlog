import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
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
// import 'moment/locale/de';

@Component({
  selector: 'app-blog-prologue',
  templateUrl: './prologue.component.html',
  styleUrls: ['../blog.component.css', './prologue.component.css']
})
export class PrologueComponent implements OnInit, OnDestroy {
  categoryContentsObserver: Observable<CategoryContent[]>;
  categoryContents: CategoryContent[];
  categoryContentsSub: Subscription;
  categoryContentsForm: any;
  isEditingCategory: boolean;

  postContentsObserver: Observable<PostContent[]>;
  postContents: PostContent[];
  postContentsForm: any;
  isShowingCategoryContents: boolean;
  isEditingPost: boolean;

  postListObserver: Observable<PostContent[]>;
  postList: PostContent[];
  postListSub: Subscription;
  postListForm: any;

  blogId: string;
  isPage: boolean;
  isLoading: boolean;
  isEmptyBlog: boolean;
  updateOk: boolean;
  newDescription: '';

  newPostConent = new PostContent();
  paramSub: Subscription;
  queryParamSub: Subscription;
  params: any;
  queryParams: any;
  selectedCategory: FormGroup;
  selectedChildCategories: Array<FormGroup>;
  selectedCategoryId: string;
  selectedChildCategoryIds: Array<string>;


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
      this.isShowingCategoryContents = false;
      this.isEditingCategory = false;
      this.params = params;
    });
    this.queryParamSub = this.route.queryParams.subscribe(queryParams => {
      this.queryParams = queryParams;
    });
  }

  @Input()
  get blogContents(): Array<BlogContent> { return this._blogContents; }
  set blogContents(blogContents: Array<BlogContent>) {
    this.isEmptyBlog = false;
    if (!blogContents || blogContents.length === 0) {
      this.isEmptyBlog = true;
      this.isLoading = false;
      return;
    }
    this._blogContents = blogContents;
    this.blogId = blogContents[0].id;

    this.categoryContentsObserver = this.blogService.getCategoryContentsObserver(this.blogId);
    this.categoryContentsSub = this.categoryContentsObserver.subscribe(categoryContents => {
      if (!categoryContents || categoryContents.length === 0){
        this.isEmptyBlog = true;
        this.isLoading = false;
        return;
      }

      this.categoryContents = categoryContents.map((categoryContent) => {
        categoryContent.categoryNumber = blogContents[0].categoryOrder
        .findIndex(categoryId => categoryId === categoryContent.id);
        // this.isLoading = false;
        return categoryContent;
      });

      this.categoryContents.sort((categoryA: CategoryContent, categoryB: CategoryContent) =>
      categoryA.categoryNumber - categoryB.categoryNumber);

      this.categoryContentsForm = this.formHelper.buildFormRecursively({categoryContents: this.categoryContents});

      if (!this.params.categoryId){
        this.postListObserver = this.blogService.getProloguePostListObserver(this.blogId);
        this.postListSub = this.postListObserver.subscribe(postList => {
          this.postList = postList;
          this.postListForm = this.formHelper.buildFormRecursively({postList: this.postList});
          this.isLoading = false;
        });
      }
    });
  }
  // tslint:disable-next-line: variable-name
  private _blogContents: Array<BlogContent>;

  countChildPost() {
    let count = 0;
    this.selectedChildCategories.forEach((categoryContent) => {
      count += categoryContent.value.postCount;
    });
    return count;
  }

  getCategoryTitle(categoryId: string): string {
    const category = this.categoryContentsForm.controls.categoryContents.controls.find((categoryContent) =>
      categoryContent.value.id === categoryId);
    return category.value.categoryTitle;
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.categoryContentsSub?.unsubscribe();
    this.postListSub?.unsubscribe();
    this.paramSub?.unsubscribe();
    this.queryParamSub?.unsubscribe();
  }
}
