import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CommentContent } from './comment.content';
import { BlogService } from 'src/app/services/blog.service';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { ProfileService } from 'src/app/services/profile.service';
import { ToastHelper } from 'src/app/helper/toast.helper';
import Swal from 'sweetalert2';
import { RouterHelper } from 'src/app/helper/router.helper';
import { AuthService } from 'src/app/services/auth.service';
import { CollectionSelect } from 'src/app/services/abstract/common.service';
import * as firebase from 'firebase/app';
import { PostContent } from '../post.content';
const FieldPath = firebase.default.firestore.FieldPath;

@Component({
  selector: 'app-post-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['../../blog.component.scss', './comment.component.scss']
})
export class CommentComponent implements OnInit, OnDestroy {
  creatingCommentParentId?: string;
  creatingCommentForm: any;
  blogId?: string;
  postId?: string;

  commentContents?: CommentContent[];
  commentContentsSub?: Subscription;
  commentContentsForm: any;
  commentContentsObservers?: Array<Observable<CommentContent[]>>;

  paramSub: Subscription;
  params: any;

  isPage = true;
  isLoading = true;
  isCreatingComment = false;
  editingCommentId?: string;
  isShowingComment = false;
  hasNullCommentContentError = false;

  pageSize = 0;
  pageIndex = 0;
  commentCreatedAtList: Array<number> = [];

  constructor(
    public profileService: ProfileService,
    private toastHelper: ToastHelper,
    public routerHelper: RouterHelper,
    private route: ActivatedRoute,
    private blogService: BlogService,
    public formHelper: FormHelper,
    public dataTransferHelper: DataTransferHelper,
    private authService: AuthService,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.params = params;
    });
  }

  @Input() isEditingPost?: boolean;
  @Input()
  get postContent(): PostContent|undefined { return this._postContent; }
  set postContent(postContent: PostContent|undefined) {
    if (!postContent){
      this.isPage = false;
      return;
    }
    this.isPage = true;
    this.isLoading = true;
    this._postContent = postContent;
    this.postId = postContent.id;
    this.blogId = postContent.blogId;
    this.commentCreatedAtList = postContent.commentCreatedAtList;
    this.changePageList(null);
  }
  // tslint:disable-next-line: variable-name
  private _postContent?: PostContent;

  isOwner(commentOwnerId: string): boolean {
    if (!this.authService.isSignedIn()){
      return false;
    }

    return commentOwnerId === this.authService.getCurrentUser()?.uid;
  }

  getCommentMarkdownLines(commentContent: any): number{
    return commentContent?.controls?.commentMarkdown?.value?.match(/\n/g)?.length + 2 || 3;
  }

  clickCommnetNew(parentId?: string): void {
    this.isCreatingComment = true;
    this.creatingCommentParentId = parentId;
    this.creatingCommentForm = this.formHelper.buildFormRecursively(new CommentContent());
    this.routerHelper.scrollToIdElement('comment-new');
  }

  clickCommentNewCancel(): void {
    this.isCreatingComment = false;
    delete this.creatingCommentParentId;
    delete this.creatingCommentForm;
  }

  clickCommentNewUpdate(): void {
    const newComment = this.creatingCommentForm.value;
    newComment.postId = this.params.postId;
    newComment.userName = this.authService.getCurrentUser()?.userName;

    const createdAt = Number(new Date());
    newComment.createdAt = createdAt;

    this.creatingCommentForm = this.formHelper.buildFormRecursively(newComment);
    Promise.all([
      this.blogService.create(`blogs/${this.postContent?.blogId}/comments`, newComment),
      this.blogService.update(`blogs/${this.postContent?.blogId}/posts/${this.postContent?.id}`, {
        commentCreatedAtList: [...this.commentCreatedAtList, createdAt]
      }),
    ])
    .then(() => {
      this.toastHelper.showSuccess('Comment Update', 'Success!');
      this.isCreatingComment = false;
      delete this.creatingCommentParentId;
      delete this.creatingCommentForm;
    })
    .catch(e => {
      this.toastHelper.showWarning('Comment Update Failed.', e);
    });
  }

  clickCommentEdit(commentId: string): void {
    this.editingCommentId = commentId;
  }

  clickCommentEditCancel(): void {
    delete this.editingCommentId;
  }

  handleClickEditCommentUpdate(commentForm: any): void {
    this.hasNullCommentContentError = false;
    if (!commentForm.value.commentMarkdown){
      this.hasNullCommentContentError = true;
      return;
    }

    const commentData = Object.assign({}, commentForm.value);
    const { uid } = this.authService.getCurrentUser();
    commentData.updatedFrom = {
      source: 'webclient',
      name: 'handleClickEditCommentUpdate',
      uid,
    };

    this.blogService
    .update(
      `blogs/${this.postContent?.id}/comments/${commentForm.value.id}`,
      commentForm.value
    )
    .then(() => {
      this.toastHelper.showSuccess('Comment Update', 'Success!');
    })
    .catch(e => {
      this.toastHelper.showWarning('Comment Update Failed.', e);
    });
  }

  handleClickEditCommentDelete(commentContent: any): void {
    this.toastHelper.askYesNo('Remove Profile Category', 'Are you sure?').then((result) => {
      if (result.value && commentContent.value.id) {
        const commentCreatedAtList = this.commentCreatedAtList
        .filter((createdAt) => commentContent.value.createdAt !== createdAt);
        Promise.all([
          this.blogService.delete(
            `blogs/${this.postContent?.blogId}/comments/${commentContent.value.id}`,
            {}
          ),
          this.blogService.update(`blogs/${this.postContent?.blogId}/posts/${this.postContent?.id}`, {
            commentCreatedAtList
          }),
        ])
        .then(() => {
          this.toastHelper.showSuccess('Comment Delete', 'OK');
        })
        .catch(e => {
          this.toastHelper.showWarning('Comment Delete Failed.', e);
        });
      }
      else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    });
  }

  changePageList(event: any): void {
    this.pageIndex = 0;
    this.pageSize = 20;
    if (event) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
    }

    if (this.commentContentsSub) {
      this.commentContentsSub.unsubscribe();
    }

    const startIndex = this.pageIndex * this.pageSize;
    const selectedCreatedAtList = Object.assign([], this.commentCreatedAtList)
    .sort((createdA, createdB) => createdA - createdB)
    .splice(startIndex, startIndex + this.pageSize);

    this.commentContentsObservers = [];
    for (let index = 0; index < selectedCreatedAtList.length; index += 10) {
      const createdAtList = Object.assign([], selectedCreatedAtList).splice(index, index + 10);
      const commentContentsObserver = this.blogService.select<CommentContent>(
        `blogs/${this.blogId}/posts`,
        {
          where: [{
            fieldPath: new FieldPath('createdAt'),
            operator: 'in',
            value: createdAtList.length ? createdAtList : [-1],
          }]
        } as CollectionSelect
      );

      this.commentContentsObservers.push(commentContentsObserver);
    }

    this.commentContents = [];
    this.commentContentsSub = zip(...this.commentContentsObservers)?.subscribe((commentContentsList) => {
      this.commentContents = [];
      commentContentsList.forEach(commentContents => {
        this.commentContents = [...this.commentContents || [], ...commentContents];
        this.commentContents.sort((commentA: any, commentB: any) => commentB.createdAt - commentA.createdAt);
        this.commentContentsForm = this.formHelper.buildFormRecursively({commentContents: this.commentContents});
      });
    });

    if (selectedCreatedAtList.length === 0) {
      this.commentContentsForm = this.formHelper.buildFormRecursively({commentContents: this.commentContents});
    }
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.commentContentsSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }
}
