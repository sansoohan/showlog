export class TalkContent {
  id: string;
  ownerId: string;
  userName: string;
  roomCreatedAtList: Array<number>;
  constructor(
    id: string = '',
    ownerId: string = '',
    userName: string = '',
    roomCreatedAtList: Array<number> = [],
  ){
    this.id = id;
    this.ownerId = ownerId;
    this.userName = userName;
    this.roomCreatedAtList = roomCreatedAtList;
  }
}
