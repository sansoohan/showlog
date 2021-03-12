export class ProjectsContent {
  projects: Array<ProjectDescription>;

  public newProjectDescription: ProjectDescription = new ProjectDescription();

  constructor(
    projects: Array<ProjectDescription> = [
      new ProjectDescription(
        'Company',
        'ProjectName',
        2,
        'PM/PL/PG/SE/QA',
        null,
        null,
        [
          'Task Flow 1',
          'Task Flow 2'
        ]
      ),
    ]
  ){
    this.projects = projects;
  }
}

export class ProjectDescription {
  organization: string;
  projectName: string;
  memberNum: number;
  position: string;
  startedAt: string|null;
  finishedAt: string|null;
  taskDescriptions: Array<string>;
  constructor(
    organization: string = '',
    projectName: string = '',
    memberNum: number = 0,
    position: string = '',
    startedAt: string|null = null,
    finishedAt: string|null = null,
    taskDescriptions: Array<string> = ['']
  ){
    this.organization = organization;
    this.projectName = projectName;
    this.memberNum = memberNum;
    this.position = position;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
    this.taskDescriptions = taskDescriptions;
  }
}
