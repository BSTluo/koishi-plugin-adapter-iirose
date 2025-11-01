import { decode } from '../utils/entities';

export interface replyMessage
{
  message: string;
  username: string;
  time: number;
}

interface data
{
  type?: string;
  timestamp: number;
  avatar: string;
  username: string;
  message?: string;
  color: string;
  uid: string;
  title: string;
  messageId?: number;
  replyMessage?: replyMessage[] | null;
}

export interface MusicMessage
{
  type?: string;
  timestamp: number;
  avatar: string;
  username: string;
  message?: string;
  color: string;
  uid: string;
  title: string;
  messageId?: number;
  musicName: string;
  musicSinger: string;
  musicPic: string;
  musicColor: string;
}

const replyMsg = (msg: string): replyMessage[] | null =>
{
  if (msg.includes(' (_hr) '))
  {
    const replies: replyMessage[] = [];

    msg.split(' (hr_) ').forEach(e =>
    {
      if (e.includes(' (_hr) '))
      {
        const tmp = e.split(' (_hr) ');
        const user = tmp[1].split('_');

        replies.unshift({
          message: decode(tmp[0]),
          username: decode(user[0]),
          time: Number(user[1]),
        });

        replies.sort((a, b) =>
        {
          return (a.time - b.time);
        });
      } else
      {
        // @ts-ignore
        replies.unshift(e);
      }
    });

    return replies;
  }

  return null;
};

export const musicMessageAnalyze = (input: data): MusicMessage =>
{
  const { timestamp, avatar, username, message, color, uid, title, messageId } = input;
  const musicData = message.replace(/ /g, '').split('>');

  return {
    timestamp,
    avatar,
    username,
    color,
    uid,
    title,
    messageId,
    musicName: musicData[1],
    musicSinger: musicData[2],
    musicPic: musicData[3],
    musicColor: musicData[4],
  };
};

export const musicMessage = (input: string) =>
{
  if (input.substring(0, 1) !== '"') return null;

  const message: string = input.substring(1);

  if (message.indexOf('<') === -1)
  {
    const tmp = message.split('>');
    if (tmp.length === 11)
    {
      if (/^\d+$/.test(tmp[0]))
      {
        const reply = replyMsg(tmp[3]);
        const message = reply ? String(reply.shift()) : tmp[3];

        const msg = {
          timestamp: Number(tmp[0]),
          avatar: tmp[1],
          username: decode(tmp[2]),
          message: decode(message),
          color: tmp[5],
          uid: tmp[8],
          title: tmp[9] === "'108" ? '花瓣' : tmp[9],
          messageId: Number(tmp[10]),
          replyMessage: reply,
        };

        if (message.startsWith('m__4@')) { return musicMessageAnalyze(msg); }
      }
    }
  }
};
