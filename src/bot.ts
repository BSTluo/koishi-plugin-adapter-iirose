import { Bot, Context, Fragment, Schema, SendOptions, Universal, h } from '@satorijs/satori'
import { WsClient } from './ws'
import pako from 'pako'
import { IIROSE_BotMessageEncoder } from './sendMessage'

export class IIROSE_Bot extends Bot<IIROSE_Bot.Config> {
  constructor(ctx: Context, config: IIROSE_Bot.Config) {
    super(ctx, config)
    ctx.plugin(WsClient, this)
  }

  sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]> {
    return new IIROSE_BotMessageEncoder(this, `${channelId}:` + guildId, guildId, options).send(content)
  }

  async getSelf(): Promise<Universal.User> {
    return {
      userId: this.ctx.config.uid,
      username: this.ctx.config.usename
    }
  }

  send(data: string) {
    const buffer = Buffer.from(data)
    const unintArray = Uint8Array.from(buffer)

    if (unintArray.length > 256) {
      const deflatedData = pako.gzip(data)
      const deflatedArray = new Uint8Array(deflatedData.length + 1)
      deflatedArray[0] = 1
      deflatedArray.set(deflatedData, 1)
      this.socket.send(deflatedArray)
    } else {
      this.socket.send(unintArray)
    }
  }
}

export namespace IIROSE_Bot {
  export interface BaseConfig extends Bot.Config { }

  export interface Config extends BaseConfig {
    usename: string
    password: string
    roomId: string
  }

  export const Config: Schema<Config> = Schema.object({
    usename: Schema.string().required().description('BOT昵称'),
    uid: Schema.string().required().description('BOT的唯一标识'),
    password: Schema.string().required().description('BOT的密码的md5'),
    roomId: Schema.string().required().description('BOT的初始群号'),
  }).description('BOT配置')
}

IIROSE_Bot.prototype.platform = 'IIROSE_Bot'
