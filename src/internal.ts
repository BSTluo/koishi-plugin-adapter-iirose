import { IIROSE_Bot } from "./bot";
import { IIROSE_WSsend } from './ws';
import { Logger } from '@satorijs/satori';
import kickFunction from './encoder/admin/kick';
import cutOneFunction from './encoder/admin/media_cut';
import cutAllFunction from './encoder/admin/media_clear';
import setMaxUserFunction from './encoder/admin/setMaxUser';
import whiteListFunction from './encoder/admin/whiteList';
import damakuFunction from './encoder/messages/damaku';
import mediaCard from './encoder/messages/media_card';
import mediaData from './encoder/messages/media_data';
import StockBuy from './encoder/user/StockBuy';
import StockSell from './encoder/user/StockSell';
import StockGet from './encoder/user/StockGet';
import { Stock } from './decoder/Stock';
import * as eventType from './event';
import moveRoom from "./encoder/user/moveRoomStart";


const logger = new Logger('IIROSE-BOT');

export class Internal {
  bot: IIROSE_Bot;
  constructor(bot: IIROSE_Bot) { this.bot = bot; }

  /**
   * 移动到指定房间
   * @param moveData 
   * @returns 
   */
  async moveRoom(moveData: eventType.move) {
    const roomId = moveData.roomId;
    if (!roomId)
    {
      if (this.bot.config.roomId === roomId) { return logger.debug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 '); }
      this.bot.config.roomId = this.bot.config.roomId;
      return logger.debug(` [IIROSE-BOT] 移动房间失败，目标房间为: ${roomId}，已经自动移动到默认房间`);
    }
    if (this.bot.config.roomId === roomId) { return logger.debug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 '); }
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
  async moveRoomStart() {
    await this.bot.adapter.disconnect(this.bot);
    await this.bot.adapter.connect(this.bot);
  }

  kick(kickData: eventType.kickData) {
    IIROSE_WSsend(this.bot, kickFunction(kickData.username));
  }

  cutOne(cutOne: eventType.cutOne) {
    (cutOne.hasOwnProperty('id')) ? IIROSE_WSsend(this.bot, cutOneFunction(cutOne.id)) : IIROSE_WSsend(this.bot, cutOneFunction());
  }

  cutAll() {
    IIROSE_WSsend(this.bot, cutAllFunction());
  }

  setMaxUser(setMaxUser: eventType.setMaxUser) {
    (setMaxUser.hasOwnProperty('number')) ? IIROSE_WSsend(this.bot, setMaxUserFunction(setMaxUser.maxMember)) : IIROSE_WSsend(this.bot, setMaxUserFunction());
  }

  whiteList(whiteList: eventType.whiteList) {
    (whiteList.hasOwnProperty('intro')) ? IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time, whiteList.intro)) : IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time));
  }

  damaku(damaku: eventType.damaku) {
    IIROSE_WSsend(this.bot, damakuFunction(damaku.message, damaku.color));
  }

  makeMusic(musicOrigin: eventType.musicOrigin) {
    const { type, name, signer, cover, link, url, duration, bitRate, color, lyrics, origin } = musicOrigin;
    IIROSE_WSsend(this.bot, mediaCard(type, name, signer, cover, color, bitRate, origin));
    IIROSE_WSsend(this.bot, mediaData(type, name, signer, cover, link, url, duration, lyrics, origin));
  }

  stockBuy(numberData: number) {
    IIROSE_WSsend(this.bot, StockBuy(numberData));
  }
  stockSell(numberData: number) {
    IIROSE_WSsend(this.bot, StockSell(numberData));
  }
  stockGet(callBack: eventType.StockGet) {
    IIROSE_WSsend(this.bot, StockGet());
    this.bot.ctx.once('iirose/stockBackCall', (stockData: Stock) => {
      const outData: eventType.StockSession = stockData;
      outData.bot = this.bot;
      outData.send = (data) => {
        // eslint-disable-next-line no-prototype-builtins
        if (data.hasOwnProperty('public')) { this.bot.sendMessage('public:', data.public.message); }
        // eslint-disable-next-line no-prototype-builtins
        if (data.hasOwnProperty('private')) { this.bot.sendMessage(`private:${data.private.userId}`, data.private.message); }
      };

      return callBack(outData);
    });
  }
}

export interface InternalType {
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
  moveRoomStart():void;
}
