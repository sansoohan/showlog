import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  searchValue: string;
  results: any;
  paramSub?: Subscription;
  params: any;

  // eslint-disable-next-line no-shadow
  constructor(
    public authService: AuthService,
  ) {
    this.searchValue = '';
  }
}
