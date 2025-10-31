import { h, Universal } from 'koishi';

import { GetUserListCallback } from './GetUserListCallback';
import { comparePassword } from '../utils/password';
import { MessageType } from '.';
import { IIROSE_Bot } from '../bot/bot';
import { clearMsg } from './clearMsg';

export const decoderMessage = async (obj: MessageType, bot: IIROSE_Bot) =>
{
  // 定义会话列表
  for (const key in obj)
  {
    switch (key)
    {
      case 'userlist': {
        if (!obj.userlist) return;
        const data: GetUserListCallback[] = obj.userlist;

        let uid = bot.ctx.config.uid;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        const event = {
          selfId: uid,
          type: 'userlist',
          platform: 'iirose',
          timestamp: Date.now()
        };
        const session = bot.session(event);

        // 大包触发
        bot.ctx.emit('iirose/before-getUserList', session, data);
        break;
      }

      case 'publicMessage': {
        if (!obj.publicMessage) return;

        obj.publicMessage.message = await clearMsg(obj.publicMessage.message, bot);

        const data = obj.publicMessage;

        // 引用
        let quotePayload: Universal.Message | undefined = undefined;
        if (data.replyMessage && data.replyMessage.length > 0)
        {
          const quoteInfo = data.replyMessage[0];
          const processedQuoteContent = await clearMsg(quoteInfo.message, bot);

          const quotedSession = bot.sessionCache.findQuote({
            username: quoteInfo.username,
            content: processedQuoteContent,
          });

          if (quotedSession)
          {
            quotePayload = {
              messageId: quotedSession.event.message.id,
              content: quotedSession.content,
              timestamp: quotedSession.timestamp,
              elements: quotedSession.elements,
              user: {
                id: quotedSession.author.id,
                name: quotedSession.author.name,
                avatar: quotedSession.author.avatar,
                nickname: quotedSession.author.nickname,
              },
              channel: {
                id: quotedSession.channelId,
                type: 0,
              },
              guild: {
                id: quotedSession.guildId,
              },
            };
          }
        }

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.smRoom;
        }

        const event = {
          type: 'message',
          platform: 'iirose',
          selfId: uid,
          timestamp: Number(data.timestamp),
          user: {
            id: data.uid,
            name: data.username,
            avatar: (data.avatar.startsWith('http')) ? data.avatar : `https://static.codemao.cn/rose/v0/images/icon/${data.avatar}`
          },
          message: {
            id: String(data.messageId),
            messageId: String(data.messageId),
            content: data.message,
            elements: h.parse(data.message),
            quote: quotePayload,
          },
          guild: {
            id: guildId
          },
          channel: {
            id: `public:${guildId}`,
            type: 0
          },
        };

        const session = bot.session(event);

        bot.sessionCache.add(session);
        bot.dispatch(session);
        break;
      }

      case 'privateMessage': {
        if (!obj.privateMessage) return;

        obj.privateMessage.message = await clearMsg(obj.privateMessage.message, bot);
        const data = obj.privateMessage;

        // 提前处理引用信息
        let quotePayload: Universal.Message | undefined = undefined;
        if (data.replyMessage && data.replyMessage.length > 0)
        {
          const quoteInfo = data.replyMessage[0];
          const processedQuoteContent = await clearMsg(quoteInfo.message, bot);

          const quotedSession = bot.sessionCache.findQuote({
            username: quoteInfo.username,
            content: processedQuoteContent,
          });

          if (quotedSession)
          {
            quotePayload = {
              messageId: quotedSession.event.message.id,
              content: quotedSession.content,
              elements: quotedSession.elements,
              timestamp: quotedSession.timestamp,
              user: {
                id: quotedSession.author.id,
                name: quotedSession.author.name,
                avatar: quotedSession.author.avatar,
                nickname: quotedSession.author.nickname,
              },
              channel: {
                id: quotedSession.channelId,
                type: 1
              }
            };
          }
        }

        let uid = bot.ctx.config.uid;

        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        const event = {
          type: 'message',
          platform: 'iirose',
          selfId: uid,
          timestamp: Number(data.timestamp),
          user: {
            id: data.uid,
            name: data.username,
            avatar: (data.avatar.startsWith('http')) ? data.avatar : `https://static.codemao.cn/rose/v0/images/icon/${data.avatar}`
          },
          message: {
            id: String(data.messageId),
            messageId: String(data.messageId),
            content: data.message,
            elements: h.parse(data.message),
            quote: quotePayload,
          },
          channel: {
            id: `private:${data.uid}`,
            type: 1
          },
        };

        const session = bot.session(event);

        bot.sessionCache.add(session);
        bot.dispatch(session);
        break;
      }

      case 'memberUpdate': {
        const data = obj.memberUpdate;
        if (!data) return;

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.smRoom;
        }

        const createEvent = (type: 'guild-member-added' | 'guild-member-removed' | 'guild-member-updated') =>
        {
          const session = bot.session({
            type,
            platform: 'iirose',
            selfId: uid,
            timestamp: Number(data.timestamp),
            guild: { id: guildId },
            user: {
              id: data.uid,
              name: data.username,
              avatar: (data.avatar.startsWith('http')) ? data.avatar : `https://static.codemao.cn/rose/v0/images/icon/${data.avatar}`
            }
          });
          bot.dispatch(session);
        };

        switch (data.type)
        {
          case 'join':
            createEvent('guild-member-added');
            break;
          case 'leave':
          case 'move':
            createEvent('guild-member-removed');
            break;
        }

        break;
      }

      case 'damaku': {
        const data = obj.damaku;
        if (!data) return;

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;
        if (bot.ctx.config.smStart && bot.ctx.config.smPassword === 'ec3a4ac482b483ac02d26e440aa0a948d309c822')
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.smRoom;
        }

        const event = {
          type: 'damaku',
          userId: data.username,
          username: data.username,
          timestamp: Date.now(),
          author: {
            userId: data.username,
            avatar: (data.avatar.startsWith('http')) ? data.avatar : `https://static.codemao.cn/rose/v0/images/icon/${data.avatar}`,
            username: data.username,
          },
          platform: 'iirose',
          guildId: guildId,
          selfId: uid,
          user: {
            id: data.username,
            name: data.username
          },
          message: {
            id: `${data.username}damaku`,
            content: data.message,
          },
        };

        const session = bot.session(event);
        bot.ctx.emit('iirose/newDamaku', session, data);
        break;
      }

      case 'switchRoom': {
        // 这玩意真的是机器人能够拥有的吗?
        const event = {
          type: 'switchRoom',
          platform: 'iirose',
          guildId: bot.config.roomId
        };
        const session = bot.session(event);

        bot.ctx.emit('iirose/switchRoom', session, obj.switchRoom);
        break;
      }

      case 'music': {
        // 音乐
        const data = obj.music;

        const event = {
          type: 'music',
          platform: 'iirose',
          guildId: bot.config.roomId
        };
        const session = bot.session(event);

        bot.ctx.emit('iirose/newMusic', session, data);
        break;
      }

      case 'paymentCallback': {
        const data = obj.paymentCallback;

        const event = {
          type: 'paymentCallback',
          platform: 'iirose',
          guildId: bot.config.roomId
        };
        const session = bot.session(event);

        bot.ctx.emit('iirose/before-payment', session, data);
        break;
      }

      case 'getUserListCallback': {
        const data = obj.getUserListCallback;

        const event = {
          type: 'getUserListCallback',
          platform: 'iirose',
          guildId: bot.config.roomId
        };
        const session = bot.session(event);

        bot.ctx.emit('iirose/before-getUserList', session, data);
        break;
      }

      case 'userProfileCallback': {
        const data = obj.userProfileCallback;

        const event = {
          type: 'userProfileCallback',
          platform: 'iirose',
          guildId: bot.config.roomId
        };
        const session = bot.session(event);

        bot.ctx.emit('iirose/before-userProfile', session, data);
        break;
      }

      case 'bankCallback': {
        const data = obj.bankCallback;

        const event = {
          type: 'bankCallback',
          platform: 'iirose',
          guildId: bot.config.roomId
        };

        const session = bot.session(event);
        bot.ctx.emit('iirose/before-bank', session, data);
        break;
      }

      case 'mediaListCallback': {
        const data = obj.mediaListCallback;

        const event = {
          type: 'mediaListCallback',
          platform: 'iirose',
          guildId: bot.config.roomId
        };

        const session = bot.session(event);
        bot.ctx.emit('iirose/before-mediaList', session, data);
        break;
      }

      case 'selfMove': {
        const data = obj.selfMove;

        const event = {
          type: 'selfMove',
          platform: 'iirose',
          guildId: bot.config.roomId
        };

        const session = bot.session(event);
        bot.ctx.emit('iirose/selfMove', session, data);
        // 自身移动房间
        break;
      }

      case 'messageDeleted': {
        const data = obj.messageDeleted;
        if (!data) return;

        bot.logInfo('messageDeleted', data);

        let uid = bot.ctx.config.uid;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        // 发送 message-deleted 事件
        const session = bot.session({
          type: 'message-deleted',
          user: {
            id: data.userId,
            name: data.userId
          },
          message: {
            id: data.messageId,
            messageId: data.messageId,
            content: '',
            elements: []
          },
          timestamp: data.timestamp,
          platform: 'iirose'
        });

        session.channelId = data.channelId;
        session.selfId = uid;

        bot.dispatch(session);
        break;
      }

      case 'mailboxMessage': {
        const data = obj.mailboxMessage;

        const event = {
          type: 'mailboxMessage',
          platform: 'iirose',
          guildId: bot.config.roomId
        };

        const session = bot.session(event);

        bot.ctx.emit('iirose/mailboxMessage', session, data);
        break;
      }

      case 'broadcastMessage': {
        const data = obj.broadcastMessage;
        if (!data) return;
        const processedContent = await clearMsg(data.message, bot);

        const event = {
          type: 'broadcast',
          platform: 'iirose',
          guildId: bot.config.roomId,
          timestamp: Number(data.timestamp),
          user: {
            id: data.username, // 广播消息没有提供用户ID，暂用用户名代替
            name: data.username,
          },
          message: {
            id: data.messageId,
            messageId: data.messageId,
            content: processedContent,
            elements: h.parse(processedContent),
          },
        };

        const session = bot.session(event);

        bot.ctx.emit('iirose/broadcast', session, data);
        break;
      }

      default: {
        break;
      }
    }
  }
};
