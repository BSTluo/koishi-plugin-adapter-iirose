import { Adapter, Schema, Context, Logger } from '@satorijs/satori'
import { IIROSE_Bot } from './bot'
import pako from 'pako'
import { decoder } from './decoder'
import { decoderMessage } from './decoderMessage'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const logger = new Logger('IIROSE-BOT')

export class WsClient extends Adapter.Client<IIROSE_Bot> {
  WSurl:string = 'wss://m2.iirose.com:8778'

  constructor(ctx:Context, bot:IIROSE_Bot) {
    super(ctx, bot)
    ctx.on('ready', () => {
      // 在插件启动时监听端口
      this.start(bot)
    })

    ctx.on('dispose', () => {
      logger.info('offline to server: %c', this.WSurl)
      this.stop(bot)
    })
  }

  async start(bot: IIROSE_Bot): Promise<void> {
    if (this.bot.socket) {return}
    
    const retryTimes = 6 // 初次连接时的最大重试次数。
    const retryInterval = 5000 // 初次连接时的重试时间间隔。
    const retryLazy = 60000 // 连接关闭后的重试时间间隔。
    

    let _retryCount = 0
    
    const reconnect = async (initial = false) => {
      logger.debug('websocket client opening')
      const socket = await this.prepare()
      // remove query args to protect privacy
      const url = socket.url.replace(/\?.+/, '')

      socket.addEventListener('error', ({ error }) => {
        logger.debug(error)
      })

      socket.addEventListener('close', ({ code, reason }) => {
        bot.socket = null
        logger.debug(`websocket closed with ${code}`)
        if (bot.status === 'disconnect') {
          return bot.status = 'offline'
        }

        const message = reason.toString() || `failed to connect to ${url}, code: ${code}`
        let timeout = retryInterval
        if (_retryCount >= retryTimes) {
          if (initial) {
            bot.error = new Error(message)
            return bot.status = 'offline'
          } else {
            timeout = retryLazy
          }
        }

        _retryCount++
        bot.status = 'reconnect'
        logger.warn(`${message}, will retry in ${retryInterval}...`)
        setTimeout(() => {
          if (bot.status === 'reconnect') reconnect()
        }, timeout)
      })

      socket.addEventListener('open', () => {
        _retryCount = 0
        bot.socket = socket
        logger.info('connect to server: %c', url)
        this.accept()
      })
    }

    reconnect(true)
    return
  }

  stop(bot: IIROSE_Bot): Promise<void> {
    this.bot.socket?.close()
    this.bot.socket = null
    return
  }

  async prepare() {
    this.bot.socket = this.bot.ctx.http.ws(this.WSurl)
    this.bot.socket.binaryType = 'arraybuffer'
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
    const loginPack = '*' + JSON.stringify(obj)
    this.send(this.bot, loginPack)

    
    this.bot.socket.onmessage = (event) => {
      // @ts-ignore
      const array = new Uint8Array(event.data)

      let message
      if (array[0] === 1) {
        message = pako.inflate(array.slice(1), {
          to: 'string'
        })
      } else {
        message = Buffer.from(array).toString('utf8')
      }
      const funcObj = decoder(this.bot, message)
      
      // 将会话上报
      decoderMessage(funcObj, this.bot)
    }
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
