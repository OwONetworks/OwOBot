import bot from '../../lib/bot'
import RSSParser from 'rss-parser'
import * as rss from './rss'
import axios from 'axios'
import { PlatformTypes } from '../../lib/bots/base'

interface Item {
  title: string,
  item_title: string,
  link: string,
  target: {
    group_id: number,
    platform: PlatformTypes
  }
}

interface NewItem {
  title: string,
  item_title: string,
  link: string,
  groups: {
    group_id: number,
    platform: PlatformTypes
  }[]
}

const parser = new RSSParser()

const quickFeed: {
  [index: string]: string
} = {
  "游戏折扣": "https://rsshub.theresa.cafe/xiaoheihe/discount/pc",
  "原神公告": "https://rsshub.theresa.cafe/mihoyo/ys",
  "明日方舟公告": "https://rsshub.theresa.cafe/arknights/news",
  "PCR公告": "https://rsshub.theresa.cafe/pcr/news-cn",
  "Epic免费游戏": "https://rsshub.theresa.cafe/epicgames/freegames/zh-CN",
  "地震速报": "https://rsshub.theresa.cafe/earthquake",
}

bot.command_group(/^快速订阅(.*)$/, 'rss.quick', async (match, event) => {
  const name = match[1].trim()

  if (!name || !quickFeed[name]) return event.reply(bot.segment().text(`没有 ${name} 这个快速订阅，可用的快速订阅有：${Object.keys(quickFeed).join(', ')}`), true)

  // 判断是否为管理员或者群主
  if (event.sender.role !== 'admin' && event.sender.role !== 'owner') return event.reply(bot.segment().text("[RSS] 请求已忽略"))

  const url = quickFeed[name]

  try {
    const resp = await parser.parseURL(url)

    const title = resp.title

    if (!title) return event.reply(bot.segment().text("[RSS] 订阅源格式错误(缺少标题)"), true)
    const group_id = event.group.id as number

    event.reply(bot.segment().text("[RSS] 正在拉取数据..."), true)

    const add = await rss.addFeed(url, title, group_id, event.platform)

    if (add) return event.reply(bot.segment().text("[RSS] 添加订阅成功"), true)

    return event.reply(bot.segment().text("[RSS] 订阅添加失败"), true)
  } catch (error) {
    event.reply(bot.segment().text("[RSS] 无法拉取订阅源"), true)
  }
})

// 添加订阅
bot.command_group(/^\/rss add (.*)$/, 'rss.add', async (match, event) => {
  let url = match[1]

  // 判断是否为管理员或者群主
  if (event.sender.role !== 'admin' && event.sender.role !== 'owner') return event.reply(bot.segment().text("[RSS] 请求已忽略"))

  try {
    url = `https://rsshub.theresa.cafe${url}`

    const resp = await parser.parseURL(url)

    const title = resp.title

    if (!title) return event.reply(bot.segment().text("[RSS] 订阅源格式错误(缺少标题)"), true)
    const group_id = event.group.id as number

    event.reply(bot.segment().text("[RSS] 正在拉取数据..."), true)

    const add = await rss.addFeed(url, title, group_id, event.platform)

    if (add) return event.reply(bot.segment().text("[RSS] 添加订阅成功"), true)

    return event.reply(bot.segment().text("[RSS] 订阅添加失败"), true)
  } catch (error) {
    event.reply(bot.segment().text("[RSS] 无法拉取订阅源"), true)
  }
})

// 删除订阅
bot.command_group(/^\/rss remove (\d+)$/, 'rss.remove', async (match, event) => {
  const id = match[1]

  // 判断是否为管理员或者群主
  if (event.sender.role !== 'admin' && event.sender.role !== 'owner') return event.reply(bot.segment().text("[RSS] 请求已忽略"))

  try {
    const remove = await rss.removeFeed(Number(id), event.group.id as number, event.platform)

    if (remove) return event.reply(bot.segment().text("[RSS] 删除订阅成功"), true)

    return event.reply(bot.segment().text("[RSS] 删除订阅失败"), true)
  } catch (error) {
    event.reply(bot.segment().text("[RSS] 删除订阅失败"), true)
  }
})

// 手动刷新订阅
bot.command_group(/^\/rss update$/, 'rss.update', async (match, event) => {
  // 判断是否为管理员或者群主
  if (event.sender.role !== 'admin' && event.sender.role !== 'owner') return event.reply(bot.segment().text("[RSS] 请求已忽略"))

  event.reply(bot.segment().text("[RSS] 刷新中..."))
  await rss.update()
  event.reply(bot.segment().text("[RSS] 刷新完成!"))
})

// 查看订阅列表
bot.command_group(/^\/rss list$/, 'rss.list', async (match, event) => {
  try {
    const feeds = await rss.getFeeds(event.group.id as number, event.platform)

    if (feeds.length === 0) return event.reply(bot.segment().text("[RSS] 没有订阅"), true)

    const buf = []

    for (const feed of feeds) {
      buf.push(`${feed.id} - ${feed.title}`)
    }

    event.reply(bot.segment().text(buf.join('\n')), true)
  } catch (error) {
    event.reply(bot.segment().text("[RSS] 获取订阅列表失败"), true)
  }
})

const push = async (item: Item) => {
  bot.bots[item.target.platform].sendPublicMessage(item.target.group_id, bot.segment().text([
    `您订阅的 ${item.title} 更新了`,
    `标题: ${item.item_title}`,
    `链接: ${item.link}`
  ].join('\n')) as any)

  const url = `https://urlscan.io/liveshot/?width=1600&height=900&url=${item.link}`
  const resp = await axios.get(url, { responseType: 'arraybuffer' })

  const group_id = item.target.group_id
  bot.bots[item.target.platform].sendPublicMessage(group_id, bot.segment().image(Buffer.from(resp.data, 'binary')) as any)
}

rss.RSSEvents.on('new', (buf: NewItem) => {
  buf.groups.forEach(group => {
    push({
      title: buf.title,
      item_title: buf.item_title,
      link: buf.link,
      target: group
    })
  })
})