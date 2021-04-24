import { AboutContent } from './about/about.content';
import { AdditionalProfileContent } from './additional-profiles/additional-profile.content';
import { SkillsContent } from './skills/skills.content';
import { ProjectsContent } from './projects/projects.content';
import { InterestsContent } from './interests/interests.content';
import { EducationsContent } from './education/educations.content';

export class ProfileContent {
  id: string;
  ownerId: string;
  userName: string;
  profileImageSrc: string;
  profileTitle: string;
  aboutContent: AboutContent;
  educationsContent: EducationsContent;
  interestsContent: InterestsContent;
  projectsContent: ProjectsContent;
  skillsContent: SkillsContent;
  additionalProfilesContent: Array<AdditionalProfileContent>;
  slackSyncs: Array<any>;
  updatedFrom: any;
  constructor(
    id: string = '',
    ownerId: string = '',
    userName: string = '',
    profileImageSrc: string = '',
    profileTitle: string = '',
    aboutContent: AboutContent = new AboutContent(),
    educationsContent: EducationsContent = new EducationsContent(),
    interestsContent: InterestsContent = new InterestsContent(),
    projectsContent: ProjectsContent = new ProjectsContent(),
    skillsContent: SkillsContent = new SkillsContent(),
    additionalProfilesContent: Array<AdditionalProfileContent> = [new AdditionalProfileContent()],
    slackSyncs: Array<any> = [],
    updatedFrom: any = {},
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.userName = userName;
    this.profileImageSrc = profileImageSrc;
    this.profileTitle = profileTitle;
    this.aboutContent = aboutContent;
    this.educationsContent = educationsContent;
    this.interestsContent = interestsContent;
    this.projectsContent = projectsContent;
    this.skillsContent = skillsContent;
    this.additionalProfilesContent = additionalProfilesContent;
    this.slackSyncs = slackSyncs;
    this.updatedFrom = updatedFrom;
  }
}
