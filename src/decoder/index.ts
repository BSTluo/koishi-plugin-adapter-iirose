import { mailboxMessage, MailboxMessageData } from './messages/MailboxMessage';
import { mediaListCallback, MediaListCallback } from './messages/MediaListCallback';
import { BroadcastMessage, broadcastMessage } from './messages/BroadcastMessage';
import { MessageDeleted, MessageDeletedData } from './messages/MessageDeleted';
import { paymentCallback, PaymentCallback } from './messages/PaymentCallback';
import { privateMessage, PrivateMessage } from './messages/PrivateMessage';
import { MemberUpdateData, memberUpdate } from './messages/MemberUpdate';
import { publicMessage, PublicMessage } from './messages/PublicMessage';
import { bulkDataPacket, UserList } from './messages/BulkDataPacket';
import { musicMessage, MusicMessage } from './messages/MusicMessage';
import { bankCallback, BankCallback } from './messages/BankCallback';
import { manyMessage, ManyMessage } from './messages/ManyMessage';
import { switchRoom, SwitchRoom } from './messages/SwitchRoom';
import { selfMove, SelfMove } from './messages/SelfMove';
import { comparePassword } from '../utils/password';
import { music, Music } from './messages/Music';
import { stock, Stock } from './messages/Stock';
import { IIROSE_Bot } from '../bot/bot';

export const decoder = async (bot: IIROSE_Bot, msg: string): Promise<MessageType> =>
{
  // 精准处理用户加入和消息回显的复合消息
  // fix: https://github.com/iirose-plugins/koishi-plugin-adapter-iirose/issues/23
  if (msg.includes("'1>s>") && msg.includes('>' + bot.config.usename + '>'))
  {
    const parts = msg.split('<');
    const joinMessage = parts.find(part => part.includes("'1>s>"));
    if (joinMessage)
    {
      // 如果找到了加入消息，就只处理这一部分
      msg = joinMessage;
    }
  }

  const len: any = {};

  len.manyMessage = manyMessage(msg, bot);
  len.userlist = await bulkDataPacket(msg, bot);
  len.publicMessage = publicMessage(msg);
  len.privateMessage = privateMessage(msg);
  len.memberUpdate = memberUpdate(msg);
  // len.switchRoom = switchRoom(msg);
  len.music = music(msg);
  len.paymentCallback = paymentCallback(msg);
  len.bankCallback = bankCallback(msg, bot);
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
  mailboxMessage?: MailboxMessageData;
  musicMessage?: MusicMessage;
  stock?: Stock;
  messageDeleted?: MessageDeletedData;
  broadcastMessage?: BroadcastMessage;
}
