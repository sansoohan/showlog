import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { profileDefault } from '../profile/profile.default';
import { MessageService } from './message.service';
import { BlogContent } from '../blog/blog.content';
import * as firebase from 'firebase';
import { PostContent } from '../blog/post/post.content';
import { CategoryContent } from '../blog/category/category.content';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  blogContentsObserver: Observable<BlogContent[]> = null;
  postContentsObserver: Observable<PostContent[]> = null;
  profileUpdateState: string = null;
  userName: string = null;

  constructor(private firestore: AngularFirestore, private message: MessageService) { }

  updateBlog(updatedBlogContent: BlogContent, blogContentsObserver: Observable<BlogContent[]>) {
    this.firestore.collection('profiles').doc(updatedBlogContent.id)
    .update(updatedBlogContent)
    .then(() => {
      this.message.showSuccess('Profile Update', 'Success!');
    })
    .catch(e => {
      console.error(e);
      this.message.showWarning('Profile Update Failed.', e);
    });
  }

  // getUserEmailCollisionObserver(userEmail: string){
  //   let userEmailCollisionObserver: Observable<BlogContent[]>;
  //   userEmailCollisionObserver = this.firestore
  //   .collection<BlogContent>('profiles', ref => ref
  //   .where(new firebase.firestore.FieldPath('aboutContent', 'email'), '==', userEmail))
  //   .valueChanges();
  //   return userEmailCollisionObserver;
  // }

  // getUserNameCollisionObserver(userName: string){
  //   let userNameCollisionObserver: Observable<BlogContent[]>;
  //   userNameCollisionObserver = this.firestore
  //   .collection<BlogContent>('profiles', ref => ref
  //   .where(new firebase.firestore.FieldPath('aboutContent', 'userName'), '==', userName))
  //   .valueChanges();
  //   return userNameCollisionObserver;
  // }

  getCategoryPost(blogId, categoryIds: Array<number>): Observable<PostContent[]> {
    this.postContentsObserver = this.firestore
    .collection<BlogContent>('blogs').doc(blogId)
    .collection<PostContent>('posts', ref => ref.where('categoryId', 'in', categoryIds))
    .valueChanges();
    return this.postContentsObserver;
  }

  getBlogContentsObserver({params = null}): Observable<BlogContent[]> {
    if (!this.blogContentsObserver){
      const currentUser = JSON.parse(localStorage.currentUser || null);
      const queryUserName = currentUser?.userName || params?.userName;
      this.blogContentsObserver = this.firestore
      .collection<BlogContent>('blogs', ref => ref.where('userName', '==', queryUserName))
      .valueChanges();
    }
    return this.blogContentsObserver;
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
  getPostListObserver({params = null}, blogId: string, categoryIds): Observable<PostContent[]> {
    const categoryId = params?.categoryId;
    if (!blogId || !categoryId){
      return;
    }
    return this.firestore
      .collection<BlogContent>('blogs').doc(blogId)
      .collection<PostContent>('posts', ref => ref.where('categoryId', 'in', categoryIds))
      .valueChanges();
  }

  getCategoryContentsObserver({params = null}, blogId: string): Observable<CategoryContent[]> {
    if (!blogId){
      return;
    }
    const categoryId = params?.categoryId;
    const categoryContentsObserver = this.firestore
    .collection<BlogContent>('blogs').doc(blogId)
    .collection<CategoryContent>('categories')
    .valueChanges();
    return categoryContentsObserver;
  }

  deleteBlog(blogId): void {
    this.firestore.doc(`blogs/${blogId}`).delete();
  }
  deleteCategory(blogId, categoryId): void {
    this.firestore.doc(`blogs/${blogId}/categories/${categoryId}`).delete();
  }
  deletePost(blogId, postId): void {
    this.firestore.doc(`blogs/${blogId}/posts/${postId}`).delete();
  }
  deleteComment(blogId, commentId): void {
    this.firestore.doc(`blogs/${blogId}/comments/${commentId}`).delete();
  }
}