<template>
  <v-layout align-center justify-center column fill-height>
      <v-subheader>Webhook一覧</v-subheader>
      <template v-for="hook in hooks">
        <hook-card :key="hook.id" :hook="hook"/>
        <v-divider :key="hook.id + '!'"/>
      </template>
      <v-layout justify-center>
        <v-dialog v-model="dialog" width="500">
          <v-btn slot="activator" color="pink" dark icon>
            <v-icon>add</v-icon>
          </v-btn>
          <v-card>
            <v-card-title><span class="headline">Webhookを作成</span></v-card-title>
            <v-card-text>
              <v-container grid-list-md>
                <v-layout wrap>
                  <v-flex xs12 sm6 md4>
                    <v-text-field label="Webhookの名前" :rules="[rules.required]" v-model="name"/>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn color="blue darken-1" dark flat @click.native="createHook">作成</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-layout>
      <v-divider/>
      <v-subheader>アカウント管理</v-subheader>
      <span class="subtitle">{{ screenName }}にログインしています。</span>
      <v-btn color="blue" dark @click="signOut">ログアウト</v-btn>
  </v-layout>
</template>

<script>
import HookCard from '~/components/HookCard.vue'
import firebase from '~/plugins/firebase'
import { mapState, mapActions } from 'vuex'

export default {
  components: {
    HookCard
  },
  middleware: 'authenticated',
  data() {
    return {
      dialog: false,
      name: null,
      rules: {
        required: val => !!val || '必須です。'
      }
    }
  },
  methods: {
    async signOut() {
      await this.$store.dispatch('signOut')
      this.$router.push('/auth')
    },
    async createHook() {
      if (!this.name) return
      this.dialog = false
      await this.$store.dispatch('createHook', { name: this.name })
      this.name = ''
    }
  },
  computed: {
    ...mapState(['user', 'hooks']),
    screenName() {
      return `@${this.user.user.username}@${this.user.host}`
    }
  }
}
</script>

<style>
</style>

