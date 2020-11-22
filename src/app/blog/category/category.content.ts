export class CategoryContent {
  id: string;
  blogId: string;
  categoryNumber?: number;
  categoryTitle: string;
  createdAt?: number;
  collapsed: boolean;
  deepCount?: number;
  parentCategoryId?: string;
  postCount: number;
  hidden: boolean;
  constructor(
    id: string = '',
    blogId: string = null,
    categoryNumber: number = null,
    categoryTitle: string = '',
    createdAt: number = Number(new Date()),
    collapsed: boolean = false,
    deepCount: number = null,
    parentCategoryId: string = null,
    postCount: number = 0,
    hidden: boolean = false,
  ){
    this.id = id;
    this.blogId = blogId;
    this.categoryNumber = categoryNumber;
    this.categoryTitle = categoryTitle;
    this.createdAt = createdAt;
    this.collapsed = collapsed;
    this.deepCount = deepCount;
    this.parentCategoryId = parentCategoryId;
    this.postCount = postCount;
    this.hidden = hidden;
  }
}