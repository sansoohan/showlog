import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { NotFoundModule } from 'src/app/modules/not-found/not-found.module';
import { PageLoadingModule } from 'src/app/modules/page-loading/page-loading.module';

import { BlogComponent } from './blog.component';
import { CommentComponent } from './post/comment/comment.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PostComponent } from './post/post.component';
import { CategoryComponent } from './category/category.component';
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
import { PrologueComponent } from './prologue/prologue.component';
import { NewPostComponent } from './category/new-post/new-post.component';

import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EmptyComponent } from './empty/empty.component';

@NgModule({
  declarations: [
    BlogComponent,
    PostComponent,
    CategoryComponent,
    CommentComponent,
    LeftSidebarComponent,
    PrologueComponent,
    NewPostComponent,
    EmptyComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NotFoundModule,
    PageLoadingModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    MarkdownModule.forChild(),
  ],
  exports: [
    NotFoundModule,
    PageLoadingModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    BlogComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: []
})
export class BlogModule { }
