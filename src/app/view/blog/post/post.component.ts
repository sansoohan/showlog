import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PostContent } from './post.content';
import { ActivatedRoute } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Observable, Subscription } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from '../blog.content';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { ProfileService } from 'src/app/services/profile.service';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { ImageHelper, ImageContent } from 'src/app/helper/image.helper';
import { ImageStorage } from 'src/app/storages/image.storage';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
// import { WebClient } from '@slack/web-api';

@Component({
  selector: 'app-blog-post',
  templateUrl: './post.component.html',
  styleUrls: ['../blog.component.scss', './post.component.scss']
})
export class PostComponent implements OnInit, OnDestroy {
  constructor(
    public profileService: ProfileService,
    public imageHelper: ImageHelper,
    public authService: AuthService,
    public routerHelper: RouterHelper,
    public dataTransferHelper: DataTransferHelper,
    private toastHelper: ToastHelper,
    private route: ActivatedRoute,
    private blogService: BlogService,
    private formHelper: FormHelper,
    private imageStorage: ImageStorage,
    private functions: AngularFireFunctions,
  ) {
    this.isPage = true;
    this.paramSub = this.route.params.subscribe(params => {
    });
    this.queryParamSub = this.route.queryParams.subscribe(queryParams => {
    });
  }

  @Input()
  get blogContent(): BlogContent|undefined { return this._blogContent; }
  set blogContent(blogContent: BlogContent|undefined) {
    if (!blogContent) {
      return;
    }

    this.paramSub = this.route.params.subscribe(params => {
      this.queryParamSub = this.route.queryParams.subscribe(queryParams => {
        this.queryParams = queryParams;
        this.isCreatingPost = !!queryParams.isCreatingPost;
        this.isEditingPost = this.isCreatingPost;

        this.params = params;
        this.postContent = new PostContent();
        this.postContent.id = this.blogService.newId();
        this.postContent.blogId = blogContent.id;
        this.postId = this.params.postId || this.postContent.id;
        this.postContentForm = this.formHelper.buildFormRecursively(this.postContent);

        this._blogContent = blogContent;
        this.blogId = blogContent.id;

        this.imageContentsObserver = this.imageStorage.getImageContentsObserver(
          `blogs/${this.blogId}/posts/${this.postId}/images`
        );
        this.imageContentsSub = this.imageContentsObserver.subscribe(imageContents => {
          this.imageContents = imageContents;
        });

        if (!this.isCreatingPost) {
          this.postContentObserver = this.blogService.observe<PostContent>(
            `blogs/${this.blogId}/posts/${this.postId}`
          );
          this.postContentSub = this.postContentObserver?.subscribe(postContent => {
            if (!postContent) {
              this.isPage = false;
              return;
            }
            this.postContent = postContent;
            this.postContent.postMarkdown = postContent.postMarkdown.replace(/\\n/g, '\n');
            this.postContentForm = this.formHelper.buildFormRecursively(this.postContent);
          });
        }
        this.isLoading = false;
      });
    });
  }
  @ViewChild ('postTextArea') public postTextArea: ElementRef|null = null;
  @Output() goToPost: EventEmitter<string> = new EventEmitter();
  @Output() goToCategory: EventEmitter<string> = new EventEmitter();
  @Input() canEdit?: boolean;
  @Input() isCreatingPost?: boolean;

  imageContentsObserver?: Observable<ImageContent[]>;
  imageContents?: ImageContent[];
  imageContentsSub?: Subscription;

  postContentObserver?: Observable<PostContent|undefined>;
  postContent?: PostContent;
  postContentSub?: Subscription;
  postContentForm: any;
  hasNullPostTitleError = false;

  postId = '';
  blogId = '';
  isPage = true;
  isLoading = true;
  isEditingPost = false;

  queryParamSub: Subscription;
  paramSub: Subscription;
  queryParams: any;
  params: any;
  // tslint:disable-next-line: variable-name
  private _blogContent?: BlogContent;

  public files: NgxFileDropEntry[] = [];

