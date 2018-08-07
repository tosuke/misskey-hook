<template>
  <v-card>
    <v-card-title class="title">{{ hook.name }}</v-card-title>
    <v-card-actions>
      <v-btn flat color="blue" @click="doCopy">WebhookのURLをコピー</v-btn>
      <v-btn flat color="red" @click="doDelete">Webhookを削除</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['hook'],
  methods: {
    doCopy() {
      this.$copyText(this.url)
    },
    async doDelete() {
      await this.$store.dispatch('deleteHook', { id: this.hook.id })
    }
  },
  computed: {
    ...mapState(['user']),
    url() {
      const base = `https://asia-northeast1-${process.env.PROJECT_ID}.cloudfunctions.net/hook`
      const uid = this.user.user.id
      const id = this.hook.id
      return `${base}?uid=${uid}&id=${id}`
    }
  }
}
</script>

