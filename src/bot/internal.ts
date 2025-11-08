import { IIROSE_Bot } from './bot';
import * as eventType from './event';
import { Universal, User } from "koishi";
import { IIROSE_WSsend } from '../utils/ws';
import Like from '../encoder/user/like/Like';
import Follow from '../encoder/user/follow/Follow';
import Dislike from '../encoder/user/like/Dislike';
import Unfollow from '../encoder/user/follow/Unfollow';
import mediaCard from '../encoder/messages/media_card';
import mediaData from '../encoder/messages/media_data';
import kickFunction from '../encoder/admin/manage/kick';
import getBalanceFunction from '../encoder/user/getBalance';
import summonDiceFunction from '../encoder/system/summonDice';
import cutOneFunction from '../encoder/admin/media/media_cut';
import broadcastFunction from '../encoder/messages/broadcast';
import { findUserIdByName, readJsonData } from '../utils/utils';
import getTasksFunction from '../encoder/system/tasks/getTasks';
import getForumFunction from '../encoder/system/forum/getForum';
import getStoreFunction from '../encoder/system/store/getStore';
import cutAllFunction from '../encoder/admin/media/media_clear';
import whiteListFunction from '../encoder/admin/manage/whiteList';
import { gradeUser, cancelGradeUser } from '../encoder/user/grade';
import getMomentsFunction from '../encoder/user/moments/getMoments';
import setMaxUserFunction from '../encoder/admin/manage/setMaxUser';
import getSelfInfoFunction from '../encoder/user/profile/getSelfInfo';
import subscribeRoomFunction from '../encoder/system/room/subscribeRoom';
import addToCartFunction from '../encoder/system/store/personal/addToCart';
import unsubscribeRoomFunction from '../encoder/system/room/unsubscribeRoom';
import getSellerCenterFunction from '../encoder/system/store/getSellerCenter';
import { stockGet, stockBuy, stockSell } from '../encoder/system/consume/stock';
import getFavoritesFunction from '../encoder/system/store/personal/getFavorites';
import getLeaderboardFunction from '../encoder/system/leaderboard/getLeaderboard';
import { bankGet, bankDeposit, bankWithdraw } from '../encoder/system/consume/bank';
import removeFromCartFunction from '../encoder/system/store/personal/removeFromCart';
import getUserMomentsByUidFunction from '../encoder/user/moments/getUserMomentsByUid';
import getUserProfileByNameFunction from '../encoder/user/profile/getUserProfileByName';
import payment, { parsePaymentCallback, PaymentCallback } from "../encoder/user/payment";
import getFollowedStoresFunction from '../encoder/system/store/personal/getFollowedStores';
import updateSelfInfoFunction, { ProfileData } from '../encoder/user/profile/updateSelfInfo';
import { parseUserProfileByName, UserProfileByName } from '../decoder/messages/UserProfileByName';
import getCompletedOrdersFunction from '../encoder/system/store/personal/orders/getCompletedOrders';
import getAfterSaleOrdersFunction from '../encoder/system/store/personal/orders/getAfterSaleOrders';
import getMusicListFunction, { parseMusicList, MediaListItem } from '../encoder/system/media/getMusicList';
import { getFollowAndFansPacket, parseFollowAndFans, FollowList } from '../encoder/user/follow/followList';
import getPendingReviewOrdersFunction from '../encoder/system/store/personal/orders/getPendingReviewOrders';
import getPendingReceiptOrdersFunction from '../encoder/system/store/personal/orders/getPendingReceiptOrders';
import getPendingPaymentOrdersFunction from '../encoder/system/store/personal/orders/getPendingPaymentOrders';
import getPendingConfirmationOrdersFunction from '../encoder/system/store/personal/orders/getPendingConfirmationOrders';

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

  async payment(uid: string, money: number, message?: string): Promise<PaymentCallback | null>
  {
    const data = (message) ? payment(uid, money, message) : payment(uid, money);
    const response = await this.bot.sendAndWaitForResponse(data, '|$', true);
    if (response)
    {
      return parsePaymentCallback(response);
    }
    return null;
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
   * 为用户打分
   * @param uid 用户uid
   * @param score 分数
   */
  async gradeUser(uid: string, score: number): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(gradeUser(uid, score), '|_', true);
  }

  /**
   * 取消为用户打分
   * @param uid 用户uid
   */
  async cancelGradeUser(uid: string): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(cancelGradeUser(uid), '|_', true);
  }

  /**
   * 获取用户资料
   * @param uid 用户uid
   */
  /**
   * 获取用户动态
   * @param uid 用户uid
   */
  async getUserMomentsByUid(uid: string): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getUserMomentsByUidFunction(uid), ':*', true);
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

  /**
   * 订阅房间
   * @param roomId 房间ID
   */
  subscribeRoom(roomId: string)
  {
    IIROSE_WSsend(this.bot, subscribeRoomFunction(roomId));
  }

  /**
   * 取消订阅房间
   * @param roomId 房间ID
   */
  unsubscribeRoom(roomId: string)
  {
    IIROSE_WSsend(this.bot, unsubscribeRoomFunction(roomId));
  }

  /**
   * 获取用户关注和粉丝列表
   * @param uid 用户uid
   */
  async getFollowList(uid: string): Promise<FollowList | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getFollowAndFansPacket(uid), '|^', true);
    if (response)
    {
      return parseFollowAndFans(response);
    }
    return null;
  }

  /**
   * 获取自身账号信息
   */
  async getSelfInfo(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getSelfInfoFunction(), '$?', true);
  }

  /**
   * 修改自身账号信息
   * @param profileData 个人资料
   */
  async updateSelfInfo(profileData: ProfileData): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(updateSelfInfoFunction(profileData), '$#', true);
    return response === '$#';
  }

  /**
   * 查询当前频道的歌单
   */
  async getMusicList(): Promise<MediaListItem[] | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getMusicListFunction(), '~', true);
    if (response)
    {
      return parseMusicList(response);
    }
    return null;
  }

  /**
   * 查询论坛
   */
  async getForum(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getForumFunction(), ':-', true);
  }

  /**
   * 查询任务
   */
  async getTasks(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getTasksFunction(), ':+', true);
  }

  /**
   * 查询朋友圈
   */
  async getMoments(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getMomentsFunction(), ':=', true);
  }

  /**
   * 查询排行榜
   */
  async getLeaderboard(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getLeaderboardFunction(), '`#', true);
  }

  /**
   * 查询商店
   */
  async getStore(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getStoreFunction(), 'g-', true);
  }

  /**
   * 查询卖家中心
   */
  async getSellerCenter(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getSellerCenterFunction(), 'g+', true);
  }

  /**
   * 加入购物车
   * @param itemId 商品ID
   */
  async addToCart(itemId: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(addToCartFunction(itemId), 'gc', true);
    return response === 'gc';
  }

  /**
   * 移除购物车
   * @param itemId 商品ID
   */
  async removeFromCart(itemId: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(removeFromCartFunction(itemId), 'gc', true);
    return response === 'gc';
  }

  /**
   * 查询等待付款的订单
   */
  async getPendingPaymentOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingPaymentOrdersFunction(), 'gu0', true);
  }

  /**
   * 查询待收货的订单
   */
  async getPendingReceiptOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingReceiptOrdersFunction(), 'gu1', true);
  }

  /**
   * 查询等待确认的订单
   */
  async getPendingConfirmationOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingConfirmationOrdersFunction(), 'gu2', true);
  }

  /**
   * 查询等待评价的订单
   */
  async getPendingReviewOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingReviewOrdersFunction(), 'gu3', true);
  }

  /**
   * 查询已完成的订单
   */
  async getCompletedOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getCompletedOrdersFunction(), 'gu4', true);
  }

  /**
   * 查询售后中的订单
   */
  async getAfterSaleOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getAfterSaleOrdersFunction(), 'gu5', true);
  }

  /**
   * 查询收藏夹
   */
  async getFavorites(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getFavoritesFunction(), 'g&', true);
  }

  /**
   * 查询关注店铺
   */
  async getFollowedStores(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getFollowedStoresFunction(), 'g@', true);
  }


  /**
   * 查询自身余额
   */
  async getBalance(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getBalanceFunction(), '`$', true);
  }

  /**
   * 召唤骰子
   * @param diceId 骰子ID (0-7)
   */
  summonDice(diceId: number)
  {
    const data = summonDiceFunction(diceId);
    if (data)
    {
      IIROSE_WSsend(this.bot, data);
    }
  }

  /**
   * 通过用户名获取用户资料
   * @param username 用户名
   */
  async getUserProfileByName(username: string): Promise<UserProfileByName | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getUserProfileByNameFunction(username), '+', true);
    if (response)
    {
      return parseUserProfileByName(response, this.bot);
    }
    return null;
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
  payment(uid: string, money: number, message?: string): Promise<PaymentCallback | null>;
  sendLike(uid: string, message?: string): void;
  sendDislike(uid: string, message?: string): void;
  followUser(uid: string): void;
  unfollowUser(uid: string): void;
  gradeUser(uid: string, score: number): Promise<string | null>;
  cancelGradeUser(uid: string): Promise<string | null>;
  getUserMomentsByUid(uid: string): Promise<string | null>;
  getUserByName(name: string): Promise<Universal.User | undefined>;
  getUserListFile(): Promise<any>;
  getRoomListFile(): Promise<any>;
  subscribeRoom(roomId: string): void;
  unsubscribeRoom(roomId: string): void;
  getFollowList(uid: string): Promise<FollowList | null>;
  getSelfInfo(): Promise<string | null>;
  updateSelfInfo(profileData: ProfileData): Promise<boolean>;
  getMusicList(): Promise<MediaListItem[] | null>;
  getForum(): Promise<string | null>;
  getTasks(): Promise<string | null>;
  getMoments(): Promise<string | null>;
  getLeaderboard(): Promise<string | null>;
  getStore(): Promise<string | null>;
  getSellerCenter(): Promise<string | null>;
  addToCart(itemId: string): Promise<boolean>;
  removeFromCart(itemId: string): Promise<boolean>;
  getPendingPaymentOrders(): Promise<string | null>;
  getPendingReceiptOrders(): Promise<string | null>;
  getPendingConfirmationOrders(): Promise<string | null>;
  getPendingReviewOrders(): Promise<string | null>;
  getCompletedOrders(): Promise<string | null>;
  getAfterSaleOrders(): Promise<string | null>;
  getFavorites(): Promise<string | null>;
  getFollowedStores(): Promise<string | null>;
  getBalance(): Promise<string | null>;
  summonDice(diceId: number): void;
  getUserProfileByName(username: string): Promise<UserProfileByName | null>;
}
