import { damaku, Damaku } from './Damaku'
import { joinRoom, SystemMessage } from './JoinRoom'
import { leaveRoom } from './LeaveRoom'
import { switchRoom, SwitchRoom } from './SwitchRoom'
import { music, Music } from './Music'
import { paymentCallback, PaymentCallback } from './PaymentCallback'
import { privateMessage, PrivateMessage } from './PrivateMessage'
import { publicMessage, PublicMessage } from './PublicMessage'
import { musicMessage, MusicMessage } from './MusicMessage'
import { manyMessage, ManyMessage } from './ManyMessage'
import { userList, UserList } from './Userlist'
import { getUserListCallback, GetUserListCallback } from './GetUserListCallback'
import { userProfileCallback, UserProfileCallback } from './UserProfileCallback'
import { bankCallback, BankCallback } from './BankCallback'
import { mediaListCallback, MediaListCallback } from './MediaListCallback'
import { selfMove, SelfMove } from './SelfMove'
import { Follower, Like, mailboxMessage, Payment, RoomNotice } from './MailboxMessage'
import { IIROSE_Bot } from '../bot'
import { stock, Stock } from './Stock'

export const decoder = (bot: IIROSE_Bot, msg: string): MessageType => {
  const len: any = {}

  len.manyMessage = manyMessage(msg)
  len.userlist = userList(msg)
  len.publicMessage = publicMessage(msg)
  len.leaveRoom = leaveRoom(msg)
  len.joinRoom = joinRoom(msg)
  len.privateMessage = privateMessage(msg)
  len.damaku = damaku(msg)
  len.switchRoom = switchRoom(msg)
  len.music = music(msg)
  len.paymentCallback = paymentCallback(msg)
  len.getUserListCallback = getUserListCallback(msg)
  len.userProfileCallback = userProfileCallback(msg)
  len.bankCallback = bankCallback(msg)
  len.mediaListCallback = mediaListCallback(msg)
  len.selfMove = selfMove(msg)
  len.mailboxMessage = mailboxMessage(msg)
  len.musicMessage = musicMessage(msg)
  len.stock = stock(msg, bot)

  const newObj = {}
  for (const key in len) {
    // 如果对象属性的值不为空，就保存该属性（如果属性的值为0 false，保存该属性。如果属性的值全部是空格，属于为空。）
    if ((len[key] === 0 || len[key] === false || len[key]) && len[key].toString().replace(/(^\s*)|(\s*$)/g, '') !== '') {
      if (key === 'manyMessage') {
        newObj[key] = len[key]
      }

      if (len[key].uid) {
        if (len[key].uid !== bot.ctx.config.uid) { newObj[key] = len[key] }
      } else {
        newObj[key] = len[key]
      }
    }
  }
  return newObj
}

export interface MessageType {
  manyMessage?: ManyMessage[]
  userlist?: UserList
  publicMessage?: PublicMessage
  leaveRoom?: SystemMessage
  joinRoom?: SystemMessage
  privateMessage?: PrivateMessage
  damaku?: Damaku
  switchRoom?: SwitchRoom
  music?: Music
  paymentCallback?: PaymentCallback
  getUserListCallback?: GetUserListCallback
  userProfileCallback?: UserProfileCallback
  bankCallback?: BankCallback
  mediaListCallback?: MediaListCallback
  selfMove?: SelfMove
  mailboxMessage?: Follower | Like | RoomNotice | Payment
  musicMessage?: MusicMessage
  stock?: Stock
}
