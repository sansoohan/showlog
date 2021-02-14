import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CommentContent } from './comment.content';
import { BlogService } from 'src/app/services/blog.service';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transefer.helper';
import { BlogContent } from '../../blog.content';
import { ProfileService } from 'src/app/services/profile.service';
import { ToastHelper } from 'src/app/helper/toast.helper';
import Swal from 'sweetalert2';
import { RouterHelper } from 'src/app/helper/router.helper';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['../../blog.component.css', './comment.component.css']
})
export class CommentComponent implements OnInit, OnDestroy {
  isPage: boolean;
  isEditingCommentIds: Array<string>;
  isCreatingComment: boolean;
  creatingCommentParentId: string;
  creatingCommentForm: any;
  isShowingComment: boolean;
  hasNullCommentContentError: boolean;
  blogId: string;

  commentContents: CommentContent[];
  commentContentsSub: Subscription;
  commentContentsForm: any;
  commentContentsObserver: Observable<CommentContent[]>;

  paramSub: Subscription;
  params: any;

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
      this.isEditingCommentIds = [];
      this.hasNullCommentContentError = false;
      this.isCreatingComment = false;
      this.isShowingComment = false;
      this.params = params;
    });
  }

  @Input() isEditingPost: boolean;
  @Input()
  get blogContents(): Array<BlogContent> { return this._blogContents; }
  set blogContents(blogContents: Array<BlogContent>) {
    this.isPage = true;
    if (!blogContents || blogContents.length === 0){
      this.isPage = false;
      return;
    }
    this._blogContents = blogContents;
    this.blogId = blogContents[0].id;

    this.commentContentsObserver =
      this.blogService.getCommentContentsObserver(this.blogId, this.params.postId);
    this.commentContentsSub = this.commentContentsObserver.subscribe(commentContents => {
      if (!commentContents || commentContents.length === 0) {
        this.isPage = false;
        return;
      }
      this.commentContents = commentContents;
      // this.commentContents.sort((categoryA: CommentContent, categoryB: CommentContent) =>
      //   categoryA.commentNumber - categoryB.commentNumber);

      this.commentContents.sort(this.dataTransferHelper.compareByOrderRecursively);
      this.commentContentsForm =
        this.formHelper.buildFormRecursively({commentContents: this.commentContents});
      this.isShowingComment = true;
    });
  }
  // tslint:disable-next-line: variable-name
  private _blogContents: Array<BlogContent>;

  isOwner(commentOwnerId): boolean {
    if (!this.authService.isSignedIn()){
      return false;
    }

    return commentOwnerId === this.authService.getCurrentUser()?.uid;
  }

  getCommentMarkdownLines(commentContent){
    return commentContent?.controls?.commentMarkdown?.value?.match(/\n/g)?.length + 2 || 3;
  }

  clickCommnetNew(parentId: string = null){
    this.isCreatingComment = true;
    this.creatingCommentParentId = parentId;
    this.creatingCommentForm = this.formHelper.buildFormRecursively(new CommentContent());
    this.routerHelper.scrollToIdElement('comment-new');
  }

  clickCommentNewCancel() {
    this.isCreatingComment = false;
    this.creatingCommentParentId = null;
    delete this.creatingCommentForm;
  }

  clickCommentNewUpdate() {
    const newComment = this.creatingCommentForm.value;
    newComment.postId = this.params.postId;
    newComment.userName = this.authService.getCurrentUser()?.userName;
    const parentComment = this.commentContents
    .find((commentContent) => commentContent.id === this.creatingCommentParentId);

    const createdAt = Number(new Date());
    newComment.createdAt = createdAt;
    newComment.order = [createdAt];

    if (parentComment) {
      newComment.parentId = parentComment.id;
      newComment.deepCount = parentComment.deepCount + 1;
      newComment.order = [...parentComment.order, createdAt];
    }

    this.creatingCommentForm = this.formHelper.buildFormRecursively(newComment);
    this.blogService
    .create(`blogs/${this.blogContents[0].id}/comments`, newComment)
    .then(() => {
      this.toastHelper.showSuccess('Comment Update', 'Success!');
      this.isCreatingComment = false;
      this.creatingCommentParentId = null;
      delete this.creatingCommentForm;
    })
    .catch(e => {
      this.toastHelper.showWarning('Comment Update Failed.', e);
    });
  }

  clickCommentEdit(commentId: string) {
    this.isEditingCommentIds.push(commentId);
  }

  clickCommentEditCancel(commentId) {
    this.isEditingCommentIds = this.isEditingCommentIds
    .filter((isEditingCommentId) => isEditingCommentId !== commentId);
  }

  handleClickEditCommentUpdate(commentForm): void {
    if (this.isEditingCommentIds.includes(commentForm.value.id)){
      this.hasNullCommentContentError = false;
      if (!commentForm.value.commentMarkdown){
        this.hasNullCommentContentError = true;
        return;
      }

      this.blogService
      .update(
        `blogs/${this.blogContents[0].id}/comments/${commentForm.value.id}`,
        commentForm.value
      )
      .then(() => {
        this.toastHelper.showSuccess('Comment Update', 'Success!');
        this.isEditingCommentIds = this.isEditingCommentIds
        .filter((isEditingCommentId) => isEditingCommentId !== commentForm.value.id);
      })
      .catch(e => {
        this.toastHelper.showWarning('Comment Update Failed.', e);
      });
    }
  }

  handleClickEditCommentDelete(commentContent) {
    this.toastHelper.askYesNo('Remove Profile Category', 'Are you sure?').then((result) => {
      if (result.value && commentContent.value.id) {
        this.blogService.delete(
          `blogs/${this.blogContents[0].id}/comments/${commentContent.value.id}`,
        )
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

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.commentContentsSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }
}
