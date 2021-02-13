export class SkillsContent {
  skillGroups: Array<SkillGroup>;
  constructor(
    skillGroups: Array<SkillGroup> = [
      new SkillGroup(
        'Front End',
        [
          new SkillDescription('devicons devicons-html5', 'HTML', '?Years'),
          new SkillDescription('devicons devicons-css3', 'CSS', '?Years'),
          new SkillDescription('devicons devicons-javascript', 'Javascript', '?Years'),
          new SkillDescription('devicon-typescript-plain', 'Typescript', '?Year'),
          new SkillDescription('devicons devicons-bootstrap', 'Bootstrap', '?Years'),
          new SkillDescription('devicon-typescript-plain', 'Nativescript', '?Months'),
          new SkillDescription('devicon-angularjs-plain', 'Angular', '?Year'),
          new SkillDescription('devicon-vuejs-plain', 'Vuejs', '?Months'),
          new SkillDescription('devicon-react-original', 'React', '?Months'),
        ]
      ),
      new SkillGroup(
        'Back End',
        [
          new SkillDescription('devicon-ruby-plain', 'Ruby', '?Year'),
          new SkillDescription('devicon-rails-plain', 'Rails', '?Year'),
          new SkillDescription('devicon-nodejs-plain', 'Nodejs', '?Year'),
          new SkillDescription('devicon-express-original', 'Express', '?Months'),
        ]
      ),
      new SkillGroup(
        'Infrastructure',
        [
          new SkillDescription('devicon-amazonwebservices-original', 'AWS', '?Year'),
          new SkillDescription('devicon-google-plain', 'GCP', '?Year'),
          new SkillDescription('devicon-docker-plain', 'DockerSwarm', '?Year'),
          new SkillDescription('devicon-nginx-original', 'Nginx', '?Months'),
        ]
      ),
      new SkillGroup(
        'Data Science',
        [
          new SkillDescription('devicons devicons-python', 'Tensorflow', '?Months'),
          new SkillDescription('devicons devicons-python', 'Python', '?Months'),
          new SkillDescription('devicons devicons-java', 'Hadoop', '?Months'),
          new SkillDescription('devicons devicons-java', 'Java', '?Months'),
        ]
      ),
      new SkillGroup(
        'Project Managing',
        [
          new SkillDescription('devicon-git-plain', 'Git', '?Years'),
        ]
      ),
      new SkillGroup(
        'Testing',
        [
          new SkillDescription('devicon-nodejs-plain', 'Puppeteer', '?Months'),
        ]
      )
    ]
  ){
    this.skillGroups = skillGroups;
  }
}

export class SkillGroup {
  skillGroupName: string;
  skills: Array<SkillDescription>;
  constructor(
    skillGroupName: string = '',
    skills: Array<SkillDescription> = [new SkillDescription()]
  ){
    this.skillGroupName = skillGroupName;
    this.skills = skills;
  }
}

export class SkillDescription {
  devicon: string;
  skillName: string;
  term: string;
  constructor(
    devicon: string = '',
    skillName: string = '',
    term: string = ''
  ){
    this.devicon = devicon;
    this.skillName = skillName;
    this.term = term;
  }
}
