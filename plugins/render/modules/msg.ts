import bot from '../../../lib/bot'
import { render } from '../api'

bot.bots.oicq.command_group(/^\/msg$/, 'render.msg', async (match, event) => {
  const defaultTitles = {
    admin: '管理员',
    member: '成员',
    owner: '群主'
  }

  if (event.replies.length === 0) return event.reply(bot.segment().text("你还没有回复消息"))

  event.reply(bot.segment().text("正在渲染..."))

  const sender = await bot.bots.oicq.__api__.getGroupMemberInfo(event.group.id as number, event.replies[0].sender.id as number)

  const title = defaultTitles[sender.role] || '无头衔'

  const image = await render('message', {
    qid: sender.user_id,
    title: sender.title || title,
    name: sender.card || sender.nickname,
    content: event.replies[0].message[0].data.text.replace(/\n/g, '</br>')
  }, {
    width: 550,
    height: 50
  })

  event.reply(bot.bots.oicq.segment().image(image))
})