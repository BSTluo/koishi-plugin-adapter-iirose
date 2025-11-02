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
    const data = message.substring(3);
    const [roomData, userData] = data.split("''<");

    // 1. 解析房间信息
    const roomList: Record<string, RoomInfo> = {};
    if (roomData)
    {
      const rooms = roomData.split('|');
      for (const room of rooms)
      {
        const roomInfo = room.split('"');
        if (roomInfo.length >= 6)
        {
          const roomId = roomInfo[0];
          roomList[roomId] = {
            id: roomId,
            name: roomInfo[1],
            online: parseInt(roomInfo[4], 10) || 0,
            description: roomInfo[5],
            users: []
          };
        }
      }
    }

    // 2. 解析用户信息并关联到房间
    const userList: UserList[] = [];
    if (userData)
    {
      userData.split('<').forEach((e) =>
      {
        const tmp = e.split('>');
        if (tmp.length >= 9)
        {
          const user: UserList = {
            avatar: tmp[0],
            username: tmp[2],
            color: tmp[3],
            room: tmp[4],
            uid: tmp[8],
          };
          userList.push(user);

          // 将用户 ID 添加到对应的房间信息中
          if (roomList[user.room])
          {
            roomList[user.room].users.push(user.uid);
          }
        }
      });
    }

    // 3. 写入 roomlist.json
    await writeWJ(bot, 'roomlist.json', roomList);

    // 4. 返回用户列表 (保持原有功能)
    return userList;
  }
};
