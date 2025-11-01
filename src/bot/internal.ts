
import { Universal, User } from "koishi";

import setMaxUserFunction from '../encoder/admin/setMaxUser';
import whiteListFunction from '../encoder/admin/whiteList';
import cutAllFunction from '../encoder/admin/media_clear';
import damakuFunction from '../encoder/messages/damaku';
import cutOneFunction from '../encoder/admin/media_cut';
import mediaCard from '../encoder/messages/media_card';
import mediaData from '../encoder/messages/media_data';
import StockSell from '../encoder/user/StockSell';
import kickFunction from '../encoder/admin/kick';
import payment from "../encoder/system/payment";
import StockBuy from '../encoder/user/StockBuy';
import StockGet from '../encoder/user/StockGet';
import { IIROSE_WSsend } from '../utils/ws';
import { Stock } from '../decoder/Stock';
import * as eventType from './event';
import { IIROSE_Bot } from "./bot";

export class Internal
{
  bot: IIROSE_Bot;
  constructor(bot: IIROSE_Bot) { this.bot = bot; }

  async send(data)
  {
    if (data.hasOwnProperty('public'))
    {
      this.bot.sendMessage('public:', data.public.message);
    }

    if (data.hasOwnProperty('private'))
    {
      this.bot.sendMessage(`private:${data.private.userId}`, data.private.message);
    }
  }

  /**
   * 移动到指定房间
   * @param moveData 
   * @returns 
   */
  async moveRoom(moveData: eventType.move)
  {
    const roomId = moveData.roomId;
    if (!roomId)
    {
      if (this.bot.config.roomId === roomId)
      {
        return this.bot.loggerDebug('移动房间失败，当前所在房间已为目标房间 ');
      }
      this.bot.config.roomId = this.bot.config.roomId;
      return this.bot.loggerDebug(`移动房间失败，目标房间为: ${roomId}，已经自动移动到默认房间`);
    }

    if (this.bot.config.roomId === roomId)
    {
      return this.bot.loggerDebug('移动房间失败，当前所在房间已为目标房间 ');
    }

    // 保存旧房间信息
    this.bot.config.oldRoomId = this.bot.config.roomId;

    // 更新房间配置
    this.bot.config.roomId = roomId;
    this.bot.config.roomPassword = moveData.roomPassword;

    // 使用房间切换方法
    if (this.bot.wsClient)
    {
      await this.bot.wsClient.switchRoom();
      this.bot.loggerInfo(`移动到房间: ${roomId}`);
    }
  }


  kick(kickData: eventType.kickData)
  {
    IIROSE_WSsend(this.bot, kickFunction(kickData.username));
  }

  cutOne(cutOne: eventType.cutOne)
  {
    (cutOne.hasOwnProperty('id')) ? IIROSE_WSsend(this.bot, cutOneFunction(cutOne.id)) : IIROSE_WSsend(this.bot, cutOneFunction());
  }

  cutAll()
  {
    IIROSE_WSsend(this.bot, cutAllFunction());
  }

  setMaxUser(setMaxUser: eventType.setMaxUser)
  {
    (setMaxUser.hasOwnProperty('number')) ? IIROSE_WSsend(this.bot, setMaxUserFunction(setMaxUser.maxMember)) : IIROSE_WSsend(this.bot, setMaxUserFunction());
  }

  whiteList(whiteList: eventType.whiteList)
  {
    (whiteList.hasOwnProperty('intro')) ? IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time, whiteList.intro)) : IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time));
  }

  damaku(damaku: eventType.damaku)
  {
    IIROSE_WSsend(this.bot, damakuFunction(damaku.message, damaku.color));
  }

  makeMusic(musicOrigin: eventType.musicOrigin)
  {
    const { type, name, signer, cover, link, url, duration, bitRate, color, lyrics, origin } = musicOrigin;
    const mediaCardResult = mediaCard(type, name, signer, cover, color, duration, bitRate, origin);
    IIROSE_WSsend(this.bot, mediaCardResult.data);
    IIROSE_WSsend(this.bot, mediaData(type, name, signer, cover, link, url, duration, lyrics, origin));
  }

  stockBuy(numberData: number)
  {
    IIROSE_WSsend(this.bot, StockBuy(numberData));
  }
  stockSell(numberData: number)
  {
    IIROSE_WSsend(this.bot, StockSell(numberData));
  }
  stockGet(callBack: eventType.StockGet)
  {
    IIROSE_WSsend(this.bot, StockGet());
    this.bot.ctx.once('iirose/stockBackCall', (stockData: Stock) =>
    {
      const outData: eventType.StockSession = stockData;
      outData.bot = this.bot;
      outData.send = (data) =>
      {
        if (data.hasOwnProperty('public'))
        {
          this.bot.sendMessage('public:', data.public.message);
        }

        if (data.hasOwnProperty('private'))
        {
          this.bot.sendMessage(`private:${data.private.userId}`, data.private.message);
        }
      };

      return callBack(outData);
    });
  }

  payment(uid: string, money: number, message?: string)
  {
    const data = (message) ? payment(uid, money, message) : payment(uid, money);
    IIROSE_WSsend(this.bot, data);
  }

  async getUserByName(name: string)
  {
    const id = this.bot.sessionCache.findUserIdByName(name);
    if (!id) return undefined;
    const user = await this.bot.getUser(id);
    return user;
  }

  async getUserById(id: string)
  {
    const user = await this.bot.getUser(id);
    return user;
  }

}

export interface InternalType
{
  moveRoom(moveData: eventType.move): Promise<void>;
  kick(kickData: eventType.kickData): void;
  cutOne(cutOne: eventType.cutOne): void;
  cutAll(): void;
  setMaxUser(setMaxUser: eventType.setMaxUser): void;
  whiteList(whiteList: eventType.whiteList): void;
  damaku(damaku: eventType.damaku): void;
  makeMusic(musicOrigin: eventType.musicOrigin): void;
  stockBuy(numberData: number): void;
  stockSell(numberData: number): void;
  stockGet(callBack: eventType.StockGet): void;
  payment(uid: string, money: number, message?: string): void;
  getUserByName(name: string): Promise<Universal.User | undefined>;
  getUserById(id: string): Promise<Universal.User | undefined>;
}
