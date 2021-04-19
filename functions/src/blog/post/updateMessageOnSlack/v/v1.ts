import * as functions from 'firebase-functions';
import { WebClient } from '@slack/web-api';

export const v1 = async (
  change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
  context: functions.EventContext,
): Promise<void> => {
  const {
    slack: {
      token,
      channel,
      ts,
    },
    postUrl,
    postTitle,
    postMarkdown,
  } = change.after.data()

  const slackCreateOrUpdate: any = {
    channel,
    text: postTitle,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${postUrl}|${postTitle}>`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: postMarkdown,
        },
      },
    ],
  }

  const web = new WebClient(token);
  if (token && channel && ts) {
    slackCreateOrUpdate.ts = ts;
    await web.chat.update(slackCreateOrUpdate)
  } else if (token && channel) {
    const res = await web.chat.postMessage(slackCreateOrUpdate)
    await change.after.ref.update({slack: {
      token,
      channel,
      ts: `${res.ts}`,
    }})
  }
}