  async updateRemovedImage(): Promise<void> {
    const inputString: string = this.postContentForm.controls.postMarkdown.value;
    for (const postImageContent of this.imageContents || []) {
      const imageTagAttributesList: Array<Array<string>> = [...inputString.matchAll(/(<img (.+?)\/>)/g)];
      const imageTagAttributes = imageTagAttributesList.map((tagAttribute) => {
        const imageTagAttribute: ImageContent = new ImageContent();
        tagAttribute[2].split(' ').filter(Boolean).forEach((a) => {
          const [key, value] = a.split('=\"');
          imageTagAttribute.attributes[key] = value.replace(/\"/g, '');
        });
        return imageTagAttribute;
      });

      const path = [
        `blogs/${this.blogId}`,
        `posts/${this.postId}`,
        `images/${postImageContent.id}`,
      ].join('/');

      let isImage = false;
      for (const tagAttribute of imageTagAttributes) {
        isImage = tagAttribute?.attributes.id === postImageContent.id;
        if (isImage) {
          tagAttribute.id = postImageContent.attributes.id;
          tagAttribute.ownerId = postImageContent.attributes.ownerId;
          await this.blogService.update(path, tagAttribute);
        }
      }
      if (!isImage) {
        await this.imageStorage.delete(path);
        await this.blogService.delete(path, {});
      }
    }
  }

  handleClickStartUploadPostImageSrc(): void {
    this.toastHelper.uploadImage('Select Your Post Image', false).then((data) => {
      if (data.value) {
        const _URL = window.URL || window.webkitURL;
        const img = new Image();
        const objectUrl = _URL.createObjectURL(data.value);
        img.src = objectUrl;
        img.onload = async () => {
          const path = `blogs/${this.blogId}/posts/${this.postId}/images`;
          let postImageContent = new ImageContent();
          postImageContent.attributes.style = [
            `width:${img.width}px`,
            `height:${img.height}px`,
            `max-width:100%`,
            `object-fit:contain`,
          ].join(';');
          postImageContent = await this.imageStorage.addImage(
            data.value, path, postImageContent
          );
          postImageContent.attributes.id = postImageContent.id;
          _URL.revokeObjectURL(objectUrl);
          const startPosition = this.postTextArea?.nativeElement.selectionStart;
          const endPosition = this.postTextArea?.nativeElement.selectionEnd;
          // Check if you've selected text
          if (startPosition === endPosition) {
            const markDownAddedImage = this.postContentForm.controls.postMarkdown.value.slice(0, startPosition)
              + this.imageHelper.getImageString(postImageContent)
              + this.postContentForm.controls.postMarkdown.value.slice(startPosition);
            this.postContentForm.controls.postMarkdown.setValue(markDownAddedImage);
          }
        };
      }
      else if (data.dismiss === Swal.DismissReason.cancel) {
        // Do Nothing
      }
    });
  }

  async handleClickEditPostImage(postImageContent: ImageContent): Promise<void> {
    const path = [
      `blogs/${this.blogId}`,
      `posts/${this.postId}`,
      `images/${postImageContent.id}`,
    ].join('/');
    let inputString = this.postContentForm.controls.postMarkdown.value;
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const imageTagAttributesList: Array<Array<string>> = [...inputString.matchAll(/(<img (.+?)\/>)/g)];
    const imageTag = imageTagAttributesList.find((tagAttribute) => {
      const imageTagAttribute: ImageContent = new ImageContent();
      tagAttribute[2].split(' ').filter(Boolean).forEach((a) => {
        const [key, value] = a.split('=\"');
        imageTagAttribute.attributes[key] = value.replace(/\"/g, '');
      });
      return imageTagAttribute.attributes.id === postImageContent.id;
    });

    const result = await this.toastHelper.editImage('Edit Image', postImageContent);
    const [imageTagString] = imageTag || [];
    if (result.value) {
      let imageStyle = this.imageHelper.getImageStyle(postImageContent);
      imageStyle = Object.assign(imageStyle, result.value);
      const imageStyleNames = Object.keys(imageStyle);
      const imageStyleString = imageStyleNames.map((imageStyleName) => [imageStyleName, imageStyle[imageStyleName]].join(':')).join(';');
      postImageContent.attributes.style = imageStyleString;
      inputString = inputString.replace(
        imageTagString,
        this.imageHelper.getImageString(postImageContent),
      );
      this.postContentForm.controls.postMarkdown.setValue(inputString);
      await this.blogService.update(path, postImageContent);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      inputString = inputString.replace(imageTagString, '');
      this.postContentForm.controls.postMarkdown.setValue(inputString);
      await this.imageStorage.delete(path);
      await this.blogService.delete(path, {});
    }
  }

  getCategoryTitle(categoryId: string): string {
    const [category] = this.blogService.getCategory(categoryId, this.blogContent?.categoryMap);
    return category?.name;
  }

  clickPostEdit(): void {
    this.isEditingPost = true;
  }

  clickPostEditCancel(): void {
    this.isEditingPost = false;
  }

  getPostMarkdownLines(): number {
    return this.postContentForm?.controls?.postMarkdown?.value?.match(/\n/g)?.length + 2 || 3;
  }

  async handleClickEditPostCreateUpdate(): Promise<void> {
    if (this.isEditingPost){
      this.hasNullPostTitleError = false;
      if (!this.postContentForm.value.postTitle){
        this.hasNullPostTitleError = true;
        return;
      }

      const newPost = this.postContentForm.value;
      newPost.categoryId = this.params.categoryId;
      newPost.createdAt = Number(new Date());

      const slackSyncs = await this.authService.getSlackSyncs();
      const selectedSlackSync = slackSyncs.find((slackSync: any) => slackSync.selected);
      newPost.slack = selectedSlackSync;

      const { userName } = this.authService.getCurrentUser();
      newPost.postUrl = `${location.origin}/#/blog/${userName}/post/${newPost.id}`;
      const [selectedCategory] = this.blogService.getCategory(
        newPost.categoryId, this.blogContent?.categoryMap
      ) || [];
      if (selectedCategory) {
        selectedCategory.postCreatedAtList = [
          ...selectedCategory.postCreatedAtList,
          newPost.createdAt,
        ];

        Promise.all([
          this.blogService.update(`blogs/${this.blogContent?.id}`, this.blogContent),
          this.blogService.set(`blogs/${this.blogContent?.id}/posts/${newPost.id}`, newPost),
          this.updateRemovedImage(),
        ]).then(() => {
          this.toastHelper.showSuccess('Post Update', 'Success!');
          setTimeout(() => {
            this.routerHelper.goToBlogPost(this.params, newPost.id);
          }, 500);
        }).catch(e => {
          this.toastHelper.showWarning('Post Update Failed.', e);
        });
      }
    }
  }

  handleClickEditPostCreateCancel(): void {
    const newPost = this.postContentForm.value;
    this.blogService.delete(
      `blogs/${this.blogContent?.id}/posts/${newPost.id}`, {
        parentKeyName: null,
        collectionPath: `blogs/${this.blogContent?.id}/posts`,
        childrenStorage: ['images'],
        children: [{
          parentKeyName: 'postId',
          collectionPath: `blogs/${this.blogContent?.id}/comments`,
          children: []
        }]
      }
    );
    this.routerHelper.goToBlogCategory(this.params, this.params.categoryId);
  }

  async handleClickEditPostUpdate(): Promise<void> {
    if (this.isEditingPost){
      await this.updateRemovedImage();
      const slackSyncs = await this.authService.getSlackSyncs();
      const selectedSlackSync = slackSyncs.find((slackSync: any) => slackSync.selected);
      const postContent = Object.assign({}, this.postContentForm.value);

      if (!postContent.slack?.ts || postContent.slack?.channel !== selectedSlackSync.channel) {
        postContent.slack.channel = selectedSlackSync.channel;
      }

      if (postContent.slack?.token !== selectedSlackSync.token) {
        postContent.slack.token = selectedSlackSync.token;
      }

      this.blogService
      .update(
        `blogs/${this.blogContent?.id}/posts/${this.postContentForm.value.id}`,
        postContent
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

  async handleClickEditPostDelete(): Promise<void> {
    this.toastHelper.askYesNo('Remove Post', 'Are you sure?').then((result) => {
      if (result.value) {
        this.isLoading = true;
        const targetCreatedAt = this.postContentForm.value.createdAt;

        const [selectedCategory] = this.blogService.getCategory(
          this.postContent?.categoryId, this.blogContent?.categoryMap
        ) || [];

        if (selectedCategory) {
          selectedCategory.postCreatedAtList = selectedCategory.postCreatedAtList
            .filter((createdAt) => createdAt !== targetCreatedAt);

          Promise.all([
            this.blogService.update(`blogs/${this.blogContent?.id}`, this.blogContent),
            this.blogService.delete(
              `blogs/${this.blogContent?.id}/posts/${this.postContentForm.value.id}`, {
                parentKeyName: null,
                collectionPath: `blogs/${this.blogContent?.id}/posts`,
                childrenStorage: ['images'],
                children: [{
                  parentKeyName: 'postId',
                  collectionPath: `blogs/${this.blogContent?.id}/comments`,
                  children: []
                }]
              }
            )
          ]).then(() => {
            this.toastHelper.showSuccess('Post Delete', 'OK');
            this.routerHelper.goToBlogCategory(this.params, this.postContentForm.value.categoryId);
          }).catch(e => {
            this.toastHelper.showWarning('Post Delete Failed.', e);
          });
        }
      }
      else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    });
  }

  async clickSlackSync(): Promise<void> {
    const slackSyncs = await this.authService.getSlackSyncs();
    const selectedSlackSync = slackSyncs.find((slackSync: any) => slackSync.selected);
    const itemlist: Array<string> = [];
    let selectedIndex = -1;
    slackSyncs.forEach((slackSync: any, index: number) => {
      itemlist.push(slackSync.name);
      if (slackSync.selected) {
        selectedIndex = index;
      }
    });

    const res = await this.toastHelper.selectOneFromArray(itemlist, selectedIndex);
    console.log(res);

    // Add
    if (res?.dismiss === 'cancel') {
      await this.clickAddSlackSync(slackSyncs);
    }

    // Select
    if (typeof(res.value) === 'number') {
      selectedIndex = res.value;
      slackSyncs.forEach((slackSync: any, index: number) => {
        slackSync.selected = selectedIndex === index;
      });
    }

    const { uid } = this.authService.getCurrentUser();
    const updatedFrom = {
      source: 'webclient',
      name: 'clickSlackSync',
      uid,
    };

    await this.authService.updateSlackSyncs(slackSyncs, updatedFrom);
  }

  async clickEditSlackSync(): Promise<void> {
    const slackSyncs = await this.authService.getSlackSyncs();
    const itemlist: Array<string> = [];
    let selectedIndex = -1;
    slackSyncs.forEach((slackSync: any, index: number) => {
      itemlist.push(slackSync.name);
      if (slackSync.selected) {
        selectedIndex = index;
      }
    });

    const selected = await this.toastHelper.selectOneFromArray(itemlist, selectedIndex);
    console.log(selected);

    let taskName;
    // Add
    if (selected?.dismiss === 'cancel') {
      taskName = 'Add SlackSync';
      await this.clickAddSlackSync(slackSyncs);
    }

    selectedIndex = selected?.value;
    // Edit
    if (typeof(selectedIndex) === 'number') {
      if (selectedIndex < 0) {
        return;
      }

      const res = await this.toastHelper.editSlackSync(slackSyncs[selectedIndex]);
      console.log(res);

      // Delete
      if (res.isDenied) {
        taskName = 'Delete SlackSync';
        slackSyncs.splice(selectedIndex, 1);
      }

      // Update
      if (res.value) {
        taskName = 'Update SlackSync';
        slackSyncs.forEach((slackSync: any, index: number) => {
          slackSync.selected = selectedIndex === index;
        });
        slackSyncs[selectedIndex] = res.value;
        await this.checkSlackCheck(res.value?.channel, res.value?.token);
      }
    }

    const { uid } = this.authService.getCurrentUser();
    const updatedFrom = {
      source: 'webclient',
      name: 'clickSlackSync',
      uid,
    };

    if (taskName) {
      await this.authService.updateSlackSyncs(slackSyncs, updatedFrom);
      this.toastHelper.showSuccess(taskName, 'Success!');
    }
  }


  async clickAddSlackSync(slackSyncs: Array<any>): Promise<void> {
    const { value } = await this.toastHelper.addSlackSync();
    if (!value) {
      return;
    }

    if (!value?.channel || !value?.name || !value?.token) {
      this.toastHelper.showError('Add Slack Sync', 'Please Enter channel, name and token');
      return;
    }

    const res = await this.checkSlackCheck(value?.channel, value?.token);

    if (res.ok) {
      if (value.selected) {
        slackSyncs.forEach((slackSync: any) => {
          slackSync.selected = false;
        });
      }
      slackSyncs.push(value);

      const { uid } = this.authService.getCurrentUser();
      const updatedFrom = {
        source: 'webclient',
        name: 'clickAddSlackSync',
        uid,
      };

      await this.authService.updateSlackSyncs(slackSyncs, updatedFrom);
      this.toastHelper.showError('Slack Sync Add', 'Success!');
    }
  }

  async checkSlackCheck(channel: string, token: string): Promise<any> {
    let res;
    try {
      res = await this.functions.httpsCallable(
        'showlogBlogPostValidateChannelOnSlack'
      )({
        slack: {
          channel,
          token,
        },
        rootPath: environment.rootPath,
      }).toPromise();
    } catch (error) {
      this.toastHelper.showError('Slack Sync Error', 'Can not push Message. Please Check channel and token');
    }
    return res;
  }

  public dropped(files: NgxFileDropEntry[]): void {
    this.files = files;
    for (const droppedFile of files) {

      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
        console.log(droppedFile.relativePath, file);
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }

  public fileOver(event: ElementRef): void{
    console.log(event);
  }

  public fileLeave(event: ElementRef): void{
    console.log(event);
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.queryParamSub?.unsubscribe();
    this.postContentSub?.unsubscribe();
    this.imageContentsSub?.unsubscribe();
  }
}
