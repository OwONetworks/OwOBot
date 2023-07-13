import client from '../elasticsearch/client'
import bot from '../../lib/bot'
import { render } from '../render/api'
import dataset from './hitokoto.json'

const randomPickHitokoto = () => {
  const len = dataset.length
  const key = Math.floor(Math.random() * len)
  const result = dataset[key]
  return `${result.hitokoto} ——${result.from}`
}

const getScore = async (uid: number) => {
  const result = await client.search({
    index: 'message_oicq',
    size: 0,
    query: {
      match: {
        "sender.id": uid
      }
    },
    aggs: {
      "message_count": {
        value_count: {
          field: "sender.id"
        }
      }
    }
  })

  // @ts-ignore
  const value = result?.aggregations?.message_count?.value
  const xp = value%500
  const lv = Math.floor(value/500)
  const progress = Math.floor(xp/500*100)

  return {
    text: `Lv.${lv} (${xp}/500)`,
    progress
  }
}

bot.bots.oicq.command_group(/^签到$/, 'sign.do', async (match, event) => {
  const score = await getScore(event.sender.id as number)
  const hitokoto = randomPickHitokoto()

  const img = await render('sign', {
    qq: event.sender.id,
    name: event.sender.cardname || event.sender.nickname || event.sender.id,
    hitokoto: hitokoto,
    progress: score.progress,
    tprogress: score.text
  }, {
    width: 800,
    height: 280
  })

  event.reply(bot.segment().image(img), true)
})
