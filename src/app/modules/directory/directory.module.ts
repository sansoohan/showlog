import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DirectoryComponent } from './directory.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    DirectoryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
  ],
  exports: [ DirectoryComponent ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DirectoryModule { }
