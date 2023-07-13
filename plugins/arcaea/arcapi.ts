import Axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import config from '../../config'
import {
  UserInfo,
  Best30,
  Best,
  SongList,
  SongDetail
} from './types'

const md5 = (str: string) => crypto.createHash('md5').update(str).digest('hex')

const token = config.plugins.arcaea.token

const axios = Axios.create({
  baseURL: config.plugins.arcaea.host,
  headers: {
    'Authorization': `Bearer ${token}`,
  }
})

const request = async (path: string, params: any, method: 'get' | 'post', body: any) => {
  const res = await axios[method](path, { params, body })
  return res.data
}

const getAssetWithBase64 = async (url: string, type: string) => {
  const cacheKey = md5(url)
  const cachePath = path.join(process.cwd(), 'data', `cache_${cacheKey}`)

  try {
    const data = await fs.readFile(cachePath)
    return `data:${type};base64,${data.toString('base64')}`
  } catch (err) {
    const res = await axios.get(url, { responseType: 'arraybuffer' })
    fs.writeFile(cachePath, Buffer.from(res.data, 'binary'))
    return `data:${type};base64,${Buffer.from(res.data, 'binary').toString('base64')}`
  }
}

let songList: SongList | null = null

const api = {
  user: {
    info: (id: string): Promise<UserInfo> => request('/user/info', { user: id, recent: 5, withsonginfo: true }, 'get', null),
    b30: (id: string): Promise<Best30> => request('/user/best30', { user: id, withsonginfo: true }, 'get', null),
    b: (uid: string, sid: string, difficulty: number): Promise<Best> => request('/user/best', { user: uid, song: sid, difficulty, withsonginfo: true }, 'get', null)
  },
  song: {
    list: (): Promise<SongList> => request('/song/list', {}, 'get', null),
    detail: (id: string): Promise<SongDetail> => request('/song/info', { song: id }, 'get', null),
    getLevel: async (id: string, rating: number) => {
      if (!songList) {
        songList = await api.song.list()
      }

      const song = songList.content.songs.find(s => s.song_id === id)
      if (!song) return null

      const info = song.difficulties.findIndex(d => d.rating === rating) + 1

      const levelMap: { [index: number]: string } = {
        1: 'Past',
        2: 'Presend',
        3: 'Future',
        4: 'Beyond'
      }

      return `${levelMap[info]} [${song.difficulties[info - 1].rating / 10}]`
    }
  },
  assets: {
    char: (id: number) => getAssetWithBase64(`/assets/char?partner=${id}`, 'image/png'),
    icon: (id: number) => getAssetWithBase64(`/assets/icon?partner=${id}`, 'image/png'),
    preview: (id: number) => getAssetWithBase64(`/assets/preview?songid=${id}`, 'image/png'),
    song: (song_name: string, difficulty: number | string) => getAssetWithBase64(`/assets/song?songname=${encodeURIComponent(song_name)}&difficulty=${encodeURIComponent(difficulty)}`, 'image/jpeg')
  }
}

export default api
