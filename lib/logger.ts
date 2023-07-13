import log4js from 'log4js'
import config from '../config'

const conf: any = {
  appenders: {
    file: {
      type: 'dateFile',
      filename: 'logs/default',
      alwaysIncludePattern: true,
      pattern: 'yyyy-MM-dd.log'
    },
    console: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: [
        "file",
        "console"
      ],
      level: config.logger.level
    }
  }
}

log4js.configure(conf)

export default log4js.getLogger
