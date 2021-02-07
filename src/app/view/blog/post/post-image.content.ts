export class PostImageContent {
  id: string;
  postImageUrl: string;
  ownerId: string;
  width: number;
  height: number;
  constructor(
    id: string = '',
    postImageUrl: string = '',
    ownerId: string = '',
    width: number = 0,
    height: number = 0,
  ) {
    this.id = id;
    this.postImageUrl = postImageUrl;
    this.ownerId = ownerId;
    this.width = width;
    this.height = height;
  }
}
