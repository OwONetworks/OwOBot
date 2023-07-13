import fs from 'fs'

interface Config {
  account: {
    uin: number,
    password: string
  },
  oicq: any,
  logger: {
    level: string,
  },
  plugins: {
    [key: string]: any
  }
}

const config = fs.readFileSync('./config.json')
const conf: Config = JSON.parse(config.toString())

export default conf
