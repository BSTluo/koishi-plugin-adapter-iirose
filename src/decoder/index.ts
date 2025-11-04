import { Follower, Like, mailboxMessage, Payment, RoomNotice } from './decoders/MailboxMessage';
import { mediaListCallback, MediaListCallback } from './decoders/MediaListCallback';
import { BroadcastMessage, broadcastMessage } from './decoders/BroadcastMessage';
import { MessageDeleted, MessageDeletedData } from './decoders/MessageDeleted';
import { paymentCallback, PaymentCallback } from './decoders/PaymentCallback';
import { privateMessage, PrivateMessage } from './decoders/PrivateMessage';
import { MemberUpdateData, memberUpdate } from './decoders/MemberUpdate';
import { publicMessage, PublicMessage } from './decoders/PublicMessage';
import { bulkDataPacket, UserList } from './decoders/BulkDataPacket';
import { musicMessage, MusicMessage } from './decoders/MusicMessage';
import { bankCallback, BankCallback } from './decoders/BankCallback';
import { manyMessage, ManyMessage } from './decoders/ManyMessage';
import { switchRoom, SwitchRoom } from './decoders/SwitchRoom';
import { selfMove, SelfMove } from './decoders/SelfMove';
import { comparePassword } from '../utils/password';
import { music, Music } from './decoders/Music';
import { stock, Stock } from './decoders/Stock';
import { IIROSE_Bot } from '../bot/bot';

export const decoder = async (bot: IIROSE_Bot, msg: string): Promise<MessageType> =>
{
  const len: any = {};

  len.manyMessage = manyMessage(msg, bot);
  len.userlist = await bulkDataPacket(msg, bot);
  len.publicMessage = publicMessage(msg);
  len.privateMessage = privateMessage(msg);
  len.memberUpdate = memberUpdate(msg);
  // len.switchRoom = switchRoom(msg);
  len.music = music(msg);
  len.paymentCallback = paymentCallback(msg);
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
  memberUpdate?: MemberUpdateData;
  switchRoom?: SwitchRoom;
  music?: Music;
  paymentCallback?: PaymentCallback;
  bankCallback?: BankCallback;
  mediaListCallback?: MediaListCallback;
  selfMove?: SelfMove;
  mailboxMessage?: Follower | Like | RoomNotice | Payment;
  musicMessage?: MusicMessage;
  stock?: Stock;
  messageDeleted?: MessageDeletedData;
  broadcastMessage?: BroadcastMessage;
}
