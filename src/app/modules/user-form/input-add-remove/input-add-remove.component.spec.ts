import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputAddRemoveComponent } from './input-add-remove.component';

describe('InputAddRemoveComponent', () => {
  let component: InputAddRemoveComponent;
  let fixture: ComponentFixture<InputAddRemoveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InputAddRemoveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputAddRemoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
