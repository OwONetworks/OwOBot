import bot from "../../lib/bot";
import r6s from './games/r6s'
import logger from "../../lib/logger";

bot.command_group(/^\/r6s (\S+)$/, 'gaming.r6s', async (match, event) => {
  event.reply(bot.segment().text("正在查询，请稍后..."), true)
  try {
    const username = match[1]
    const image = await r6s.getCurrentImage(username)

    event.reply(bot.segment().image(image), true)
  } catch (error) {
    logger('r6s').error(error)
    event.reply(bot.segment().text("查询失败"), true)
  }
})