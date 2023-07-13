import Logger from "./lib/logger";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const getArgv = (key: string) => {
  const argv = process.argv.slice(2)
  const index = argv.findIndex(item => item.startsWith(`--${key}`))
  if (index === -1) return undefined
  return argv[index].split('=')[1]
}

const logger = Logger('Init')

logger.info('启动中...')

logger.info(`当前是 ${process.argv.includes('--dev') ? '开发' : '生产'} 环境`)

const start = async () => {
  logger.info('开始加载插件')

  const modules = getArgv('module')

  const list = modules ? modules.split(',') : [
    'core', // 核心功能集
    'pixiv', // pixiv搜图
    'trace.moe', // 以图搜番
    'rss', // RSS订阅
    'elasticsearch', // 消息搜索
    'render', // 图片渲染
    'wordle', // wordle游戏
    'ping', // 延迟测试
    'gaming', // 游戏相关
    'clone', // 语音克隆
    'arcaea', // Arc查分
    'waifu', // 抽老婆
    'music', // 点歌
    'sign', // 签到
    'randomImages', // 随机 猫猫/老婆
    'llm', // LLM调用机器人
  ]

  for (const item of list) {
    logger.info(`正在加载 ${item}`)
    import(`./plugins/${item}`).then(() => {
      logger.info(`${item} 加载成功`)
    }).catch(err => {
      logger.warn(`${item} 加载失败:`, err)
    })
  }
}

const init = async () => {
  await import('./lib/bot')
  await start()
}

init()
