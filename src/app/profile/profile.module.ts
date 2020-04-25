import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from './navbar/navbar.component';
import { AboutComponent } from './about/about.component';
import { EducationComponent } from './education/education.component';
import { SkillsComponent } from './skills/skills.component';
import { InterestsComponent } from './interests/interests.component';
import { ProjectsComponent } from './projects/projects.component';
import { AdditionalProfilesComponent } from './additional-profiles/additional-profiles.component';
import { ProfileComponent } from './profile.component';

@NgModule({
  declarations: [
    ProfileComponent,
    NavbarComponent,
    AboutComponent,
    EducationComponent,
    SkillsComponent,
    InterestsComponent,
    ProjectsComponent,
    AdditionalProfilesComponent
  ],
  imports: [ CommonModule ],
  exports: [ ProfileComponent ],
  providers: []
})
export class ProfileModule { }
