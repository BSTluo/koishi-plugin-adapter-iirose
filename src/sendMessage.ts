import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { Context, MessageEncoder, h } from 'koishi';
// import { h, MessageEncoder } from '@satorijs/satori';
import { IIROSE_Bot } from './bot';
import PublicMessage from './encoder/messages/PublicMessage';
import PrivateMessage from './encoder/messages/PrivateMessage';
// import mediaCard from './encoder/messages/media_card'
// import mediaData from './encoder/messages/media_data'
import Like from './encoder/system/Like';
import { IIROSE_WSsend } from './ws';
import { musicOrigin } from './event';
import { messageObjList } from './messageTemp';
import { } from 'koishi-plugin-filemanager';
import { rgbaToHex } from './utils';

async function getMediaMetadata(url: string)
{
  const response = await axios.get(url, {
    responseType: 'stream'
  });

  const mm = await import('music-metadata');
  // 解析媒体文件流的元数据
  const metadata = await mm.parseStream(response.data, null, { duration: true });

  const { common, format } = metadata;

  return {
    title: common.title || ['未知', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我歌曲名字欸'][Math.floor(Math.random() * 7)],
    artist: common.artist || ['未知', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我音乐家的名字欸'][Math.floor(Math.random() * 7)],
    album: common.album || ['群星', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我专辑的名字欸'][Math.floor(Math.random() * 7)],
    duration: format.duration || 0,
    bitrate: format.bitrate || 0,
    picture: common.picture?.[0] ? {
      format: common.picture[0].format,
      data: Buffer.from(common.picture[0].data).toString('base64') // 如果你想用作封面图
    } : 'https://www.loliapi.com/acg/'
  };
}

export class IIROSE_BotMessageEncoder<C extends Context = Context> extends MessageEncoder<C, IIROSE_Bot<C>>
{
  private outDataOringin: string = '';
  private outDataOringinObj: string = '';

  async flush(): Promise<void>
  {
    if (this.bot.config.hangUpMode) { return; }
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
        const url = attrs.link || attrs.url || attrs.src;
        const metadata = await getMediaMetadata(url);

        const obj: musicOrigin = {
          type: "video",
          name: attrs.name || metadata.title,
          signer: attrs.author || metadata.artist,
          cover: attrs.cover || metadata.picture,
          link: url,
          url: url,
          duration: attrs.duration || metadata.duration,
          bitRate: attrs.bitRate || metadata.bitrate,
          color: attrs.color,
          lyrics: (attrs.lyrics) ? attrs.lyrics : (Math.random() > 0.9) ? '' : '俺不中嘞，插件没给俺歌词啊喵',
          origin: (attrs.origin) ? attrs.origin : null
        };

        this.bot.internal.makeMusic(obj);
        // ctx.emit('iirose/makeMusic', obj);
        break;
      }

      case 'audio': {
        let url = attrs.link || attrs.url || attrs.src;
        let file: Buffer;
        let uid: string;
        let config: { contentType: string; filename: string; } | undefined;
        if (url.startsWith('file://'))
        {
          const fileUrl = new URL(url);
          file = fs.readFileSync(fileUrl);
          uid = this.bot.config.uid;
        }

        if (url.startsWith('data:audio'))
        {
          // 创建一个FormData实例
          const base64ImgStr = url.replace(/^data:audio\/[a-z]+;base64,/, '');
          file = Buffer.from(base64ImgStr, 'base64');
          uid = this.bot.config.uid;
          config = { contentType: 'audio/mpeg', filename: 'x.mp3' };
        }

        if (!url.startsWith('http'))
        {
          try
          {
            const formData = new FormData();

            // JSON.parse(this.bot.config.picFormData, (key, value) =>
            // {
            //   if (key == '') { return; }
            //   if (value == '[file]')
            //   {
            //     config ? formData.append(key, file, config) : formData.append(key, file);
            //   }
            //   if (value == '[uid]')
            //   {
            //     formData.append(key, uid);
            //   }

            // });

            // 发送formData到后端
            url = await this.bot.ctx.filemanager.audio.upload(file, this.bot.ctx.filemanager.makeTempName() + '.mp3');

            // const match = this.bot.config.picBackLink.match(/\[([\s\S]+?)\]/g);

            // if (match)
            // {
            //   match.forEach(element =>
            //   {
            //     // const urlStr = element.replace(/[\[\]]/g, '');
            //     // 这里返回的data必须是类似a.mp3的这样的格式
            //     url = `${(this.bot.config.picBackLink).replace(element, outData)}`;
            //   });
            // }
            break;
          } catch (error)
          {
            this.outDataOringin += '[音频异常]';
            console.error(error);
          }
        }

        function getRandomColor()
        {
          const letters = '0123456789ABCDEF';
          let color = '#';
          for (let i = 0; i < 6; i++)
          {
            color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        }

        const metadata = await getMediaMetadata(url);

        const obj: musicOrigin = {
          type: 'music',
          name: attrs.name || metadata.title,
          signer: attrs.author || metadata.artist,
          cover: attrs.cover || metadata.picture,
          link: url,
          url: url,
          duration: attrs.duration || metadata.duration,
          bitRate: attrs.bitRate || metadata.bitrate,
          color: attrs.color || getRandomColor(),
          lyrics: (attrs.lyrics) ? attrs.lyrics : (Math.random() > 0.9) ? '' : '俺不中嘞，插件没给俺歌词啊喵',
          origin: (attrs.origin) ? attrs.origin : null
        };

        this.bot.internal.makeMusic(obj);
        // ctx.emit('iirose/makeMusic', obj);
        break;
      }

      case 'quote': {
        let id = attrs.id;
        if (!id)
        {
          id = Object.keys(messageObjList).pop();
        }

        const messData = await this.bot.getMessage('', id);

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
              if (/[a-z0-9]+/.test(attrs.id))
              {

                this.outDataOringin += ` [@${attrs.id}@] `;
              } else
              {
                this.outDataOringin += ` [*${attrs.id}*] `;
              }
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
          this.outDataOringin += ` [_${attrs.roomId}_] `;
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
          // if (!this.outDataOringin.startsWith('\\\\\\*\n')) { this.outDataOringin = '\\\\\\*\n' + this.outDataOringin; }
          this.outDataOringin += `[${attrs.src}]`;
          break;
        }

        let file: Buffer<ArrayBuffer>;
        let uid: string;
        let config: { contentType: string; filename: string; } | undefined;
        if (attrs.src.startsWith('file://'))
        {
          const fileUrl = new URL(attrs.src);
          file = fs.readFileSync(fileUrl.pathname);
          uid = this.bot.config.uid;
        }

        if (attrs.src.startsWith('data:image'))
        {
          // 创建一个FormData实例
          const base64ImgStr = attrs.src.replace(/^data:image\/[a-z]+;base64,/, '');
          file = Buffer.from(base64ImgStr, 'base64');
          uid = this.bot.config.uid;
          config = { contentType: 'image/png', filename: 'x.png' };
        }

        try
        {
          // JSON.parse(this.bot.config.picFormData, (key, value) =>
          // {
          //   if (key == '') { return; }
          //   if (value == '[file]')
          //   {
          //     config ? formData.append(key, file, config) : formData.append(key, file);
          //   }
          //   if (value == '[uid]')
          //   {
          //     // console.log('uid', uid);
          //     // console.log('key', key);
          //     formData.append(key, uid);
          //   }

          // formData.append(key, value); 加了这个会导致上传失败，意义不明
          // });



          // 发送formData到后端

          // 发送formData到后端
          // const response = await axios.post(this.bot.config.picLink, formData, {
          //   headers: formData.getHeaders(),
          // });
          // let outData = response.data; // 确保你正确地访问了响应数据
          // const match = this.bot.config.picBackLink.match(/\[([\s\S]+?)\]/g);
          // if (match)
          // {
          //   match.forEach(element =>
          //   {
          //     const urlStr = element.replace(/[\[\]]/g, '');
          //     // const repNodeList = urlStr.split('.');

          //     // 使用reduce来访问嵌套属性
          //     // outData = repNodeList.reduce((acc, key) => acc[key], outData);
          //     // console.log('outData', outData);
          //     this.outDataOringin += `[${(this.bot.config.picBackLink).replace(element, outData)}]`;
          //     // console.log('outDataOringin', this.outDataOringin);
          //   });
          // }

          const url = await this.bot.ctx.filemanager.img.upload(file, `${this.bot.ctx.filemanager.makeTempName()}.png`);
          this.outDataOringin += `[${url}#e]`;


        } catch (error)
        {
          this.outDataOringin += '[图片显示异常]';
          //console.error(error);
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
      this.outDataOringinObj = PublicMessage(this.outDataOringin, rgbaToHex(this.bot.config.color));
    } else if (this.channelId.startsWith('private:'))
    {
      this.outDataOringinObj = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, rgbaToHex(this.bot.config.color));
    }
  }
}
