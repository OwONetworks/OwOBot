import { Bot, MessageBuilder, PrivateMessage, GroupMessage } from "./base";
import * as oicq from 'icqq'

export class OICQBot extends Bot {
  public __bot__: oicq.Client
  public __api__: oicq.Client

  constructor(config: any) {
    super(config)

    this.__bot__ = oicq.createClient({
      ...config.oicq.config,
      auto_server: false,
    })

    this.__api__ = this.__bot__
    this.__bot__.logger = this.logger

    this.__bot__.on('message.group', async (event) => {
      const msg: GroupMessage = {
        type: 'group',
        sub_type: event.sub_type,
        platform: 'oicq',
        sender: {
          platform: 'oicq',
          id: event.sender.user_id,
          nickname: event.sender.nickname,
          cardname: event.sender.card,
          role: event.sender.role,
        },
        group: {
          platform: 'oicq',
          id: event.group_id,
          name: event.group_name
        },
        message: this.messageProcessor(event.message),
        message_id: `qq:${event.message_id}`,
        // @ts-ignore
        reply: async (message: OICQMessageBuilder, reply: boolean = true) => {
          const msg = new OICQMessageBuilder()
          msg.message_chain = message.message_chain
          try { return await event.reply(msg.toMessage(), reply) } catch (error) { }
        },
        replies: []
      }

      if (event.source) {
        const user = await this.__bot__.getGroupMemberInfo(event.group_id, event.source.user_id)

        msg.replies.push({
          type: 'group',
          sub_type: event.sub_type,
          platform: 'oicq',
          sender: {
            platform: 'oicq',
            id: event.source.user_id,
            nickname: user.nickname,
            cardname: user.card,
            role: user.role,
          },
          group: {
            platform: 'oicq',
            id: event.group_id,
            name: event.group_name
          },
          message: [{
            type: 'text',
            data: {
              text: event.source.message
            }
          }],
          // @ts-ignore
          reply: async (message: OICQMessageBuilder, reply: boolean = true) => {
            const msg = new OICQMessageBuilder()
            msg.message_chain = message.message_chain
            try { return await event.reply(msg.toMessage(), reply) } catch (error) { }
          },
          message_id: `qq:${event.message_id}`,
          replies: []
        })
      }

      this.emit('message.group', msg)
    })

    this.__bot__.on('message.private', async (event) => {
      const msg: PrivateMessage = {
        type: 'private',
        sub_type: event.sub_type,
        platform: 'oicq',
        sender: {
          platform: 'oicq',
          id: event.sender.user_id,
          nickname: event.sender.nickname,
          cardname: event.sender.nickname,
        },
        message: this.messageProcessor(event.message),
        message_id: `qq:${event.message_id}`,
        // @ts-ignore
        reply: async (message: OICQMessageBuilder, reply: boolean = true) => {
          const msg = new OICQMessageBuilder()
          msg.message_chain = message.message_chain
          try { return await event.reply(msg.toMessage(), reply) } catch (error) { }
        },
        replies: []
      }

      if (event.source) {
        msg.replies.push({
          type: 'private',
          sub_type: event.sub_type,
          platform: 'oicq',
          sender: {
            platform: 'oicq',
            id: event.source.user_id,
            nickname: event.sender.nickname,
            cardname: event.sender.nickname,
          },
          message: [{
            type: 'text',
            data: {
              text: event.source.message
            }
          }],
          // @ts-ignore
          reply: async (message: OICQMessageBuilder, reply: boolean = true) => {
            const msg = new OICQMessageBuilder()
            msg.message_chain = message.message_chain
            try { return await event.reply(msg.toMessage(), reply) } catch (error) { }
          },
          message_id: `qq:${event.message_id}`,
          replies: []
        })
      }

      this.emit('message.private', msg)
    })

    this.__bot__.on('system.login.error', (event) => {
      this.emit('system.error', event)
    })

    this.__bot__.on("system.login.slider", (e) => {
      console.log("[OICQ] 输入ticket：")
      process.stdin.once("data", ticket => this.__bot__.submitSlider(String(ticket).trim()))
    })

    this.__bot__.on('system.login.device', (e) => {
      this.__bot__.sendSmsCode()
      console.log("[OICQ] 输入验证码：")
      process.stdin.once("data", code => this.__bot__.submitSmsCode(String(code).trim()))
    })

    this.__bot__.on('system.login.qrcode', (e) => {
      console.log("[OICQ] 按回车键继续登录")
      process.stdin.once("data", () => this.__bot__.login())
    })

    this.__bot__.on('system.online', () => {
      this.logger.info('Bot 已登录')
    })

    this.__bot__.on('system.login.error', event => {
      this.logger.error('Bot 登录失败:', event)
    })

    this.__bot__.login(this.config.oicq.account.uin, this.config.oicq.account.password)
  }

  public sendPublicMessage(target_id: number, message: OICQMessageBuilder) {
    return this.__bot__.sendGroupMsg(target_id, message.toMessage())
  }

  public sendPrivateMessage(target_id: number, message: OICQMessageBuilder) {
    return this.__bot__.sendPrivateMsg(target_id, message.toMessage())
  }

  private messageProcessor(msg: oicq.MessageElem[]) {
    return msg.map((item) => {
      if (item.type === 'at') {
        return {
          type: 'at',
          data: {
            target: item.qq
          }
        }
      } else {
        return {
          type: item.type,
          data: item
        }
      }
    })
  }

  public segment(): MessageBuilder {
    return new OICQMessageBuilder()
  }
}

export class OICQMessageBuilder extends MessageBuilder {
  constructor() {
    super()
  }

  public toMessage() {
    const msg = []

    for (const item of this.message_chain) {
      const type = item.type
      const data = item.data

      switch (type) {
        case 'text':
          msg.push(data.text)
          break
        case 'image':
          msg.push(oicq.segment.image(data.image))
          break
        case 'at':
          msg.push(oicq.segment.at(data.target))
          break
        case 'video':
          msg.push(oicq.segment.video(data.video))
          break
        case 'audio':
          msg.push(oicq.segment.record(data.audio))
          break
        case 'file':
          msg.push(`[MessageBuilder] failed to build file because of no support`)
          break
        case 'raw':
          msg.push(data)
      }
    }

    return msg
  }
}