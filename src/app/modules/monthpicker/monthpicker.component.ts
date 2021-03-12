import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-modules-monthpicker',
  templateUrl: './monthpicker.component.html',
  styleUrls: ['./monthpicker.component.scss']
})
export class MonthpickerComponent implements OnInit {
  @Input()
  control!: FormControl;

  constructor() {

  }
  ngOnInit(): void {

  }

  resetValue(): void {
    this.control?.setValue(null);
  }
}
