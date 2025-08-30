
import { Universal, User } from "koishi";

import setMaxUserFunction from '../encoder/admin/setMaxUser';
import whiteListFunction from '../encoder/admin/whiteList';
import cutAllFunction from '../encoder/admin/media_clear';
import cutOneFunction from '../encoder/admin/media_cut';
import damakuFunction from '../encoder/messages/damaku';
import mediaData from '../encoder/messages/media_data';
import mediaCard from '../encoder/messages/media_card';
import moveRoom from "../encoder/user/moveRoomStart";
import StockSell from '../encoder/user/StockSell';
import kickFunction from '../encoder/admin/kick';
import payment from "../encoder/system/payment";
import StockBuy from '../encoder/user/StockBuy';
import StockGet from '../encoder/user/StockGet';
import { Stock } from '../decoder/Stock';
import { IIROSE_WSsend } from '../utils/ws';
import * as eventType from './event';
import { IIROSE_Bot } from "./bot";
import { loggerDebug } from "..";

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
        return loggerDebug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 ');
      }
      this.bot.config.roomId = this.bot.config.roomId;
      return loggerDebug(` [IIROSE-BOT] 移动房间失败，目标房间为: ${roomId}，已经自动移动到默认房间`);
    }

    if (this.bot.config.roomId === roomId)
    {
      return loggerDebug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 ');
    }
    this.bot.config.oldRoomId = this.bot.config.roomId;
    this.bot.config.roomId = roomId;
    this.bot.config.roomPassword = moveData.roomPassword;
    // await this.bot.adapter.disconnect(this.bot);
    // await this.bot.adapter.connect(this.bot);

    (moveData.roomPassword) ? IIROSE_WSsend(this.bot, moveRoom(moveData.roomId, moveData.roomPassword)) : IIROSE_WSsend(this.bot, moveRoom(moveData.roomId));
  }

  /**
     * 移动到指定房间开始(一般不调用这个..调用moveRoom)
     * @returns 
     */
  async moveRoomStart()
  {
    await this.bot.adapter.disconnect(this.bot);
    await this.bot.adapter.connect(this.bot);
    // this.bot.config.oldRoomId = null;
    // this.bot.config.roomPassword = null;
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
    IIROSE_WSsend(this.bot, mediaCard(type, name, signer, cover, color, duration, bitRate, origin));
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
    const id = this.UserData.name[name];
    const user = await this.bot.getUser(id);
    return user;
  }

  async getUserById(id: string)
  {
    const user = await this.bot.getUser(id);
    return user;
  }

  initUserData()
  {
    this.UserData.name = {};
    this.UserData.id = {};

    this.bot.addData.forEach(v =>
    {
      const name = v.username;
      const id = v.uid;

      this.UserData.name[name] = id;
      this.UserData.id[id] = name;
    });
  }

  UserData: Record<string, Record<string, string>> = {};
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
  moveRoomStart(): void;
  payment(uid: string, money: number, message?: string): void;
  initUserData(): void;
  getUserByName(name: string): Promise<Universal.User | undefined>;
  getUserById(id: string): Promise<Universal.User | undefined>;
}
