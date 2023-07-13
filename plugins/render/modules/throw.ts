import bot from '../../../lib/bot'
import { render } from '../api'

bot.bots.oicq.command_group(/^\/throw$/, 'render.throw', async (match, event) => {
  // @ts-ignore
  const at = event.message.filter(item => item.type === 'at')[0]

  const target = at ? at.data.target : (event.replies[0] ? event.replies[0].sender.id : event.sender.id)

  if (!target) return event.reply(bot.segment().text("你还没有指定目标用户"))

  event.reply(bot.segment().text("正在渲染..."))

  const image = await render('throwit', {
    qid: target
  }, {
    width: 512,
    height: 512
  })

  event.reply(bot.segment().image(image))
})
