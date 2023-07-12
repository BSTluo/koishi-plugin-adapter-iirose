import { IIROSE_Bot } from './bot'
import { MessageType } from './decoder'
import { h } from '@satorijs/satori'

export const decoderMessage = (obj: MessageType, bot: IIROSE_Bot) => {
  // 定义会话列表

  for (const key in obj) {
    switch (key) {
      case 'userlist': {
        bot.socket.send('')
        break
      }

      case 'publicMessage': {
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
        session.guildId = data.uid
        session.content = data.message
        session.channelId = 'public'
        session.selfId = bot.ctx.config.uid

        bot.dispatch(session)
        break
      }

      case 'leaveRoom': {
        // 作为为事件
        break
      }

      case 'joinRoom': {
        // 作为事件
        break
      }

      case 'privateMessage': {
        obj.privateMessage.message = clearMsg(obj.privateMessage.message)
        const data = obj.privateMessage

        const session = bot.session({
          type: 'message',
          userId: data.uid,
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
        bot.dispatch(session)
        break
      }

      case 'damaku': {
        // 获取到弹幕
        break
      }

      case 'switchRoom': {
        break
      }

      case 'music': {
        // 音乐
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
        // 自身移动房间
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
