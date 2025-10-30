import { h } from 'koishi';

import { GetUserListCallback } from './GetUserListCallback';
import { comparePassword } from '../utils/password';
import { MessageType } from '.';
import { IIROSE_Bot } from '../bot/bot';

export const decoderMessage = async (obj: MessageType, bot: IIROSE_Bot) =>
{
  // 定义会话列表
  // console.log('decoderMessage', obj);
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

        // const session: passiveEvent.getUserListCallbackEvent = {
        //   // 开启兼容性
        //   // type: 'guild-deleted',
        //   type: 'userlist',
        //   platform: 'iirose',
        //   selfId: bot.ctx.config.uid,
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins

        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };

        // 大包触发
        bot.ctx.emit('iirose/before-getUserList', session, data);
        break;
      }

      case 'publicMessage': {
        if (!obj.publicMessage) return;
        bot.setMessage(String(obj.publicMessage.messageId), {
          messageId: String(obj.publicMessage.messageId),
          isDirect: true,
          content: obj.publicMessage.message,
          timestamp: Number(obj.publicMessage.timestamp),
          author: {
            userId: obj.publicMessage.uid,
            avatar: obj.publicMessage.avatar,
            username: obj.publicMessage.username,
            nickname: obj.publicMessage.username,
          },
        });

        obj.publicMessage.message = await clearMsg(obj.publicMessage.message, bot);

        const data = obj.publicMessage;

        const session = bot.session({
          type: 'message',
          user: {
            id: data.uid,
            name: data.username,
            avatar: (data.avatar.startsWith('http')) ? data.avatar : `https://static.codemao.cn/rose/v0/images/icon/${data.avatar}`
          },
          message: {
            messageId: String(data.messageId),
            content: data.message,
            elements: h.parse(data.message),
          },
          timestamp: Number(data.timestamp),
        });

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.smRoom;
        }

        session.platform = 'iirose';
        session.subtype = 'group';
        session.subsubtype = 'group';
        session.guildId = guildId;
        session.content = data.message;
        session.channelId = `public:${guildId}`;
        session.selfId = uid;
        session.isDirect = false;

        bot.dispatch(session);
        break;
      }

      case 'leaveRoom': {
        // 作为事件
        const data = obj.leaveRoom;
        if (!data) return;

        let uid = bot.ctx.config.uid;

        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        const event = {
          selfId: uid,
          type: 'room-leave',
          platform: 'iirose',
          timestamp: Date.now(),
          userId: data.uid,
          username: data.username,
          user: {
            id: data.uid,
            name: data.username
          },
          message: {
            messageId: data.uid + 'leaveRoom',
            content: 'leaveRoom',
            elements: h.parse('leaveRoom'),
          },
          guildId: data.room,
        };

        // const session = {
        //   // 开启兼容性
        //   // type: 'guild-deleted',
        //   type: 'room-leave',
        //   userId: data.uid,
        //   username: data.username,
        //   timestamp: Number(data.timestamp),
        //   author: {
        //     userId: data.uid,
        //     avatar: data.avatar,
        //     username: data.username,
        //   },
        //   platform: 'iirose',
        //   guildId: data.room,
        //   selfId: bot.ctx.config.uid,
        //   bot: bot,
        //   data: data,
        //   user: {
        //     id: data.uid,
        //     name: data.username
        //   },
        //   message: {
        //     messageId: data.uid + 'leaveRoom',
        //     content: 'leaveRoom',
        //     elements: h.parse('leaveRoom'),
        //   }
        // };

        const session = bot.session(event);
        session.guildId = bot.ctx.config.roomIdfa;
        bot.ctx.emit('iirose/leaveRoom', session, data);

        // const sessionV2: passiveEvent.leaveRoomEvent = {
        //   type: 'leaveRoom',
        //   userId: data.uid,
        //   username: data.username,
        //   author: {
        //     userId: data.uid,
        //     avatar: data.avatar,
        //     username: data.username,
        //   },
        //   platform: 'iirose',
        //   guildId: data.room,
        //   selfId: bot.ctx.config.uid,
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // }

        // bot.ctx.emit('iirose/leaveRoom', sessionV2);
        break;
      }

      case 'joinRoom': {
        // 作为事件
        const data = obj.joinRoom;
        if (!data) return;

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;

        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.sm;
        }

        const event = {
          type: 'room-join',
          userId: data.uid,
          username: data.username,
          timestamp: Number(data.timestamp),
          author: {
            userId: data.uid,
            avatar: (data.avatar.startsWith('http')) ? data.avatar : `https://static.codemao.cn/rose/v0/images/icon/${data.avatar}`,
            username: data.username,
          },
          platform: 'iirose',
          guildId: guildId,
          selfId: uid,
          bot: bot,
          data: data,
          user: {
            id: data.uid,
            name: data.username
          },
          message: {
            messageId: data.uid + 'joinRoom',
            content: 'joinRoom',
            elements: h.parse('joinRoom'),
          },
        };

        const session = bot.session(event);
        session.guildId = guildId;
        bot.ctx.emit('iirose/joinRoom', session, data);

        // const sessionV2: passiveEvent.joinRoomEvent = {
        //   type: 'joinRoom',
        //   userId: data.uid,
        //   username: data.username,
        //   author: {
        //     userId: data.uid,
        //     avatar: data.avatar,
        //     username: data.username,
        //   },
        //   platform: 'iirose',
        //   guildId: bot.ctx.config.roomId,
        //   selfId: bot.ctx.config.uid,
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };

        // const botSession = bot.session(session) as Session;
        // botSession.guildId = bot.ctx.config.roomId
        // bot.ctx.emit('iirose/joinRoom', sessionV2);
        break;
      }

      case 'privateMessage': {
        if (!obj.privateMessage) return;
        bot.setMessage(String(obj.privateMessage.messageId), {
          messageId: String(obj.privateMessage.messageId),
          isDirect: true,
          content: obj.privateMessage.message,
          timestamp: Number(obj.privateMessage.timestamp),
          author: {
            userId: obj.privateMessage.uid,
            avatar: obj.privateMessage.avatar,
            username: obj.privateMessage.username,
            nickname: obj.privateMessage.username,
          },
        });

        obj.privateMessage.message = await clearMsg(obj.privateMessage.message, bot);
        const data = obj.privateMessage;

        const session = bot.session({
          type: 'message',
          user: {
            id: data.uid,
            name: data.username,
            avatar: (data.avatar.startsWith('http')) ? data.avatar : `https://static.codemao.cn/rose/v0/images/icon/${data.avatar}`
          },
          message: {
            messageId: String(data.messageId),
            content: data.message,
            elements: h.parse(data.message),
          },
          timestamp: Number(data.timestamp),
        });
        session.platform = 'iirose';
        session.subtype = 'private';
        session.subsubtype = 'private';
        session.isDirect = true;
        session.content = data.message;
        session.channelId = `private:${data.uid}`;

        let uid = bot.ctx.config.uid;

        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        session.selfId = uid;
        session.isDirect = true;

        bot.dispatch(session);
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

        // const session: passiveEvent.damakuEvent = {
        //   type: 'damaku',
        //   userId: data.username,
        //   author: {
        //     userId: data.username,
        //     avatar: data.avatar,
        //     username: data.username,
        //   },
        //   platform: 'iirose',
        //   // 房间地址
        //   guildId: 'damaku',
        //   selfId: bot.ctx.config.uid,
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };

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
        // const session: passiveEvent.switchRoomEvent = {
        //   type: 'switchRoom',
        //   platform: 'iirose',
        //   guildId: bot.config.roomId,
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: obj.switchRoom
        // };

        bot.ctx.emit('iirose/switchRoom', session, obj.switchRoom);
        break;
      }

      case 'music': {
        // 音乐
        const data = obj.music;

        // const session: passiveEvent.musicEvent = {
        //   type: 'music',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };
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

        // const session: passiveEvent.paymentCallbackEvent = {
        //   type: 'paymentCallback',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };

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

        // const session: passiveEvent.getUserListCallbackEvent = {
        //   type: 'getUserListCallback',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };

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

        // const session: passiveEvent.userProfileCallbackEvent = {
        //   type: 'userProfileCallback',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };
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

        // const session: passiveEvent.bankCallbackEvent = {
        //   type: 'bankCallback',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };
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

        // const session: passiveEvent.mediaListCallbackEvent = {
        //   type: 'mediaListCallback',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };
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

        // const session: passiveEvent.selfMoveEvent = {
        //   type: 'selfMove',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data
        // };
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

        // const session: passiveEvent.mailboxMessageEvent = {
        //   type: 'mailboxMessage',
        //   platform: 'iirose',
        //   send: (data) =>
        //   {
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.public) { bot.sendMessage('public:', data.public.message); }
        //     // eslint-disable-next-line no-prototype-builtins
        //     if (data.private) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
        //   },
        //   bot: bot,
        //   data: data,
        // };

        const event = {
          type: 'mailboxMessage',
          platform: 'iirose',
          guildId: bot.config.roomId
        };

        const session = bot.session(event);

        bot.ctx.emit('iirose/mailboxMessage', session, data);
        break;
      }

      default: {
        break;
      }
    }
  }
};

