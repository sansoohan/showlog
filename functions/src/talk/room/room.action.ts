import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://developers-8a830.firebaseio.com"
});
const firestore = admin.firestore();
const FieldValue = admin.firestore.FieldValue

export const onTalkRoomMemberCreate = functions.database
.ref('/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onCreate(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`/talks/${talkId}/rooms/${roomId}`);
    await roomRef.update({broadcastIds: FieldValue.arrayUnion(broadcastId)});
  }
});

export const onTalkRoomMemberDelete = functions.database
.ref('/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onDelete(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`/talks/${talkId}/rooms/${roomId}`);
    await roomRef.update({broadcastIds: FieldValue.arrayRemove(broadcastId)});
  }
});
