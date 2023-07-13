import { search, downloadImage } from './pixiv';
import bot from '../../lib/bot'

bot.command_all(/^\/pixiv (.*)$/, 'pixiv.search', async (match, event) => {
  const keyword = match[1]

  event.reply(bot.segment().text("[Pixiv] 搜索中..."), true)
  const illusts = await search(keyword)

  if (illusts.length === 0) return event.reply(bot.segment().text("[Pixiv] 没有找到相关内容"), true)

  const msg = bot.segment()

  // 随机发送一张
  const illust = illusts[Math.floor(Math.random() * illusts.length)]

  msg.image(await downloadImage(illust.image_urls.large.replace('i.pximg.net', 'i.pixiv.cat')))
  msg.text(`标题: ${illust.title}\n`)
  msg.text(`作者: ${illust.user.name}\n`)
  msg.text(`链接: https://www.pixiv.net/artworks/${illust.id}`)

  await event.reply(msg)
})
