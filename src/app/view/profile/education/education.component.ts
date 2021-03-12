import { Component, OnInit, Input } from '@angular/core';
import { EducationsContent, EducationContent } from './educations.content';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';

@Component({
  selector: 'app-profile-education',
  templateUrl: './education.component.html',
  styleUrls: ['../profile.component.scss', './education.component.scss']
})
export class EducationComponent implements OnInit {
  @Input() educationsContent?: EducationsContent;
  @Input() isEditing?: boolean;
  @Input() profileForm: any;
  public newDescription: string;
  public newEducation: EducationContent = new EducationContent();

  constructor(
    public dataTransferHelper: DataTransferHelper,
  ) {
    this.newDescription = '';
  }

  ngOnInit(): void {

  }
}
