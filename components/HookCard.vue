<template>
  <v-card>
    <v-card-title class="title">{{ hook.name }}</v-card-title>
    <v-card-actions>
      <v-btn flat color="blue" @click="doCopy">WebhookのURLをコピー</v-btn>
      <v-dialog v-model="dialog" width="500">
        <v-btn slot="activator" flat color="red">Webhookを削除</v-btn>

        <v-card>
          <v-card-title class="headline red lighten-2">本当に削除しますか？</v-card-title>
          <v-card-text class="subheading">この操作は取り消せません。</v-card-text>
          <v-card-actions>
            <v-btn flat color="blue" @click="dialog=false">削除しない</v-btn>
            <v-btn flat color="red" @click="doDelete">削除する</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['hook'],
  data() {
    return {
      dialog: false
    }
  },
  methods: {
    doCopy() {
      this.$copyText(this.url)
    },
    async doDelete() {
      await this.$store.dispatch('deleteHook', { id: this.hook.id })
      this.dialog = false
    }
  },
  computed: {
    ...mapState(['user', 'uid']),
    url() {
      const base = `https://asia-northeast1-${process.env.PROJECT_ID}.cloudfunctions.net/hook`
      const uid = this.uid 
      const id = this.hook.id
      return `${base}?uid=${uid}&id=${id}`
    }
  }
}
</script>

