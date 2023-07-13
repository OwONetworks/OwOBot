import conf from '../../config'
import bot from '../../lib/bot'
import { chat } from './gpt35'
import * as functions from './invoke'

bot.command_all(/^(!|！)(.*)/, 'llm.chat', async (match, event) => {
  const msg = match[2]
  await event.reply(bot.segment().text("Loading..."), true)
  const result = await chat(event.sender.id, msg)
  if (result.type === 'text') {
    if (conf.plugins.llm.enableChat) await event.reply(result.text, true)
    await event.reply(bot.segment().text("无法识别的指令"), true)
  } else {
    const platform = event.platform
    const functionName = result.functionName as keyof typeof functions
    const functionArgs = result.functionArgs
    const human_readable_function_name = functions.__map__[functionName]

    await event.reply(bot.segment().text(`正在调用 ${human_readable_function_name}...`), true)

    const func = functions[functionName] as Function

    if (!func) {
      await event.reply(bot.segment().text("不支持的功能调用"), true)
      return
    }

    try {
      func(platform, functionArgs, event)
    } catch (error) {
      await event.reply(bot.segment().text("调用失败，可能对应指令不兼容此平台"), true)
    }
  }
})