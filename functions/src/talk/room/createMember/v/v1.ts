import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const firestore = admin.firestore()
const FieldValue = admin.firestore.FieldValue;

export const v1 = async (
  snapshot: functions.database.DataSnapshot,
  context: functions.EventContext,
): Promise<void> => {
  const {env, talkId, roomId, broadcastId} = context.params;
  const roomRef = firestore.doc(`${env}/showlog/talks/${talkId}/rooms/${roomId}`);
  await roomRef.update({broadcastIds: FieldValue.arrayUnion(broadcastId)});
}
