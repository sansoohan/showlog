export class InterestsContent {
  descriptions: Array<string>;
  constructor(
    descriptions: Array<string> = [
      'Hadoop Distribute System',
      'Hacking technique for developer',
      'Bio Sensor for Input Device',
      'AI Programing',
    ]
  ){
    this.descriptions = descriptions;
  }
}
