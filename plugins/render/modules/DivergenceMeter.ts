import bot from '../../../lib/bot'
import { render } from '../api'

bot.command_group(/^世界线$/, 'render.DivergenceMeter', async (match, event) => {
  event.reply(bot.segment().text("正在探测..."))

  const image = await render('DivergenceMeter', {
    addon: 0
  }, {
    width: 1600,
    height: 600
  })

  event.reply(bot.segment().image(image), true)
})

bot.command_group(/^世界线(\d)$/, 'render.DivergenceMeter.config', async (match, event) => {
  event.reply(bot.segment().text("正在探测..."))

  let num = parseInt(match[1])
  
  // 只允许 0~4
  if (num < 0 || num > 4) {
    num = 0
  }

  const image = await render('DivergenceMeter', {
    addon: num
  }, {
    width: 1600,
    height: 600
  })

  event.reply(bot.segment().image(image), true)
})
