import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BlogContent } from '../view/blog/blog.content';
import { PostContent } from '../view/blog/post/post.content';
import { CategoryContent } from '../view/blog/category/category.content';
import { CommentContent } from '../view/blog/post/comment/comment.content';
import { AuthService } from './auth.service';
import { FormGroup } from '@angular/forms';
import { FormHelper } from 'src/app/helper/form.helper';
import { ToastHelper } from '../helper/toast.helper';
import { AngularFireStorage } from '@angular/fire/storage';
import { CommonService } from './abstract/common.service';
import * as firebase from 'firebase/app';
import FieldPath = firebase.firestore.FieldPath;
import { DataTransferHelper } from '../helper/data-transfer.helper';

@Injectable({
  providedIn: 'root'
})
export class BlogService extends CommonService {
  blogContentsObserver: Observable<BlogContent[]> = null;
  postContentsObserver: Observable<PostContent[]> = null;
  profileUpdateState: string = null;
  userName: string = null;

  constructor(
    public firestore: AngularFirestore,
    public authService: AuthService,
    public storage: AngularFireStorage,
    private formHelper: FormHelper,
    private toastHelper: ToastHelper,
    private dataTransferHelper: DataTransferHelper,
  ) {
    super(authService, firestore, storage);
  }

  getBlogContentsObserver({params = null}): Observable<BlogContent[]> {
    let blogContentsObserver: Observable<BlogContent[]>;
    const queryUserName = params?.userName;
    if (queryUserName) {
      blogContentsObserver = this.firestore
      .collection<BlogContent>('blogs', ref => ref
      .where(new FieldPath('userName'), '==', queryUserName))
      .valueChanges();
    }
    return blogContentsObserver;
  }

  getPostContentsObserver({params = null}, blogId: string): Observable<PostContent[]> {
    const postId = params?.postId;
    if (!blogId || !postId){
      return;
    }
    return this.firestore
      .collection<BlogContent>('blogs').doc(blogId)
      .collection<PostContent>('posts', ref => ref.where('id', '==', postId))
      .valueChanges();
  }

  getProloguePostListObserver(blogId: string): Observable<PostContent[]> {
    if (!blogId){
      return;
    }
    return this.firestore
      .collection<BlogContent>('blogs').doc(blogId)
      .collection<PostContent>('posts', ref => ref.orderBy('createdAt', 'desc').limit(10))
      .valueChanges();
  }

  getCategoryPostListObserver(
    blogId: string,
    postCreatedAtList: Array<number>,
  ): Observable<PostContent[]> {
    if (!blogId){
      return;
    }
    if (postCreatedAtList.length === 0) {
      postCreatedAtList = [-1];
    }

    return this.firestore
      .collection<BlogContent>('blogs').doc(blogId)
      .collection<PostContent>('posts', ref => ref
        .where('createdAt', 'in', postCreatedAtList)
      )
      .valueChanges();
  }

  getCategoryContentsObserver(blogId: string): Observable<CategoryContent[]> {
    if (!blogId){
      return;
    }
    const categoryContentsObserver = this.firestore
    .collection<BlogContent>('blogs').doc(blogId)
    .collection<CategoryContent>('categories')
    .valueChanges();
    return categoryContentsObserver;
  }

  getCommentContentsObserver(
    blogId: string,
    postId: string,
  ): Observable<CommentContent[]> {
    if (!blogId || !postId){
      return;
    }
    const categoryContentsObserver = this.firestore
    .collection<BlogContent>('blogs').doc(blogId)
    .collection<CommentContent>('comments', ref => ref.where('postId', '==', postId))
    .valueChanges();
    return categoryContentsObserver;
  }

  getCategoryDeepCount(
    categoryContent: any,
    categoryContents: Array<any>,
  ): number {
    if (!categoryContent?.value.parentId) {
      return 1;
    }
    const parentCategory = categoryContents
    .find((category) => category.value.id === categoryContent.value.parentId);

    return 1 + this.getCategoryDeepCount(parentCategory, categoryContents);
  }

  async cascadeDeleteCateogry(
    blogContents: Array<BlogContent>,
    targetCategory: FormGroup,
    categoryContentsForm: FormGroup,
  ): Promise<any> {
    const blogId = blogContents[0].id;
    const targetChildCategories = this.formHelper.getChildContentsRecusively(
      // tslint:disable-next-line: no-string-literal
      categoryContentsForm.controls.categoryContents['controls'], targetCategory
    );
    const targetCategories = [targetCategory, ...targetChildCategories];
    const targetCategoryPromises = targetCategories.map(async (category) => {
      return new Promise((resolve, reject) => {
        return this
        .delete(`blogs/${blogId}/categories/${category.value.id}`, {
          parentKeyName: null,
          collectionPath: `blogs/${blogId}/categories`,
          children: [{
            parentKeyName: 'categoryId',
            collectionPath: `blogs/${blogId}/posts`,
            childrenStorage: ['images'],
            children: [{
              parentKeyName: 'postId',
              collectionPath: `blogs/${blogId}/comments`,
              children: []
            }]
          }]
        })
        .then(() => {
          blogContents[0].categoryOrder = blogContents[0].categoryOrder
          .filter((categoryId) => categoryId !== category.value.id);
          this
          .update(`blogs/${blogId}`, blogContents[0])
          .then(() => resolve())
          .catch(e => reject(e));
        })
        .catch(e => reject(e));
      });
    });

    return Promise.all([
      ...targetCategoryPromises,
    ]);
  }
}
