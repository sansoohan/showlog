import { Component, OnInit, Input, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-blog-category',
  templateUrl: './category.component.html',
  styleUrls: ['../blog.component.css', './category.component.css']
})
export class CategoryComponent implements OnInit, OnDestroy {
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
  isCreatingPost: boolean;

  postListObserver: Observable<PostContent[]>;
  postList: PostContent[];
  postListSub: Subscription;
  postListForm: any;
  isShowingPostList: boolean;

  blogId: string;
  isPage: boolean;
  isLoading: boolean;
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

  selectedPageNum: number;
  pageSize: number;
  pageIndex: number;
  postCreatedAtList: Array<number>;

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
      this.pageIndex = queryParams?.pageIndex || 0;
      this.pageSize = 20;
      this.isCreatingPost = !!queryParams.isCreatingPost;
    });
  }

  @Input()
  get blogContents(): Array<BlogContent> { return this._blogContents; }
  set blogContents(blogContents: Array<BlogContent>) {
    if (!blogContents || blogContents.length === 0){
      return;
    }
    this.isPage = true;
    this.isLoading = true;
    this._blogContents = blogContents;
    this.blogId = blogContents[0].id;

    this.categoryContentsObserver = this.blogService.getCategoryContentsObserver(this.blogId);
    this.categoryContentsSub = this.categoryContentsObserver.subscribe(categoryContents => {
      if (!categoryContents || categoryContents.length === 0){
        return;
      }

      this.categoryContents = categoryContents.map((categoryContent) => {
        categoryContent.categoryNumber = blogContents[0].categoryOrder
        .findIndex(categoryId => categoryId === categoryContent.id);
        return categoryContent;
      });

      this.categoryContents.sort((categoryA: CategoryContent, categoryB: CategoryContent) =>
        categoryA.categoryNumber - categoryB.categoryNumber);

      this.categoryContentsForm = this.formHelper.buildFormRecursively({categoryContents: this.categoryContents});

      if (this.params.categoryId){
        this.selectedCategory =
          this.categoryContentsForm.controls.categoryContents.controls.find((categoryContent) =>
          categoryContent.value.id === this.params.categoryId);
        if (!this.selectedCategory) {
          this.isPage = false;
          return;
        }

        this.selectedChildCategories =
          this.formHelper.getChildContentsRecusively(
            this.categoryContentsForm.controls.categoryContents.controls, this.selectedCategory
          );

        const selectedCategories = [
          this.selectedCategory?.value,
          ...this.selectedChildCategories.map((selectedChildCategory) => selectedChildCategory.value)
        ].filter(Boolean);
        const categoryIds = selectedCategories.map((categoryContent) =>
          categoryContent.id
        );
        this.postCreatedAtList = [];
        for (const selectedCategory of selectedCategories){
          this.postCreatedAtList = [
            ...this.postCreatedAtList,
            ...selectedCategory.postCreatedAtList
          ];
        }
        this.changePageList(null);
      }
    });
  }
  // tslint:disable-next-line: variable-name
  private _blogContents: Array<BlogContent>;

  countChildPost() {
    let count = 0;
    this.selectedChildCategories.forEach((categoryContent) => {
      count += categoryContent.value.postCreatedAtList.length;
    });
    return count;
  }

  getCategoryTitle(categoryId: string): string {
    const category = this.categoryContentsForm.controls.categoryContents.controls.find((categoryContent) =>
      categoryContent.value.id === categoryId);
    return category.value.categoryTitle;
  }

  changePageList(event) {
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
    this.postCreatedAtList = [...selectedCreatedAtList, ...this.postCreatedAtList];
    this.postListObserver = this.blogService.getCategoryPostListObserver(
      this.blogId, selectedCreatedAtList
    );
    this.postListSub = this.postListObserver.subscribe(postList => {
      this.postList = postList;
      this.postListForm = this.formHelper.buildFormRecursively({postList: this.postList});
      this.isLoading = false;
    });
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
    this.queryParamSub?.unsubscribe();
    this.postListSub?.unsubscribe();
    this.categoryContentsSub?.unsubscribe();
  }
}
