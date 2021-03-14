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
import * as firebase from 'firebase/app';

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

  removeCategoryPosts(
    blogId: string,
    postCreatedAtList: Array<number>,
  ): Promise<void>|undefined {
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
    ).get().toPromise().then(posts => posts.forEach(postDoc => {
      const cascade = {
        parentKeyName: null,
        collectionPath: `blogs/${blogId}/posts`,
        childrenStorage: ['images'],
        children: [{
          parentKeyName: 'postId',
          collectionPath: `blogs/${blogId}/comments`,
          children: []
        }]
      };
      this.delete(
        `blogs/${blogId}/posts/${postDoc.id}`, cascade
      );
    }));
  }
}
