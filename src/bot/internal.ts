
import { Universal, User } from "koishi";
import { findUserIdByName, readJsonData } from '../utils/utils';

import setMaxUserFunction from '../encoder/admin/manage/setMaxUser';
import whiteListFunction from '../encoder/admin/manage/whiteList';
import cutAllFunction from '../encoder/admin/media/media_clear';
import broadcastFunction from '../encoder/messages/broadcast';
import cutOneFunction from '../encoder/admin/media/media_cut';
import mediaCard from '../encoder/messages/media_card';
import mediaData from '../encoder/messages/media_data';
import { stockGet, stockBuy, stockSell } from '../encoder/system/stock';
import kickFunction from '../encoder/admin/manage/kick';
import payment from "../encoder/user/payment";
import { bankGet, bankDeposit, bankWithdraw } from '../encoder/system/bank';
import { IIROSE_WSsend } from '../utils/ws';
import Like from '../encoder/user/like/Like';
import Dislike from '../encoder/user/like/Dislike';
import Follow from '../encoder/user/follow/Follow';
import Unfollow from '../encoder/user/follow/Unfollow';
import UserProfile from '../encoder/system/UserProfile';
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

  broadcast(broadcast: eventType.broadcast)
  {
    IIROSE_WSsend(this.bot, broadcastFunction(broadcast.message, broadcast.color));
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
    IIROSE_WSsend(this.bot, stockBuy(numberData));
  }
  stockSell(numberData: number)
  {
    IIROSE_WSsend(this.bot, stockSell(numberData));
  }

  async stockGet(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(stockGet(), '>', true);
  }

  async bankGet(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(bankGet(), '>$', true);
  }

  bankDeposit(amount: number)
  {
    IIROSE_WSsend(this.bot, bankDeposit(amount));
  }

  bankWithdraw(amount: number)
  {
    IIROSE_WSsend(this.bot, bankWithdraw(amount));
  }

  payment(uid: string, money: number, message?: string)
  {
    const data = (message) ? payment(uid, money, message) : payment(uid, money);
    IIROSE_WSsend(this.bot, data);
  }

  /**
   * 点赞用户
   * @param uid 用户uid
   * @param message 附带消息
   */
  sendLike(uid: string, message?: string)
  {
    const data = (message) ? Like(uid, message) : Like(uid);
    IIROSE_WSsend(this.bot, data);
  }

  /**
   * 点踩用户
   * @param uid 用户uid
   * @param message 附带消息
   */
  sendDislike(uid: string, message?: string)
  {
    const data = (message) ? Dislike(uid, message) : Dislike(uid);
    IIROSE_WSsend(this.bot, data);
  }

  /**
   * 关注用户
   * @param uid 用户uid
   */
  followUser(uid: string)
  {
    IIROSE_WSsend(this.bot, Follow(uid));
  }

  /**
   * 取消关注用户
   * @param uid 用户uid
   */
  unfollowUser(uid: string)
  {
    IIROSE_WSsend(this.bot, Unfollow(uid));
  }

  /**
   * 获取用户资料
   * @param uid 用户uid
   */
  async getUserProfile(uid: string): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(UserProfile(uid), ':*', true);
  }

  async getUserByName(name: string): Promise<Universal.User | undefined>
  {
    // 使用工具函数通过用户名查找用户ID
    const userId = await findUserIdByName(this.bot, name);

    // 如果找到了用户ID，则调用现有的 getUser 方法获取完整的用户信息
    if (userId)
    {
      return this.bot.getUser(userId);
    }

    // 如果未找到，则返回 undefined
    return undefined;
  }

  /**
   * 获取 userlist.json 的内容
   * @returns userlist.json 的解析后数据
   */
  async getUserListFile(): Promise<any>
  {
    return await readJsonData(this.bot, 'wsdata/userlist.json');
  }

  /**
   * 获取 roomlist.json 的内容
   * @returns roomlist.json 的解析后数据
   */
  async getRoomListFile(): Promise<any>
  {
    return await readJsonData(this.bot, 'wsdata/roomlist.json');
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
  broadcast(broadcast: eventType.broadcast): void;
  makeMusic(musicOrigin: eventType.musicOrigin): void;
  stockBuy(numberData: number): void;
  stockSell(numberData: number): void;
  stockGet(): Promise<string | null>;
  bankGet(): Promise<string | null>;
  bankDeposit(amount: number): void;
  bankWithdraw(amount: number): void;
  payment(uid: string, money: number, message?: string): void;
  sendLike(uid: string, message?: string): void;
  sendDislike(uid: string, message?: string): void;
  followUser(uid: string): void;
  unfollowUser(uid: string): void;
  getUserProfile(uid: string): Promise<string | null>;
  getUserByName(name: string): Promise<Universal.User | undefined>;
  getUserListFile(): Promise<any>;
  getRoomListFile(): Promise<any>;
}
