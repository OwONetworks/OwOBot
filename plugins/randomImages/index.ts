import bot from '../../lib/bot'
import axios from 'axios'

bot.command_all(/^(随机猫猫|\/neko)$/, 'randomimages.neko', async (match, event) => {
  await event.reply(bot.segment().text("Loading..."), true)
  const image = await axios.get('https://theresa.cafe/waifu/sfw/neko', { responseType: 'arraybuffer' })
  await event.reply(bot.segment().image(image.data))
})

bot.command_all(/^(随机老婆|\/waifu)$/, 'randomimages.waifu', async (match, event) => {
  await event.reply(bot.segment().text("Loading..."), true)
  const image = await axios.get('https://theresa.cafe/waifu/sfw/waifu', { responseType: 'arraybuffer' })
  await event.reply(bot.segment().image(image.data))
})