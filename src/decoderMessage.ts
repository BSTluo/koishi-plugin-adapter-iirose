import { IIROSE_Bot } from './bot'
import { MessageType } from './decoder'
import { h } from '@satorijs/satori'
import { Events } from './event'
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
        messageObjList[obj.publicMessage.messageId] = {
          messageId: String(obj.publicMessage.messageId),
          isDirect: true,
          content: obj.publicMessage.message,
          timestamp: obj.publicMessage.timestamp,
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
          },
          platform: 'iirose',
        })
        session.subtype = 'group'
        session.subsubtype = 'group'
        session.guildId = bot.ctx.config.roomId
        session.content = data.message
        session.channelId = 'public'
        session.selfId = bot.ctx.config.uid
        
        bot.dispatch(session)
        break
      }

      case 'leaveRoom': {
        // 作为事件
        const data = obj.leaveRoom

        const session = bot.session({
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
        })

        // 房间地址
        session.guildId = data.room
        session.selfId = bot.ctx.config.uid

        bot.ctx.emit('iirose/leaveRoom', session, data)
        break
      }

      case 'joinRoom': {
        // 作为事件
        const data = obj.joinRoom

        const session = bot.session({
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
        })
        // 房间地址
        session.guildId = data.room
        session.selfId = bot.ctx.config.uid

        bot.ctx.emit('iirose/joinRoom', session, data)
        break
      }

      case 'privateMessage': {
        messageObjList[obj.publicMessage.messageId] = {
          messageId: String(obj.publicMessage.messageId),
          isDirect: true,
          content: obj.publicMessage.message,
          timestamp: obj.publicMessage.timestamp,
          author: {
            userId: obj.publicMessage.uid,
            avatar: obj.publicMessage.avatar,
            username: obj.publicMessage.username,
            nickname: obj.publicMessage.username,
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
          },
          platform: 'iirose',
        })
        session.subtype = 'private'
        session.subsubtype = 'private'
        session.content = data.message
        session.channelId = `private:${data.uid}`
        session.selfId = bot.ctx.config.uid
        
        console.log(session)
        bot.dispatch(session)
        break
      }

      case 'damaku': {
        const data = obj.damaku

        const session = bot.session({
          type: 'damaku',
          userId: data.username,
          author: {
            userId: data.username,
            avatar: data.avatar,
            username: data.username,
          },
          platform: 'iirose',
        })
        // 房间地址
        session.guildId = 'damaku'
        session.selfId = bot.ctx.config.uid

        bot.ctx.emit('iirose/newDamaku', session, data)
        break
      }

      case 'switchRoom': {
        // 这玩意真的是机器人能够拥有的吗
        break
      }

      case 'music': {
        // 音乐
        const data = obj.music

        const session = bot.session({
          type: 'music',
          platform: 'iirose',
        })

        bot.ctx.emit('iirose/newMusic', session, data)
        break
      }

      case 'paymentCallback': {
        const data = obj.paymentCallback

        const session = bot.session({
          type: 'paymentCallback',
          platform: 'iirose',
        })

        bot.ctx.emit('iirose/before-payment', session, data)
        break
      }

      case 'getUserListCallback': {
        const data = obj.getUserListCallback

        const session = bot.session({
          type: 'getUserListCallback',
          platform: 'iirose',
        })

        bot.ctx.emit('iirose/before-getUserList', session, data)
        break
      }

      case 'userProfileCallback': {
        const data = obj.userProfileCallback

        const session = bot.session({
          type: 'userProfileCallback',
          platform: 'iirose',
        })

        bot.ctx.emit('iirose/before-userProfile', session, data)
        break
      }

      case 'bankCallback': {
        const data = obj.bankCallback

        const session = bot.session({
          type: 'bankCallback',
          platform: 'iirose',
        })

        bot.ctx.emit('iirose/before-bank', session, data)
        break
      }

      case 'mediaListCallback': {
        const data = obj.mediaListCallback

        const session = bot.session({
          type: 'mediaListCallback',
          platform: 'iirose',
        })

        bot.ctx.emit('iirose/before-mediaList', session, data)
        break
      }

      case 'selfMove': {
        const data = obj.selfMove

        const session = bot.session({
          type: 'selfMove',
          platform: 'iirose',
        })

        bot.ctx.emit('iirose/selfMove', session, data)
        // 自身移动房间
        break
      }

      case 'mailboxMessage': {
        const data = obj.mailboxMessage

        const session = bot.session({
          type: 'mailboxMessage',
          platform: 'iirose',
        })

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
    [/\s\[\*(\S+)\*\]\s/g, '<at id="', '"></at>'],
    [/https*:\/\/[\s\S]+?\.(png|jpg|jpeg|gif)(#e)*/g, '<image url="', '"></image>', /\[/g, /]/g]
  ]

  let msg1 = msg
  for (let reg of result) {
    const arr = msg1.match(reg[0])
    if (arr) {
      if (reg.length > 3) {
        for (let i = 4; i < reg.length; i++) {
          msg1 = msg1.replace(reg[i], '')
        }
      }

      arr.forEach(element => {
        msg1 = msg1.replace(new RegExp(element, 'g'), reg[1] + element + reg[2])
      })
    }
  }

  return msg1
}
