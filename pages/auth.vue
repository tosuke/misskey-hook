<template>
  <v-layout justify-center>
    <v-jumbotron color="grey lighten-2">
      <v-container fill-height>
        <v-layout align-center>
          <v-flex>
            <h3 class="display-2">ログイン</h3>
            <v-divider class="my-3"/>
            <v-btn large color="blue" dark class="mx-0" @click="signIn">Misskeyアカウントでログイン</v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-jumbotron>
  </v-layout>
</template>

<script>
import firebase from '~/plugins/firebase'
export default {
  methods: {
    async signIn() {
      const functions = firebase.app().functions('asia-northeast1')
      const { data } = await functions.httpsCallable('generateSession')()
      localStorage.setItem('auth-session-id', data.token)
      location.href = data.url
    }
  }
}
</script>

