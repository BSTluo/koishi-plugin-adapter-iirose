import { IIROSE_Bot } from './bot'
import { MessageType } from './decoder'
import { h } from '@satorijs/satori'

export const decoderMessage = (obj: MessageType, bot: IIROSE_Bot) => {
  // 定义会话列表

  for (const key in obj) {
    switch (key) {
      case 'userlist': {
        break
      }

      case 'publicMessage': {
        obj.publicMessage.message = clearMsg(obj.publicMessage.message)
        const session = bot.session({
          type: 'message',
          messageId: String(obj.publicMessage.messageId),
          timestamp: Number(obj.publicMessage.timestamp),
          content: obj.publicMessage.message,
          elements: h.parse(obj.publicMessage.message),
          subtype: 'group',
          author: {
            userId: obj.publicMessage.uid,
            avatar: obj.publicMessage.avatar,
            username: obj.publicMessage.username,
            nickname: obj.publicMessage.username,
          },
        })

        session.guildId = obj.publicMessage.uid
        session.content = obj.publicMessage.message
        session.channelId = 'public'
        session.selfId = bot.ctx.config.uid

        bot.dispatch(session)
        break
      }

      case 'leaveRoom': {
        break
      }

      case 'joinRoom': {
        break
      }

      case 'privateMessage': {
        obj.privateMessage.message = clearMsg(obj.privateMessage.message)

        const session = bot.session({
          type: 'message',
          messageId: String(obj.privateMessage.messageId),
          timestamp: Number(obj.privateMessage.timestamp),
          elements: h.parse(obj.privateMessage.message),
          subtype: 'private',
          author: {
            userId: obj.privateMessage.uid,
            avatar: obj.privateMessage.avatar,
            username: obj.privateMessage.username,
            nickname: obj.privateMessage.username,
          },
        })
        session.guildId = obj.privateMessage.uid
        session.content = obj.privateMessage.message
        session.channelId = 'private'
        session.selfId = bot.ctx.config.uid

        bot.dispatch(session)
        break
      }

      case 'damaku': {
        break
      }

      case 'switchRoom': {
        break
      }

      case 'music': {
        break
      }

      case 'paymentCallback': {
        break
      }

      case 'getUserListCallback': {
        break
      }

      case 'userProfileCallback': {
        break
      }

      case 'bankCallback': {
        break
      }

      case 'mediaListCallback': {
        break
      }

      case 'selfMove': {
        break
      }

      case 'mailboxMessage': {
        break
      }

      default: {
        break
      }
    }
  }
}

function clearMsg(msg: string) {
  const result = /https*:\/\/[\s\S]+?\.(png|jpg|jpeg|gif)(#e)*/g
  let msg1 = msg
  const arr = msg1.match(result)

  if (arr) {
    msg1 = msg1.replace(/\[/g, '').replace(/]/g, '')

    arr.forEach(element => {
      msg1 = msg1.replace(new RegExp(element, 'g'), `<image url="${element}"></image>`)
    })
  }
  return msg1
}
