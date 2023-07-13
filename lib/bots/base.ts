import events from 'events'
import GetLogger from '../logger'
import { Logger } from 'log4js'
import { isAsyncFunction } from "../utils";

interface IEmissions {
  'system.error': (event: any) => void
  'message.group': (event: GroupMessage) => void
  'message.private': (event: PrivateMessage) => void
}

export class Bot extends events.EventEmitter {
  private _untypedOn = this.on
  private _untypedEmit = this.emit
  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => this._untypedOn(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => this._untypedEmit(event, ...args)

  public __bot__: any
  public __api__: any

  public config: any

  public commandMap: {
    [id: string]: {
      type: 'private' | 'group',
      callback: PrivateCommandCallbackFunction | GroupCommandCallbackFunction,
      regex: RegExp,
    }[]
  }

  public logger: Logger

  constructor(config: any) {
    super()
    this.config = config
    this.commandMap = {}

    const className = this.constructor.name
    this.logger = GetLogger(`[bot:${className}]`)

    this.startCommandEvent()
  }

  private startCommandEvent() {
    this.logger.info(`正在配置指令触发器`)
    // 群聊指令
    this.on('message.group', async (msg: GroupMessage) => {
      if (msg.message.length === 0) return
      const text = this.getTextFromMsg(msg.message)

      const groupCommands = Object.values(this.commandMap).map(item => {
        const command = item.find(command => command.type === 'group')
        if (command) {
          return {
            ...command,
            id: Object.keys(this.commandMap).find(key => this.commandMap[key].includes(command))
          }
        }
      }).filter(item => item).flat()

      for (const command of groupCommands) {
        if (!command) return
        const regexp = command.regex
        const callback = command.callback as GroupCommandCallbackFunction

        regexp.lastIndex = 0
        if (regexp.test(text)) {
          this.logger.info(`用户 ${msg.platform}:${msg.sender.id} 在群聊中触发了 ${command.id} 指令 -> ${text}`)
          const result = regexp.exec(text)

          // 处理异步函数的错误
          if (isAsyncFunction(callback)) {
            try {
              await callback(result as RegExpExecArray, msg)
            } catch (error) {
              msg.reply(this.segment().text(`[Core] 命令执行出现错误`))
            }

            return
          }

          try {
            callback(result as RegExpExecArray, msg)
          } catch (error) {
            msg.reply(this.segment().text(`[Core] 命令执行出现错误`))
          }
        }
      }
    })

    // 私聊消息
    this.on('message.private', async (msg: PrivateMessage) => {
      if (msg.message.length === 0) return
      const text = this.getTextFromMsg(msg.message)

      const PrivateCommands = Object.values(this.commandMap).map(item => {
        const command = item.find(command => command.type === 'private')
        if (command) {
          return {
            ...command,
            id: Object.keys(this.commandMap).find(key => this.commandMap[key].includes(command))
          }
        }
      }).filter(item => item).flat()

      for (const command of PrivateCommands) {
        if (!command) return
        const regexp = command.regex
        const callback = command.callback as PrivateCommandCallbackFunction

        regexp.lastIndex = 0
        if (regexp.test(text)) {
          this.logger.info(`用户 ${msg.platform}:${msg.sender.id} 在群聊中触发了 ${command.id} 指令 -> ${text}`)
          const result = regexp.exec(text)

          // 处理异步函数的错误
          if (isAsyncFunction(callback)) {
            try {
              await callback(result as RegExpExecArray, msg)
            } catch (error) {
              msg.reply(this.segment().text(`[Core] 命令执行出现错误`))
            }

            return
          }

          try {
            callback(result as RegExpExecArray, msg)
          } catch (error) {
            msg.reply(this.segment().text(`[Core] 命令执行出现错误`))
          }
        }
      }
    })

    this.logger.info(`指令触发器配置完成`)
  }

  public command_all(regexp: RegExp, id: string, callback: CommandCallbackFunction) {
    this.command_private(regexp, id, callback as PrivateCommandCallbackFunction)
    this.command_group(regexp, id, callback as GroupCommandCallbackFunction)
  }

  public invoke(command_id: string, type: string, match: RegExpExecArray, event: any) {
    const commands = this.commandMap[command_id]
    if (!commands) throw new Error(`Command ${command_id} not found`)

    const command = commands.find(c => c.type === type)
    if (!command) throw new Error(`Command ${command_id} not found`)

    command.callback(match, event)
  }

  // 群聊指令
  public command_group(regexp: RegExp, id: string, callback: GroupCommandCallbackFunction): void {
    this.logger.info(`Group - 正在注册指令 ${id}, 触发正则 ${regexp}`)
    if (!this.commandMap[id]) this.commandMap[id] = []

    this.commandMap[id].push({
      type: 'group',
      callback: callback,
      regex: regexp
    })
  }

  // 私聊指令
  public command_private(regexp: RegExp, id: string, callback: PrivateCommandCallbackFunction): void {
    this.logger.info(`Private - 正在注册指令 ${id}, 触发正则 ${regexp}`)

    if (!this.commandMap[id]) this.commandMap[id] = []

    this.commandMap[id].push({
      type: 'private',
      callback: callback,
      regex: regexp,
    })
  }

  public segment() {
    return new MessageBuilder()
  }

  public getTextFromMsg(msg: MessageItem[]) {
    return msg.filter((item) => item.type === 'text').map((item) => item.data.text).join('')
  }
}

export class MessageBuilder {
  public message_chain: {
    type: string,
    data: any
  }[]

