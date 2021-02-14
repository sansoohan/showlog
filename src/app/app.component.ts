import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import * as firebase from 'firebase/app';
import FieldPath = firebase.firestore.FieldPath;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  searchValue: string;
  results: any;

  // tslint:disable-next-line:no-shadowed-variable
  constructor(
    public authService: AuthService
  ) {
    this.searchValue = '';
  }

  // tslint:disable-next-line:use-lifecycle-interface
  ngOnInit() {

  }
}
