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
import { IIROSE_WSsend } from './ws';
import * as EventType from '../bot/event';
import { IIROSE_Bot } from '../bot/bot';
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

export const startEventsServer = (bot: IIROSE_Bot) =>
{
  let event: (() => boolean)[] = [];

  event.push(bot.ctx.on('iirose/moveRoom', async moveData =>
  {
    const roomId = moveData.roomId;
    if (!roomId)
    {
      if (bot.config.roomId === roomId)
      {
        return bot.loggerDebug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 ');
      }
      bot.config.roomId = bot.config.roomId;
      return bot.loggerDebug(` [IIROSE-BOT] 移动房间失败，目标房间为: ${roomId}，已经自动移动到默认房间`);
    }
    if (bot.config.roomId === roomId)
    {
      return bot.loggerDebug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 ');
    }
    bot.config.oldRoomId = bot.config.roomId;
    bot.config.roomId = roomId;
    bot.config.roomPassword = moveData.roomPassword;

    await bot.adapter.disconnect(bot);
    await bot.adapter.connect(bot);
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
    IIROSE_WSsend(bot, mediaCard(type, name, signer, cover, color, duration, bitRate, origin));
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
        // eslint-disable-next-line no-prototype-builtins
        if (data.hasOwnProperty('public')) { bot.sendMessage('public:', data.public.message); }
        // eslint-disable-next-line no-prototype-builtins
        if (data.hasOwnProperty('private')) { bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
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