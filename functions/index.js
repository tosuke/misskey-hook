const dotenv = require('dotenv')
dotenv.config()

const firebase = require('./firebase')
const functions = require('firebase-functions')
const axios = require('axios')
const request = require('request-promise-native')
const crypto = require('crypto')
const misskey = require('./misskey')
const db = require('./firestore')
const getAppSecret = require('./appSecret')

const Firestore = firebase.firestore

exports.generateSession = functions.region('asia-northeast1').https.onCall(async (data, ctx) => {
  const host = data.host || 'misskey.xyz'
  const { data: res } = await misskey(host).post('/auth/session/generate', {
    appSecret: await getAppSecret(host)
  })
  await db
    .collection('authSessions')
    .doc(res.token)
    .set({
      host,
      timestamp: Firestore.FieldValue.serverTimestamp()
    })
  return res
})

exports.authCallback = functions.https.onRequest(async (req, res) => {
  const token = req.query.token

  const sessionRef = db.collection('authSessions').doc(token)

  const host = await sessionRef.get().then(val => val.data().host)
  const appSecret = await getAppSecret(host)

  const { data } = await misskey(host).post(
    '/auth/session/userkey',
    { token, appSecret }
  )

  const hash = crypto.createHash('sha256')
  hash.update(data.accessToken + appSecret)
  const accessToken = hash.digest('hex')

  const batch = db.batch()
  const userRef = db.collection('users').doc(genUID(data.user.id, host))
  batch
    .set(userRef, {
      accessToken,
      host,
      user: data.user
    })
    .update(sessionRef, {
      userRef
    })
  await batch.commit()
  res.redirect('/')
})

exports.createOpenIDToken = functions.region('asia-northeast1').https.onCall(async (data, ctx) => {
  const { sessionId } = data
  const sessionRef = db.collection('authSessions').doc(sessionId)
  const user = await db.runTransaction(async tx => {
    const sessionDoc = await tx.get(sessionRef)
    const user = await tx.get(sessionDoc.data().userRef)
    tx.delete(sessionRef)
    return user.data()
  })

  const uid = genUID(user.user.id, user.host)

  return {
    token: await firebase.auth().createCustomToken(uid, { accessToken: user.accessToken })
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
    const { host, token } = hook

    const ids = await Promise.all(imageUrls.map(url => resolveURL(url, host, token)))

    const mediaIds = [...(params.mediaIds || []), ...ids]
    let post = {
      i: token,
      ...params
    }
    if (mediaIds.length > 0) {
      post.mediaIds = mediaIds
    }

    const { data } = await misskey(host).post('/notes/create', post)
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

async function resolveURL(url, host = 'misskey.xyz', token) {
  const name = base64hash(url)
  const { data: files } = await misskey(host).post('/drive/files/find', { i: token, name })
  if (files.length === 0) {
    const { data: stream } = await axios.get(url, {
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
    const resp = JSON.parse(
      await request.post({
        url: `https://${host}/api/drive/files/create`,
        formData,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
        }
      })
    )
    return resp.id
  } else {
    return files[0].id
  }
}

function genUID(id, host = 'misskey.xyz') {
  return host === 'misskey.xyz' ? id : '_' + base64hash(`${id}@${host}`)
}

function base64hash(src) {
  return crypto
    .createHash('sha1')
    .update(src)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}
