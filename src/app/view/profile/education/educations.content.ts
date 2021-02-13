export class EducationsContent {
  educations: Array<EducationContent>;
  constructor(
    educations: Array<EducationContent> = [
      new EducationContent(
        'University of Dankook',
        'Bachelor of Computer Science',
        ['Software Enginneering', 'GPA: 3.02'],
        null,
        null
      ),
      new EducationContent(
        'BulGok High School',
        'Math/Science',
        [],
        null,
        null
      )
    ]
  ){
    this.educations = educations;
  }
}

export class EducationContent {
  organization: string;
  degree: string;
  descriptions: Array<string>;
  startedAt: string;
  finishedAt: string;
  constructor(
    organization: string = '',
    degree: string = '',
    descriptions: Array<string> = [''],
    startedAt: string = null,
    finishedAt: string = null
  ){
    this.organization = organization;
    this.degree = degree;
    this.descriptions = descriptions;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
  }
}
