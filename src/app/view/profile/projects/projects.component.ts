import { Component, OnInit, Input } from '@angular/core';
import { ProjectsContent, ProjectDescription } from './projects.content';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';

@Component({
  selector: 'app-profile-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['../profile.component.scss', './projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  @Input() projectsContent?: ProjectsContent;
  @Input() isEditing?: boolean;
  @Input() profileForm: any;
  public newTaskDescription: string;
  public newProjectDescription: ProjectDescription = new ProjectDescription();

  constructor(
    public dataTransferHelper: DataTransferHelper,
  ) {
    this.newTaskDescription = '';
  }

  ngOnInit(): void {

  }
}
