import axios, { AxiosInstance } from 'axios'
import http from 'http'
import https from 'https'
import conf from '../../config'

let axiosInstances: AxiosInstance[] = []

if (conf.plugins.gaming.enableIPv6Pool) {
  const pool = conf.plugins.gaming.pools as string[]

  const httpAgents = pool.map(ip => new http.Agent({ keepAlive: true, family: 6, localAddress: ip }))
  const httpsAgents = pool.map(ip => new https.Agent({ keepAlive: true, family: 6, localAddress: ip }))  

  axiosInstances = pool.map((ip, i) => axios.create({
    httpAgent: httpAgents[i],
    httpsAgent: httpsAgents[i]
  }))
} else {
  axiosInstances = [
    axios.create(),
  ]
}

const pick = (): AxiosInstance => {
  if (process.argv.includes('--dev')) return axios.create()

  const i = Math.floor(Math.random() * axiosInstances.length)
  return axiosInstances[i]
}

export default {
  get axios(): AxiosInstance {
    return pick()
  }
}
