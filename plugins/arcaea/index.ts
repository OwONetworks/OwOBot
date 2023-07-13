import { segment } from 'icqq'
import bot from '../../lib/bot'
import ArcaeaAPI from './arcapi'
import { render } from '../render/api'

bot.command_group(/^\/a b30 (\S+)$/, 'arcaea.b30', async (match, event) => {
  const id = match[1]

  event.reply(bot.segment().text(`正在查询 ${id}...`))

  const data = await ArcaeaAPI.user.b30(id)

  if (data.status !== 0) {
    event.reply(bot.segment().text(`查询失败`))
    return
  }

  const songs: any[] = []

  for (const index in data.content.best30_list) {
    const b30 = data.content.best30_list[index]
    const song = data.content.best30_songinfo[index]

    songs.push({
      img: await ArcaeaAPI.assets.song(song.name_en || song.name_jp, 1),
      name: song.name_jp || song.name_en,
      score: b30.score,
      status: {
        pure: b30.perfect_count,
        shiny: b30.shiny_perfect_count,
        far: b30.near_count,
        miss: b30.miss_count
      },
      user_rating: b30.rating.toFixed(3),
      song_rating: await ArcaeaAPI.song.getLevel(b30.song_id, song.rating)
    })
  }

  const options = {
    partner: await ArcaeaAPI.assets.icon(data.content.account_info.character),
    name: data.content.account_info.name,
    best30: data.content.best30_avg,
    recent10: data.content.recent10_avg,
    songs: JSON.stringify(songs)
  }

  const img = await render('arcaea.b30', options, { width: 1800, height: 900 })

  event.reply(bot.segment().image(img))
})
