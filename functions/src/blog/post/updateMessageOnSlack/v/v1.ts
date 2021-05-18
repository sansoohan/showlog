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

  const imageTagAttributesList = postMarkdown.matchAll(/(<img (.+?)\/>)/g)
  const postMarkdownIndexs = [[0]]
  const imagesTagAttributes = []
  const blocks: Array<any> = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${postUrl}|${postTitle}>`,
      },
    },
  ]

  for (const tagAttribute of imageTagAttributesList) {
    const imageTagAttribute: any = { attributes: {} }
    postMarkdownIndexs[postMarkdownIndexs.length - 1].push(tagAttribute.index)
    postMarkdownIndexs.push([tagAttribute.index + tagAttribute[1].length])
    tagAttribute[2].split(' ').filter(Boolean).forEach((a: any) => {
      const [key, value] = a.split('=\"');
      imageTagAttribute.attributes[key] = value.replace(/\"/g, '');
    });
    imagesTagAttributes.push(imageTagAttribute)
  }
  postMarkdownIndexs[postMarkdownIndexs.length - 1].push(postMarkdown.length)

  imagesTagAttributes.forEach((imagesTagAttribute, index) => {
    if (postMarkdownIndexs[index][0] !== postMarkdownIndexs[index][1]) {
      const markdownPart = postMarkdown.substring(
        postMarkdownIndexs[index][0],
        postMarkdownIndexs[index][1],
      )
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: markdownPart,
        },
      })
    }

    blocks.push({
      type: "image",
      "image_url": imagesTagAttribute.attributes?.src,
      "alt_text": "An incredibly cute kitten."
    })
  })

  const startIndex = postMarkdownIndexs[postMarkdownIndexs.length - 1][0]
  const endIndex = postMarkdownIndexs[postMarkdownIndexs.length - 1][1]
  if (startIndex !== endIndex) {
    const markdownPart = postMarkdown.substring(startIndex, endIndex)
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: markdownPart,
      },
    })
  }

  const slackCreateOrUpdate: any = {
    channel,
    text: postTitle,
    blocks,
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
