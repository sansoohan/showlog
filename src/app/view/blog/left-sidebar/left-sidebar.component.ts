import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from '../blog.content';
import { CategoryContent } from '../category/category.content';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { ImageContent, ImageHelper } from 'src/app/helper/image.helper';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-blog-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['../blog.component.css', './left-sidebar.component.css']
})
export class LeftSidebarComponent implements OnInit, OnDestroy {
  @Input() isEditingPost: boolean;
  @Input() canEdit: boolean;
  @Input() imageContents: Array<ImageContent>;
  @Input() blogContents: Array<BlogContent>;
  @Output() clickStartUploadPostImageSrc: EventEmitter<null> = new EventEmitter();
  @Output() clickEditPostImage: EventEmitter<ImageContent> = new EventEmitter();
  @Output() updateCategory: EventEmitter<string> = new EventEmitter();

  editingCategoryId: string;
  paramSub: Subscription;
  params: any;
  isPage: boolean;
  newCategory: CategoryContent;

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService,
    public blogService: BlogService,
    public dataTransferHelper: DataTransferHelper,
    public imageHelper: ImageHelper,
    public routerHelper: RouterHelper,
    public formHelper: FormHelper,
    private toastHelper: ToastHelper,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      this.params = params;
    });
  }

  moveUpCategory(
    categoryContentGroupBId: string,
    categoryContentsArray: any,
  ): void {
    const categoryContentGroupB = categoryContentsArray.controls
    .find((category) => category.value.id === categoryContentGroupBId);
    const categoryContentGroupA =
    categoryContentsArray.controls[categoryContentGroupB.value.categoryNumber - 1];
    const deepCountA = this.blogService.getCategoryDeepCount(
      categoryContentGroupA, categoryContentsArray.controls
    );
    const minDeepCountB = this.blogService.getCategoryDeepCount(
      categoryContentGroupB, categoryContentsArray.controls
    );
    const childrenCategoryWithB = [
      categoryContentGroupB,
      ...this.formHelper
      .getChildContentsRecusively(categoryContentsArray.controls, categoryContentGroupB)
    ];

    if (!categoryContentGroupA) {
      return;
    }

    if (!categoryContentGroupB) {
      categoryContentGroupA.controls.parentId.setValue(null);
    }
    else if (categoryContentGroupB.value.parentId === categoryContentGroupA.value.id) {
      const tmpCategoryANubmer = categoryContentGroupA.value.categoryNumber;
      const categoryBSize = childrenCategoryWithB.length;
      for (let i = tmpCategoryANubmer; i <= tmpCategoryANubmer + categoryBSize; i++){
        if (i === tmpCategoryANubmer) {
          categoryContentsArray.controls[i].controls.categoryNumber
          .setValue(tmpCategoryANubmer + categoryBSize);
          continue;
        }

        if (i === tmpCategoryANubmer + 1) {
          categoryContentsArray.controls[i].controls.categoryNumber
          .setValue(i - 1);
          categoryContentsArray.controls[i].controls.parentId
          .setValue(categoryContentGroupA.value.parentId || null);
          continue;
        }

        categoryContentsArray.controls[i].controls.categoryNumber
        .setValue(i - 1);
      }
    }
    else if (
      categoryContentGroupB.value.parentId === categoryContentGroupA.value.parentId
    ) {
      categoryContentGroupB.controls.parentId.setValue(categoryContentGroupA.value.id);
    } else {
      categoryContentGroupB.controls.parentId.setValue(categoryContentGroupA.value.parentId);
    }

    categoryContentsArray.patchValue(
      categoryContentsArray.value.sort((a, b) => a.categoryNumber - b.categoryNumber)
    );

    const maxDeepCountB = Math.max(...childrenCategoryWithB.map((category) => {
      return this.blogService.getCategoryDeepCount(
        category, categoryContentsArray.controls
      );
    })) - 1;

    categoryContentsArray.patchValue(
      categoryContentsArray.value.sort((a, b) => a.categoryNumber - b.categoryNumber)
    );

    if (maxDeepCountB >= 4){
      this.moveUpCategory(categoryContentGroupBId, categoryContentsArray);
    }
  }

  handleClickStartUploadPostImageSrc(): void {
    this.clickStartUploadPostImageSrc.emit();
  }

  handleClickEditPostImage(imageContent: ImageContent): void {
    this.clickEditPostImage.emit(imageContent);
  }

  handleSelectCategory(categoryId): void {
    this.routerHelper.goToBlogCategory(this.params, categoryId);
  }
  handleSortCategory(categoryMap): void {
    this.blogContents[0].categoryMap = categoryMap;
    this.blogService.update(`blogs/${this.blogContents[0].id}`, this.blogContents[0])
    .catch(() => {
      this.toastHelper.showSuccess('Category Map', 'Updating Category Map is failed');
    });
  }
  handleEditCategory(categoryId): void {
    const [category] = this.blogService.getCategory(categoryId, this.blogContents[0].categoryMap);
    this.toastHelper.askUpdateDelete('Edit Category', 'Category Name', category.name)
    .then(async (data) => {
      if (data.value) {
        category.name = data.value;
        this.blogService.update(`blogs/${this.blogContents[0].id}`, this.blogContents[0])
        .then(() => {
          this.toastHelper.showSuccess('Category Name', 'Category Name is updated');
        })
        .catch(() => {
          this.toastHelper.showSuccess('Category Name', 'Updating Category Name is failed');
        });
      }
      else if (data.dismiss === Swal.DismissReason.cancel) {
        this.toastHelper.askYesNo('Remove Category', 'Are you sure?').then(result => {
          if (result.value) {
            const blogId = this.blogContents[0].id;
            this.blogContents[0].categoryMap = this.deleteCategory(
              blogId, categoryId, this.blogContents[0].categoryMap
            );
            this.blogService.update(`blogs/${blogId}`, this.blogContents[0])
            .then(() => {
              this.toastHelper.showSuccess('Remove Category', 'Category is removed');
            })
            .catch(() => {
              this.toastHelper.showSuccess('Remove Category', 'Removing Category is failed');
            });
          }
          else if (result.dismiss === Swal.DismissReason.cancel){

          }
        });
      }
    });
  }
  handleAddCategory(categoryId): void {
    const categoryContent = new CategoryContent();
    categoryContent.id = this.blogService.newId();

    if (!categoryId) {
      this.blogContents[0].categoryMap = [
        categoryContent,
        ...this.blogContents[0].categoryMap,
      ];
    } else {
      const [category] = this.blogService.getCategory(categoryId, this.blogContents[0].categoryMap);
      category.children = [
        categoryContent,
        ...category.children,
      ];
    }

    this.blogService.update(`blogs/${this.blogContents[0].id}`, this.blogContents[0]);
  }

  getCategoryPageList(category: CategoryContent): Array<number> {
    let results: Array<number> = [...(category?.postCreatedAtList || [])];
    for (const child of category.children) {
      results = [...results, ...this.getCategoryPageList(child)];
    }
    return results;
  }

  deleteCategory(
    blogId: string,
    categoryId: string,
    categories: Array<CategoryContent>
  ): Array<CategoryContent>{
    const results: Array<CategoryContent> = [];
    for (const category of categories) {
      if (category.id !== categoryId) {
        category.children = this.deleteCategory(blogId, categoryId, category.children);
        results.push(category);
      } else {
        const postCreatedAtList = this.getCategoryPageList(category);
        this.blogService.removeCategoryPosts(blogId, postCreatedAtList);
      }
    }

    return results;
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }
}
