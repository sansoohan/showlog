export class PostImageContent {
  id: string;
  ownerId: string;
  attributes: any;
  constructor(
    id: string = '',
    ownerId: string = '',
    attributes: any = {},
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.attributes = attributes;
  }
}
