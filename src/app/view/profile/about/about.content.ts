export class AboutContent {
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  email: string;
  social: Array<AboutSocial>;
  constructor(
    firstName: string = 'First Name',
    lastName: string = 'Last Name',
    address: string = 'Address',
    phoneNumber: string = '+00 00-0000-0000',
    email: string = 'your-email@gmail.com',
    social: Array<AboutSocial> = [
      new AboutSocial(
        'https://kr.linkedin.com/in/sansoo-han-29a40216a',
        'fa fa-linkedin',
      ),
      new AboutSocial(
        'https://github.com/sansoohan',
        'fa fa-github',
      ),
    ],
  ){
    this.firstName = firstName;
    this.lastName = lastName;
    this.address = address;
    this.phoneNumber = phoneNumber;
    this.email = email;
    this.social = social;
  }
}

export class AboutSocial {
  socialUrl: string;
  faIcon: string;
  constructor(
    socialUrl: string = '',
    faIcon: string = ''
  ){
    this.socialUrl = socialUrl;
    this.faIcon = faIcon;
  }
}
