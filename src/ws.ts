import { Adapter, Context, Logger, Schema } from '@satorijs/satori'
import { IIROSE_Bot } from './bot'
import pako from 'pako'
import { decoder } from './decoder'
import { decoderMessage } from './decoderMessage'
import { EventsServer } from './utils'
import { Status } from '@satorijs/protocol'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const logger = new Logger('IIROSE-BOT')

export class WsClient extends Adapter.WsClient<IIROSE_Bot> {
  WSurl: string = 'wss://m2.iirose.com:8778'

  constructor(ctx: Context, bot: IIROSE_Bot) {
    super(ctx, bot)

    // ctx.on('dispose', () => {
    //   logger.info('offline to server: %c', this.WSurl)
    //   this.over(bot)
    // })
  }

  live: NodeJS.Timeout
  loginObj: {
    r: string
    n: string
    p: string
    st: string
    mo: string
    mb: string
    mu: string
  }

  async prepare() {
    this.socket = this.bot.ctx.http.ws(this.WSurl)
    // socket = this.socket
    this.bot.socket = this.socket
    // this.socket.binaryType = 'arraybuffer'

    this.loginObj = {
      r: this.bot.ctx.config.roomId,
      n: this.bot.ctx.config.usename,
      p: this.bot.ctx.config.password,
      st: 'n',
      mo: '',
      mb: '',
      mu: '01',
    }

    this.socket.addEventListener('open', () => {
      logger.info('connect to server: %c', this.WSurl)

      const loginPack = '*' + JSON.stringify(this.loginObj)
      IIROSE_WSsend(this.bot, loginPack)
      EventsServer(this.bot)
      this.bot.online()
      this.live = setInterval(() => {
        if (this.bot.status == Status.ONLINE) { IIROSE_WSsend(this.bot, '') }

      }, 30 * 1000) // 半分钟发一次包保活
    })

    return this.socket
  }

  accept() {
    // 花园登陆报文
    this.socket.addEventListener('message', (event) => {
      // @ts-ignore
      const array = new Uint8Array(event.data)

      let message
      if (array[0] === 1) {
        message = pako.inflate(array.slice(1), {
          to: 'string',
        })
      } else {
        message = Buffer.from(array).toString('utf8')
      }
      const funcObj = decoder(this.bot, message)
      // console.log(funcObj)
      // 将会话上报
      // eslint-disable-next-line no-prototype-builtins
      if (funcObj.hasOwnProperty('manyMessage')) {
        funcObj.manyMessage.slice().reverse().forEach(element => {
          const test = {}
          const type = element.type
          test[type] = element

          decoderMessage(test, this.bot)
        })
      } else {
        decoderMessage(funcObj, this.bot)
      }
    })
  }

  async over(bot: IIROSE_Bot): Promise<void> {
    this.socket?.close()
    this.socket = null
    this.bot.socket?.close()
    this.bot.socket = null
  }
}

export namespace WsClient {
  export interface Config extends Adapter.WsClientConfig { }

  export const Config: Schema<Config> = Schema.intersect([
    Adapter.WsClient.Config,
  ])
}

export function IIROSE_WSsend(bot: IIROSE_Bot, data: string) {
  if (bot.socket.readyState !== 1) { return }
  const buffer = Buffer.from(data)
  const unintArray = Uint8Array.from(buffer)

  if (unintArray.length > 256) {
    const deflatedData = pako.gzip(data)
    const deflatedArray = new Uint8Array(deflatedData.length + 1)
    deflatedArray[0] = 1
    deflatedArray.set(deflatedData, 1)
    bot.socket.send(deflatedArray)
  } else {
    bot.socket.send(unintArray)
  }
}

