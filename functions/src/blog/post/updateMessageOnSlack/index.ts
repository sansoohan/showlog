import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as v from './v'

const adminDatabase = admin.database()

export const showlogBlogPostUpdateMessageOnSlack = functions.firestore.document([
  '{env}',
  'showlog',
  'blogs',
  '{blogId}',
  'posts',
  '{postId}',
].join('/'))
.onUpdate(async (change, context) => {
  const { env } = context.params
  const databaseRootFunctionV: any = await new Promise((resolve) => {
    // tslint:disable-next-line: no-floating-promises
    adminDatabase.ref([
      env,
      'showlog',
      'FUNCTION_V',
    ].join('/')).once("value", (functionSnapshot: any) => {
      resolve(functionSnapshot.val())
    })
  })

  const functionVersion = databaseRootFunctionV?.showlogBlogPostUpdateMessageOnSlack || 'unknown'
  if (!databaseRootFunctionV?.showlogBlogPostUpdateMessageOnSlack) {
    throw new Error (`There is no vertion : ${functionVersion}`)
  }

  const version: any = v
  const selectedFunction: (
    change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
    context: functions.EventContext,
  ) => Promise<void> = version[functionVersion]
  await selectedFunction(change, context)
})
