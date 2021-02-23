import { TestBed } from '@angular/core/testing';

import { ImageHelper } from './image.helper';

describe('ImageHelper', () => {
  let service: ImageHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageHelper);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
