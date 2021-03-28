import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const firestore = admin.firestore();
const FieldValue = admin.firestore.FieldValue

export const onStageTalkRoomMemberCreate = functions.database
.ref('stage/developers/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onCreate(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`stage/developers/talks/${talkId}/rooms/${roomId}`);
    await roomRef.update({broadcastIds: FieldValue.arrayUnion(broadcastId)});
  }
});

export const onStageTalkRoomMemberDelete = functions.database
.ref('stage/developers/talks/{talkId}/rooms/{roomId}/_broadcast_/{broadcastId}')
.onDelete(async (snapshot, context) => {
  const {talkId, roomId, broadcastId} = context.params;
  if (talkId && roomId && broadcastId) {
    const roomRef = firestore.doc(`stage/developers/talks/${talkId}/rooms/${roomId}`);
    await roomRef.update({broadcastIds: FieldValue.arrayRemove(broadcastId)});
  }
});
