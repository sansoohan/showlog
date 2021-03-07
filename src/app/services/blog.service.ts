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

  getCategory(categoryId: string, categories: Array<CategoryContent>): Array<CategoryContent>{
    let results: Array<CategoryContent> = [];
    for (const category of categories) {
      if (category.id === categoryId) {
        results.push(category);
      } else {
        results = [...this.getCategory(categoryId, category.children), ...results];
      }
    }

    return results.filter(Boolean);
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

  removeCategoryPosts(
    blogId: string,
    postCreatedAtList: Array<number>,
  ): Promise<void> {
    if (!blogId){
      return;
    }
    if (postCreatedAtList.length === 0) {
      postCreatedAtList = [-1];
    }

    this.firestore
    .collection<BlogContent>('blogs').doc(blogId)
    .collection<PostContent>('posts', ref => ref
      .where('createdAt', 'in', postCreatedAtList)
    ).get().toPromise().then(posts => posts.forEach(postDoc => {
      this.delete(
        `blogs/${blogId}/posts/${postDoc.id}`, {
          parentKeyName: null,
          collectionPath: `blogs/${blogId}/posts`,
          childrenStorage: ['images'],
          children: [{
            parentKeyName: 'postId',
            collectionPath: `blogs/${blogId}/comments`,
            children: []
          }]
        }
      );
    }));
  }

  getCommentContentsObserver(
    blogId: string,
    postId: string,
  ): Observable<CommentContent[]> {
    if (!blogId || !postId){
      return;
    }
    return this.firestore
    .collection<BlogContent>('blogs').doc(blogId)
    .collection<CommentContent>('comments', ref => ref.where('postId', '==', postId))
    .valueChanges();
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
}
