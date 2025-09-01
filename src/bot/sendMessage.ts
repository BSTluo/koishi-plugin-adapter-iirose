
import { Context, MessageEncoder, h } from 'koishi';

import { } from 'koishi-plugin-filemanager';

import PrivateMessage from '../encoder/messages/PrivateMessage';
import PublicMessage from '../encoder/messages/PublicMessage';
import { rgbaToHex } from '../utils/utils';
import Like from '../encoder/system/Like';
import { musicOrigin } from './event';
import { IIROSE_WSsend } from '../utils/ws';
import { IIROSE_Bot } from './bot';
import FormData from 'form-data';

import fs from 'node:fs';

async function getMediaMetadata(url: string, ctx: Context)
{
  const response = await ctx.http.get(url, {
    responseType: 'stream'
  });

  const mm = await import('music-metadata');
  const { Readable } = await import('stream');

  const nodeStream = Readable.fromWeb(response as ReadableStream);
  const metadata = await mm.parseStream(nodeStream, null, { duration: true });

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

export class IIROSE_BotMessageEncoder extends MessageEncoder<Context, IIROSE_Bot>
{
  private outDataOringin: string = '';
  private outDataOringinObj: string = '';
  private currentMessageId: string = '';

  async flush(): Promise<void>
  {
    if (this.bot.config.hangUpMode) { return; }
    if (this.outDataOringin.length <= 0)
    {
      this.outDataOringin = ' '; // 默认内容
    }

    // 在实际发送消息时生成消息ID和消息对象
    if (this.channelId.startsWith('public:'))
    {
      const result = PublicMessage(this.outDataOringin, rgbaToHex(this.bot.config.color));
      this.currentMessageId = result.messageId;
      this.outDataOringinObj = result.data;
    } else if (this.channelId.startsWith('private:'))
    {
      const result = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, rgbaToHex(this.bot.config.color));
      this.currentMessageId = result.messageId;
      this.outDataOringinObj = result.data;
    }

    await IIROSE_WSsend(this.bot, this.outDataOringinObj);
  }

  async sendData(message: string): Promise<void>
  {
    await IIROSE_WSsend(this.bot, message);
  }

  // 获取消息ID
  getMessageId(): string
  {
    return this.currentMessageId;
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
        const metadata = await getMediaMetadata(url, this.bot.ctx);

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

        const metadata = await getMediaMetadata(url, this.bot.ctx);

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
          const messageKeys = this.bot.getMessageKeys();
          id = messageKeys[messageKeys.length - 1];
        }

        const messData = await this.bot.getMessage('', id);

        if (messData)
        {
          this.outDataOringin = `${messData.content} (_hr) ${messData.author.username}_${Math.round(new Date().getTime() / 1e3)} (hr_) ` + this.outDataOringin;
        } else
        {
          this.bot.loggerWarn(`[Quote处理] 未找到消息ID: ${id}`);
        }
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

      case 'i18n': {
        try
        {
          const path = attrs?.path;
          if (path && this.bot.ctx.i18n)
          {
            const locales = this.bot.ctx.i18n.fallback([]);
            try
            {
              const text = this.bot.ctx.i18n.text(locales, [path], attrs || {});
              if (text && typeof text === 'string')
              {
                this.outDataOringin += text;
                break;
              }
            } catch (e)
            {
              // i18n解析失败，使用fallback
            }
          }
          this.outDataOringin += `[${path || 'i18n'}]`;
        } catch (error)
        {
          this.outDataOringin += `[${attrs?.path || 'i18n'}]`;
        }
        break;
      }

      case 'at': {
        if (attrs.hasOwnProperty('id'))
        {
          const user = await this.bot.internal.getUserById(attrs.id);
          const name = user?.name;
          if (name && name !== ("用户数据库初始化ing"))
          {
            this.outDataOringin += ` [*${name}*] `;
          } else
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
        // p元素处理完子元素后需要添加换行符
        break;
      }

      case 'br': {
        // br元素直接添加换行符
        this.outDataOringin += '\n';
        break;
      }

      case 'like': {
        // 点赞事件
        await IIROSE_WSsend(this.bot, Like(attrs.uid, attrs.message));
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
      for (const h of children)
      {
        await this.visit(h);
      }
    }

    // p元素 处理完子元素后需要添加换行符
    if (type === 'p' && this.outDataOringin.length > 0)
    {
      this.outDataOringin += '\n';
    }
  }
}
