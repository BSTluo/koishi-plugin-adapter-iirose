import { Dict, h, Logger, MessageEncoder, Quester } from '@satorijs/satori'
import { IIROSE_Bot } from './bot'
import pako from 'pako'
import PublicMessage from './encoder/messages/PublicMessage'
import PrivateMessage from './encoder/messages/PrivateMessage'

export class IIROSE_BotMessageEncoder extends MessageEncoder<IIROSE_Bot> {
  private outDataOringin: string = ''
  private outDataOringinObj: string = ''

  async flush(): Promise<void> {
    let buffer = Buffer.from(this.outDataOringinObj)
    let unintArray = Uint8Array.from(buffer)

    if (unintArray.length > 256) {
      let deflatedData = pako.gzip(this.outDataOringinObj)
      let deflatedArray = new Uint8Array(deflatedData.length + 1)
      deflatedArray[0] = 1
      deflatedArray.set(deflatedData, 1)

      this.bot.socket.send(deflatedArray)
    } else {
      this.bot.socket.send(unintArray)
    }
  }

  async visit(element: h): Promise<void> {
    const { type, attrs, children } = element
    switch (type) {
      case "text": {
        this.outDataOringin += attrs.content
        break
      }

      case "at": {
        this.outDataOringin += ` [*${attrs.content}*] `
        break
      }

      case "markdown": {
        this.outDataOringin += `\`\`\`\n${attrs.content}`
        break
      }

      case "image": {
        console.log(attrs.url)
        this.outDataOringin += `[${attrs.url}]`
      }

      default: {
        break
      }
    }

    if (this.channelId.startsWith("public:")) {
      this.outDataOringinObj = PublicMessage(this.outDataOringin, '66ccff')
    } else if (this.channelId.startsWith("private:")) {
      this.outDataOringinObj = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, '66ccff')
    }
  }
}