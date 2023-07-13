import RSSParser from 'rss-parser'
import db from '../db'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import Logger from '../../lib/logger'
import { PlatformTypes } from '../../lib/bots/base'

interface Feed {
  id: number,
  title: string,
  group_id: number,
  url: string,
  limits: number,
  platform: PlatformTypes
}

const logger = Logger('RSS')
const md5sum = (str: string) => crypto.createHash('md5').update(str).digest('hex')

const parser = new RSSParser()

export const RSSEvents = new EventEmitter()

export const addFeed = async (feedUrl: string, title: string, group_id: number, platform: PlatformTypes) => {
  try {
    await db('plugin_rss_feed').insert({
      group_id: group_id,
      title: title,
      url: feedUrl,
      platform: platform
    })
    return true
  } catch (error) {
    return false
  }
}

export const removeFeed = async (id: number, group_id: number, platform: PlatformTypes) => {
  try {
    await db('plugin_rss_feed').where({
      group_id: group_id,
      id: id,
      platform: platform
    }).del()
    return true
  } catch (error) {
    return false
  }
}

export const getFeeds = async (group_id: number, platform: PlatformTypes): Promise<Feed[]> => {
  try {
    const feeds: Feed[] = await db('plugin_rss_feed').where({
      group_id: group_id,
      platform: platform
    })

    return feeds
  } catch (error) {
    return []
  }
}

export const update = async () => {
  logger.info('Updating RSS feeds...')

  const feeds: Feed[] = await db('plugin_rss_feed').select('*').groupBy('url')

  for (const feed of feeds) {
    try {
      const url = feed.url;

      const resp = await parser.parseURL(url)

      const item = resp.items[0]

      const title = item.title || '无标题';
      const link = item.link || '无链接';

      const gid = md5sum(link)

      const exists = await db('plugin_rss_history').where({
        fid: feed.id,
        gid: gid,
        platform: feed.platform
      }).first()

      if (exists) continue

      await db('plugin_rss_history').insert({
        fid: feed.id,
        gid: gid,
        platform: feed.platform
      })

      const groups = await db('plugin_rss_feed').where({
        id: feed.id
      }).select('group_id', 'platform').groupBy('group_id')

      RSSEvents.emit('new', {
        title: feed.title,
        item_title: title,
        link: link,
        groups: groups.map(g => ({
          group_id: g.group_id,
          platform: g.platform
        }))
      })
    } catch (error) {
      logger.warn(`订阅 ${feed.url} 更新失败:`, error)
    }
  }

  logger.info('RSS feeds updated.')
}

setInterval(async () => {
  await update()
}, 3600e3)
