import setMaxUserFunction from '../encoder/admin/setMaxUser';
import whiteListFunction from '../encoder/admin/whiteList';
import cutAllFunction from '../encoder/admin/media_clear';
import cutOneFunction from '../encoder/admin/media_cut';
import damakuFunction from '../encoder/messages/damaku';
import mediaCard from '../encoder/messages/media_card';
import mediaData from '../encoder/messages/media_data';
import StockSell from '../encoder/user/StockSell';
import kickFunction from '../encoder/admin/kick';
import StockGet from '../encoder/user/StockGet';
import StockBuy from '../encoder/user/StockBuy';
import * as EventType from '../bot/event';
import { IIROSE_Bot } from '../bot/bot';
import { IIROSE_WSsend } from './ws';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * 颜色转换函数：将rgba格式转换为十六进制格式
 * @param rgba - rgba格式的颜色字符串或十六进制格式的颜色字符串
 * @returns 六位十六进制格式的颜色字符串（不包含#）
 */
export function rgbaToHex(rgba: string): string
{
  // 如果已经是十六进制格式，直接返回
  if (/^[0-9a-fA-F]{6}$/.test(rgba))
  {
    return rgba;
  }

  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match)
  {
    return '66ccff'; // 默认颜色
  }

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  // 忽略alpha通道，只使用RGB

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `${rHex}${gHex}${bHex}`;
}

/**
 * 生成消息ID
 * @returns 12位随机字符串作为消息ID
 */
export function generateMessageId(): string
{
  return Math.random().toString().substring(2, 14);
}

export const startEventsServer = (bot: IIROSE_Bot) =>
{
  let event: (() => boolean)[] = [];

  event.push(bot.ctx.on('iirose/moveRoom', async moveData =>
  {
    await bot.internal.moveRoom(moveData);
  }));

  event.push(bot.ctx.on('iirose/kick', (kickData: EventType.kickData) =>
  {
    /* 示例data
    kickData: {
        username: '用户名'
    }
    */
    IIROSE_WSsend(bot, kickFunction(kickData.username));
  }));

  event.push(bot.ctx.on('iirose/cut-one', (cutOne: EventType.cutOne) =>
  {
    /* 示例data
    cutOneData: {
        id: '歌曲id'
    }
    */
    // eslint-disable-next-line no-prototype-builtins
    (cutOne.hasOwnProperty('id')) ? IIROSE_WSsend(bot, cutOneFunction(cutOne.id)) : IIROSE_WSsend(bot, cutOneFunction());
  }));

  event.push(bot.ctx.on('iirose/cut-all', () =>
  {
    /* 示例data
    （无）
    */
    IIROSE_WSsend(bot, cutAllFunction());
  }));

  event.push(bot.ctx.on('iirose/setMaxUser', (setMaxUser: EventType.setMaxUser) =>
  {
    /* 示例data
    setMaxUser: {
      maxMember: 人数（为空则清除限制？）
    }
    */
    // eslint-disable-next-line no-prototype-builtins
    (setMaxUser.hasOwnProperty('number')) ? IIROSE_WSsend(bot, setMaxUserFunction(setMaxUser.maxMember)) : IIROSE_WSsend(bot, setMaxUserFunction());
  }));

  event.push(bot.ctx.on('iirose/whiteList', (whiteList: EventType.whiteList) =>
  {
    /* 示例data
    data: {
      username: 用户名,
      time: 持续时间（应该是秒）,
      intro: 大抵是备注？可忽略不填这一项
    }
    */

    // eslint-disable-next-line max-len, no-prototype-builtins
    (whiteList.hasOwnProperty('intro')) ? IIROSE_WSsend(bot, whiteListFunction(whiteList.username, whiteList.time, whiteList.intro)) : IIROSE_WSsend(bot, whiteListFunction(whiteList.username, whiteList.time));
  }));

  event.push(bot.ctx.on('iirose/damaku', (damaku: EventType.damaku) =>
  {
    /* 示例data
    data: {
      message: 弹幕内容,
      color: 16进制颜色代码（不带#）
    }
    */
    IIROSE_WSsend(bot, damakuFunction(damaku.message, damaku.color));
  }));

  event.push(bot.ctx.on('iirose/makeMusic', (musicOrigin: EventType.musicOrigin) =>
  {
    const { type, name, signer, cover, link, url, duration, bitRate, color, lyrics, origin } = musicOrigin;
    const mediaCardResult = mediaCard(type, name, signer, cover, color, duration, bitRate, origin);
    IIROSE_WSsend(bot, mediaCardResult.data);
    IIROSE_WSsend(bot, mediaData(type, name, signer, cover, link, url, duration, lyrics, origin));
  }));

  event.push(bot.ctx.on('iirose/stockBuy', (numberData: number) =>
  {
    IIROSE_WSsend(bot, StockBuy(numberData));
  }));

  event.push(bot.ctx.on('iirose/stockSell', (numberData: number) =>
  {
    IIROSE_WSsend(bot, StockSell(numberData));
  }));

  event.push(bot.ctx.on('iirose/stockGet', (callBack: EventType.StockGet) =>
  {
    IIROSE_WSsend(bot, StockGet());
    bot.ctx.once('iirose/stockBackCall', (stockData: EventType.StockSession) =>
    {
      const outData: EventType.StockSession = stockData;
      outData.bot = bot;
      outData.send = (data) =>
      {
        if (data.hasOwnProperty('public'))
        {
          bot.sendMessage('public:', data.public.message);
        }
        if (data.hasOwnProperty('private'))
        {
          bot.sendMessage(`private:${data.private.userId}`, data.private.message);
        }
      };

      return callBack(outData);
    });
  }));
  // 发音频视频的果然还是直接sendMessage.ts里面改好...
  // system那边真的有东西有用吗
  // user也是！！
  // 摸了摸了))
  return event;
};

