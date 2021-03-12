export class AdditaionProfileContent {
  title: string;
  largeGroups: Array<LargeGroup>;
  constructor(
    title: string = 'workflow',
    largeGroups: Array<LargeGroup> = [
      new LargeGroup(
        null,
        [
          new SmallGroup(
            'Core Engine',
            [
              new SmallGroupDescription('Run exameple code', 'fa-li fa fa-check'),
              new SmallGroupDescription('Modify interface on exameple code', 'fa-li fa fa-check'),
              new SmallGroupDescription('Integrate Test on Local', 'fa-li fa fa-check'),
              new SmallGroupDescription('System Test on Remote Dev Server', 'fa-li fa fa-check'),
              new SmallGroupDescription('Make Test Server', 'fa-li fa fa-check'),
              new SmallGroupDescription('Make API and Document', 'fa-li fa fa-check'),
            ]
          ),
          new SmallGroup(
            'New Feature',
            [
              new SmallGroupDescription('Make API and Document', 'fa-li fa fa-check'),
              new SmallGroupDescription('Get Requirements', 'fa-li fa fa-check'),
              new SmallGroupDescription('Draw UI Design', 'fa-li fa fa-check'),
              new SmallGroupDescription('Ask Requirement Details', 'fa-li fa fa-check'),
              new SmallGroupDescription('Make UI Design', 'fa-li fa fa-check'),
              new SmallGroupDescription('Design/Migrate Database', 'fa-li fa fa-check'),
              new SmallGroupDescription('Make API with validation', 'fa-li fa fa-check'),
              new SmallGroupDescription('Fix bug on new feature', 'fa-li fa fa-check'),
            ]
          ),
        ],
      )
    ]
  ) {
    this.title = title;
    this.largeGroups = largeGroups;
  }
}

export class LargeGroup {
  largeGroupName: string|null;
  smallGroups: Array<SmallGroup>;
  constructor(
    largeGroupName: string|null = '',
    smallGroups: Array<SmallGroup> = [new SmallGroup()]
  ){
    this.largeGroupName = largeGroupName;
    this.smallGroups = smallGroups;
  }
}

export class SmallGroup {
  smallGroupName: string;
  descriptions: Array<SmallGroupDescription>;
  constructor(
    smallGroupName: string = '',
    descriptions: Array<SmallGroupDescription> = [new SmallGroupDescription()]
  ){
    this.smallGroupName = smallGroupName;
    this.descriptions = descriptions;
  }
}

export class SmallGroupDescription {
  descriptionDetail: string;
  faIcon: string;
  constructor(
    descriptionDetail: string = '',
    faIcon: string = 'fa'
  ){
    this.descriptionDetail = descriptionDetail;
    this.faIcon = faIcon;
  }
}

