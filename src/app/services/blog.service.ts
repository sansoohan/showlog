import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BlogContent } from '../view/blog/blog.content';
import { PostContent } from '../view/blog/post/post.content';
import { CategoryContent } from '../view/blog/category/category.content';
import { CommentContent } from '../view/blog/post/comment/comment.content';
import { AuthService } from './auth.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { CommonService } from './abstract/common.service';
import { environment } from 'src/environments/environment';
import * as firebase from 'firebase/app';
import { RouterHelper } from '../helper/router.helper';
import { ToastHelper } from '../helper/toast.helper';

const FieldPath = firebase.default.firestore.FieldPath;

@Injectable({
  providedIn: 'root'
})
export class BlogService extends CommonService {
  blogContentsObserver?: Observable<BlogContent[]>;
  postContentsObserver?: Observable<PostContent[]>;
  profileUpdateState?: string;
  userName?: string;

  constructor(
    public firestore: AngularFirestore,
    public authService: AuthService,
    public storage: AngularFireStorage,
    private routerHelper: RouterHelper,
    private toastHelper: ToastHelper,
  ) {
    super(authService, firestore, storage);
  }

  getCategory(categoryId?: string, categories?: Array<CategoryContent>): Array<CategoryContent> {
    let results: Array<CategoryContent> = [];
    for (const category of categories || []) {
      if (category.id === categoryId) {
        results.push(category);
      } else {
        results = [...this.getCategory(categoryId, category.children), ...results];
      }
    }
    return results.filter(Boolean);
  }

  async removeCategoryPosts(
    blogId: string,
    postCreatedAtList: Array<number>,
  ): Promise<void> {
    if (!blogId){
      return;
    }
    if (postCreatedAtList.length === 0) {
      postCreatedAtList = [-1];
    }

    const postContentsPromises = [];
    for (let index = 0; index < postCreatedAtList.length; index += 10) {
      const createdAtList = Object.assign([], postCreatedAtList).splice(index, index + 10);
      const postContentPromise = this.firestore
      .collection<BlogContent>('blogs').doc(blogId)
      .collection<PostContent>('posts', ref => ref
        .where('createdAt', 'in', createdAtList)
      ).get().toPromise();

      postContentsPromises.push(postContentPromise);
    }

    await Promise.all(postContentsPromises).then((postContentsList) => {
      postContentsList.forEach(posts => {
        posts.forEach(postDoc => {
          const cascade = {
            parentKeyName: null,
            collectionPath: `blogs/${blogId}/posts`,
            // childrenStorage: ['images'],
            children: [{
              parentKeyName: 'postId',
              collectionPath: `blogs/${blogId}/comments`,
              children: []
            }]
          };
          this.delete(
            `blogs/${blogId}/posts/${postDoc.id}`, cascade
          );
        });
      });
    });

    this.toastHelper.showSuccess('Category Removed', 'Success!');
    this.routerHelper.goToBlogPrologue({});
  }
}
