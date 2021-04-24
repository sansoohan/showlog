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
    updatedFrom,
  } = change.after.data();

  // Ignore update by functions
  if (updatedFrom?.source === 'functions') {
    return
  }

  const { slack: beforeSlack } = change.before.data();

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

  if (!beforeSlack?.token || !beforeSlack?.channel || !beforeSlack?.ts) {
    const res = await web.chat.postMessage(slackCreateOrUpdate)
    await change.after.ref.update({
      slack: {
        token,
        channel,
        ts: `${res.ts}`,
      },
      updatedFrom: {
        source: 'functions',
        name: 'showlogBlogPostUpdateMessageOnSlack',
      },
    });

    return
  }

  // Move Into Other Channel
  if (beforeSlack.channel !== channel) {
    await web.chat.delete({
      channel: beforeSlack.channel,
      ts,
    });
    const res = await web.chat.postMessage(slackCreateOrUpdate)
    await change.after.ref.update({
      slack: {
        token,
        channel,
        ts: `${res.ts}`,
      },
      updatedFrom: {
        source: 'functions',
        name: 'showlogBlogPostUpdateMessageOnSlack',
      },
    });

    return
  }

  // Upload
  if (token && channel && ts) {
    slackCreateOrUpdate.ts = ts;
    await web.chat.update(slackCreateOrUpdate)

    return
  }
}
