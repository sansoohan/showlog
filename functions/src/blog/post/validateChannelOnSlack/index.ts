import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as v from './v'

const adminDatabase = admin.database()

export const showlogBlogPostValidateChannelOnSlack = functions.https.onCall(async (data, context) => {
  const { rootPath } = data
  const databaseRootFunctionV: any = await new Promise((resolve) => {
    // tslint:disable-next-line: no-floating-promises
    adminDatabase.ref([
      rootPath,
      'FUNCTION_V',
    ].join('/')).once("value", (functionSnapshot: any) => {
      resolve(functionSnapshot.val())
    })
  })

  const functionVersion = databaseRootFunctionV?.showlogBlogPostValidateChannelOnSlack || 'unknown'
  if (!databaseRootFunctionV?.showlogBlogPostValidateChannelOnSlack) {
    throw new Error (`There is no vertion : ${functionVersion}`)
  }

  const version: any = v
  const selectedFunction: (
    data: any,
    context: functions.https.CallableContext,
  ) => Promise<any> = version[functionVersion]
  const functionRes = await selectedFunction(data, context)
  return functionRes
})
