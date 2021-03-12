import { Component, OnInit, Input } from '@angular/core';
import { BlogContent } from '../../blog.content';

@Component({
  selector: 'app-blog-category-new-post',
  templateUrl: './new-post.component.html',
  styleUrls: ['./new-post.component.scss']
})
export class NewPostComponent implements OnInit {
  @Input() isEditingPost?: boolean;
  @Input() isCreatingPost?: boolean;
  @Input() canEdit?: boolean;
  @Input() blogContents?: Array<BlogContent>;

  constructor() { }

  ngOnInit(): void {
  }
}
