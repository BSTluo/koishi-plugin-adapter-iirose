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
    // 恢复调试日志输出
    console.log("========================================");
    console.log(message);
    console.log("========================================");

    const data = message.substring(3);
    const userList: UserList[] = [];
    const roomIds = new Set<string>();

    // 1. 解析用户列表并收集 Room ID
    data.split('<').forEach((e) =>
    {
      const tmp = e.split('>');
      if (tmp.length >= 9)
      {
        const room = tmp[4];
        if (room) roomIds.add(room);
        userList.push({
          avatar: tmp[0].startsWith('http') ? tmp[0] : `https://s.iirose.com/images/icon/${tmp[0]}.jpg`,
          username: h.unescape(tmp[2]),
          color: tmp[3],
          room: room,
          uid: tmp[8],
        });
      }
    });

    // 2. 解析房间信息
    const roomList: Record<string, RoomInfo> = {};
    const roomDataSegments = data.split('<');

    for (const roomId of roomIds)
    {
      // 查找包含房间ID的特定段
      // 格式为 <roomId_... 或 <roomId>...
      const roomSegment = roomDataSegments.find(s => s.startsWith(roomId + '_') || s.startsWith(roomId + '>'));

      if (roomSegment)
      {
        // 房间数据在 <roomId... 之前的部分
        const roomDataString = data.substring(0, data.indexOf('<' + roomSegment));
        const lastPart = roomDataString.split('<').pop();

        if (lastPart)
        {
          const fields = lastPart.split('>');
          // 倒数第二个字段是简介
          const description = fields[fields.length - 2] || '';

          roomList[roomId] = {
            id: roomId,
            name: roomSegment.split('>')[1] || '',
            online: 0, // 无法从此结构中直接获取，暂定为0
            description: description,
            users: userList.filter(u => u.room === roomId).map(u => u.uid),
          };
        }
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
