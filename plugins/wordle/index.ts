import bot from '../../lib/bot'
import * as words from './words'
import { render } from '../render/api'
import * as tencent from 'tencentcloud-sdk-nodejs'
import db from '../db'
import conf from '../../config'

const randomHex = (len: number) => {
  let str = ''
  for (let i = 0; i < len; i++) {
    str += Math.floor(Math.random() * 16).toString(16)
  }

  return str.substring(0, len)
}

const translate = new tencent.tmt.v20180321.Client({
  credential: conf.plugins.wordle.tencent,
  region: 'ap-guangzhou'
})

const sessions: {
  [index: string]: {
    target: string,
    inputs: string[],
    chinese: string,
    lock: boolean,
    db: 'SUM'|'TEM8'|'GRE8000'|'TOFEL',
    scores: {
      user: number | string,
      score: number
    }[]
  }
} = {}

const start = (event: any, db: 'SUM'|'TEM8'|'GRE8000'|'TOFEL') => {
  if (sessions[`${event.platform}:${event.group.id}`]) {
    event.reply(bot.segment().text("已经有一个在运行的游戏了，发送 end 可以结束游戏"))

    return
  }

  const word = words[db][Math.floor(Math.random() * words[db].length)]

  sessions[`${event.platform}:${event.group.id}`] = {
    target: word,
    inputs: [],
    chinese: '翻译获取失败',
    lock: false,
    db: db,
    scores: []
  }

  translate.TextTranslate({
    Source: 'en',
    SourceText: word,
    Target: 'zh',
    ProjectId: 0
  }).then(resp => {
    sessions[`${event.platform}:${event.group.id}`].chinese = resp.TargetText
  })

  event.reply(bot.segment().text("游戏开始啦"), true)
}

bot.command_group(/^\/wordle$/, 'wordle.create', async (match, event) => {
  start(event, 'SUM')
})

bot.command_group(/^\/wordle rank$/, 'wordle.rank', async (match, event) => {
  const data = await db('plugin_wordle')
    .select(
      'uid',
      db.raw('SUM(score) / COUNT(score) / AVG(round) * 100 AS score')
    )
    .groupBy('uid')
    .orderBy('score', 'desc')
    .where('q', 1)
    .limit(10)

  event.reply(bot.segment().text(`排行榜\n${data.map((item: any, index: number) => `${index + 1}. ${item.uid}: ${Math.round(item.score)}`).join('\n')}`))
})

bot.command_group(/^\/wordle (SUM|TEM8|GRE8000|TOFEL)$/, 'wordle.wordslist', async (match, event) => {
  const target = match[1]

  if (!['SUM', 'TEM8', 'GRE8000', 'TOFEL'].includes(target)) {
    event.reply(bot.segment().text("没有这个词库，目前可用词库为: SUM, TEM8, GRE8000, TOFEL"))
    return
  }

  const t: 'SUM'|'TEM8'|'GRE8000'|'TOFEL' = target as 'SUM'|'TEM8'|'GRE8000'|'TOFEL'

  start(event, t)
})

bot.on('message.group', async event => {
  const msg = event.message.filter(item => item.type === 'text').map(item => item.data.text).join('')
  const session = sessions[`${event.platform}:${event.group.id}`]

  if (!session) return

  if (session.lock) return

  if (msg === 'end' || session.inputs.length >= 10) {
    session.lock = true

    const image = await render('wordle', {
      target: session.target,
      inputs: session.inputs.join(','),
    }, {
      width: 206,
      height: 40
    })

    event.reply(bot.segment().image(image).text([
      `答案是: ${session.target} (${session.chinese})`,
      `总共 ${session.inputs.length} 次`,
    ].join('\n')), true)

    delete sessions[`${event.platform}:${event.group.id}`]

    return
  }

  if (msg.length !== 5) return
  if (msg.match(/[^a-z]/)) return

  if (!words.ALL.includes(msg)) {
    event.reply(bot.segment().text("词库中没有这个单词"), true)
    return
  }

  if (session.target === msg) {
    session.lock = true

    const reply = bot.segment()

    // 记录历史
    session.inputs.push(msg)

    // 渲染图片
    const image = await render('wordle', {
      target: session.target,
      inputs: session.inputs.join(',')
    }, {
      width: 206,
      height: 40
    })

    // 记录分数
    session.scores.push({
      user: event.sender.id,
      score: 5
    })
    
    // 计算分数
    const scoreboard: {[index: number | string]: number} = {}

    for (const item of session.scores) {
      scoreboard[item.user] = (scoreboard[item.user] || 0) + item.score
    }

    // 发送消息
    reply.image(image)
    reply.text([
      `猜对啦，答案是: ${session.target} (${session.chinese})`,
      `共 ${session.inputs.length} 次`,
      '\n',
      `记分板:`,
      ...Object.entries(scoreboard).map(([user, score]) => `${user}: ${score}`),
    ].join('\n'))

    // 录入数据库
    const game = randomHex(16)

    Object.entries(scoreboard).forEach(async ([user, score]) => {
      await db('plugin_wordle').insert({
        game: game,
        uid: user,
        score: score,
        word: session.target,
        round: session.scores.filter(item => Number(item.user) === Number(user)).length,
      })
    })

    // 结束游戏
    delete sessions[`${event.platform}:${event.group.id}`]

    event.reply(reply, true)
  } else {
    if (session.inputs.includes(msg)) {
      event.reply(bot.segment().text("已经猜过这个单词了"), true)
      return
    }

    // 记录历史
    session.inputs.push(msg)

    // 计算分数
    let score = 0

    const input = msg.split('')
    const target = session.target.split('')

    for (const index in input) {
      if (input[index] === target[index]) {
        score += 1
      } else if (target.includes(input[index])) {
        score += 0.5
      }
    }

    session.scores.push({
      user: event.sender.id,
      score: score
    })

    // 渲染图片
    const image = await render('wordle', {
      target: session.target,
      inputs: session.inputs.join(','),
    }, {
      width: 206,
      height: 40
    })

    event.reply(bot.segment().image(image), true)
  }
})
