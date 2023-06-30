import { h, MessageEncoder } from '@satorijs/satori'
import { IIROSE_Bot } from './bot'
import pako from 'pako'
import PublicMessage from './encoder/messages/PublicMessage'
import PrivateMessage from './encoder/messages/PrivateMessage'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'

export class IIROSE_BotMessageEncoder extends MessageEncoder<IIROSE_Bot> {
  private outDataOringin: string = ''
  private outDataOringinObj: string = ''

  async flush(): Promise<void> {
    const buffer = Buffer.from(this.outDataOringinObj)
    const unintArray = Uint8Array.from(buffer)

    if (unintArray.length > 256) {
      const deflatedData = pako.gzip(this.outDataOringinObj)
      const deflatedArray = new Uint8Array(deflatedData.length + 1)
      deflatedArray[0] = 1
      deflatedArray.set(deflatedData, 1)

      this.bot.socket.send(deflatedArray)
    } else {
      this.bot.socket.send(unintArray)
    }
  }

  async visit(element: h): Promise<void> {
    const { type, attrs/*, children */ } = element
    switch (type) {
      case 'text': {
        this.outDataOringin += attrs.content
        break
      }

      case 'at': {
        this.outDataOringin += ` [*${attrs.content}*] `
        break
      }

      case 'markdown': {
        this.outDataOringin += `\`\`\`\n${attrs.content}`
        break
      }

      case 'image': {
        try {
          // 创建一个FormData实例
          const formData = new FormData()
          const base64ImgStr = attrs.url.replace(/^data:image\/[a-z]+;base64,/, '')
          formData.append('file', Buffer.from(base64ImgStr, 'base64'), { contentType: 'image/png', filename: 'x.png' })
          formData.append('timeOut', 1)

          // 发送formData到后端
          const response = await axios.post('https://zerfile.bstluo.top/upload', formData, {
            headers: formData.getHeaders()
          })

          this.outDataOringin += `[https://zerfile.bstluo.top/public/${response.data}]`
        } catch (error) {
          this.outDataOringin += '[图片显示异常]'
          console.error(error)
        }

        break
      }

      default: {
        break
      }
    }

    if (this.channelId.startsWith('public:')) {
      this.outDataOringinObj = PublicMessage(this.outDataOringin, '66ccff')
    } else if (this.channelId.startsWith('private:')) {
      this.outDataOringinObj = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, '66ccff')
    }
  }
}
