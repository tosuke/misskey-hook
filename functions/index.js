const firebase = require('firebase-admin')
const functions = require('firebase-functions')
const dotenv = require('dotenv')
const _axios = require('axios')
const https = require('https')
const crypto = require('crypto')

dotenv.config()

firebase.initializeApp({
  ...JSON.parse(process.env.FIREBASE_CONFIG),
  credential: firebase.credential.cert(require('./service-account.json'))
})
firebase.firestore().settings({ timestampsInSnapshots: true })

const axios = _axios.create({
  baseURL: 'https://misskey.xyz/api',
  timeout: 10000
})

const httpsAgent = new https.Agent({ keepAlive: true })

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.generateSession = functions.region('asia-northeast1').https.onCall(async (data, ctx) => {
  const { data: res } = await axios.post(
    '/auth/session/generate',
    { appSecret: process.env.MISSKEY_APP_SECRET },
    { httpsAgent }
  )
  return res
})

exports.authCallback = functions.https.onRequest(async (req, res) => {
  const token = req.query.token
  const { data } = await axios.post(
    '/auth/session/userkey',
    { token, appSecret: process.env.MISSKEY_APP_SECRET },
    { httpsAgent }
  )
  const hash = crypto.createHash('sha256')
  hash.update(data.accessToken + process.env.MISSKEY_APP_SECRET)
  const accessToken = hash.digest('hex')
  const db = firebase.firestore()
  const batch = db.batch()
  const userRef = db.collection('users').doc(data.user.id)
  batch
    .set(userRef, {
      accessToken,
      user: data.user
    })
    .set(db.collection('authSessions').doc(token), {
      userRef
    })
  await batch.commit()
  res.redirect('/')
})

exports.createOpenIDToken = functions.region('asia-northeast1').https.onCall(async (data, ctx) => {
  const { sessionId } = data
  const db = firebase.firestore()
  const sessionRef = db.collection('authSessions').doc(sessionId)
  const user = await db.runTransaction(async (tx) => {
    const sessionDoc = await tx.get(sessionRef)
    const user = await tx.get(sessionDoc.data().userRef)
    tx.delete(sessionRef)
    return user.data()
  })

  return {
    token: await firebase.auth().createCustomToken(user.user.id, { accessToken: user.accessToken })
  }
})
