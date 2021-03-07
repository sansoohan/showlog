import { CategoryContent } from './category/category.content';

export class BlogContent {
  id: string;
  userName: string;
  ownerId: string;
  categoryMap: Array<CategoryContent>;
  constructor(
    id: string = '',
    userName: string = '',
    ownerId: string = '',
    categoryMap: Array<CategoryContent> = [],
  ){
    this.id = id;
    this.userName = userName;
    this.ownerId = ownerId;
    this.categoryMap = categoryMap;
  }
}
