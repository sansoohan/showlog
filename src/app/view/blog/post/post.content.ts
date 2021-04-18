export class PostContent {
  id: string;
  blogId: string;
  categoryId: string;
  commentCount: number;
  createdAt: number;
  postTitle: string;
  postMarkdown: string;
  postImageSrcs: any;
  selectedIamgeIndex?: number|null;
  likes: any;
  ownerId: string;
  commentCreatedAtList: Array<number>;
  slack: any;
  postUrl: string;
  constructor(
    id: string = '',
    blogId: string = '',
    categoryId: string = '',
    commentCount: number = 0,
    createdAt: number = Number(new Date()),
    postTitle: string = '',
    postMarkdown: string = '',
    postImageSrcs: any = [],
    selectedIamgeIndex: number|null = null,
    likes: any = [],
    ownerId: string = '',
    commentCreatedAtList: Array<number> = [],
    slack: any = {},
    postUrl: string = '',
  ){
    this.id = id;
    this.blogId = blogId;
    this.categoryId = categoryId;
    this.commentCount = commentCount;
    this.createdAt = createdAt,
    this.postTitle = postTitle;
    this.postMarkdown = postMarkdown;
    this.postImageSrcs = postImageSrcs;
    this.selectedIamgeIndex = selectedIamgeIndex;
    this.likes = likes;
    this.ownerId = ownerId;
    this.commentCreatedAtList = commentCreatedAtList;
    this.slack = slack;
    this.postUrl = postUrl;
  }
}
