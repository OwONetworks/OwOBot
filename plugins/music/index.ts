import bot from '../../lib/bot'
import * as NeteaseCloudMusicApi from 'NeteaseCloudMusicApi'
import { toArm_inDocker } from '../clone'
import axios from 'axios'

const UserSelect: Map<number | string, {time: Date, list: number[]}> = new Map()

bot.command_group(/^点歌\s+(.*)$/, 'music.search', async (match, event) => {
  event.reply(bot.segment().text("正在搜索..."), true)
  const keyword = match[1]
  const result = await NeteaseCloudMusicApi.search({
    keywords: keyword,
    type: 1
  }) as unknown as any

  const songs = result.body.result.songs.slice(0, 10)

  const songList = songs.map((song: any, index: number) => {
    return `${index}. ${song.name} - ${song.artists.map((artist: any) => artist.name).join(', ')}`
  })

  UserSelect.set(event.sender.id, {
    time: new Date(),
    list: songs.map((song: any) => song.id)
  })

  event.reply(bot.segment().text(songList.join('\n')), true)
})

bot.command_group(/^\d$/, 'music.play', async (match, event) => {
  const userSelect = UserSelect.get(event.sender.id)
  if (!userSelect) return
  
  const index = parseInt(match[0])
  if (index > userSelect.list.length) {
    event.reply(bot.segment().text("索引超出范围"), true)
    return
  }

  const songId = userSelect.list[index]

  event.reply(bot.segment().text("正在下载歌曲..."), true)
  
  const url = await NeteaseCloudMusicApi.song_url({
    id: songId
  })

  // @ts-ignore
  const resp = await axios.get(url.body.data[0].url, {
    responseType: 'arraybuffer'
  })

  const data = resp.data

  if (event.platform === 'oicq') {
    event.reply(bot.segment().text("正在转码..."), true)
    const amr = await toArm_inDocker(data)
    await event.reply(bot.segment().text("正在发送..."), true)
    event.reply(bot.segment().audio(amr))
  } else {
    event.reply(bot.segment().audio(data))
  }
})
