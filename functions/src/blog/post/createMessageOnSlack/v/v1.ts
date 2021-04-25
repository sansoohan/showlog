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
    },
    postMarkdown, postTitle, postUrl, updatedFrom
  } = snapshot.data()

  // Don't Run on Data Copy
  if (updatedFrom?.source) {
    return;
  }

  if (token && channel) {
    const web = new WebClient(token);
    const res = await web.chat.postMessage({
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
    });
    await snapshot.ref.update({
      slack: {
        token,
        channel,
        ts: `${res.ts}`,
      },
      updatedFrom: {
        source: 'functions',
        name: 'showlogBlogPostCreateMessageOnSlack',
      },
    })
  }
}
