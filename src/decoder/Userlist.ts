import { h } from 'koishi';
import { IIROSE_Bot } from '../bot/bot';

export interface UserList
{
  avatar: string;
  username: string;
  color: string;
  room: string;
  uid: string;
}

export interface RoomInfo
{
  id: string;
  name: string;
  online: number;
  description: string;
  users: string[];
}

export const userList = (message: string, bot: IIROSE_Bot) =>
{
  if (message.startsWith('%*"'))
  {
    // 大包完整的数据内容
    // 请务必慎重打印视检 
    // 仅开发调试的时候再取消注释
    // console.log("========================================");
    // console.log(message);
    // console.log("========================================");

    // 移除开头的 %*"
    const data = message.substring(3);
    const list: UserList[] = [];

    // 使用 '<' 分割成用户数据块
    data.split('<').forEach((e) =>
    {
      // 使用 '>' 分割每个用户数据块的字段
      const tmp = e.split('>');
      if (tmp.length >= 9)
      { // 确保有足够的字段来提取 uid
        list.push({
          avatar: tmp[0].startsWith('http') ? tmp[0] : `http://s.iirose.com/images/icon/${tmp[0]}.jpg`,
          username: h.unescape(tmp[2]),
          color: tmp[3],
          room: tmp[4],
          uid: tmp[8],
        });
      }
    });

    return list;
  }
};
