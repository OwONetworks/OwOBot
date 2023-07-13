import Bot from '../../lib/bot'
import { PlatformTypes } from '../../lib/bots/base'

// RSS 添加订阅
export const rss_add = (platform: PlatformTypes, args: any, event: any) => {
  Bot.bots[platform].invoke('rss.add', 'group', ['', args.url] as unknown as RegExpExecArray, event)
}

// RSS 订阅列表
export const rss_list = (platform: PlatformTypes, args: any, event: any) => {
  Bot.bots[platform].invoke('rss.list', 'group', [] as unknown as RegExpExecArray, event)
}

// RSS 删除订阅
export const rss_del = (platform: PlatformTypes, args: any, event: any) => {
  Bot.bots[platform].invoke('rss.remove', 'group', ['', args.index] as unknown as RegExpExecArray, event)
}

// 搜索动漫
export const anime_trace = (platform: PlatformTypes, args: any, event: any) => {
  Bot.bots[platform].invoke('trace.trace', 'group', [''] as unknown as RegExpExecArray, event)
}

// wordle
export const wordle = (platform: PlatformTypes, args: any, event: any) => {
  if (args.word_list) {
    Bot.bots[platform].invoke('wordle.wordslist', 'group', ['', args.word_list.toUpperCase()] as unknown as RegExpExecArray, event)
  } else {
    Bot.bots[platform].invoke('wordle.wordslist', 'group', ['', "SUM"] as unknown as RegExpExecArray, event)
  }
}

// wordle_rank
export const wordle_rank = (platform: PlatformTypes, args: any, event: any) => {
  Bot.bots[platform].invoke('wordle.rank', 'group', [''] as unknown as RegExpExecArray, event)
}

// Pixiv搜图
export const pixiv_search = (platform: PlatformTypes, args: any, event: any) => {
  Bot.bots[platform].invoke('pixiv.search', 'group', ['', args.keyword] as unknown as RegExpExecArray, event)
}

export const __map__: {[index: string]: string} = {
  rss_add: '添加RSS订阅',
  rss_list: 'RSS订阅列表',
  rss_del: '删除RSS订阅',
  anime_trace: '搜索动漫',
  wordle: 'wordle',
  wordle_rank: 'wordle排行榜',
  pixiv_search: 'Pixiv搜图'
}