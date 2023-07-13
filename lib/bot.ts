import config from '../config'
import { Bot, CommandCallbackFunction, GroupCommandCallbackFunction, MessageBuilder, PrivateCommandCallbackFunction } from './bots/base'
import { OICQBot } from './bots/oicq'
import { TelegramBot } from './bots/telegram'

class MixedBot extends Bot {
  public bots: {
    oicq: OICQBot,
    telegram: TelegramBot
  }

  constructor (config: any) {
    super(config)

    this.bots = {
      oicq: new OICQBot(config),
      telegram: new TelegramBot(config)
    }

    // @ts-ignore
    this.on = (event: any, callback: (...args: any[]) => void) => {
      this.bots.oicq.on(event, callback)
      this.bots.telegram.on(event, callback)
    }

    // @ts-ignore
    this.once = (event: any, callback: (...args: any[]) => void) => {
      this.bots.oicq.once(event, callback)
      this.bots.telegram.once(event, callback)
    }
  }

  // @deprecated use bot instead
  public sendPrivateMessage(target_id: string | number, message: MessageBuilder): void {}

  // @deprecated use bot instead
  public sendPublicMessage(target_id: string | number, message: MessageBuilder): void {}

  public command_group(regexp: RegExp, id: string, callback: GroupCommandCallbackFunction): void {
    this.bots.oicq.command_group(regexp, id, callback)
    this.bots.telegram.command_group(regexp, id, callback)
  }

  public command_private(regexp: RegExp, id: string, callback: PrivateCommandCallbackFunction): void {
    this.bots.oicq.command_private(regexp, id, callback)
    this.bots.telegram.command_private(regexp, id, callback)
  }

  public command_all(regexp: RegExp, id: string, callback: CommandCallbackFunction): void {
    this.bots.oicq.command_all(regexp, id, callback)
    this.bots.telegram.command_all(regexp, id, callback)
  }
}

export default new MixedBot(config)
