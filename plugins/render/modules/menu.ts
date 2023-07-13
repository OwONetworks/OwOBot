import bot from '../../../lib/bot'
import { render } from '../api'

bot.command_all(/菜单/, 'render.menu', async (match, event) => {
  const fullText = event.message.filter(v => v.type === 'text').map(v => v.data.text).join('').trim()
  if (fullText !== '菜单') return

  await event.reply(bot.segment().text("加载中..."), true)

  const img = await render('menu', {}, {
    width: 1800,
    height: 800
  })

  await event.reply(bot.segment().image(img), true)
})
