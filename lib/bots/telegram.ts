import * as telegraf from 'telegraf'
import { Bot as BaseBot, User, Group, GroupMessage, PrivateMessage, MessageItem, MessageBuilder, GroupCommandCallbackFunction } from './base'
import { httpsProxyAgent } from '../../plugins/proxy'

function deepCopy(obj: any, cache = new WeakMap()): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  
  let copy: any;
  
  if (Array.isArray(obj)) {
    copy = [];
    cache.set(obj, copy);
    for (let i = 0; i < obj.length; i++) {
      copy[i] = deepCopy(obj[i], cache);
    }
  } else {
    copy = {};
    cache.set(obj, copy);
    for (let key in obj) {
      if (obj.hasOwnProperty && obj.hasOwnProperty(key)) {
        copy[key] = deepCopy(obj[key], cache);
      }
    }
  }
  
  return copy;
}

export class TelegramBot extends BaseBot {
  public __bot__: telegraf.Telegraf
  public __api__: telegraf.Telegram

  constructor (config: any) {
    super(config)

    this.logger.info('Initializing Telegram bot...')

    this.__bot__ = new telegraf.Telegraf(config.telegram.account.token, {
      telegram: {
        agent: httpsProxyAgent
      }
    })

    this.__api__ = this.__bot__.telegram

    this.__bot__.on('message', async (ctx) => {
      // @ts-ignore
      this.logger.info(`[${ctx.chat.type}, ${ctx.chat.title}] ${ctx.from.username}: ${ctx.message.text}`)

      // 群聊消息
      if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        const group = await this.GetGroup(ctx.chat.id)
        const sender = await this.GetGroupUser(ctx.chat.id, ctx.from.id)

        const copiedCtx: AllWriteable<telegraf.Context> = deepCopy(ctx)
        // @ts-ignore
        const hasReply = !!ctx.message.reply_to_message

        // @ts-ignore
        if (hasReply) {
          // @ts-ignore
          copiedCtx.message = ctx.message.reply_to_message
          // @ts-ignore
          copiedCtx.message.text = ctx.message.text
          // @ts-ignore
          copiedCtx.message_id = ctx.message.reply_to_message.message_id
        }

        const msg: GroupMessage = {
          platform: 'telegram',
          type: 'group',
          sub_type: "normal",
          sender: sender,
          group: group,
          message: await this.messageProcessor(ctx),
          message_id: `telegram:${ctx.message.message_id}`,
          replies: hasReply ? [{
            platform: 'telegram',
            type: 'group',
            sub_type: "normal",
            // @ts-ignore
            sender: await this.GetGroupUser(ctx.chat.id, ctx.message.reply_to_message.from.id),
            group: group,
            message: await this.messageProcessor(copiedCtx),
            // @ts-ignore
            message_id: `telegram:${ctx.message.reply_to_message.message_id}`,
            replies: [],
            reply: async (message, reply) => {
              await this.sendMessage(message, ctx.chat.id, {
                // @ts-ignore
                reply_to_message_id: reply && ctx.message.reply_to_message.message_id,
                parse_mode: 'MarkdownV2'
              })
            }
          }] : [],
          reply: async (message, reply) => {
            await this.sendMessage(message, ctx.chat.id, {
              // @ts-ignore
              reply_to_message_id: reply && ctx.message.message_id,
              parse_mode: 'MarkdownV2'
            })
          },
        }

        this.emit('message.group', msg)
      } else if (ctx.chat.type === 'private') {
        // 私聊消息
        const sender = await this.GetGroupUser(ctx.chat.id, ctx.from.id)

        const copiedCtx: AllWriteable<telegraf.Context> = deepCopy(ctx)
        // @ts-ignore
        const hasReply = !!ctx.message.reply_to_message

        // @ts-ignore
        if (hasReply) {
          // @ts-ignore
          copiedCtx.message = ctx.message.reply_to_message
          // @ts-ignore
          copiedCtx.message.text = ctx.message.text
          // @ts-ignore
          copiedCtx.message_id = ctx.message.reply_to_message.message_id
        }

        const msg: PrivateMessage = {
          platform: 'telegram',
          type: 'private',
          sub_type: "normal",
          sender: sender,
          message: await this.messageProcessor(ctx),
          message_id: `telegram:${ctx.message.message_id}`,
          replies: hasReply ? [{
            platform: 'telegram',
            type: 'private',
            sub_type: "normal",
            // @ts-ignore
            sender: await this.GetGroupUser(ctx.chat.id, ctx.message.reply_to_message.from.id),
            message: await this.messageProcessor(copiedCtx),
            // @ts-ignore
            message_id: `telegram:${ctx.message.reply_to_message.message_id}`,
            replies: [],
            reply: async (message, reply) => {
              await this.sendMessage(message, ctx.chat.id, {
                // @ts-ignore
                reply_to_message_id: reply && ctx.message.reply_to_message.message_id,
                parse_mode: 'MarkdownV2'
              })
            }
          }] : [],
          reply: async (message, reply) => {
            await this.sendMessage(message, ctx.chat.id, {
              // @ts-ignore
              reply_to_message_id: reply && ctx.message.message_id,
              parse_mode: 'MarkdownV2'
            })
          }
        }

        this.emit('message.private', msg)
      }
    })

