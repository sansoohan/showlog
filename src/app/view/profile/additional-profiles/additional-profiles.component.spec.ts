import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdditionalProfilesComponent } from './additional-profiles.component';

describe('AdditionalProfilesComponent', () => {
  let component: AdditionalProfilesComponent;
  let fixture: ComponentFixture<AdditionalProfilesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdditionalProfilesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdditionalProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
