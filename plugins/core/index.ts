import bot from '../../lib/bot'

bot.bots.telegram.command_private(/^\/(help|start)$/, 'core.telegram.start', async (match, event) => {
  const msg = [
    '内置指令',
    `• /help, /start - 显示本条信息`,
    '',
    '以图搜番',
    `• /trace - 消息中附带任意图片即可`,
    '',
    '图片渲染',
    `• /throw - 回复一位用户，生成扔头像图片(仅支持群聊)`,
    '',
    '随机老婆',
    `• /waifu - 随机老婆`,
    `• /neko - 随机猫猫`,
    '',
    `RSS订阅(仅支持群聊)`,
    `• /rss add <path> - 添加订阅（填写RSSHub支持的PATH即可）`,
    `• /rss list - 查看订阅列表`,
    `• /rss remove <id> - 删除订阅`,
    '',
    `Wordle游戏(仅支持群聊)`,
    `• /wordle - 开始一局游戏`,
    `• /wordle <SUM|TEM8|GRE8000|TOFEL> - 使用指定的词库开始游戏`,
    '',
    '',
    `自然语言调用`,
    `• !<command> - 直接说出你想让咱做的事情就行`,
    `• 例如：!查看订阅列表, !把xxx添加到订阅列表 等`,
    `• 考虑到输入便捷性问题，这里的感叹号也支持中文`,
    `• 最后需要注意的是并不是所有指令都支持这个功能`,
    '',
    '',
    '需要注意的是由于兼容性与易用性问题，部分指令不符合TG规范的功能在这里并没有完整显示',
    '可以考虑为其他平台准备的 “菜单” 命令查看所有功能'
  ].join('\n')

  event.reply(bot.segment().text(msg), true)
})

bot.bots.telegram.command_group(/^\/(help|start)$/, 'core.telegram.start', async (match, event) => {
  event.reply(bot.segment().text(`由于消息过长，本命令只允许在私聊中使用`), true)
})
