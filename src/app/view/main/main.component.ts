import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { RouterHelper } from 'src/app/helper/router.helper';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private routerHelper: RouterHelper,
  ) {
  }

  goToProfile(params: any): void {
    const { userName: ownerName } = this.authService.getCurrentUser();
    this.routerHelper.goToProfile({
      userName: params?.userName || ownerName || 'sansoohan'
    });
  }
  goToBlogPrologue(params: any): void {
    const { userName: ownerName } = this.authService.getCurrentUser();
    this.routerHelper.goToBlogPrologue({
      userName: params?.userName || ownerName || 'sansoohan' });
  }
  goToTalk(params: any): void {
    const { userName: ownerName } = this.authService.getCurrentUser();
    this.routerHelper.goToTalk({
      userName: params?.userName || ownerName || 'sansoohan' });
  }

  ngOnInit(): void {
  }

}
