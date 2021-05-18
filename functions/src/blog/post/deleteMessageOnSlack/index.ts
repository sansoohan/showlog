import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as v from './v'

const adminDatabase = admin.database()

export const showlogBlogPostDeleteMessageOnSlack = functions.firestore.document([
  '{env}/showlog',
  'blogs/{blogId}',
  'posts/{postId}',
].join('/'))
.onDelete(async (snapshot, context) => {
  const { env } = context.params
  const databaseRootFunctionV: any = await new Promise((resolve) => {
    // tslint:disable-next-line: no-floating-promises
    adminDatabase.ref([
      env,
      'showlog',
      'FUNCTION_V'
    ].join('/')).once("value", (functionSnapshot: any) => {
      resolve(functionSnapshot.val())
    })
  })

  const functionVersion = databaseRootFunctionV?.showlogBlogPostDeleteMessageOnSlack || 'unknown'
  if (!databaseRootFunctionV?.showlogBlogPostDeleteMessageOnSlack) {
    throw new Error (`There is no vertion : ${functionVersion}`)
  }

  const version: any = v
  const selectedFunction: (
    snapshot: functions.firestore.QueryDocumentSnapshot,
    context: functions.EventContext,
  ) => Promise<void> = version[functionVersion]
  await selectedFunction(snapshot, context)
})
