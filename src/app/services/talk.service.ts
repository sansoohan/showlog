import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TalkContent } from '../view/talk/talk.content';
import { RoomContent } from '../view/talk/room/room.content';
import { CommonService } from './abstract/common.service';
import * as firebase from 'firebase/app';
import FieldPath = firebase.firestore.FieldPath;
import { AngularFireStorage } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class TalkService extends CommonService {
  constructor(
    public firestore: AngularFirestore,
    public authService: AuthService,
    public storage: AngularFireStorage,
  ) {
    super(authService, firestore, storage);
  }

  getTalkContentsObserver({params = null}): Observable<TalkContent[]> {
    let talkContentsObserver: Observable<TalkContent[]>;
    const queryUserName = params?.userName;
    if (queryUserName){
      talkContentsObserver = this.firestore
      .collection<TalkContent>('talks', ref => ref
      .where(new FieldPath('userName'), '==', queryUserName))
      .valueChanges();
    }
    return talkContentsObserver;
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
