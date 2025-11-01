import { Follower, Like, mailboxMessage, Payment, RoomNotice } from './MailboxMessage';
import { getUserListCallback, GetUserListCallback } from './GetUserListCallback';
import { mediaListCallback, MediaListCallback } from './MediaListCallback';
import { MessageDeleted, MessageDeletedData } from './MessageDeleted';
import { paymentCallback, PaymentCallback } from './PaymentCallback';
import { privateMessage, PrivateMessage } from './PrivateMessage';
import { publicMessage, PublicMessage } from './PublicMessage';
import { musicMessage, MusicMessage } from './MusicMessage';
import { bankCallback, BankCallback } from './BankCallback';
import { manyMessage, ManyMessage } from './ManyMessage';
import { switchRoom, SwitchRoom } from './SwitchRoom';
import { comparePassword } from '../utils/password';
import { selfMove, SelfMove } from './SelfMove';
import { userList, UserList } from './Userlist';
import { damaku, Damaku } from './Damaku';
import { stock, Stock } from './Stock';
import { music, Music } from './Music';
import { IIROSE_Bot } from '../bot/bot';
import { MemberUpdateData, memberUpdate } from './MemberUpdate';
import { BroadcastMessage, broadcastMessage } from './BroadcastMessage';

export const decoder = (bot: IIROSE_Bot, msg: string): MessageType =>
{
  const len: any = {};

  len.manyMessage = manyMessage(msg, bot);
  len.userlist = userList(msg);
  len.publicMessage = publicMessage(msg);
  len.privateMessage = privateMessage(msg);
  len.damaku = damaku(msg);
  len.memberUpdate = memberUpdate(msg);
  len.switchRoom = switchRoom(msg);
  len.music = music(msg);
  len.paymentCallback = paymentCallback(msg);
  len.getUserListCallback = getUserListCallback(msg);
  len.bankCallback = bankCallback(msg);
  len.mediaListCallback = mediaListCallback(msg);
  len.selfMove = selfMove(msg);
  len.mailboxMessage = mailboxMessage(msg);
  len.musicMessage = musicMessage(msg);
  len.stock = stock(msg, bot);
  len.messageDeleted = MessageDeleted(bot, msg);
  len.broadcastMessage = broadcastMessage(msg);

  const newObj = {};
  for (const key in len)
  {
    // 如果对象属性的值不为空，就保存该属性（如果属性的值为0 false，保存该属性。如果属性的值全部是空格，属于为空。）
    if ((len[key] === 0 || len[key] === false || len[key]) && len[key].toString().replace(/(^\s*)|(\s*$)/g, '') !== '')
    {
      if (key === 'manyMessage')
      {
        newObj[key] = len[key];
      }

      if (len[key].uid)
      {
        let uid = bot.ctx.config.uid;

        if (bot.config.smStart && comparePassword(bot.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        if (len[key].uid !== uid) { newObj[key] = len[key]; }
      } else
      {
        newObj[key] = len[key];
      }
    }
  }
  return newObj;
};

export interface MessageType
{
  manyMessage?: ManyMessage[];
  userlist?: UserList[];
  publicMessage?: PublicMessage;
  privateMessage?: PrivateMessage;
  damaku?: Damaku;
  memberUpdate?: MemberUpdateData;
  switchRoom?: SwitchRoom;
  music?: Music;
  paymentCallback?: PaymentCallback;
  getUserListCallback?: GetUserListCallback[];
  bankCallback?: BankCallback;
  mediaListCallback?: MediaListCallback;
  selfMove?: SelfMove;
  mailboxMessage?: Follower | Like | RoomNotice | Payment;
  musicMessage?: MusicMessage;
  stock?: Stock;
  messageDeleted?: MessageDeletedData;
  broadcastMessage?: BroadcastMessage;
}
