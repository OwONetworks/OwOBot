import AxiosSocks5Agent from 'axios-socks5-agent'
import HttpsProxyAgent from 'https-proxy-agent'
import conf from '../../config'

export const { httpAgent, httpsAgent } = AxiosSocks5Agent({
  agentOptions: {
    keepAlive: true,
  },
  host: conf.plugins.proxy.socks5.host,
  port: conf.plugins.proxy.socks5.port,
})

export const httpsProxyAgent = HttpsProxyAgent(conf.plugins.proxy.https.url)
httpsProxyAgent.timeout = 5000