  constructor() {
    this.message_chain = []

    return this
  }

  public text(text: string) {
    this.message_chain.push({
      type: 'text',
      data: {
        text
      }
    })

    return this
  }

  public at(target: string | number) {
    this.message_chain.push({
      type: 'at',
      data: {
        target: target
      }
    })

    return this
  }

  public image(data: string | Buffer) {
    this.message_chain.push({
      type: 'image',
      data: {
        image: data
      }
    })

    return this
  }

  public video(data: string | Buffer) {
    this.message_chain.push({
      type: 'video',
      data: {
        video: data
      }
    })

    return this
  }

  public audio(data: string | Buffer) {
    this.message_chain.push({
      type: 'audio',
      data: {
        audio: data
      }
    })

    return this
  }

  public file(data: string | Buffer) {
    this.message_chain.push({
      type: 'file',
      data: {
        file: data
      }
    })

    return this
  }

  public raw(data: any) {
    this.message_chain.push({
      type: 'raw',
      data
    })

    return this
  }

  public toMessage() { }
}

const platforms = {
  'oicq': '',
  'telegram': ''
}

export type ExtendedMessageBuilder<T extends MessageBuilder> = T;
export type PlatformTypes = keyof typeof platforms
export type GroupCommandCallbackFunction = (match: RegExpExecArray, event: GroupMessage) => void
export type PrivateCommandCallbackFunction = (match: RegExpExecArray, event: PrivateMessage) => void
export type CommandCallbackFunction = (match: RegExpExecArray, event: GroupMessage | PrivateMessage) => void

export interface MessageItem {
  type: string
  data: any
}

export interface User {
  id: number | string
  platform: PlatformTypes
  // 昵称
  nickname: string
  // 群名片
  cardname: string
  // role
  role?: 'admin' | 'owner' | 'member'
}

export interface Group {
  id: number | string
  platform: PlatformTypes
  name: string
}

export interface GroupMessage {
  message_id: number | string
  platform: PlatformTypes
  type: 'group'
  sub_type: 'normal' | 'anonymous' | 'notice'
  message: MessageItem[]
  sender: User
  group: Group,
  reply: (message: MessageBuilder, reply?: boolean) => void
  replies: GroupMessage[]
}

export interface PrivateMessage {
  message_id: number | string
  platform: PlatformTypes
  type: 'private'
  sub_type?: string
  message: MessageItem[]
  sender: User
  reply: (message: MessageBuilder, reply?: boolean) => void
  replies: PrivateMessage[]
}