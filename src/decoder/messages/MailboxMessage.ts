import { decode } from '../../utils/entities';

export interface RoomNotice
{
  notice: string;
  background: string;
  timestamp: number;
}

export interface Follower
{
  username: string;
  avatar: string;
  gender: string;
  background: string;
  timestamp: number;
  color: string;
}

export interface Like
{
  username: string;
  avatar: string;
  gender: string;
  background: string;
  timestamp: number;
  color: string;
  message: string;
}

export interface Payment
{
  username: string;
  avatar: string;
  gender: string;
  background: string;
  timestamp: number;
  color: string;
  message: string;
  money: number;
}

/**
 * 解析邮箱消息 (包括房间公告, 关注, 点赞, 支付等)
 * @param message 消息
 * @returns {any}
 */
export const mailboxMessage = (message: string) =>
{
  if (/^@/.test(message))
  {
    let parser = false;

    message.slice(2).split('<').forEach(e =>
    {
      const tmp = e.split('>');
      if (tmp.length === 3)
      {
        parser = true;
        // roomNotice

        return {
          notice: decode(tmp[0]),
          background: tmp[1],
          timestamp: Number(tmp[2]),
        };
      }
      if (tmp.length === 7)
      {
        if (/^'\^/.test(tmp[3]))
        {
          parser = true;
          const data = {
            username: decode(tmp[0]),
            avatar: tmp[1],
            gender: tmp[2],
            background: tmp[4],
            timestamp: Number(tmp[5]),
            color: tmp[6],
          };
          // follower
          return data;
        } else if (/^'\*/.test(tmp[3]))
        {
          parser = true;
          const data = {
            username: decode(tmp[0]),
            avatar: tmp[1],
            gender: tmp[2],
            background: tmp[4],
            timestamp: Number(tmp[5]),
            color: tmp[6],
            message: decode(tmp[3].substring(3)),
          };
          // like
          return data;
        } else if (/^'\$/.test(tmp[3]))
        {
          parser = true;
          const data = {
            username: decode(tmp[0]),
            avatar: tmp[1],
            gender: tmp[2],
            money: parseInt(tmp[3].split(' ')[0].substring(2)),
            message: decode(tmp[3].split(' ')[1] || ''),
            background: tmp[4],
            timestamp: Number(tmp[5]),
            color: tmp[6],
          };
          // payment
          return data;
        }
      }
    });

    return parser;
  }
};