async function clearMsg(msg: string, bot: IIROSE_Bot)
{
  const result: [RegExp, string, string][] = [
    [/\[\*([\s\S]+?)\*\]/g, '<at name="', '"/>'],
    [/\[@([\s\S]+?)@\]/g, '<at id="', '"/>'],
    [/(https*:\/\/[\s\S]+?\.(png|jpg|jpeg|gif))(#e)*/g, '<img src="', '"/>'],
  ];

  let msg1 = msg;
  for (const reg of result)
  {
    const Reg = reg[0];
    const matchArr = msg1.match(Reg);

    if (matchArr)
    {
      let findIndex = -1;
      const stringTemp: string[] = [];

      // 第一次遍历，替换占位符并保存原始匹配
      matchArr.forEach(v =>
      {
        findIndex++;
        msg1 = msg1.replace(v, `\^\$${findIndex}\$\^`);
        stringTemp.push(v);
      });

      // 第二次遍历，处理并替换回真实内容
      for (let index = 0; index < stringTemp.length; index++)
      {
        let v = stringTemp[index];
        let replacement = '';
        if (reg[1].startsWith('<at name="'))
        {
          // at by name: [*name*]
          const name = v.substring(2, v.length - 2);
          const user = await bot.internal.getUserByName(name);
          // 如果找不到用户，则保留原始文本
          replacement = user ? `${h('at', { id: user.id, name })}` : v;
        } else if (reg[1].startsWith('<at id="'))
        {
          // at by id: [@id@]
          const id = v.substring(2, v.length - 2);
          const user = await bot.internal.getUserById(id);
          // 如果找不到用户，则保留原始文本
          replacement = user ? `${h('at', { id, name: user.name })}` : v;
        } else if (reg[1].startsWith('<img src="'))
        {
          // image
          const cleanUrl = v.replace(/#e$/, '');
          replacement = `${h('img', { src: cleanUrl })}`;
        }
        msg1 = msg1.replace(`\^\$${index}\$\^`, replacement);
      }
    }
  }

  return msg1;
}
