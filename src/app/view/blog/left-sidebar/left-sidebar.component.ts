import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { FormGroup, AbstractControl } from '@angular/forms';
import { DataTransferHelper } from 'src/app/helper/data-transefer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from '../blog.content';
import { CategoryContent } from '../category/category.content';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { PostContent } from '../post/post.content';

@Component({
  selector: 'app-blog-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['../blog.component.css', './left-sidebar.component.css']
})
export class LeftSidebarComponent implements OnInit {
  @Input() isEditingPost: boolean;
  @Input() isEditingCategory: boolean;
  @Input() isAddingCategory: boolean;
  @Input() categoryContentsForm: FormGroup;
  @Input() categoryContents: Array<CategoryContent>;
  @Input() blogContents: Array<BlogContent>;
  @Output() clickStartUploadPostImageSrc: EventEmitter<null> = new EventEmitter();

  paramSub: Subscription;
  params: any;
  isPage: boolean;
  newCategory: CategoryContent;

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService,
    public blogService: BlogService,
    public dataTransferHelper: DataTransferHelper,
    public routerHelper: RouterHelper,
    public formHelper: FormHelper,
    private toastHelper: ToastHelper,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      this.isEditingCategory = false;
      this.isAddingCategory = false;
      this.params = params;
    });
  }

  addCategory(
    blogContents: Array<BlogContent>,
    parentCategory: FormGroup,
    categoryContentsArray: any,
  ){
    const newCategory = Object.assign({}, new CategoryContent());
    newCategory.blogId = blogContents[0].id;
    newCategory.parentId = parentCategory.value.id;
    const newCategoryCount = categoryContentsArray.value
    .filter((category) =>
      new RegExp(newCategory.categoryTitle, 'g').test(category.categoryTitle)
    ).length;
    newCategory.categoryTitle = `${newCategory.categoryTitle}${newCategoryCount + 1}`;
    this.blogService
    .create(`blogs/${blogContents[0].id}/categories`, newCategory)
    .then(() => {
      const insertIndex = blogContents[0].categoryOrder
      .findIndex((categoryId) => categoryId === parentCategory.value.id);
      blogContents[0].categoryOrder.splice(insertIndex + 1, 0, newCategory.id);
      this.blogService.update(
        `blogs/${blogContents[0].id}`,
        blogContents[0]
      )
      .then(() => {
        this.toastHelper.showSuccess('Category Create', 'Success!');
      })
      .catch(e => {
        this.toastHelper.showWarning('Category Create Failed.', e);
      });
    })
    .catch(e => {
      this.toastHelper.showWarning('Category Create Failed.', e);
    });
  }

  removeCategory(
    blogContents: Array<BlogContent>,
    targetCategory: FormGroup,
    categoryContentsForm: FormGroup,
  ) {
    const blogId = blogContents[0].id;
    const targetChildCategories = this.formHelper.getChildContentsRecusively(
      // tslint:disable-next-line: no-string-literal
      categoryContentsForm.controls.categoryContents['controls'], targetCategory
    );
    const targetCategories = [targetCategory, ...targetChildCategories];
    const removeMessages = targetCategories.map((category) => `${category.value.categoryTitle}`);
    this.toastHelper.askYesNo('Remove Category', [...removeMessages].join(', '))
    .then((result) => {
      if (result.value) {
        this.blogService.cascadeDeleteCateogry(
          blogContents,
          targetCategory,
          categoryContentsForm
        )
        .then(() => {
          this.toastHelper.showSuccess('Category Remove', 'Success!');
          this.routerHelper.goToBlogPrologue(this.params);
        })
        .catch(e => {
          this.toastHelper.showWarning('Category Remove Failed.', e);
        });
      }
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

  clickCategoryEdit(): void {
    this.isEditingCategory = true;
  }

  clickCategoryEditCancel(): void {
    this.isEditingCategory = false;
  }

  async clickCategoryEditUpdate(
    blogContents: Array<BlogContent>,
    categoryContents: Array<CategoryContent>,
    categoryContentsArray: AbstractControl,
  ) {
    blogContents[0].categoryOrder = categoryContentsArray.value
    .map((categoryContent: CategoryContent) => categoryContent.id);
    let categoryContentPromises = [
      this.blogService.update(
        `blogs/${blogContents[0].id}`,
        blogContents[0]
      )
    ];

    categoryContentPromises = [
      ...categoryContentPromises,
      ...categoryContents.map((categoryContent) => {
        const categoryMightBeChanged = categoryContentsArray.value
        .find((category) => category.id === categoryContent.id);

        if (
          categoryMightBeChanged.parentId !== categoryContent.parentId ||
          categoryMightBeChanged.categoryTitle !== categoryContent.categoryTitle ||
          categoryMightBeChanged.hidden !== categoryContent.hidden ||
          categoryMightBeChanged.collapsed !== categoryContent.collapsed
        ) {
          return this.blogService.update(
            `blogs/${blogContents[0].id}/categories/${categoryContent.id}`,
            categoryContentsArray.value.find(
              (category: CategoryContent) => category.id === categoryContent.id
            )
          );
        }
        else {
          return new Promise<void>((resolve) => { resolve(); });
        }
      })
    ];

    await Promise.all(categoryContentPromises)
    .then(() => {
      this.toastHelper.showSuccess('Category Update', 'Success!');
    })
    .catch(e => {
      this.toastHelper.showWarning('Category Update Failed.', e);
    });
  }

  handleClickStartUploadPostImageSrc() {
    this.clickStartUploadPostImageSrc.emit();
  }

  ngOnInit(): void {
  }
}
