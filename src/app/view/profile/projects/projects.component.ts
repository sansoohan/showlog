import { Component, OnInit, Input } from '@angular/core';
import { ProjectsContent, ProjectDescription } from './projects.content';

@Component({
  selector: 'app-profile-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['../profile.component.css', './projects.component.css']
})
export class ProjectsComponent implements OnInit {
  @Input() projectsContent: ProjectsContent;
  @Input() isEditing: boolean;
  @Input() profileForm: any;
  public newTaskDescription: '';
  public newProjectDescription: ProjectDescription = new ProjectDescription();

  constructor() { }

  ngOnInit() {

  }
}
