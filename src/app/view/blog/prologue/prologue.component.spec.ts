import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrologueComponent } from './prologue.component';

describe('PrologueComponent', () => {
  let component: PrologueComponent;
  let fixture: ComponentFixture<PrologueComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrologueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrologueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
