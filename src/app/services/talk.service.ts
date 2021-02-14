import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { FormHelper } from 'src/app/helper/form.helper';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TalkContent } from '../view/talk/talk.content';
import { RoomContent } from '../view/talk/room/room.content';
import { first } from 'rxjs/operators';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class TalkService extends CommonService {
  constructor(
    public firestore: AngularFirestore,
    public authService: AuthService,
  ) {
    super(authService, firestore);
  }

  getTalkContentsObserver({params = null}): Observable<TalkContent[]> {
    const currentUser = this.authService.getCurrentUser();
    const queryUserName = currentUser?.userName || params?.userName;
    return this.firestore
    .collection<TalkContent>('talks', ref => ref.where('userName', '==', queryUserName))
    .valueChanges();
  }

  getRoomsObserver(talkId: string): Observable<RoomContent[]> {
    if (!talkId){
      return;
    }
    return this.firestore
    .collection<TalkContent>('talks').doc(talkId)
    .collection<RoomContent>('rooms').valueChanges();
  }
}
