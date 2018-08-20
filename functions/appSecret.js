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
    throw new Error('unsupported instance')
  }
}

module.exports = appSecret