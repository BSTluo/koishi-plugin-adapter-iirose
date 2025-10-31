import { Context, Bot, Fragment, Universal, Logger, Session } from 'koishi';

import { MessageInfo, messageObjList as MessageObjListType } from './messageTemp';
import { IIROSE_BotMessageEncoder } from './sendMessage';
import { Internal, InternalType } from './internal';
import { SessionCache } from './sessionCache';
import { comparePassword } from '../utils/password';
import { SendOptions } from '@satorijs/protocol';
import { IIROSE_WSsend, WsClient } from '../utils/ws';
import kick from '../encoder/admin/kick';
import mute from '../encoder/admin/mute';
import { Config } from '../config';

export class IIROSE_Bot extends Bot<Context>
{
  static MessageEncoder = IIROSE_BotMessageEncoder;

  platform: string = 'iirose';
  socket: WebSocket | undefined = undefined;
  public messageIdResolvers: ((messageId: string) => void)[] = [];
  public addData: {
    uid: string;
    username: string;
    avatar: string;
    room: string;
    color: string;
    data: Record<string, any>;
  }[] = [];

  static inject = ['assets'];

  public wsClient: WsClient;
  public readonly config: Config;
  public sessionCache: SessionCache;
  private isStarting: boolean = false;
  private isStarted: boolean = false;
  private disposed: boolean = false;
  private userInfoTimeout: NodeJS.Timeout | null = null;
  private messageObjList: MessageObjListType = {};
  public logger: Logger;

