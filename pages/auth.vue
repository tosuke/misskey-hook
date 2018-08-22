<template>
  <v-layout justify-center>
    <v-jumbotron color="grey lighten-2">
      <v-container fill-height>
        <v-layout align-center>
          <v-flex>
            <h2 class="display-2">{{ title }}</h2>
            <span class="subheading">
              Misskeyへの投稿の自動化を支援します。
              ドキュメントは<a target="_blank" rel="noopener noreferrer" href="https://github.com/Tosuke/misskey-hook/wiki">こちら</a>にあります。
            </span>
            <v-divider class="my-3"/>
            <h2 class="display-1">ログイン</h2>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12 sm6 md4>
                  <v-text-field
                    label="インスタンス名"
                    placeholder="misskey.xyz"
                    :rules="[rules.required]"
                    v-model="host"
                  />
                  <v-btn
                    large color="blue" dark
                    class="mx-0"
                    :loading="loading"
                    @click="signIn"
                  >Misskeyアカウントでログイン</v-btn>
                  <v-dialog v-model="error" max-width="300">
                    <v-card>
                      <v-card-title class="headline">エラーが発生しました。</v-card-title>
                      <v-card-text>{{ errorMessage }}</v-card-text>
                    </v-card>
                  </v-dialog>
                </v-flex>
              </v-layout>
            </v-container>
          </v-flex>
        </v-layout>
      </v-container>
    </v-jumbotron>
  </v-layout>
</template>

<script>
import firebase from '~/plugins/firebase'
export default {
  data() {
    return {
      title: process.env.APP_DESCRIPTION,
      host: '',
      rules: {
        required: val => !!val || '必須です。'
      },
      loading: false,
      error: false,
      errorMessage: null
    }
  },
  methods: {
    async signIn() {
      this.loading = true
      const host = (this.host || 'misskey.xyz').trim()
      const functions = firebase.app().functions('asia-northeast1')
      const { data } = await functions.httpsCallable('generateSession')({ host }).catch(err => {
        this.errorMessage = '非対応のインスタンスです。'
        this.error = true
        this.loading = false
        throw err
      })
      this.loading = false
      localStorage.setItem('auth-session-id', data.token)
      location.href = data.url
    }
  }
}
</script>

