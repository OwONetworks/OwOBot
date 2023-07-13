import elastic from '@elastic/elasticsearch'
import config from '../../config'

const client = new elastic.Client({
  node: config.plugins.elasticsearch.elasticsearch.host,
  tls: {
    rejectUnauthorized: false
  },
  auth: {
    apiKey: config.plugins.elasticsearch.elasticsearch.apikey
  }
})

export default client
