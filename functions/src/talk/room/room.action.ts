import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const firestore = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

export const onDevTalkRoomMemberCreate = functions.database
.ref('dev/developers/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onCreate(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`dev/developers/talks/${talkId}/rooms/${roomId}`);
    await roomRef.update({broadcastIds: FieldValue.arrayUnion(broadcastId)});
  }
});

export const onDevTalkRoomMemberDelete = functions.database
.ref('dev/developers/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onDelete(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`dev/developers/talks/${talkId}/rooms/${roomId}`);
      await roomRef.update({broadcastIds: FieldValue.arrayRemove(broadcastId)});
  }
});
