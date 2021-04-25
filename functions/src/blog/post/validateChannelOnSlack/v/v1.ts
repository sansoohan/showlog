'use strict'

import * as functions from 'firebase-functions'
import { WebClient, WebAPICallResult } from '@slack/web-api';

export const v1 = async (
  data: any,
  context: functions.https.CallableContext,
): Promise<any> => {
  const {
    slack: {
      token,
      channel,
    }
  } = data

  const web = new WebClient(token);

  const res: WebAPICallResult  = await web.chat.postMessage({
    channel,
    text: 'Check Channel Existing',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Check Channel Existing',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'OK',
        },
      },
    ],
  });

  await web.chat.delete({
    channel,
    ts: res.ts as any,
  });

  return res;
}
