import { h } from 'koishi';
import { IIROSE_Bot } from '../bot/bot';
import { writeWJ } from '../utils/utils';

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

export const userList = async (message: string, bot: IIROSE_Bot) =>
{
  if (message.startsWith('%*"'))
  {
    console.log("========================================");
    console.log(message);
    console.log("========================================");

    const data = message.substring(3);
    const userList: UserList[] = [];

    // 1. 解析用户列表
    data.split('<').forEach((e) =>
    {
      const tmp = e.split('>');
      if (tmp.length >= 9)
      {
        userList.push({
          avatar: tmp[0].startsWith('http') ? tmp[0] : `https://s.iirose.com/images/icon/${tmp[0]}.jpg`,
          username: h.unescape(tmp[2]),
          color: tmp[3],
          room: tmp[4],
          uid: tmp[8],
        });
      }
    });

    // 2. 解析房间信息
    const roomList = {};
    const segments = data.split('<');
    // 匹配一个或多个由下划线连接的、长度至少为10的十六进制字符串
    const roomIdRegex = /^([a-f0-9]{10,}_?)+$/;

    for (let i = 1; i < segments.length; i++)
    {
      const currentSegment = segments[i];
      const candidateId = currentSegment.split('>')[0];

      if (roomIdRegex.test(candidateId))
      {
        const roomDataFields = currentSegment.split('>');
        const idPath = candidateId.split('_');
        const roomName = roomDataFields[1] || '';
        const description = roomDataFields[6] || ''; // 根据固定顺序，简介在第7个字段

        let currentLevel = roomList;
        for (let j = 0; j < idPath.length - 1; j++)
        {
          const idPart = idPath[j];
          if (!currentLevel[idPart])
          {
            currentLevel[idPart] = {};
          }
          currentLevel = currentLevel[idPart];
        }

        const finalId = idPath[idPath.length - 1];
        currentLevel[finalId] = {
          id: finalId,
          name: roomName,
          description: description,
          users: userList.filter(u => u.room === finalId).map(u => u.uid),
          online: userList.filter(u => u.room === finalId).length,
        };
      }
    }

    // 3. 写入 roomlist.json
    if (Object.keys(roomList).length > 0)
    {
      await writeWJ(bot, 'roomlist.json', roomList);
    }

    // 4. 返回用户列表
    return userList;
  }
};
