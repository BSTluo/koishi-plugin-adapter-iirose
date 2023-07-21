import { IIROSE_Bot } from './bot'
import { MessageType } from './decoder'
import { h } from '@satorijs/satori'
import * as Events from './event'

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
          userId: data.uid,
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
        // 作为事件
        const data = obj.leaveRoom
        bot.ctx.emit('iirose/leaveRoom', data)
        break
      }

      case 'joinRoom': {
        // 作为事件
        const data = obj.joinRoom
        bot.ctx.emit('iirose/joinRoom', data)
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

        console.log(session)
        bot.dispatch(session)
        break
      }

      case 'damaku': {
        const data = obj.damaku
        bot.ctx.emit('iirose/newDamaku', data)
        break
      }

      case 'switchRoom': {
        // 这玩意真的是机器人能够拥有的吗
        break
      }

      case 'music': {
        // 音乐
        const data = obj.music
        bot.ctx.emit('iirose/newMusic', data)
        break
      }

      case 'paymentCallback': {
        const data = obj.paymentCallback
        bot.ctx.emit('iirose/before-payment', data)
        break
      }

      case 'getUserListCallback': {
        const data = obj.getUserListCallback
        bot.ctx.emit('iirose/before-getUserList', data)
        break
      }

      case 'userProfileCallback': {
        const data = obj.userProfileCallback
        bot.ctx.emit('iirose/before-userProfile', data)
        break
      }

      case 'bankCallback': {
        const data = obj.bankCallback
        bot.ctx.emit('iirose/before-bank', data)
        break
      }

      case 'mediaListCallback': {
        const data = obj.mediaListCallback
        bot.ctx.emit('iirose/before-mediaList', data)
        break
      }

      case 'selfMove': {
        const data = obj.selfMove
        bot.ctx.emit('iirose/selfMove', data)
        // 自身移动房间
        break
      }

      case 'mailboxMessage': {
        const data = obj.mailboxMessage
        bot.ctx.emit('iirose/mailboxMessage', data)
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
