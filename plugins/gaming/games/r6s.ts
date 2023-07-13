import pool from '../pool'
import axios from 'axios'
import { render } from '../../render/api'

const rankParse = (rank: string) => {
  if (rank === 'No Rank') return '无段位'

  const map: { [index:string]: string } = {'COPPER': '紫铜', 'BRONZE': '青铜', 'SILVER': '白银', 'GOLD': '黄金', 'PLATINUM': '白金', 'DIAMOND': '钻石', 'CHAMPIONS': '冠军'}

  const [tier, num] = rank.split(' ')
  return `${map[tier]} ${num}`
}

const getBase64Image = async (url: string) => {
  const resp = await axios.get(url, {
    responseType: 'arraybuffer'
  })
  const buffer = Buffer.from(resp.data, 'binary')
  return `data:${resp.headers['content-type']};base64,${buffer.toString('base64')}`
}

const r6s = async (username: string) => {
  const url = `https://r6.tracker.network/api/v0/overwolf/player?name=${username}`
  const resp = await pool.axios.get(url)
  return resp.data
}

const getCurrentImage = async (username: string) => {
  const data = await r6s(username)
  const current = data.currentSeasonBestRegion
  const lifetime = data.lifetimeStats
  
  const name = data.name
  const avatar = await getBase64Image(data.avatar)
  const level = data.level
  const rank = rankParse(current.rankName)
  const rankImage = await getBase64Image(current.img)

  const kd = lifetime.kd  // K/D
  const kills = lifetime.kills  // 总击杀
  const deaths = lifetime.deaths  // 总死亡
  const matches = lifetime.matches  // 总场次
  const wins = lifetime.wins  // 总胜场
  const winPct = lifetime.winPct  // 胜率
  const headshots = lifetime.headshots  // 爆头数
  const headshotPct = lifetime.headshotPct  // 爆头率
  const maxMMR = lifetime.bestMmr.mmr
  const maxRank = rankParse(lifetime.bestMmr.name)
  const maxRankImage = await getBase64Image(lifetime.bestMmr.img)

  const topAttacker = data.operators.sort((a: any, b: any) => b.timePlayed - a.timePlayed).find((item: any) => item.isAttack === true)
  const topDefender = data.operators.sort((a: any, b: any) => b.timePlayed - a.timePlayed).find((item: any) => item.isAttack === false)

  const topAttackerName = `${topAttacker.name} (${topAttacker.timePlayedDisplay})`
  const topAttackerImage = await getBase64Image(topAttacker.img)

  const topDefenderName = `${topDefender.name} (${topDefender.timePlayedDisplay})`
  const topDefenderImage = await getBase64Image(topDefender.img)

  return await render('r6s', {
    name,
    avatar,
    level,
    rank,
    rankImage,
    kd: kd.toFixed(2),
    kills,
    deaths,
    matches,
    wins,
    winPct,
    headshots,
    headshotPct,
    maxMMR,
    maxRank,
    maxRankImage,
    topAttackerName,
    topAttackerImage,
    topDefenderName,
    topDefenderImage
  }, {
    width: 600,
    height: 100,
  })
}

export default {
  getCurrentImage
}