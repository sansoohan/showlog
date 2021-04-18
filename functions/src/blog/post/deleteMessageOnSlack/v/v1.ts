import * as functions from 'firebase-functions';
import { WebClient } from '@slack/web-api';

export const v1 = async (
  snapshot: functions.firestore.QueryDocumentSnapshot,
  context: functions.EventContext,
): Promise<void> => {
  const {
    slack: {
      token,
      channel,
      ts,
    },
  } = snapshot.data();
  if (token && channel && ts) {
    const web = new WebClient(token);
    await web.chat.delete({
      channel,
      ts,
    });
  }
}
