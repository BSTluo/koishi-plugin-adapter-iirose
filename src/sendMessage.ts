import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { h, MessageEncoder } from '@satorijs/satori';
import { IIROSE_Bot } from './bot';
import PublicMessage from './encoder/messages/PublicMessage';
import PrivateMessage from './encoder/messages/PrivateMessage';
// import mediaCard from './encoder/messages/media_card'
// import mediaData from './encoder/messages/media_data'
import Like from './encoder/system/Like';
import { IIROSE_WSsend } from './ws';
import { musicOrigin } from './event';

export class IIROSE_BotMessageEncoder extends MessageEncoder<IIROSE_Bot> {
  private outDataOringin: string = '';
  private outDataOringinObj: string = '';

  async flush(): Promise<void> {
    IIROSE_WSsend(this.bot, this.outDataOringinObj);
  }

  async sendData(message: string): Promise<void> {
    IIROSE_WSsend(this.bot, message);
  }

  async visit(element: h): Promise<void> {
    const { type, attrs, children } = element;
    // console.log('type', type)
    // console.log('attrs', attrs)
    // console.log('children', children)

    switch (type) {
      case 'video': {
        const obj: musicOrigin = {
          type: "video",
          name: attrs.name,
          signer: attrs.author,
          cover: attrs.cover,
          link: attrs.url,
          url: attrs.url,
          duration: attrs.duration,
          bitRate: attrs.bitRate,
          color: attrs.color
        };

        this.bot.ctx.emit('iirose/makeMusic', obj);
        break;
      }

      case 'audio': {
        const obj: musicOrigin = {
          type: 'music',
          name: attrs.name,
          signer: attrs.author,
          cover: attrs.cover,
          link: attrs.url,
          url: attrs.url,
          duration: attrs.duration,
          bitRate: attrs.bitRate,
          color: attrs.color
        };

        this.bot.ctx.emit('iirose/makeMusic', obj);
        break;
      }

      case 'quote': {
        const messData = await this.bot.getMessage('', attrs.id);

        this.outDataOringin = `${messData.content} (_hr) ${messData.author.username}_${Math.round(new Date().getTime() / 1e3)} (hr_) ` + this.outDataOringin;
        break;
      }

      case 'text': {
        if (this.outDataOringin.length > 0) {
          this.outDataOringin += `\n${attrs.content}`;
        } else {
          this.outDataOringin += `${attrs.content}`;
        }
        break;
      }

      case 'at': {
        this.outDataOringin += ` [*${attrs.id}*] `;
        break;
      }
      case 'a': {
        this.outDataOringin += attrs.href;
        break;
      }
      case 'markdown': {
        this.outDataOringin += `\`\`\`\n${attrs.content}`;
        break;
      }

      case 'image': {
        let i = 0;
        if (attrs.url.startsWith('http')) {
          const arr = ['jpg', 'jpeg', 'png', 'gif'];
          for (const iterator of arr) {
            if (attrs.url.endsWith(`.${iterator}`)) {
              this.outDataOringin += `[${attrs.url}]`;
              i = 1;
              break;
            }
          }
          if (i > 0) { break; }
          if (!this.outDataOringin.startsWith('\\\\\\*\n')) { this.outDataOringin = '\\\\\\*\n' + this.outDataOringin; }
          this.outDataOringin += `![](${attrs.url})`;
          break;
        }

        const formData = new FormData();
        if (attrs.url.startsWith('file://')) {
          const fileUrl = new URL(attrs.url);
          formData.append('f[]', fs.createReadStream(fileUrl));
          formData.append('i', this.bot.ctx.config.uid);
        }

        if (attrs.url.startsWith('data:image')) {
          // 创建一个FormData实例
          const base64ImgStr = attrs.url.replace(/^data:image\/[a-z]+;base64,/, '');
          formData.append('f[]', Buffer.from(base64ImgStr, 'base64'), { contentType: 'image/png', filename: 'x.png' });
          formData.append('i', this.bot.ctx.config.uid);
        }

        try {
          // 发送formData到后端
          const response = await axios.post(this.bot.ctx.config.picLink, formData, {
            headers: formData.getHeaders(),
          });
          let outData = response;

          const match = this.bot.ctx.config.picBackLink.match(/\[([\s\S]+?)\]/g);
          if (match) {
            match.forEach(element => {
              const urlStr = element.replace(/[\[\]]/g, '');
              const repNodeList = urlStr.split('.');
              outData = outData[repNodeList];

              this.outDataOringin += `[${(this.bot.ctx.config.picBackLink).replace(element, outData)}]`;
            });
          }
        } catch (error) {
          console.log(error);
          this.outDataOringin += '[图片显示异常]';
          console.error(error);
        }

        break;
      }

      case 'p': {
        break;
      }

      case 'like': {
        // 点赞事件
        IIROSE_WSsend(this.bot, Like(attrs.uid, attrs.message));
        break;
      }

      case '': {
        break;
      }

      // case 'onebot:music': {
      //   const response = await axios.get((this.bot.ctx.config.musicLink).replace('[musicid]', attrs.id))
      //   if (response.data.code !== 200) { break }
      //   const musicData = response.data.data[0]
      //   if (musicData.br === 0) {
      //     this.outDataOringin += `[歌曲点播失败,可能为VIP歌曲]`
      //     break
      //   }
      //   const durationSeconds = Math.trunc((musicData.size * 8) / musicData.br) + 1
      //   const cardData = mediaCard('music', attrs.name, attrs.artist, 'https://api.vvhan.com/api/acgimg', (musicData.br / 1000), '66ccff')
      //   // eslint-disable-next-line max-len
      //   const mData = mediaData('music', attrs.name, attrs.artist, 'https://api.vvhan.com/api/acgimg', 'https://github.com/BSTluo', musicData.url, durationSeconds)
      //   this.sendData(cardData)
      //   this.sendData(mData)

      //   break
      // }

      default: {
        break;
      }
    }

    if (children.length > 0) {
      if (this.outDataOringin.length > 0) { this.outDataOringin += '\n'; }

      for (const h of children) {
        await this.visit(h);
      }
    }

    if (this.outDataOringin.length <= 0) { return; }

    if (this.channelId.startsWith('public:')) {
      this.outDataOringinObj = PublicMessage(this.outDataOringin, '66ccff');
    } else if (this.channelId.startsWith('private:')) {
      this.outDataOringinObj = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, '66ccff');
    }
  }
}
