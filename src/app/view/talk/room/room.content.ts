export class RoomContent {
  id?: string;
  ownerId?: string;
  userName?: string;
  createdAt?: number;
  broadcastIds?: Array<string>;
  constructor(
    id: string = '',
    ownerId: string = '',
    userName: string = '',
    createdAt: number = Number(new Date()),
    broadcastIds: Array<string> = [],
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.userName = userName;
    this.createdAt = createdAt;
    this.broadcastIds = broadcastIds;
  }
}
