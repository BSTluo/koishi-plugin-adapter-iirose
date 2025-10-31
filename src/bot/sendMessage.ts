
import { Context, MessageEncoder, h } from 'koishi';
import { } from '@koishijs/assets';
import PrivateMessage from '../encoder/messages/PrivateMessage';
import PublicMessage from '../encoder/messages/PublicMessage';
import { IIROSE_WSsend } from '../utils/ws';
import { rgbaToHex } from '../utils/utils';
import Like from '../encoder/system/Like';
import { musicOrigin } from './event';
import { IIROSE_Bot } from './bot';
import { clearMsg } from '../decoder/clearMsg';

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
  private audioSent: boolean = false;

  async flush(): Promise<void>
  {
    if (this.bot.config.onlyHangUpMode) { return; }

    // 如果已经发送了音频消息且没有其他内容，则不发送额外消息
    if (this.audioSent && this.outDataOringin.length <= 0)
    {
      return;
    }

    if (this.outDataOringin.length <= 0)
    {
      this.outDataOringin = ' '; // 默认内容
    } else
    {
      // 清理消息末尾多余的换行符，避免发送空白行
      this.outDataOringin = this.outDataOringin.replace(/\n+$/, '');

      // 如果清理后内容为空，设置默认内容
      if (this.outDataOringin.length <= 0)
      {
        this.outDataOringin = ' ';
      }
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

    if (this.currentMessageId)
    {
      this.results.push({ id: this.currentMessageId });
      await this.cacheSentMessage(this.currentMessageId, this.outDataOringin);
    }
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
   * @description 缓存发出的消息
   * @param messageId 消息id
   * @param content 消息内容
   */
  private async cacheSentMessage(messageId: string, content: string): Promise<void>
  {
    if (!this.bot.sessionCache) return;

    // 缓存前也需要对消息进行处理
    const processedContent = await clearMsg(content, this.bot);

    const event: any = {
      type: 'message',
      platform: 'iirose',
      selfId: this.bot.selfId,
      timestamp: Date.now(),
      user: {
        id: this.bot.user.id,
        name: this.bot.user.name,
        avatar: this.bot.user.avatar,
      },
      message: {
        id: messageId,
        messageId: messageId,
        content: processedContent,
        elements: h.parse(processedContent),
      },
      channel: {
        id: this.channelId,
        type: this.channelId.startsWith('public:') ? 0 : 1,
      },
    };

    if (this.channelId.startsWith('public:'))
    {
      event.guild = { id: this.channelId.substring(7) };
    }

    const session = this.bot.session(event);
    this.bot.sessionCache.add(session);
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

  /**
   * HTML反转义函数，用于处理assets转换后的URL中的转义字符
   * @param text 需要反转义的文本
   * @returns 反转义后的文本
   */
  private unescapeHtml(text: string): string
  {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }

  /**
   * 确保在添加内容前有换行符
   * 用于图文消息里的图片和文字之间的换行
   */
  private ensureNewlineBefore(): void
  {
    if (this.outDataOringin.length > 0 && !this.outDataOringin.endsWith('\n'))
    {
      this.outDataOringin += '\n';
    }
  }

  async visit(element: h): Promise<void>
  {
    const { type, attrs, children } = element;
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

        // 如果是 https 协议，直接使用
        if (url.startsWith('https'))
        {
          // 直接使用 https URL
        } else
        {
          // 使用 assets 服务转存非 https 协议的资源
          try
          {
            const audioElement = `${h.audio(url)}`;
            const transformedContent = await this.bot.ctx.assets.transform(audioElement);

            // 从转存后的内容中提取 URL
            const urlMatch = transformedContent.match(/src="([^"]+)"/);
            if (urlMatch && urlMatch[1])
            {
              url = this.unescapeHtml(urlMatch[1]);
            } else
            {
              throw new Error('无法从转存结果中提取音频 URL');
            }
          } catch (error)
          {
            this.outDataOringin += '[音频转存异常]';
            this.bot.loggerError(error);
            break;
          }
        }

        // 确保URL以.weba结尾，IIROSE平台需要此后缀才能正确识别为语音消息
        if (!url.endsWith('.weba'))
        {
          if (url.includes('?'))
          {
            url += `&iiroseaudio=.weba`;
          } else
          {
            url += `?iiroseaudio=.weba`;
          }
        }

        let audioMessage: string;
        let audioMessageId: string;
        if (this.channelId.startsWith('public:'))
        {
          const result = PublicMessage(url, rgbaToHex(this.bot.config.color));
          audioMessage = result.data;
          audioMessageId = result.messageId;
        } else if (this.channelId.startsWith('private:'))
        {
          const result = PrivateMessage(this.channelId.split(':')[1], url, rgbaToHex(this.bot.config.color));
          audioMessage = result.data;
          audioMessageId = result.messageId;
        }

        if (audioMessage)
        {
          await IIROSE_WSsend(this.bot, audioMessage);
          // 标记已发送音频消息，防止flush时发送空格消息
          this.audioSent = true;
          if (audioMessageId)
          {
            this.results.push({ id: audioMessageId });
            await this.cacheSentMessage(audioMessageId, url);
          }
        }
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
        let url = attrs.src;

        // 如果是 https 协议，直接使用
        if (url.startsWith('https'))
        {
          this.ensureNewlineBefore();
          this.outDataOringin += `[${url}#e]`;
          this.outDataOringin += '\n';
          break;
        }
        // 使用 assets 服务转存非 https 协议的资源
        try
        {
          const imgElement = `${h.image(url)}`;
          const transformedContent = await this.bot.ctx.assets.transform(imgElement);

          // 从转存后的内容中提取 URL
          const urlMatch = transformedContent.match(/src="([^"]+)"/);
          if (urlMatch && urlMatch[1])
          {
            const transformedUrl = this.unescapeHtml(urlMatch[1]);
            this.ensureNewlineBefore();
            this.outDataOringin += `[${transformedUrl}#e]`;
            this.outDataOringin += '\n';
          } else
          {
            throw new Error('无法从转存结果中提取图片 URL');
          }
        } catch (error)
        {
          this.ensureNewlineBefore();
          this.outDataOringin += '[图片转存异常]';
          this.outDataOringin += '\n';
          this.bot.loggerError(error);
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
