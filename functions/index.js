const firebase = require('firebase-admin')
const functions = require('firebase-functions')
const dotenv = require('dotenv')
const axios = require('axios')
const https = require('https')
const request = require('request-promise-native')
const crypto = require('crypto')

dotenv.config()

firebase.initializeApp({
  ...JSON.parse(process.env.FIREBASE_CONFIG),
  credential: firebase.credential.cert(require('./service-account.json'))
})
firebase.firestore().settings({ timestampsInSnapshots: true })
const firestore = firebase.firestore()

const misskey = axios.create({
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
  const { data: res } = await misskey.post(
    '/auth/session/generate',
    { appSecret: process.env.MISSKEY_APP_SECRET },
    { httpsAgent }
  )
  return res
})

exports.authCallback = functions.https.onRequest(async (req, res) => {
  const token = req.query.token
  const { data } = await misskey.post(
    '/auth/session/userkey',
    { token, appSecret: process.env.MISSKEY_APP_SECRET },
    { httpsAgent }
  )
  const hash = crypto.createHash('sha256')
  hash.update(data.accessToken + process.env.MISSKEY_APP_SECRET)
  const accessToken = hash.digest('hex')
  const db = firestore
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
  const db = firestore
  const sessionRef = db.collection('authSessions').doc(sessionId)
  const user = await db.runTransaction(async tx => {
    const sessionDoc = await tx.get(sessionRef)
    const user = await tx.get(sessionDoc.data().userRef)
    tx.delete(sessionRef)
    return user.data()
  })

  return {
    token: await firebase.auth().createCustomToken(user.user.id, { accessToken: user.accessToken })
  }
})

exports.hook = functions.region('asia-northeast1').https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.send('').end()
      return
    }
    const { uid, id } = req.query
    const params = req.body
    const imageUrls = params.imageUrls || []

    const db = firestore
    const hookRef = db
      .collection('users')
      .doc(uid)
      .collection('hooks')
      .doc(id)
    const hookDoc = await hookRef.get()
    if (!hookDoc.exists) {
      res
        .status(404)
        .send({ message: 'not found' })
        .end()
      return
    }
    const hook = hookDoc.data()
    const token = hook.token

    const ids = await Promise.all(imageUrls.map(url => resolveURL(url, token)))

    const mediaIds = [...(params.mediaIds || []), ...ids]

    const { data } = await misskey.post('/notes/create', { i: token, ...params, mediaIds }, { httpsAgent })
    res.json(data).end()
  } catch (err) {
    res
      .status(500)
      .json({
        message: err.message
      })
      .end()
    console.error(err)
    throw err
  }
})

async function resolveURL(url, token) {
  const name = crypto.createHash('sha1').update(url).digest('base64').replace(/\+/g, '-').replace('/\//g', '_')
  const { data: files } = await misskey.post('/drive/files/find', { i: token, name }, { httpsAgent })
  if (files.length === 0) {
    const { data: stream } = await axios.get(url, {
      httpsAgent,
      responseType: 'stream'
    })
    const formData = {
      i: token,
      file: {
        value: stream,
        options: {
          filename: name
        }
      }
    }
    const resp = JSON.parse(await request.post({ url: 'https://misskey.xyz/api/drive/files/create', formData }))
    return resp.id
  } else {
    return files[0].id
  }
}
