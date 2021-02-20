import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PostContent } from './post.content';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from '../blog.content';
import { CategoryContent } from '../category/category.content';
import { PostImageContent } from './post-image.content';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transefer.helper';
import { ProfileService } from 'src/app/services/profile.service';
import { ToastHelper } from 'src/app/helper/toast.helper';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-blog-post',
  templateUrl: './post.component.html',
  styleUrls: ['../blog.component.css', './post.component.css']
})
export class PostComponent implements OnInit, OnDestroy {
  @ViewChild ('postTextArea') public postTextArea: ElementRef;
  @Output() goToPost: EventEmitter<string> = new EventEmitter();
  @Output() goToCategory: EventEmitter<string> = new EventEmitter();
  @Input() isEditingPost;
  @Input() isCreatingPost;

  categoryContentsObserver: Observable<CategoryContent[]>;
  categoryContents: CategoryContent[];
  categoryContentsSub: Subscription;
  categoryContentsForm: any;
  isEditingCategory: boolean;

  postImageContentsObserver: Observable<PostImageContent[]>;
  postImageContents: PostImageContent[];
  postImageContentsSub: Subscription;

  postContentsObserver: Observable<PostContent[]>;
  postContents: PostContent[];
  postContentsSub: Subscription;
  postContentsForm: any;
  hasNullPostTitleError: boolean;

  postListObserver: Observable<PostContent[]>;
  postList: PostContent[];
  postListForm: any;

  blogId: string;
  isPage: boolean;
  isLoading: boolean;
  updateOk: boolean;

  paramSub: Subscription;
  params: any;

  constructor(
    public profileService: ProfileService,
    private toastHelper: ToastHelper,
    private route: ActivatedRoute,
    private blogService: BlogService,
    public authService: AuthService,
    public routerHelper: RouterHelper,
    private formHelper: FormHelper,
    public dataTransferHelper: DataTransferHelper,
  ) {
    this.isPage = true;
  }

  @Input()
  get blogContents(): Array<BlogContent> { return this._blogContents; }
  set blogContents(blogContents: Array<BlogContent>) {
    if (!blogContents || blogContents.length === 0) {
      return;
    }
    this.paramSub = this.route.params.subscribe(params => {
      this.postContents = [new PostContent()];
      this.postContents[0].id = this.blogService.newId();
      this.postContentsForm = this.formHelper.buildFormRecursively(this.postContents[0]);
      this.postImageContents = [];

      this.hasNullPostTitleError = false;
      this.isEditingCategory = false;
      this.params = params;

      this.isPage = true;
      this.isLoading = true;
      this._blogContents = blogContents;
      this.blogId = blogContents[0].id;

      if (this.params?.postId) {
        this.postImageContentsObserver = this.blogService.getPostImageContentsObserver(
          blogContents[0].id, this.params.postId
        );
        this.postImageContentsSub = this.postImageContentsObserver.subscribe(postImageContents => {
          this.postImageContents = postImageContents;
        });
      }

      this.categoryContentsObserver = this.blogService.getCategoryContentsObserver(this.blogId);
      this.categoryContentsSub = this.categoryContentsObserver.subscribe(categoryContents => {
        if (!categoryContents || categoryContents.length === 0){
          this.isPage = false;
          return;
        }

        this.categoryContents = categoryContents.map((categoryContent) => {
          categoryContent.categoryNumber = blogContents[0].categoryOrder
          .findIndex(categoryId => categoryId === categoryContent.id);
          return categoryContent;
        });

        this.categoryContents.sort((categoryA: CategoryContent, categoryB: CategoryContent) =>
        categoryA.categoryNumber - categoryB.categoryNumber);

        this.categoryContentsForm =
          this.formHelper.buildFormRecursively({categoryContents: this.categoryContents});

        if (this.params?.postId) {
          this.postContentsObserver = this.blogService.getPostContentsObserver(
            {params: this.params}, this.blogId
          );
          this.postContentsSub = this.postContentsObserver.subscribe(postContents => {
            this.postContents = postContents;
            if (this.postContents.length === 0 || !this.postContents) {
              this.isPage = false;
              return;
            }
            this.postContents[0].postMarkdown = this.postContents[0].postMarkdown.replace(/\\n/g, '\n');
            this.postContentsForm = this.formHelper.buildFormRecursively(this.postContents[0]);
          });
        }
        this.isLoading = false;
      });
    });
  }
  // tslint:disable-next-line: variable-name
  private _blogContents: Array<BlogContent>;