export const stopEventsServer = (event: (() => boolean)[]) =>
{
  event.forEach((element: () => boolean) =>
  {
    element();
  });
};

/**
 * 将数据写入到 wsdata 目录下的指定 JSON 文件中
 * @param bot IIROSE_Bot 实例
 * @param relativePath 文件路径 (例如 'wsdata/userlist.json')
 * @param data 要写入的数据对象
 */
export const writeWJ = async (bot: IIROSE_Bot, relativePath: string, data: any): Promise<void> =>
{
  try
  {
    const instanceDataDir = path.join(bot.ctx.baseDir, 'data', 'adapter-iirose', bot.config.uid.trim());
    const filePath = path.join(instanceDataDir, relativePath);

    // 确保目标目录存在
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    bot.logInfo(`[iirose-writeWJ] 数据已更新至: ${filePath}`);
  } catch (error)
  {
    bot.logger.error(`[iirose-writeWJ] 写入 ${relativePath} 失败:`, error);
  }
};

/**
 * 从实例的数据目录中安全地读取和解析JSON文件。
 * @param bot IIROSE_Bot 实例
 * @param filename 相对于实例数据目录的文件路径 (e.g., 'wsdata/userlist.json')
 * @returns 解析后的JSON数据，如果文件不存在或解析失败则返回 null
 */
export const readJsonData = async (bot: IIROSE_Bot, filename: string): Promise<any> =>
{
  try
  {
    const instanceDataDir = path.join(bot.ctx.baseDir, 'data', 'adapter-iirose', bot.config.uid.trim());
    const filePath = path.join(instanceDataDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error)
  {
    // 如果文件不存在，这是正常情况，不需要报错
    if (error.code === 'ENOENT')
    {
      return null;
    }
    // 其他错误（如JSON解析失败）则需要记录
    bot.logger.error(`[iirose-readJsonData] 读取或解析 ${filename} 失败:`, error);
    return null;
  }
};

/**
 * 在嵌套的房间数据中递归查找指定的房间。
 * @param guildData 嵌套的房间数据对象
 * @param roomId 要查找的房间ID
 * @returns 找到的房间信息对象，未找到则返回 null
 */
export const findRoomInGuild = (guildData: any, roomId: string): any =>
{
  if (!guildData || typeof guildData !== 'object')
  {
    return null;
  }

  for (const key in guildData)
  {
    const room = guildData[key];
    if (room && room.id === roomId)
    {
      return room;
    }
    // 如果当前值是一个对象，就递归进去查找
    if (typeof room === 'object')
    {
      const found = findRoomInGuild(room, roomId);
      if (found)
      {
        return found;
      }
    }
  }

  return null;
};

/**
 * 将一个社区（Guild）下的所有层级嵌套的房间扁平化为一个房间列表。
 * @param guildData 嵌套的房间数据对象
 * @returns 扁平化后的房间信息数组
 */
export const flattenRooms = (guildData: any): any[] =>
{
  const allRooms = [];

  function recurse(data: any)
  {
    if (!data || typeof data !== 'object')
    {
      return;
    }

    for (const key in data)
    {
      const room = data[key];
      // 检查一个对象是否是房间信息对象（有id和name属性）
      if (room && room.id && room.name)
      {
        allRooms.push(room);
      }
      // 如果当前值是一个对象，就递归进去
      if (typeof room === 'object')
      {
        recurse(room);
      }
    }
  }

  recurse(guildData);
  return allRooms;
};