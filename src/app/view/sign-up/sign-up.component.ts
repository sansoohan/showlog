import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  constructor(private router: Router, public authService: AuthService) {
    if (this.authService.isSignedIn()){
      this.router.navigate(['/profile']);
    }
  }

  ngOnInit(): void {
  }

  signUpSuccess(): void {
    this.router.navigate(['/sign-in']);
  }

  onSignInClicked(): void {
    this.router.navigate(['/sign-in']);
  }
}
