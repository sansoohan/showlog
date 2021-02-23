import { Injectable } from '@angular/core';
import { DataTransferHelper } from './data-transfer.helper';

@Injectable({
  providedIn: 'root'
})

export class ImageHelper {
  constructor() { }
  getImageString(imageContent: ImageContent): string {
    const attributeNames: Array<string> = Object.keys(imageContent.attributes);
    return [
      '<img',
      ...attributeNames.map((attributeName) => {
        return `${attributeName}="${imageContent.attributes[attributeName]}"`;
      }),
      '/>',
    ].join(' ');
  }
  isPortraitImage(imageContent: ImageContent): boolean {
    const {width, height} = this.getImageStyle(imageContent);
    return Number(width) < Number(height);
  }
  getImageStyle(imageContent: ImageContent): any {
    const imageContentStyle = {};
    const splitedStyle = imageContent.attributes.style.split(/;/g);
    for (const s of splitedStyle) {
      const [key, value] = s.split(/:/g);
      imageContentStyle[key] = value;
    }
    return imageContentStyle;
  }
}

export class ImageContent {
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
