import { CategoryContent } from './category/category.content';

export class BlogContent {
  id: string;
  userName: string;
  ownerId: string;
  categoryMap: Array<CategoryContent>;
  updatedFrom: any;
  constructor(
    id: string = '',
    userName: string = '',
    ownerId: string = '',
    categoryMap: Array<CategoryContent> = [],
    updatedFrom: any = {},
  ){
    this.id = id;
    this.userName = userName;
    this.ownerId = ownerId;
    this.categoryMap = categoryMap;
    this.updatedFrom = updatedFrom;
  }
}
