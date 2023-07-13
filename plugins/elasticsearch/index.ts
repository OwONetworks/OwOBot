import bot from '../../lib/bot'
import crypto from 'crypto'
import logger from '../../lib/logger'
import config from '../../config'
import client from './client'
import { query as SQLQuery } from './sql'

const indexName = config.plugins.elasticsearch.elasticsearch.index

const hash = (str: string) => parseInt(crypto.createHash('md5').update(str).digest('hex'), 16).toString(36)

bot.bots.oicq.__api__.on('message.group', async (event) => {
  if (!config.plugins.elasticsearch.whitelist.includes(event.group.group_id)) return

  try {
    if (process.argv.includes('--dev')) return

    const id = `${event.group_id}:${event.sender.user_id}:${hash(`${event.raw_message}:${new Date().getTime()}`)}`

    await client.create({
      index: indexName,
      id: id,
      document: {
        group: {
          id: event.group_id,
          name: event.group.name
        },
        sender: {
          id: event.sender.user_id,
          name: event.sender.nickname,
          card: event.sender.card
        },
        reply: event.source,
        message: event.raw_message,
        full_msg: event.message,
        timestamp: new Date()
      }
    })
  } catch (e) {
    logger('elasticsearch').warn(e)
  }
})

const search = async (query: string, page: number) => {
  const from = (page - 1) * 50

  const resp = await client.search({
    index: indexName,
    size: 50,
    from: from,
    profile: true,
    q: query,
    // @ts-ignore
    sort: [{
      timestamp: {
        order: 'desc'
      }
    }]
  })

  if (!resp.profile) return null

  return {
    result: resp.hits.hits.map(e => e._source).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    profile: resp.profile.shards[0]
  }
}

bot.bots.oicq.command_group(/^\/search (\d+) (.*)$/, 'elasticsearch.group.search', async (match, event) => {
  const list = config.plugins.elasticsearch.whitelist

  if (!list.includes(event.group.id)) return

  event.reply(bot.segment().text("搜索中..."))

  const query = match[2]
  const page = match[1]

  const data = await search(`group.id: ${event.group.id} AND ${query}`, parseInt(page))

  if (!data) return event.reply(bot.segment().text("没有搜索到任何结果"))

  const result: any = data.result
  const profile = data.profile

  const msg: any[] = []

  const q = profile.searches[0].query[0]

  msg.push({
    message: [
      `总耗时: ${q.time_in_nanos / 1000000}ms`,
      `解析结果: ${q.description}`,
      `详细信息: `,
      Object.keys(q.breakdown).map(k => {
        // @ts-ignore
        const v = q.breakdown[k]

        return `    ${k.replace(/_/g, ' ')}: ${isNaN(Number(v)) ? v : `${v/1000000}ms`}`
      }).join('\n')
    ].join('\n'),
    nicknam: 'OwOBot | DEBUG',
    time: Math.round(new Date().getTime() / 1000000),
    user_id: 2300691416
  })

  for (const item of result) {
    msg.push({
      message: item.full_msg || item.message,
      nickname: item.sender.card || item.sender.name,
      time: Math.round(new Date(item.timestamp).getTime()/1e3),
      user_id: item.sender.id
    })
  }

  const fmsg = await bot.bots.oicq.__api__.makeForwardMsg(msg)

  event.reply(bot.segment().raw(fmsg))
})

bot.bots.oicq.command_group(/^\/query (.*)$/, 'elasticsearch.group.query', async (match, event) => {
  const list = config.plugins.elasticsearch.whitelist

  if (!list.includes(event.group.id)) return

  event.reply(bot.segment().text("搜索中..."))

  const query = match[1]

  try {
    const data = await SQLQuery(query, event.group.id as number)
    if (!data) return event.reply(bot.segment().text("没有搜索到任何结果"))

    if (typeof data === 'string') {
      if (data.length > 50) {
        const fmsg = await bot.bots.oicq.__api__.makeForwardMsg([{
          message: data,
          nickname: "OwOBot | 聚合查询",
          time: Math.round(new Date().getTime()/1e3),
          user_id: 2300691416
        }])
        
        return event.reply(bot.segment().raw(fmsg))
      } else {
        return event.reply(bot.segment().text(data), true)
      }
    }

    const msg: any[] = []

    for (const item of data) {
      msg.push({
        message: item.full_msg || item.message,
        nickname: item.sender.card || item.sender.name,
        time: Math.round(new Date(item.timestamp).getTime()/1e3),
        user_id: item.sender.id
      })
    }

    const fmsg = await bot.bots.oicq.__api__.makeForwardMsg(msg)
  
    event.reply(bot.segment().raw(fmsg))
  } catch (error) {
    logger('Elasticsearch').error(error)
    return event.reply(bot.segment().text(`查询出现错误: ${error}`))
  }
})
