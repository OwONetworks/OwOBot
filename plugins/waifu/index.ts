import bot from '../../lib/bot'
import db from '../db'
import { MemberInfo } from 'icqq'

/**
 * 此插件仅用于QQ环境，没有针对其他平台的兼容性处理
 */

const init = async () => {
  try {
    await db.schema.createTableIfNotExists('plugin_waifu', table => {
      table.string('group_id').notNullable().index()
      table.string('user_id_1').notNullable().index()
      table.string('user_id_2').notNullable().index()
      table.timestamp('created_at').notNullable().defaultTo(db.fn.now())
    })
  } catch (error) {}
}

const getRandomWaifu = async (group_id: number, user1: number) => {
  const isMarried = await db('plugin_waifu').where({ group_id, user_id_1: user1 }).orWhere({ group_id, user_id_2: user1 }).first()

  if (isMarried) return

  let isDupe = true
  const list = await bot.bots.oicq.__api__.getGroupMemberList(group_id)

  const getRandomKey = () => {
    const index = Math.floor(Math.random() * list.size)
    const keys = list.keys()
    for (let i = 0; i < index; i++) {
      keys.next()
    }

    return keys.next().value
  }

  let count = 0

  while (isDupe) {
    if (count > 20) return
    count++

    const key = getRandomKey()
    const user2 = list.get(key) as MemberInfo

    if (user2.user_id === user1) continue

    const isMarried = await db('plugin_waifu').where({ group_id, user_id_1: user2.user_id }).orWhere({ group_id, user_id_2: user2.user_id }).first()
    if (isMarried) continue

    return user2
  }
}

const queryLimit = async (group_id: number, user_id: number) => {
  const groupMemberCount = (await bot.bots.oicq.__api__.getGroupInfo(group_id)).member_count
  const waifu = await db('plugin_waifu').where({ group_id, user_id_1: user_id }).andWhere(db.raw(`created_at > now() - interval ${groupMemberCount} minute`)).first()

  if (waifu) return groupMemberCount

  return 0
}

bot.bots.oicq.command_group(/^抽老婆$/, 'waifu.gacha', async (match, event) => {
  const waifu = await getRandomWaifu(event.group.id as number, event.sender.id as number)

  if (!waifu) return event.reply(bot.segment().text("没有找到合适的老婆，这边建议您去开个impart呢~"))

  await db('plugin_waifu').insert({
    group_id: event.group.id,
    user_id_1: event.sender.id,
    user_id_2: waifu.user_id
  })

  event.reply(bot.segment().text(`喜报！您抽到了 ${waifu.card || waifu.nickname}(${waifu.user_id})`), true)
})

bot.bots.oicq.command_group(/^查老婆$/, 'waifu.query', async (match, event) => {
  const waifu = await db('plugin_waifu').where({ group_id: event.group.id, user_id_1: event.sender.id }).orWhere({ group_id: event.group.id, user_id_2: event.sender.id }).first()

  if (!waifu) return event.reply(bot.segment().text("您还没有老婆呢~"))

  const user_id = waifu.user_id_1 == event.sender.id ? waifu.user_id_2 : waifu.user_id_1
  const user = await bot.bots.oicq.__api__.getGroupMemberInfo(event.group.id as number, user_id)

  event.reply(bot.segment().text(`您的老婆是: ${user.card || user.nickname}(${user_id})`), true)
})

bot.bots.oicq.command_group(/^离婚$/, 'waifu.divorce', async (match, event) => {
  const limit = await queryLimit(event.group.id as number, event.sender.id as number)
  if (limit) {
    event.reply(bot.segment().text(`噫，结婚 ${limit}分钟 不到就想着离婚！\n\n[发现一个坏蛋，等级五]`), true)
    return
  }

  const waifu = await db('plugin_waifu')
    .where({ group_id: event.group.id, user_id_1: event.sender.id })
    .orWhere({ group_id: event.group.id, user_id_2: event.sender.id }).first()

  if (!waifu) return event.reply(bot.segment().text("您还没有老婆呢~"))

  await db('plugin_waifu')
    .where({ group_id: event.group.id, user_id_1: event.sender.id })
    .orWhere({ group_id: event.group.id, user_id_2: event.sender.id }).delete()

  event.reply(bot.segment().text("离婚成功！"), true)
})

init()
