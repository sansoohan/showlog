import { Component, OnInit, Input } from '@angular/core';
import { AdditaionProfileContent, LargeGroup, SmallGroup, SmallGroupDescription } from './additional-profile.content';

@Component({
  selector: 'app-profile-additional-profiles',
  templateUrl: './additional-profiles.component.html',
  styleUrls: ['../profile.component.scss', './additional-profiles.component.scss']
})
export class AdditionalProfilesComponent implements OnInit {
  @Input() additaionProfilesContent?: Array<AdditaionProfileContent>;
  @Input() isEditing?: boolean;
  @Input() profileForm: any;
  public newSmallGroupDescription = new SmallGroupDescription();
  public newSmallGroup = new SmallGroup();
  public newLargeGroup = new LargeGroup();
  constructor() { }

  ngOnInit(): void {

  }
}
