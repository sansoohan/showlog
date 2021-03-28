import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const firestore = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

export const onProdTalkRoomMemberCreate = functions.database
.ref('prod/developers/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onCreate(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`prod/developers/talks/${talkId}/rooms/${roomId}`);
    await roomRef.update({broadcastIds: FieldValue.arrayUnion(broadcastId)});
  }
});

export const onProdTalkRoomMemberDelete = functions.database
.ref('prod/developers/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onDelete(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`prod/developers/talks/${talkId}/rooms/${roomId}`);
      await roomRef.update({broadcastIds: FieldValue.arrayRemove(broadcastId)});
  }
});
