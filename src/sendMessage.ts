import pako from 'pako'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import { h, MessageEncoder } from '@satorijs/satori'
import { IIROSE_Bot } from './bot'
import PublicMessage from './encoder/messages/PublicMessage'
import PrivateMessage from './encoder/messages/PrivateMessage'
import mediaCard from './encoder/messages/media_card'
import mediaData from './encoder/messages/media_data'
import Like from './encoder/system/Like'

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

  async sendData(message: string): Promise<void> {
    const buffer = Buffer.from(message)
    const unintArray = Uint8Array.from(buffer)

    if (unintArray.length > 256) {
      const deflatedData = pako.gzip(message)
      const deflatedArray = new Uint8Array(deflatedData.length + 1)
      deflatedArray[0] = 1
      deflatedArray.set(deflatedData, 1)

      this.bot.socket.send(deflatedArray)
    } else {
      this.bot.socket.send(unintArray)
    }
  }

  async visit(element: h): Promise<void> {
    const { type, attrs, children } = element
    console.log('type', type)
    console.log('attrs', attrs)
    console.log('children', children)

    switch (type) {
      case 'quote': {
        const messData = await this.bot.getMessage('', attrs.id)

        this.outDataOringin = `${messData.content} (_hr) ${messData.author.username}_${Math.round(new Date().getTime() / 1e3)} (hr_) ` + this.outDataOringin
        break
      }

      case 'text': {
        if (this.outDataOringin.length > 0) {
          this.outDataOringin += `\n${attrs.content}`
        } else {
          this.outDataOringin += `${attrs.content}`
        }
        break
      }

      case 'at': {
        this.outDataOringin += ` [*${attrs.id}*] `
        break
      }
      case 'a': {
        this.outDataOringin += attrs.href
        break
      }
      case 'markdown': {
        this.outDataOringin += `\`\`\`\n${attrs.content}`
        break
      }

      case 'image': {
        let i = 0
        if (attrs.url.startsWith('http')) {
          let arr = ['jpg', 'jpeg', 'png', 'gif']
          for (const iterator of arr) {
            if (attrs.url.endsWith(`.${iterator}`)) {
              this.outDataOringin += `[${attrs.url}]`
              i = 1
              break
            }
          }
          if (i > 0) { break }
          if (!this.outDataOringin.startsWith('\\\\\\*\n')) { this.outDataOringin = '\\\\\\*\n' + this.outDataOringin }
          this.outDataOringin += `![](${attrs.url})`
          break
        }

        const formData = new FormData()
        if (attrs.url.startsWith('file://')) {
          const fileUrl = new URL(attrs.url)
          formData.append('file', fs.createReadStream(fileUrl))
          formData.append('timeOut', 1)
        }

        if (attrs.url.startsWith('data:image')) {
          // 创建一个FormData实例
          const base64ImgStr = attrs.url.replace(/^data:image\/[a-z]+;base64,/, '')
          formData.append('file', Buffer.from(base64ImgStr, 'base64'), { contentType: 'image/png', filename: 'x.png' })
          formData.append('timeOut', 1)
        }

        try {
          // 发送formData到后端
          const response = await axios.post(this.bot.ctx.config.picLink, formData, {
            headers: formData.getHeaders()
          })
          this.outDataOringin += `[${(this.bot.ctx.config.picBackLink).replace('[data]', response.data)}]`
        } catch (error) {
          console.log(error)
          this.outDataOringin += '[图片显示异常]'
          console.error(error)
        }

        break
      }

      case 'p': {
        this.outDataOringin += '\n'
        break
      }

      case 'like': {
        // 点赞事件
        this.bot.send(Like(attrs.uid, attrs.message))
        break
      }

      case '': {
        break
      }

      case 'onebot:music': {
        const response = await axios.get((this.bot.ctx.config.musicLink).replace('[musicid]', attrs.id))
        if (response.data.code !== 200) { break }
        const musicData = response.data.data[0]
        if (musicData.br === 0) {
          this.outDataOringin += `[歌曲点播失败,可能为VIP歌曲]`
          break
        }
        const durationSeconds = Math.trunc((musicData.size * 8) / musicData.br) + 1
        const cardData = mediaCard('music', attrs.name, attrs.artist, 'https://api.vvhan.com/api/acgimg', (musicData.br / 1000), '66ccff')
        const mData = mediaData('music', attrs.name, attrs.artist, 'https://api.vvhan.com/api/acgimg', 'https://github.com/BSTluo', musicData.url, durationSeconds)
        this.sendData(cardData)
        this.sendData(mData)

        break
      }

      default: {
        break
      }
    }

    if (children.length > 0) {
      if (this.outDataOringin.length > 0) { this.outDataOringin += '\n' }

      for (let h of children) {
        this.visit(h)
      }
    }

    if (this.outDataOringin.length <= 0) { return }

    if (this.channelId.startsWith('public:')) {
      this.outDataOringinObj = PublicMessage(this.outDataOringin, '66ccff')
    } else if (this.channelId.startsWith('private:')) {
      this.outDataOringinObj = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, '66ccff')
    }
  }
}
/*

当前问题
children的内容无法解析，解决方法如下
检测到children有内容时，再跑visit
每次跑完visit的时候push()一次发送数组，等待解析后的flush函数将这个数组内的数据全部发送

*/