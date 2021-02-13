export class TalkContent {
  id: string;
  ownerId: string;
  userName: string;
  constructor(
    id: string = '',
    ownerId: string = '',
    userName: string = '',
  ){
    this.id = id;
    this.ownerId = ownerId;
    this.userName = userName;
  }
}
