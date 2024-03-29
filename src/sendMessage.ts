import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { Context } from 'koishi';
import { h, MessageEncoder } from '@satorijs/satori';
import { IIROSE_Bot } from './bot';
import PublicMessage from './encoder/messages/PublicMessage';
import PrivateMessage from './encoder/messages/PrivateMessage';
// import mediaCard from './encoder/messages/media_card'
// import mediaData from './encoder/messages/media_data'
import Like from './encoder/system/Like';
import { IIROSE_WSsend } from './ws';
import { musicOrigin } from './event';

export class IIROSE_BotMessageEncoder<C extends Context = Context> extends MessageEncoder<C, IIROSE_Bot<C>>
{
  private outDataOringin: string = '';
  private outDataOringinObj: string = '';

  async flush(): Promise<void>
  {
    IIROSE_WSsend(this.bot, this.outDataOringinObj);
  }

  async sendData(message: string): Promise<void>
  {
    IIROSE_WSsend(this.bot, message);
  }

  /**
   * 转义特殊字符，目前发现仅适用于media_card
   * @param text 
   * @returns 
   */
  escapeSpecialCharacters(text: string | null): string | null
  {
    if (text === null)
    {
      return text;
    }
    return text
      .replace(/"/g, '&quot;')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async visit(element: h): Promise<void>
  {
    const { type, attrs, children } = element;
    // console.log('type', type);
    // console.log('attrs', attrs);
    // console.log('children', children);

    switch (type)
    {
      case 'video': {
        const obj: musicOrigin = {
          type: "video",
          name: attrs.name,
          signer: attrs.author,
          cover: attrs.cover,
          link: attrs.link || attrs.url,
          url: attrs.url,
          duration: attrs.duration,
          bitRate: attrs.bitRate,
          color: attrs.color,
          lyrics: (attrs.lyrics) ? attrs.lyrics : '',
          origin: (attrs.origin) ? attrs.origin : null
        };

        this.bot.internal.makeMusic(obj);
        // ctx.emit('iirose/makeMusic', obj);
        break;
      }

      case 'audio': {
        const obj: musicOrigin = {
          type: 'music',
          name: attrs.name,
          signer: attrs.author,
          cover: attrs.cover,
          link: attrs.link || attrs.url,
          url: attrs.url,
          duration: attrs.duration,
          bitRate: attrs.bitRate,
          color: attrs.color,
          lyrics: (attrs.lyrics) ? attrs.lyrics : '',
          origin: (attrs.origin) ? attrs.origin : null
        };
        this.bot.internal.makeMusic(obj);
        // ctx.emit('iirose/makeMusic', obj);
        break;
      }

      case 'quote': {
        const messData = await this.bot.getMessage('', attrs.id);

        this.outDataOringin = `${messData.content} (_hr) ${messData.author.username}_${Math.round(new Date().getTime() / 1e3)} (hr_) ` + this.outDataOringin;
        break;
      }

      case 'text': {
        if (this.outDataOringin.length > 0)
        {
          this.outDataOringin += `${attrs.content}`;
        } else
        {
          this.outDataOringin += `${attrs.content}`;
        }
        break;
      }

      case 'at': {
        if (attrs.hasOwnProperty('id'))
        {
          try
          {
            const dataTemp = await fetch(`https://xc.null.red:8043/api/iirose/user/info?type=id&data=${attrs.id}`, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const dataJson = await dataTemp.json();
            if (dataJson.code == 200)
            {
              this.outDataOringin += ` [*${dataJson.name}*] `;
            } else
            {
              this.outDataOringin += ` [@${attrs.id}@] `;
            }
          } catch (error)
          {
            this.outDataOringin += ` [@${attrs.id}@] `;
          }

        } else if (attrs.hasOwnProperty('name'))
        {
          this.outDataOringin += ` [*${attrs.name}*] `;
        } else if (attrs.hasOwnProperty('roomId'))
        {
          this.outDataOringin += ` [_${attrs.name}_] `;
        }
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

      case 'image':
      case 'img': {
        let i = 0;
        if (attrs.src.startsWith('http'))
        {
          const arr = ['jpg', 'jpeg', 'png', 'gif'];
          for (const iterator of arr)
          {
            if (attrs.src.endsWith(`.${iterator}`))
            {
              this.outDataOringin += `[${attrs.src}]`;
              i = 1;
              break;
            }
          }
          if (i > 0) { break; }
          if (!this.outDataOringin.startsWith('\\\\\\*\n')) { this.outDataOringin = '\\\\\\*\n' + this.outDataOringin; }
          this.outDataOringin += `![](${attrs.src})`;
          break;
        }

        let file: Buffer | fs.ReadStream;
        let uid: string;
        let config;
        if (attrs.src.startsWith('file://'))
        {
          const fileUrl = new URL(attrs.src);
          file = fs.createReadStream(fileUrl);
          uid = this.bot.ctx.config.uid;
        }

        if (attrs.src.startsWith('data:image'))
        {
          // 创建一个FormData实例
          const base64ImgStr = attrs.src.replace(/^data:image\/[a-z]+;base64,/, '');
          file = Buffer.from(base64ImgStr, 'base64'), { contentType: 'image/png', filename: 'x.png' };
          uid = this.bot.ctx.config.uid;
          config = { contentType: 'image/png', filename: 'x.png' };
        }

        try
        {
          const formData = new FormData();

          JSON.parse(this.bot.ctx.config.picFormData, (key, value) =>
          {
            if (key == '') { return; }
            if (value == '[file]') { (config) ? formData.append(key, file, config) : formData.append(key, file); }
            if (value == '[uid]') { formData.append(key, uid); }
            formData.append(key, value);
          });

          // 发送formData到后端
          const response = await axios.post(this.bot.ctx.config.picLink, formData, {
            headers: formData.getHeaders(),
          });
          let outData = response;
          const match = this.bot.ctx.config.picBackLink.match(/\[([\s\S]+?)\]/g);
          if (match)
          {
            match.forEach(element =>
            {
              const urlStr = element.replace(/[\[\]]/g, '');
              const repNodeList = urlStr.split('.');
              outData = outData[repNodeList];

              this.outDataOringin += `[${(this.bot.ctx.config.picBackLink).replace(element, outData)}]`;
            });
          }
        } catch (error)
        {
          // console.log(error);
          this.outDataOringin += '[图片显示异常]';
          // console.error(error);
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
    if (children.length > 0)
    {
      if (this.outDataOringin.length > 0) { this.outDataOringin += '\n'; }

      for (const h of children)
      {
        await this.visit(h);
      }
    }

    if (this.outDataOringin.length <= 0) { return; }

    if (this.channelId.startsWith('public:'))
    {
      this.outDataOringinObj = PublicMessage(this.outDataOringin, this.bot.config.color);
    } else if (this.channelId.startsWith('private:'))
    {
      this.outDataOringinObj = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, this.bot.config.color);
    }
  }
}