  async updateRemovedImage(postId: string) {
    const inputString = this.postContentsForm.controls.postMarkdown.value;
    for (const postImageContent of this.postImageContents) {
      // tslint:disable-next-line: no-string-literal
      const imageTagAttributesList: Array<Array<string>> = [...inputString['matchAll'](/(<img (.+?)\/>)/g)];
      const imageTagAttributes = imageTagAttributesList.map((tagAttribute) => {
        const imageTagAttribute: PostImageContent = new PostImageContent();
        tagAttribute[2].split(' ').filter(Boolean).forEach((a) => {
          const [key, value] = a.split('=\"');
          imageTagAttribute.attributes[key] = value.replace(/\"/g, '');
        });
        return imageTagAttribute;
      });

      const path = [
        `blogs/${this.blogId}`,
        `posts/${postId}`,
        `images/${postImageContent.id}`,
      ].join('/');

      let isImage: boolean = false;
      for (const tagAttribute of imageTagAttributes) {
        isImage = tagAttribute?.attributes.id === postImageContent.id;
        if (isImage) {
          tagAttribute.id = postImageContent.attributes.id;
          tagAttribute.ownerId = postImageContent.attributes.ownerId;
          await this.blogService.update(path, tagAttribute);
        }
      }
      if (!isImage) {
        await this.blogService.delete(path);
      }
    }
  }

  handleClickStartUploadPostImageSrc() {
    this.toastHelper.uploadImage('Select Your Post Image', false).then((data) => {
      if (data.value) {
        const _URL = window.URL || window.webkitURL;
        const img = new Image();
        const objectUrl = _URL.createObjectURL(data.value);
        img.onload = async () => {
          const postId = this.params.postId || this.postContents[0].id;
          console.log(postId);
          const path = `blogs/${this.blogId}/posts/${postId}/images`;
          let postImageContent = new PostImageContent();
          postImageContent.attributes.style = [
            `width:${img.width}`,
            `height:${img.height}`,
            `max-width:100%`,
            `object-fit:contain`,
          ].join(';');
          postImageContent = await this.blogService.addImageOnPost(
            data.value, path, postImageContent
          );
          postImageContent.attributes.id = postImageContent.id;
          _URL.revokeObjectURL(objectUrl);
          const startPosition = this.postTextArea.nativeElement.selectionStart;
          const endPosition = this.postTextArea.nativeElement.selectionEnd;
          // Check if you've selected text
          if (startPosition === endPosition) {
            const markDownAddedImage = this.postContentsForm.controls.postMarkdown.value.slice(0, startPosition)
              + this.dataTransferHelper.getImageString(postImageContent)
              + this.postContentsForm.controls.postMarkdown.value.slice(startPosition);
            this.postContentsForm.controls.postMarkdown.setValue(markDownAddedImage);
          }
        };
        img.src = objectUrl;
      }
      else if (data.dismiss === Swal.DismissReason.cancel) {
        // Do Nothing
      }
    });
  }

  handleClickRemovePostImage(postImageContent: PostImageContent): void {
    console.log(postImageContent);
    this.toastHelper.editImage('Edit Image', postImageContent)
    .then((result) => {
      if (result.value) {
        console.log(result.value);
        postImageContent = Object.assign(postImageContent, result.value);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // const firestorePath = `blogs/${this.blogId}/posts/${this.params.postId}/images/${}`;
        // const storagePath = `blogs/${this.blogId}/postImages/${postImageContent}`;
      }
    }).catch(e => {
      this.toastHelper.showWarning('Edit Image Failed.', e);
    });
  }

  getCategoryTitle(categoryId: string): string {
    const category = this.categoryContentsForm?.controls.categoryContents.controls.find((categoryContent) =>
      categoryContent.value.id === categoryId);
    return category?.value.categoryTitle;
  }

  clickPostEdit() {
    this.isEditingPost = true;
  }

  clickPostEditCancel(){
    this.isEditingPost = false;
  }

  getPostMarkdownLines(){
    return this.postContentsForm?.controls?.postMarkdown?.value?.match(/\n/g)?.length + 2 || 3;
  }

  async handleClickEditPostCreateUpdate() {
    if (this.isEditingPost){
      this.hasNullPostTitleError = false;
      if (!this.postContentsForm.value.postTitle){
        this.hasNullPostTitleError = true;
        return;
      }

      const newPost = this.postContentsForm.value;
      newPost.categoryId = this.params.categoryId;
      newPost.createdAt = Number(new Date());
      const selectedCategory: CategoryContent = this.categoryContents.find((categoryContent) =>
        categoryContent.id === newPost.categoryId
      );
      if (selectedCategory) {
        selectedCategory.postCreatedAtList = [
          ...selectedCategory.postCreatedAtList,
          newPost.createdAt,
        ];
        this.blogService.update(
          `blogs/${this.blogContents[0].id}/categories/${selectedCategory.id}`,
          selectedCategory
        ).then(async () => {
          await this.blogService.set(`blogs/${this.blogContents[0].id}/posts/${newPost.id}`, newPost);
          await this.updateRemovedImage(newPost.id);
          this.toastHelper.showSuccess('Post Update', 'Success!');
          this.routerHelper.goToBlogPost(this.params, newPost.id);
        })
        .catch(e => {
          this.toastHelper.showWarning('Post Update Failed.', e);
        });
      }
    }
  }

  handleClickEditPostCreateCancel() {
    this.routerHelper.goToBlogCategory(this.params, this.params.categoryId);
  }

  async handleClickEditPostUpdate() {
    if (this.isEditingPost){
      await this.updateRemovedImage(this.postContentsForm.value.id);

      this.blogService
      .update(
        `blogs/${this.blogContents[0].id}/posts/${this.postContentsForm.value.id}`,
        this.postContentsForm.value
      )
      .then(() => {
        this.toastHelper.showSuccess('Post Update', 'Success!');
      })
      .catch(e => {
        this.toastHelper.showWarning('Post Update Failed.', e);
      });
    }
    this.isEditingPost = false;
  }

  async handleClickEditPostDelete() {
    this.toastHelper.askYesNo('Remove Post', 'Are you sure?').then((result) => {
      if (result.value) {
        this.isLoading = true;
        const targetCreatedAt = this.postContentsForm.value.createdAt;

        const selectedCategory: CategoryContent = this.categoryContents.find((categoryContent) =>
          categoryContent.id === this.postContentsForm.value.categoryId
        );

        if (selectedCategory) {
          selectedCategory.postCreatedAtList = selectedCategory.postCreatedAtList
            .filter((createdAt) => createdAt !== targetCreatedAt);
          this.blogService.update(
            `blogs/${this.blogContents[0].id}/categories/${selectedCategory.id}`,
            selectedCategory
          ).then(() => {
            this.blogService.delete(
              `blogs/${this.blogContents[0].id}/posts/${this.postContentsForm.value.id}`,
            )
            .then(() => {
              this.toastHelper.showSuccess('Post Delete', 'OK');
              this.routerHelper.goToBlogCategory(this.params, this.postContentsForm.value.categoryId);
            })
            .catch(e => {
              this.toastHelper.showWarning('Post Delete Failed.', e);
            });
          })
          .catch(e => {
            this.toastHelper.showWarning('Post Delete Failed.', e);
          });
        }
      }
      else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    });
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
    this.postContentsSub?.unsubscribe();
    this.categoryContentsSub?.unsubscribe();
    this.postImageContentsSub?.unsubscribe();
  }
}
