export class CategoryContent {
  id: string;
  name: string;
  createdAt: number;
  isExpanded: boolean;
  postCreatedAtList: Array<number>;
  children: Array<CategoryContent>;
  constructor(
    id: string = '',
    name: string = 'New Category',
    createdAt: number = Number(new Date()),
    isExpanded: boolean = false,
    postCreatedAtList: Array<number> = [],
    children: Array<CategoryContent> = [],
  ) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
    this.isExpanded = isExpanded;
    this.postCreatedAtList = postCreatedAtList;
    this.children = children;
  }
}
