import { Adapter, Context, Logger, Schema } from '@satorijs/satori'
import { IIROSE_Bot } from './bot'
import pako from 'pako'
import { decoder } from './decoder'
import { decoderMessage } from './decoderMessage'
import { EventsServer } from './utils'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const logger = new Logger('IIROSE-BOT')

export class WsClient extends Adapter.Client<IIROSE_Bot> {
  WSurl: string = 'wss://m2.iirose.com:8778'
  
  constructor(ctx: Context, bot: IIROSE_Bot) {
    super(ctx, bot)

    ctx.on('ready', () => {
      // 在插件启动时监听端口
      this.prepare()
    })

    ctx.on('dispose', () => {
      logger.info('offline to server: %c', this.WSurl)
      this.stop(bot)
    })
  }
  

  async prepare() {
    this.bot.socket = this.bot.ctx.http.ws(this.WSurl)
    this.bot.socket.binaryType = 'arraybuffer'
    this.accept()
    return this.bot.socket
  }

  accept() {
    // 花园登陆报文
    const obj = {
      r: this.bot.ctx.config.roomId,
      n: this.bot.ctx.config.usename,
      p: this.bot.ctx.config.password,
      st: 'n',
      mo: '',
      mb: '',
      mu: '01',
    }
    let live

    this.bot.socket.addEventListener('open', () => {
      logger.info('connect to server: %c', this.WSurl)
      
      const loginPack = '*' + JSON.stringify(obj)
      this.send(this.bot, loginPack)
      this.bot.online()
      EventsServer(this.bot)
      live = setInterval(() => {
        this.bot.socket.send('')
      }, 60 * 1000) // 两分钟发一次包保活
    })

    this.bot.socket.onmessage = (event) => {
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
      if (funcObj.hasOwnProperty('manyMessage')) {
        funcObj.manyMessage.slice().reverse().forEach(element => {
          let test = {}
          let type = element.type
          test[type] = element

          decoderMessage(test, this.bot)
        })
      } else {
        decoderMessage(funcObj, this.bot)
      }
    }

    let time = 0;
    this.bot.socket.on("error", (err) => {
      time++
      if (time > 5) { return this.stop(this.bot) }

      this.bot.socket = null
      this.bot.status = 'reconnect'
      clearInterval(live)
      logger.warn(`${this.bot.config.usename}, will retry in 5000ms...`)

      this.bot.socket = this.bot.ctx.http.ws(this.WSurl)
      const loginPack = '*' + JSON.stringify(obj)
      this.send(this.bot, loginPack)

      live = setInterval(() => {
        this.bot.socket.send('')
      }, 60 * 1000) // 两分钟发一次包保活
      
    })
  }

  stop(bot: IIROSE_Bot): Promise<void> {
    this.bot.socket?.close()
    this.bot.socket = null

    bot.socket?.close()
    bot.socket = null
    return
  }

  // 特殊的发送函数
  send(bot: IIROSE_Bot, data: string) {
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
}

export namespace WsClient {
  export interface Config extends Adapter.WsClient.Config { }

  export const Config: Schema<Config> = Schema.intersect([
    Adapter.WsClient.Config,
  ])
}
