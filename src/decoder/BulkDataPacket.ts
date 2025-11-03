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
    background?: string;
}

export const bulkDataPacket = async (message: string, bot: IIROSE_Bot) =>
{
    if (message.startsWith('%*"'))
    {
        if (bot.config.debugMode)
        {
            await writeWJ(bot, 'wsdata/message.log', message);
        }

        let rawData = message.substring(3);
        const userStartMarker = 'r.iirose.com/i/';
        const markerIndex = rawData.indexOf(userStartMarker);

        // 如果找到了标记，说明前面有股票数据，需要截取
        // 我们需要回溯到 "http://" 或 "https://" 的开头
        let data: string;
        if (markerIndex !== -1)
        {
            const httpIndex = rawData.lastIndexOf('http', markerIndex);
            if (httpIndex !== -1)
            {
                data = rawData.substring(httpIndex);
            } else
            {
                // 如果找不到 http，这是一个异常情况，但我们仍然尝试从标记处开始解析
                data = rawData.substring(markerIndex);
            }
        } else
        {
            // 如果没有找到标记，我们假定没有股票数据（或者格式已变）
            data = rawData;
        }
        const userList: UserList[] = [];

        // 解析用户列表
        data.split('<').forEach((e) =>
        {
            const tmp = e.split('>');
            if (tmp.length >= 9)
            {
                userList.push({
                    avatar: tmp[0].startsWith('http') ? tmp[0] : `http://s.iirose.com/images/icon/${tmp[0]}.jpg`,
                    username: h.unescape(tmp[2]),
                    color: tmp[3],
                    room: tmp[4],
                    uid: tmp[8],
                });
            }
        });

        // 写入 userlist.json
        if (userList.length > 0)
        {
            await writeWJ(bot, 'wsdata/userlist.json', userList);
        }

        // 解析房间信息
        const roomList = {};
        const segments = data.split('<');
        // 匹配一个或多个由下划线连接的、长度至少为10的、且包含至少一个字母的十六进制字符串
        const roomIdRegex = /^(?=.*[a-f])([a-f0-9]{10,}_?)+$/;

        for (let i = 1; i < segments.length; i++)
        {
            const currentSegment = segments[i];
            const candidateId = currentSegment.split('>')[0];

            if (roomIdRegex.test(candidateId))
            {
                const roomDataFields = currentSegment.split('>');
                const idPath = candidateId.split('_');
                const roomName = roomDataFields[1] || '';

                const rawDescField = roomDataFields[5] || '';
                let description = '';
                let background = '';

                if (rawDescField.startsWith('s://') || rawDescField.startsWith('://'))
                {
                    const firstSpaceIndex = rawDescField.indexOf(' ');
                    const protocol = rawDescField.startsWith('s://') ? 'https' : 'http';

                    if (firstSpaceIndex !== -1)
                    {
                        const urlPart = rawDescField.substring(rawDescField.startsWith('s://') ? 4 : 3, firstSpaceIndex);
                        background = `${protocol}://${urlPart}`;
                        description = rawDescField.substring(firstSpaceIndex + 1).split('&&')[0].trim();
                    } else
                    {
                        const urlPart = rawDescField.substring(rawDescField.startsWith('s://') ? 4 : 3);
                        background = `${protocol}://${urlPart}`;
                    }
                } else
                {
                    description = rawDescField.split('&&')[0].trim();
                }

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
                    background: background,
                    users: userList.filter(u => u.room === finalId).map(u => u.uid),
                    online: userList.filter(u => u.room === finalId).length,
                };
            }
        }

        // 写入 roomlist.json
        if (Object.keys(roomList).length > 0)
        {
            await writeWJ(bot, 'wsdata/roomlist.json', roomList);
        }

        // 触发一次股价查询
        bot.internal.stockGet();

        // 返回用户列表
        return userList;
    }
};