import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PostContent } from './post/post.content';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { BlogContent } from './blog.content';
import Swal from 'sweetalert2';
import { CategoryContent } from './category/category.content';
import { AuthService } from 'src/app/services/auth.service';
import { FormHelper } from 'src/app/helper/form.helper';
import { DataTransferHelper } from 'src/app/helper/data-transefer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit, OnDestroy {
  blogContentsObserver: Observable<BlogContent[]>;
  blogContents: BlogContent[];
  blogContensSub: Subscription;

  categoryContentsObserver: Observable<CategoryContent[]>;
  categoryContents: CategoryContent[];
  categoryContentsSub: Subscription;
  categoryContentsForm: any;
  isEditingCategory: boolean;

  postContentsObserver: Observable<PostContent[]>;
  postContents: PostContent[];
  postContentsSub: Subscription;
  postContentsForm: any;
  isShowingPostContents: boolean;
  isEditingPost: boolean;

  postListObserver: Observable<PostContent[]>;
  postList: PostContent[];
  postListSub: Subscription;
  postListForm: any;
  isShowingPostList: boolean;

  blogId: string;
  isPage: boolean;
  updateOk: boolean;
  newDescription: '';

  newPostConent = new PostContent();
  paramSub: Subscription;
  params: any;
  selectedCategory: FormGroup;
  selectedChildCategories: Array<FormGroup>;
  selectedCategoryId: string;
  selectedChildCategoryIds: Array<string>;

  constructor(
    private route: ActivatedRoute,
    public formHelper: FormHelper,
    public dataTransferHelper: DataTransferHelper,
    public routerHelper: RouterHelper,
    private blogService: BlogService,
    public authService: AuthService,
    private firestore: AngularFirestore,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.isPage = true;
      this.isShowingPostList = false;
      this.isShowingPostContents = false;
      this.isEditingCategory = false;
      this.isEditingPost = false;
      this.params = params;
      this.selectedCategoryId = params.categoryId;

      this.blogContentsObserver = this.blogService.getBlogContentsObserver({params});
      this.blogContensSub = this.blogContentsObserver.subscribe(async (blogContents) => {
        this.blogContents = blogContents;
        if (this.blogContents.length === 0){
          const userUid = this.authService.getCurrentUser()?.uid;
          const isOwner = await this.authService.isOwner();
          if (!isOwner) {
            this.isPage = false;
            return;
          }
          const newCategoryContent = new CategoryContent();
          newCategoryContent.blogId = userUid;
          await this.blogService.create(`blogs/${userUid}/categories`, newCategoryContent);
          const newBlogContent = new BlogContent();
          newBlogContent.categoryOrder.push(newCategoryContent.id);
          await this.blogService.set(`blogs/${userUid}`, newBlogContent);
        }

        this.blogId = this.blogContents[0].id;
      });
    });
  }

  async clickCategoryEditUpdate(content: BlogContent | PostContent | CategoryContent){
    if (!this.updateOk){
      Swal.fire({
        icon: 'warning',
        title: 'Upate Fail',
        text: 'Checking User Email and Name',
        showCancelButton: false
      });
      return;
    }

    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    });

    await swalWithBootstrapButtons.fire({
      title: 'Updating...',
      // tslint:disable-next-line:quotemark
      text: "Are you sure?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.value) {
        if (this.isEditingCategory){
          // this.profileService.updateProfile(profileContent, this.profileContentsObserver);
        }
        this.isEditingCategory = false;
      }
      else if (result.dismiss === Swal.DismissReason.cancel){

      }
    });
  }




  async clickPostEditUpdate(content: BlogContent | PostContent | CategoryContent){
    if (!this.updateOk){
      Swal.fire({
        icon: 'warning',
        title: 'Upate Fail',
        text: 'Checking User Email and Name',
        showCancelButton: false
      });
      return;
    }

    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    });

    await swalWithBootstrapButtons.fire({
      title: 'Updating...',
      // tslint:disable-next-line:quotemark
      text: "Are you sure?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.value) {
        if (this.isEditingPost){
          // this.profileService.updateProfile(profileContent, this.profileContentsObserver);
        }
        this.isEditingPost = false;
      }
      else if (result.dismiss === Swal.DismissReason.cancel){

      }
    });
  }


  ngOnInit() {

  }

  ngOnDestroy() {
    this.blogContensSub?.unsubscribe();
    this.categoryContentsSub?.unsubscribe();
    this.postContentsSub?.unsubscribe();
    this.postListSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }
}
