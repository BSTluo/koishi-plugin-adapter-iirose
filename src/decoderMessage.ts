import { IIROSE_Bot } from './bot'
import { MessageType } from './decoder'
import { h } from '@satorijs/satori'
import { Events, EventsCallBackOrigin } from './event'
import { messageObjList } from './messageTemp'

export const decoderMessage = (obj: MessageType, bot: IIROSE_Bot) => {
  // 定义会话列表

  for (const key in obj) {
    switch (key) {
      case 'userlist': {
        bot.socket.send('')
        break
      }

      case 'publicMessage': {
        messageObjList[String(obj.publicMessage.messageId)] = {
          messageId: String(obj.publicMessage.messageId),
          isDirect: true,
          content: obj.publicMessage.message,
          timestamp: Number(obj.publicMessage.timestamp),
          author: {
            userId: obj.publicMessage.uid,
            avatar: obj.publicMessage.avatar,
            username: obj.publicMessage.username,
            nickname: obj.publicMessage.username,
          }
        }

        obj.publicMessage.message = clearMsg(obj.publicMessage.message)
        const data = obj.publicMessage

        const session = bot.session({
          type: 'message',
          userId: data.username,
          messageId: String(data.messageId),
          timestamp: Number(data.timestamp),
          content: data.message,
          elements: h.parse(data.message),
          author: {
            userId: data.uid,
            avatar: data.avatar,
            username: data.username,
            nickname: data.username,
          }
        })
        session.platform = 'iirose'
        session.subtype = 'group'
        session.subsubtype = 'group'
        session.guildId = bot.ctx.config.roomId
        session.content = data.message
        session.channelId = `public:${bot.ctx.config.roomId}`
        session.selfId = bot.ctx.config.uid
        session.isDirect = false

        bot.dispatch(session)
        break
      }

      case 'leaveRoom': {
        // 作为事件
        const data = obj.leaveRoom

        const session: EventsCallBackOrigin = {
          // 开启兼容
          // type: 'guild-deleted',
          type: 'room-leave',
          userId: data.username,
          timestamp: Number(data.timestamp),
          author: {
            userId: data.uid,
            avatar: data.avatar,
            username: data.username,
          },
          platform: 'iirose',
          guildId: data.room,
          selfId: bot.ctx.config.uid,
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/leaveRoom', session, data)
        break
      }

      case 'joinRoom': {
        // 作为事件
        const data = obj.joinRoom

        const session: EventsCallBackOrigin = {
          // 开启兼容
          // type: 'guild-added',
          type: 'room-join',
          userId: data.username,
          timestamp: Number(data.timestamp),
          author: {
            userId: data.uid,
            avatar: data.avatar,
            username: data.username,
          },
          platform: 'iirose',
          guildId: data.room,
          selfId: bot.ctx.config.uid,
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }
        bot.ctx.emit('iirose/joinRoom', session, data)
        break
      }

      case 'privateMessage': {
        messageObjList[String(obj.privateMessage.messageId)] = {
          messageId: String(obj.privateMessage.messageId),
          isDirect: true,
          content: obj.privateMessage.message,
          timestamp: Number(obj.privateMessage.timestamp),
          author: {
            userId: obj.privateMessage.uid,
            avatar: obj.privateMessage.avatar,
            username: obj.privateMessage.username,
            nickname: obj.privateMessage.username,
          }
        }

        obj.privateMessage.message = clearMsg(obj.privateMessage.message)
        const data = obj.privateMessage

        const session = bot.session({
          type: 'message',
          userId: data.username,
          messageId: String(data.messageId),
          timestamp: Number(data.timestamp),
          elements: h.parse(data.message),
          author: {
            userId: data.uid,
            avatar: data.avatar,
            username: data.username,
            nickname: data.username,
          }
        })
        session.platform = 'iirose'
        session.subtype = 'private'
        session.subsubtype = 'private'
        session.content = data.message
        session.channelId = `private:${data.uid}`
        session.selfId = bot.ctx.config.uid
        session.isDirect = true

        bot.dispatch(session)
        break
      }

      case 'damaku': {
        const data = obj.damaku

        const session: EventsCallBackOrigin = {
          type: 'damaku',
          userId: data.username,
          author: {
            userId: data.username,
            avatar: data.avatar,
            username: data.username,
          },
          platform: 'iirose',
          // 房间地址
          guildId: 'damaku',
          selfId: bot.ctx.config.uid,
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }


        bot.ctx.emit('iirose/newDamaku', session, data)
        break
      }

      case 'switchRoom': {
        // 这玩意真的是机器人能够拥有的吗
        const data = obj.switchRoom
        const session: EventsCallBackOrigin = {
          type: 'switchRoom',
          platform: 'iirose',
          guildId: bot.config.roomId,
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/switchRoom', session, data)
        break
      }

      case 'music': {
        // 音乐
        const data = obj.music

        const session: EventsCallBackOrigin = {
          type: 'music',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/newMusic', session, data)
        break
      }

      case 'paymentCallback': {
        const data = obj.paymentCallback

        const session: EventsCallBackOrigin = {
          type: 'paymentCallback',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/before-payment', session, data)
        break
      }

      case 'getUserListCallback': {
        const data = obj.getUserListCallback

        const session: EventsCallBackOrigin = {
          type: 'getUserListCallback',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/before-getUserList', session, data)
        break
      }

      case 'userProfileCallback': {
        const data = obj.userProfileCallback

        const session: EventsCallBackOrigin = {
          type: 'userProfileCallback',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/before-userProfile', session, data)
        break
      }

      case 'bankCallback': {
        const data = obj.bankCallback

        const session: EventsCallBackOrigin = {
          type: 'bankCallback',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/before-bank', session, data)
        break
      }

      case 'mediaListCallback': {
        const data = obj.mediaListCallback

        const session: EventsCallBackOrigin = {
          type: 'mediaListCallback',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/before-mediaList', session, data)
        break
      }

      case 'selfMove': {
        const data = obj.selfMove

        const session: EventsCallBackOrigin = {
          type: 'selfMove',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/selfMove', session, data)
        // 自身移动房间
        break
      }

      case 'mailboxMessage': {
        const data = obj.mailboxMessage

        const session: EventsCallBackOrigin = {
          type: 'mailboxMessage',
          platform: 'iirose',
          send: (data) => {
            if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message) }
            if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message) }
          },
          bot: bot
        }

        bot.ctx.emit('iirose/mailboxMessage', session, data)
        break
      }

      default: {
        break
      }
    }
  }
}

function clearMsg(msg: string) {
  /*
  result规则：
  [
    匹配规则,
    koishi元素前缀,
    koishi元素后缀,
    若干个文字过滤项..
  ]
  */
  const result = [
    [/\s\[\*(\S+)\*\]\s/g, '<at id="', '"></at>', /\s\[\*/g, /\*\]\s/g],
    [/https*:\/\/[\s\S]+?\.(png|jpg|jpeg|gif)(#e)*/g, '<image url="', '"></image>', /\[/g, /]/g]
  ]

  let msg1 = msg
  for (let reg of result) {
    const Reg = reg[0]
    const matchArr = msg1.match(Reg)

    if (matchArr) {
      let findIndex = -1
      let stringTemp = []

      matchArr.forEach(v => {
        if (reg.length > 3) {
          for (let i = 3; i < reg.length; i++) {
            msg1 = msg1.replace(reg[i], '')
            v = v.replace(reg[i], '')
          }
        }

        findIndex++
        msg1 = msg1.replace(v, `#$${findIndex}$#`)
        stringTemp.push(v)
      })

      stringTemp.forEach((v, index) => {
        msg1 = msg1.replace(`#$${index}$#`, reg[1] + v + reg[2])
      })
    }
  }

  return msg1
}
