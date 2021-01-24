import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BlogContent } from '../view/blog/blog.content';
import { PostContent } from '../view/blog/post/post.content';
import { CategoryContent } from '../view/blog/category/category.content';
import { CommentContent } from '../view/blog/post/comment/comment.content';
import { AuthService } from './auth.service';
import { FormGroup, FormArray } from '@angular/forms';
import { FormHelper } from 'src/app/helper/form.helper';
import { ToastHelper } from '../helper/toast.helper';
import { AngularFireStorage } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  blogContentsObserver: Observable<BlogContent[]> = null;
  postContentsObserver: Observable<PostContent[]> = null;
  profileUpdateState: string = null;
  userName: string = null;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private formHelper: FormHelper,
    private toastHelper: ToastHelper,
    private storage: AngularFireStorage,
  ) { }

  async addImageOnPost(file: File, path: string, content: any): Promise<any> {
    if (!this.authService.isSignedIn()) {
      return null;
    }

    const filePath = `blogs/${JSON.parse(localStorage.currentUser).uid}/postImages/${file.name}`;
    const MB = 1024 * 1024;
    if (file.size > 10 * MB) {
      this.toastHelper.showError('Profile Image', 'Please Upload under 10MB');
      return;
    }

    const fileRef = this.storage.ref(filePath);
    await this.storage.upload(filePath, file);
    const updatedContent = await new Promise((resolve, reject) => {
      const fileRefSubscribe = fileRef.getDownloadURL().subscribe(imageUrl => {
        content.postImageUrl = imageUrl;
        this.create(path, content)
        .then(() => {
          this.toastHelper.showSuccess('Post Image', 'Your Post Image is uploaded!');
          fileRefSubscribe.unsubscribe();
          resolve(content)
        }).catch((error) => {
          fileRefSubscribe.unsubscribe();
          reject(error);
        })
      });
    });
    return updatedContent;
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
        .delete(`blogs/${blogId}/categories/${category.value.id}`)
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

    const targetPostPromises = targetCategories.map((category) => {
      return new Promise((resolve, reject) => {
        const tmpSub = this
        .getCategoryPostListObserver(blogId, category.value.postCreatedAtList)
        .subscribe((postContents: Array<PostContent>) => {
          const postContentPromises = postContents.map((postContent) => {
            return new Promise((resolveInner, rejectInner) => {
              this
              .delete(`blogs/${blogId}/posts/${postContent.id}`)
              .then(() => resolveInner())
              .catch((e) => rejectInner(e));
            });
          });

          Promise.all(postContentPromises)
          .then(() => {
            tmpSub.unsubscribe();
            resolve();
          })
          .catch((e) => reject(e));
        });
      });
    });

    return Promise.all([
      ...targetPostPromises,
      ...targetCategoryPromises,
    ]);
  }

  async create(path: string, content: any): Promise<void> {
    if (!this.authService.isSignedIn()) {
      return null;
    }
    content.ownerId = JSON.parse(localStorage.currentUser).uid;
    return this.firestore.collection(path).add(content)
    .then(async (collection) => {
      content.id = collection.id;
      return collection.update(content);
    });
  }

  async update(path: string, updated: any): Promise<void> {
    return this.firestore.doc(path).update(updated);
  }
  async delete(path: string): Promise<void> {
    return this.firestore.doc(path).delete();
  }
}
