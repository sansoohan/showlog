import { Component, OnInit, Input } from '@angular/core';
import { SkillsContent, SkillGroup, SkillDescription } from './skills.content';

@Component({
  selector: 'app-profile-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['../profile.component.scss', './skills.component.scss']
})
export class SkillsComponent implements OnInit {
  @Input() skillsContent?: SkillsContent;
  @Input() isEditing?: boolean;
  @Input() profileForm: any;
  public newSkillGroup: SkillGroup = new SkillGroup();
  public newSkillDescription: SkillDescription = new SkillDescription();

  constructor() { }

  ngOnInit(): void {
  }
}
