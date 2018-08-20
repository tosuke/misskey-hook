import firebase from '~/plugins/firebase'

export default async function() {
  if (process.client && window.localStorage && localStorage.getItem('auth-session-id')) {
    const session = localStorage.getItem('auth-session-id')
    localStorage.removeItem('auth-session-id')
    const functions = firebase.app().functions('asia-northeast1')

    try {
      const {
        data: { token }
      } = await functions.httpsCallable('createOpenIDToken')({ sessionId: session })
      await firebase.auth().signInWithCustomToken(token)
    } catch (err) {
      console.error(err)
    }
  }
  const user = firebase.auth().currentUser
  if (user) {
    return user
  } else {
    return await new Promise((res, rej) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(
        usr => {
          res(usr)
          unsubscribe()
        },
        err => {
          rej(err)
          unsubscribe()
        }
      )
    })
  }
}
