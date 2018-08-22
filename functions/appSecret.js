const misskey = require('./misskey')
const db = require('./firestore')

const cache = new Map()

async function appSecret(host = 'misskey.xyz') {
  if (cache.has(host)) return cache.get(host)

  const instanceRef = db.collection('instances').doc(host)
  const instanceDoc = await instanceRef.get()
  if (instanceDoc.exists) {
    const { appSecret } = instanceDoc.data()
    cache.set(host, appSecret)
    return appSecret
  } else {
    // TODO: Create App
    try {
      const permission = ['note-write', 'drive-read', 'drive-write']
      const { data: app } = await misskey(host).post('/app/create', {
        name: process.env.APP_NAME,
        description: process.env.APP_DESCRIPTION,
        callbackUrl: process.env.APP_CALLBACK_URL,
        permission
      })

      if (app.error) {
        throw new Error(app.error)
      }

      await instanceRef.set({
        id: app.id,
        appSecret: app.secret
      })

      return app.secret
    } catch (err) {
      console.error(err)
      throw new Error('unsupported instance')
    }
  }
}

module.exports = appSecret
