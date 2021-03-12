import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TalkContent } from '../view/talk/talk.content';
import { RoomContent } from '../view/talk/room/room.content';
import { CommonService } from './abstract/common.service';
import * as firebase from 'firebase/app';
import { AngularFireStorage } from '@angular/fire/storage';

const FieldPath = firebase.default.firestore.FieldPath;

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

  getTalkContentsObserver(params: any): Observable<TalkContent[]>|undefined {
    const queryUserName = params?.userName;
    if (!queryUserName){
      return;
    }

    return this.firestore
    .collection<TalkContent>('talks', ref => ref
    .where(new FieldPath('userName'), '==', queryUserName))
    .valueChanges();
  }

  getRoomsObserver(talkId: string): Observable<RoomContent[]>|undefined {
    if (!talkId){
      return;
    }

    return this.firestore
    .collection<TalkContent>('talks').doc(talkId)
    .collection<RoomContent>('rooms').valueChanges();
  }
}
