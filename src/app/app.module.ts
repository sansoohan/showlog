// Angular core
import {APP_BASE_HREF} from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, SecurityContext } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';
import { AppRoutingModule } from 'src/app/app-routing.module';

// Angular Material
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';

// Firebase
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAnalyticsModule } from '@angular/fire/analytics';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui';
import { environment } from 'src/environments/environment';

// ngx module
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { MarkdownModule } from 'ngx-markdown';
import { NgxFileDropModule } from 'ngx-file-drop';

// View
import { AppComponent } from 'src/app/app.component';
import { HeaderComponent } from './header/header.component';
import { BlogModule } from 'src/app/view/blog/blog.module';
import { TalkModule } from './view/talk/talk.module';
import { ContactComponent } from 'src/app/view/contact/contact.component';
import { MainComponent } from 'src/app/view/main/main.component';
import { ProfileModule } from 'src/app/view/profile/profile.module';
import { SignInComponent } from 'src/app/view/sign-in/sign-in.component';
import { SignUpComponent } from 'src/app/view/sign-up/sign-up.component';

// Moudles
import { EmbededGooglemapModule } from 'src/app/modules/embeded-googlemap/embeded-googlemap.module';
import { NotFoundModule } from 'src/app/modules/not-found/not-found.module';
import { AngularFireModule } from '@angular/fire';

@NgModule({
  declarations: [
    AppComponent,
    SignInComponent,
    SignUpComponent,
    ContactComponent,
    MainComponent,
    HeaderComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SweetAlert2Module.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    MarkdownModule.forRoot({
      sanitize: SecurityContext.NONE,
    }),
    NgxFileDropModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    NgxAuthFirebaseUIModule.forRoot(
      environment.firebase,
      () => 'developer',
      {
        enableFirestoreSync: true, // enable/disable autosync users with firestore
        toastMessageOnAuthSuccess: false, // whether to open/show a snackbar message on auth success - default : true
        toastMessageOnAuthError: false, // whether to open/show a snackbar message on auth error - default : true
        authGuardFallbackURL: '/loggedout', // url for unauthenticated users - to use in combination with canActivate feature on a route
        authGuardLoggedInURL: '/loggedin', // url for authenticated users - to use in combination with canActivate feature on a route
        passwordMaxLength: 30, // `min/max` input parameters in components should be within this range.
        passwordMinLength: 8, // Password length min/max in forms independently of each componenet min/max.
        // Same as password but for the name
        nameMaxLength: 50,
        nameMinLength: 2,
        // If set, sign-in/up form is not available until email has been verified.
        // Plus protected routes are still protected even though user is connected.
        guardProtectedRoutesUntilEmailIsVerified: true,
        enableEmailVerification: true, // default: true
        useRawUserCredential: true
      }
    ),
    ProfileModule,
    BlogModule,
    TalkModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AppRoutingModule,
    MatPasswordStrengthModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    EmbededGooglemapModule,
    NotFoundModule,
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '/',
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
