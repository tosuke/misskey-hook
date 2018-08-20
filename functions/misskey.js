const axios = require('axios')
const https = require('https')

const misskeyClientCache = new Map()

const httpsAgent = new https.Agent({ keepAlive: true })

function misskey(host = 'misskey.xyz') {
  if (misskeyClientCache.has(host)) {
    return misskeyClientCache.get(host)
  }

  const client = axios.create({
    baseURL: `https://${host}/api`,
    timeout: 10000,
    httpsAgent,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
    }
  })

  misskeyClientCache.set(host, client)
  return client
}

module.exports = misskey
