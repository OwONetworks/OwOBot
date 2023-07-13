import bot from '../../lib/bot'
import { render } from '../render/api'
import ping from './ping'

bot.command_group(/\/ping (\S+)/, 'ping.ping', async (match, event) => {
  const target = match[1]
  event.reply(bot.segment().text("Pinging..."), true)

  const result = await ping(target)

  event.reply(bot.segment().text("Rendering..."), true)

  const image = await render('ping', {
    result: JSON.stringify(result)
  }, {
    width: 1800,
    height: 1200
  })

  event.reply(bot.segment().image(image), true)
})
