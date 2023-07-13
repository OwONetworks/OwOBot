import { TraceMoe } from 'trace.moe.ts'
import bot from '../../lib/bot'

const searcher = new TraceMoe()

bot.command_all(/^\/trace$/, 'trace.trace', async (match, event) => {
  const img = event.message.filter(item => item.type === 'image')[0].data.url.toString()

  if (!img) return event.reply(bot.segment().text('[Trace.moe] 图呢?'), true)

  await event.reply(bot.segment().text('[Trace.moe] 搜索中...'), true)

  const resp = await searcher.fetchAnime(img, {
    anilistInfo: true
  })

  if (!resp.result || resp.result.length === 0) return event.reply(bot.segment().text('[Trace.moe] 没有找到相关内容'), true)

  const r = resp.result[0]
  const start = r.from
  const min = parseInt(String(start/60));
  const sec = Math.round(start - min * 60);

  event.reply(bot.segment().text(`出自番剧 ${r.anilist.title.native} 第 ${r.episode} 话 ${min}分${sec}秒 处，相似度 ${(r.similarity * 100).toFixed(2)}%`), true)
})