  constructor(public ctx: Context, config: Config)
  {
    super(ctx, {}, 'iirose-bot');

    this.platform = 'iirose';
    this.config = config;
    this.logger = new Logger(`DEV:adapter-iirose`);
    this.sessionCache = new SessionCache(config.sessionCacheSize);

    // 重置状态
    this.isStarting = false;
    this.isStarted = false;
    this.disposed = false;
    this.userInfoTimeout = null;

    this.wsClient = new WsClient(ctx, this);

    if (this.config.smStart && comparePassword(this.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
    {
      this.selfId = this.config.smUid;
      this.userId = this.config.smUid;
    } else
    {
      this.selfId = this.config.uid;
      this.userId = this.config.uid;
    }
  }

  public loggerError(message: any, ...args: any[]): void
  {
    this.ctx.logger.error(`[${this.config.uid}]`, message, ...args);
  }

  public loggerInfo(message: any, ...args: any[]): void
  {
    this.ctx.logger.info(`[${this.config.uid}]`, message, ...args);
  }

  public loggerDebug(message: any, ...args: any[]): void
  {
    this.ctx.logger.debug(`[${this.config.uid}]`, message, ...args);
  }

  public loggerWarn(message: any, ...args: any[]): void
  {
    this.ctx.logger.warn(`[${this.config.uid}]`, message, ...args);
  }

  public logInfo(message: any, ...args: any[]): void
  {
    if (this.config.debugMode)
    {
      this.logger.info(`[${this.config.uid}]`, message, ...args);
    }
  }

  public fulllogInfo(message: any, ...args: any[]): void
  {
    if (this.config.fullDebugMode)
    {
      this.logger.info(`[${this.config.uid}]`, message, ...args);
    }
  }

  setDisposing(disposing: boolean)
  {
    this.disposed = disposing;
    // 将停用状态传递给 WebSocket 客户端
    if (this.wsClient && this.wsClient.setDisposing)
    {
      this.wsClient.setDisposing(disposing);
    }
  }

  async start()
  {

    // 检查是否正在停用
    if (this.disposed)
    {
      return;
    }

    // 防止重复启动
    if (this.isStarting || this.isStarted)
    {
      return;
    }

    this.isStarting = true;

    try
    {
      // 设置为连接中状态
      this.status = Universal.Status.CONNECT;

      // 启动 WebSocket 连接
      await this.wsClient.start();

      this.isStarted = true;

    } catch (error)
    {
      // 如果插件正在停用，不记录错误
      if (!this.disposed)
      {
        this.loggerError('机器人启动失败:', error);
      } else
      {
      }
      this.isStarted = false;
    } finally
    {
      this.isStarting = false;
    }
  }

  async stop()
  {
    // 如果已经停止，直接返回
    if (this.disposed)
    {
      return;
    }

    // 立即设置停用状态
    this.setDisposing(true);

    // 重置状态
    this.isStarting = false;
    this.isStarted = false;

    // 立即清理定时器
    if (this.userInfoTimeout)
    {
      clearTimeout(this.userInfoTimeout);
      this.userInfoTimeout = null;
    }

    // 立即下线
    this.offline();

    // 停止 WebSocket 连接
    if (this.wsClient)
    {
      // 使用 Promise.race 限制等待时间
      await Promise.race([
        this.wsClient.stop(),
        new Promise(resolve => setTimeout(resolve, 500)) // 最多等待500ms
      ]);
    }
  }

  async sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    if (!channelId || (!channelId.startsWith('public') && !channelId.startsWith('private')))
    {
      return [];
    }
    const finalChannelId = guildId ? `${channelId}:${guildId}` : channelId;

    // 创建消息编码器并发送消息
    const encoder = new IIROSE_BotMessageEncoder(this, finalChannelId, guildId, options);
    await encoder.send(content);

    // 直接获取生成的消息ID
    const messageId = encoder.getMessageId();

    if (messageId)
    {
      return [messageId];
    } else
    {
      return [];
    }
  }

  async sendPrivateMessage(userId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    return this.sendMessage(`private:${userId}`, content);
  }

  async getSelf(): Promise<Universal.User>
  {
    let user: Universal.User = await this.getUser(this.config.uid);
    if (user.id == 'error')
    {
      if (this.config.smStart && comparePassword(this.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
      {
        user = {
          id: this.config.smUid,
          name: this.config.smUsername,
          avatar: 'http://p26-tt.byteimg.com/origin/pgc-image/cabc74beb5794b97b1b300a2b8817e05'
        };
      } else
      {
        user = {
          id: this.config.uid,
          name: this.config.usename,
          avatar: 'http://p26-tt.byteimg.com/origin/pgc-image/cabc74beb5794b97b1b300a2b8817e05'
        };
      }
    }
    return user;
  }

  async getUser(userId: string, guildId?: string): Promise<Universal.User>
  {
    let user: Universal.User = {
      id: 'error',
      name: '用户数据库初始化ing',
      avatar: ''
    };

    let userData: { username: string; avatar: string; uid?: string; room?: string; color?: string; data?: Record<string, any>; } | undefined = undefined;
    for (let v of this.addData)
    {
      if (v.uid == userId)
      {
        userData = v;
        break;
      }
    }

    if (userData == undefined)
    {
      return user;
    }

    user = {
      id: userId,
      name: userData.username,
      avatar: userData.avatar
    };

    return user;
  }

  async getMessage(channelId: string, messageId: string)
  {
    return this.messageObjList[messageId];
  }

  setMessage(messageId: string, messageInfo: MessageInfo)
  {
    this.messageObjList[messageId] = messageInfo;
  }

  getMessageKeys(): string[]
  {
    return Object.keys(this.messageObjList);
  }

  async kickGuildMember(guildId: string, userName: string, permanent?: boolean): Promise<void>
  {
    await IIROSE_WSsend(this, kick(userName));
  }

  async muteGuildMember(guildId: string, userName: string, duration: number, reason?: string): Promise<void>
  {
    let time: string;

    // 永久禁言
    if ((duration / 1000) > 99999)
    {
      time = '&';
    } else
    {
      time = String(duration / 1000);
    }

    if (reason == undefined)
    {
      reason = '';
    }

    await IIROSE_WSsend(this, mute('all', userName, time, reason));
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void>;
  async deleteMessage(channelId: string, messageId: string[]): Promise<void>;
  async deleteMessage(channelId: string, messageId: string | string[]): Promise<void>
  {
    try
    {
      await new Promise(resolve => setTimeout(resolve, this.config.deleteMessageDelay));

      // 如果是数组，逐个撤回
      if (Array.isArray(messageId))
      {
        for (const id of messageId)
        {
          await this.deleteSingleMessage(channelId, id);
        }
      } else
      {
        // 单个消息撤回
        await this.deleteSingleMessage(channelId, messageId);
      }
    } catch (error)
    {
      this.loggerError('删除消息失败:', error);
    }
  }

  // 撤回单个消息
  private async deleteSingleMessage(channelId: string, messageId: string): Promise<boolean>
  {
    try
    {
      // 根据频道类型确定撤回命令格式
      let deleteCommand: string;
      if (channelId.startsWith('private:'))
      {
        const userId = channelId.split(":")[1];
        deleteCommand = `v0*${userId}#${messageId}`;
      } else
      {
        deleteCommand = `v0#${messageId}`;
      }

      this.logInfo(`[撤回消息开始] 频道: ${channelId}, 消息ID: ${messageId}`);

      if (this.socket && this.socket.readyState === WebSocket.OPEN)
      {
        await IIROSE_WSsend(this, deleteCommand);
        return true;
      } else
      {
        this.loggerWarn('WebSocket连接未就绪，无法撤回消息');
        return false;
      }
    } catch (error)
    {
      this.loggerError(`撤回消息失败 (channelId: ${channelId}, messageId: ${messageId}):`, error);
      return false;
    }
  }

  internal: InternalType = new Internal(this);
}
