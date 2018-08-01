<template>
  <section class="container">
    <div>
      <button @click="login">login</button>
    </div>
  </section>
</template>

<script>
import AppLogo from '~/components/AppLogo.vue'
import firebase from '~/plugins/firebase'

export default {
  components: {
    AppLogo
  },
  methods: {
    async login() {
      const functions = firebase.app().functions('asia-northeast1')
      const { data } = await functions.httpsCallable('generateSession')()
      localStorage.setItem('auth-session-id', data.token)
      location.href = data.url
    }
  }
}
</script>

<style>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* 1 */
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>

