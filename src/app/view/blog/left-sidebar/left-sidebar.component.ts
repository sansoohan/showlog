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
import { FormControl } from '@angular/forms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-blog-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['../blog.component.scss', './left-sidebar.component.scss']
})
export class LeftSidebarComponent implements OnInit, OnDestroy {
  @Input() isEditingPost?: boolean;
  @Input() canEdit?: boolean;
  @Input() imageContents?: Array<ImageContent>;
  @Input() blogContent?: BlogContent;
  @Output() clickStartUploadPostImageSrc: EventEmitter<null> = new EventEmitter();
  @Output() clickEditPostImage: EventEmitter<ImageContent> = new EventEmitter();
  @Output() updateCategory: EventEmitter<string> = new EventEmitter();

  editingCategoryId?: string;
  paramSub: Subscription;
  params: any;
  newCategory?: CategoryContent;

  isPage = true;

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
      this.params = params;
    });
  }

  handleClickStartUploadPostImageSrc(): void {
    this.clickStartUploadPostImageSrc.emit();
  }

  handleClickEditPostImage(imageContent: ImageContent): void {
    this.clickEditPostImage.emit(imageContent);
  }

  handleSelectCategory(categoryId: string): void {
    this.routerHelper.goToBlogCategory(this.params, categoryId);
  }
  handleSortCategory(categoryMap: any): void {
    if (!this.blogContent) {
      return;
    }
    this.blogContent.categoryMap = categoryMap;
    this.blogService.update([
      environment.rootPath,
      `blogs/${this.blogContent.id}`
    ].join('/'), this.blogContent)
    .catch(() => {
      this.toastHelper.showSuccess('Category Map', 'Updating Category Map is failed');
    });
  }
  handleEditCategory(categoryId: string): void {
    const [category] = this.blogService.getCategory(categoryId, this.blogContent?.categoryMap);
    const { uid } = this.authService.getCurrentUser();
    if (this.blogContent) {
      this.blogContent.updatedFrom = {
        source: 'webclient',
        name: 'handleEditCategory',
        uid,
      };
    }

    this.toastHelper.askUpdateDelete('Edit Category', 'Category Name', category.name)
    .then(async (data) => {
      if (data.value) {
        category.name = data.value;
        this.blogService.update(
          [
            environment.rootPath,
            `blogs/${this.blogContent?.id}`,
          ].join('/'), this.blogContent)
        .then(() => {
          this.toastHelper.showSuccess('Category Name', 'Category Name is updated');
        })
        .catch(() => {
          this.toastHelper.showSuccess('Category Name', 'Updating Category Name is failed');
        });
      }
      else if (data.dismiss === Swal.DismissReason.cancel) {
        this.toastHelper.askYesNo('Remove Category', 'Are you sure?').then(result => {
          if (result.value && this.blogContent) {
            const blogId = this.blogContent.id;
            this.blogContent.categoryMap = this.deleteCategory(
              blogId, categoryId, this.blogContent.categoryMap
            );
            this.blogService.update([
              environment.rootPath,
              `blogs/${blogId}`,
            ].join('/'), this.blogContent)
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
  handleAddCategory(categoryId?: string): void {
    const categoryContent = new CategoryContent();
    categoryContent.id = this.blogService.newId();
    const { uid } = this.authService.getCurrentUser();
    if (this.blogContent) {
      this.blogContent.updatedFrom = {
        source: 'webclient',
        name: 'handleAddCategory',
        uid,
      };
    }

    if (!categoryId && this.blogContent) {
      this.blogContent.categoryMap = [
        categoryContent,
        ...this.blogContent.categoryMap,
      ];
    } else {
      const [category] = this.blogService.getCategory(categoryId, this.blogContent?.categoryMap);
      category.children = [
        categoryContent,
        ...category.children,
      ];
    }

    this.blogService.update([
      environment.rootPath,
      `blogs/${this.blogContent?.id}`
    ].join('/'), this.blogContent);
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
