import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLoadingModule } from 'src/app/modules/page-loading/page-loading.module';
import { TalkComponent } from './talk.component';
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
import { RoomComponent } from './room/room.component';
import { EntranceComponent } from './entrance/entrance.component';
import { NotFoundModule } from 'src/app/modules/not-found/not-found.module';
import { MatPaginatorModule } from '@angular/material/paginator';

@NgModule({
  declarations: [
    TalkComponent,
    LeftSidebarComponent,
    RoomComponent,
    EntranceComponent,
  ],
  imports: [
    NotFoundModule,
    CommonModule,
    PageLoadingModule,
    MatPaginatorModule,
  ],
  exports: [
    NotFoundModule,
    TalkComponent,
    MatPaginatorModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TalkModule { }
