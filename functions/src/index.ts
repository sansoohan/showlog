import * as admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://developers-8a830.firebaseio.com"
});

export { showlogTalkRoomCreateMember } from './talk/room/createMember';
export { showlogTalkRoomDeleteMember } from './talk/room/deleteMember';
