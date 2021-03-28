import * as admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://developers-8a830.firebaseio.com"
});

export { onDevTalkRoomMemberCreate, onDevTalkRoomMemberDelete } from './dev/talk/room/room.action';

export { onStageTalkRoomMemberCreate, onStageTalkRoomMemberDelete } from './stage/talk/room/room.action';

export { onProdTalkRoomMemberCreate, onProdTalkRoomMemberDelete } from './prod/talk/room/room.action';