    this.run()
  }

  private async run() {
    while (true) {
      try {
        await this.__bot__.launch()
        break
      } catch (error) {
        this.logger.error(error)
      }
    }
  }

  public static textProcessor (text: string) {
    return text.replace(/([_\*\[\]\(\)~`\>\#\+\-=\|\{\}\.\!])/g, '\\$1')
  }

  private async sendMessage (message: MessageBuilder, chat_id: number, options: any) {
    const msg = new TelegramMessageBuilder()
    msg.message_chain = message.message_chain

    const data = msg.toMessage()

    const count = Object.values(data.flags).filter((v) => v).length
    if (count > 1) {
      // 图片
      if (data.image) {
        data.image.forEach(async (image) => {
          try {
            await this.__api__.sendPhoto(chat_id, image, options)
          } catch (error) { }
        })
      }

      // 视频
      if (data.video) {
        data.video.forEach(async (video) => {
          try {
            await this.__api__.sendVideo(chat_id, video, options)
          } catch (error) { }
        })
      }

      // 文件
      if (data.file) {
        data.file.forEach(async (file) => {
          try {
            await this.__api__.sendDocument(chat_id, file, options)
          } catch (error) { }
        })

        // 语音
        if (data.audio) {
          data.audio.forEach(async (audio) => {
            try {
              await this.__api__.sendAudio(chat_id, audio, options)
            } catch (error) { }
          })
        }

        // 文字
        if (data.text) {
          try {
            await this.__api__.sendMessage(chat_id, data.text, options)
          } catch (error) { }
        }
      }
    } else {
      const funcMap = {
        file: 'sendDocument',
        image: 'sendPhoto',
        video: 'sendVideo',
        audio: 'sendAudio',
      }

      const key_index = Object.values(data.flags).findIndex((v) => v)
      const key_name = Object.keys(data.flags)[key_index] as keyof typeof funcMap
      const func = funcMap[key_name] || 'sendMessage'

      try {
        // @ts-ignore
        await this.__api__[func](chat_id, data[key_name] ? data[key_name][0] : data.text, {
          caption: data.text,
          ...options
        })
      } catch (err) {
        this.logger.warn(`消息发送失败`, err)
      }
    }
  }

  public sendPublicMessage(target_id: string | number, message: MessageBuilder): void {
    this.sendMessage(message, target_id as number, {
      parse_mode: 'MarkdownV2'
    })
  }

  public sendPrivateMessage(target_id: string | number, message: MessageBuilder): void {
    this.sendMessage(message, target_id as number, {
      parse_mode: 'MarkdownV2'
    })
  }

  private async GetGroup (id: number): Promise<Group> {
    const chat = await this.__api__.getChat(id)
    if (chat.type === 'group' || chat.type === 'supergroup') {
      const group: Group = {
        platform: 'telegram',
        id: chat.id,
        name: chat.title,
      }

      return group
    } else {
      throw new Error('Not a group')
    }
  }

  private async GetGroupUser (group_id: number, id: number): Promise<User> {
    const user = await this.__api__.getChatMember(group_id, id)

    const roleMap = {
      'creator': 'owner',
      'administrator': 'admin',
      'member': 'member',
      'restricted': 'member',
      'left': 'member',
      'kicked': 'member',
    }

    const user_obj: User = {
      platform: 'telegram',
      id: user.user.id,
      nickname: user.user.username || user.user.first_name,
      cardname: `${user.user.first_name}${user.user.last_name ? ` ${user.user.last_name}` : ''}`,
      role: roleMap[user.status] as 'admin' | 'owner' | 'member',
    }

    return user_obj
  }

  private async messageProcessor (ctx: telegraf.Context): Promise<MessageItem[]> {
    const AtFilter = (str: string) => {
      return str.replace(new RegExp(`@${this.__bot__.botInfo?.username}`, 'g'), '')
    }

    return [
      // 文本消息
      ...[(
        // @ts-ignore
        ctx.message.text && {
          type: 'text',
          data: {
            // @ts-ignore
            text: AtFilter(ctx.message.text)
          }
        }
      )],
      // caption
      ...[(
        // @ts-ignore
        ctx.message.caption && {
          type: 'text',
          data: {
            // @ts-ignore
            text: AtFilter(ctx.message.caption)
          }
        }
      )],
      // 表情包
      ...[(
        // @ts-ignore
        ctx.message.sticker && {
          type: 'image',
          data: {
            // 图片链接
            // @ts-ignore
            url: await this.__api__.getFileLink(ctx.message.sticker.file_id)
          }
        }
      ), (
        // @ts-ignore
        ctx.message.sticker && {
          type: 'text',
          data: {
            // emoji
            // @ts-ignore
            text: ctx.message.sticker.emoji
          }
        }
      )],
      // 图片
      ...[(
        // @ts-ignore
        ctx.message.photo && {
          type: 'image',
          data: {
            // @ts-ignore
            url: await this.__api__.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)
          }
        }
      )],
      // 文件
      ...[(
        // @ts-ignore
        ctx.message.document && {
          type: 'file',
          data: {
            // @ts-ignore
            url: await this.__api__.getFileLink(ctx.message.document.file_id),
          }
        }
      )]
    ].flat().filter((v) => v)
  }
}

export class TelegramMessageBuilder extends MessageBuilder {
  public toMessage() {
    const hasImage = this.message_chain.filter((v) => v.type === 'image').length > 0
    const hasFile = this.message_chain.filter((v) => v.type === 'file').length > 0
    const hasAudio = this.message_chain.filter((v) => v.type === 'audio').length > 0
    const hasVideo = this.message_chain.filter((v) => v.type === 'video').length > 0

    const textMessage = this.message_chain.filter((v) => !['image', 'file', 'audio', 'video'].includes(v.type))
      .map(item => {
        if (item.type === 'at') {
          return `[@${item.data.target}](tg://user?id=${item.data.target})`
        } else if (item.type === 'text') {
          return TelegramBot.textProcessor(item.data.text)
        }
      }).join('')

    const messageObject = {
      image: hasImage ? this.message_chain.filter((v) => v.type === 'image').map((v) => telegraf.Input.fromBuffer(v.data.image)) : undefined,
      file: hasFile ? this.message_chain.filter((v) => v.type === 'file').map((v) => telegraf.Input.fromBuffer(v.data.file)) : undefined,
      audio: hasAudio ? this.message_chain.filter((v) => v.type === 'audio').map((v) => telegraf.Input.fromBuffer(v.data.audio)) : undefined,
      video: hasVideo ? this.message_chain.filter((v) => v.type === 'video').map((v) => telegraf.Input.fromBuffer(v.data.video)) : undefined,
      text: textMessage,
      flags: {
        image: hasImage,
        file: hasFile,
        audio: hasAudio,
        video: hasVideo,
      }
    }

    return messageObject
  }
}

type AllWriteable<T> = { -readonly [P in keyof T]: T[P] }