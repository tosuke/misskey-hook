const firebase = require('firebase-admin')

firebase.initializeApp({
  ...JSON.parse(process.env.FIREBASE_CONFIG || '{}'),
  credential: firebase.credential.cert(require('./service-account.json'))
})

module.exports = firebase