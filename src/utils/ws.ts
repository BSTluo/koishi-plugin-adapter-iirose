import { Context, sleep, Universal } from 'koishi';
import WebSocket from 'ws';

import { startEventsServer, stopEventsServer } from './utils';
import { getMd5Password, comparePassword } from './password';
import { decoderMessage } from '../decoder/decoderMessage';
import { decoder } from '../decoder';
import { IIROSE_Bot } from '../bot/bot';
import pako from 'pako';
import md5 from 'md5';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export class WsClient
{
  private event: (() => boolean)[] = [];
  private ctx: Context;
  private bot: IIROSE_Bot;
  private isStarting: boolean = false;
  private isStarted: boolean = false;
  private disposed: boolean = false;

  live: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  loginObj: {
    r?: string;
    n?: string;
    p?: string;
    st?: string;
    mo?: string;
    mb?: string;
    mu?: string; // 关系到服务器给不给你媒体信息
    lr?: string;
    rp?: string;
    fp?: string;

    // 游客专用
    i?: string, // 头像
    nc?: string, // 颜色
    s?: string, // 性别
    uid?: string, // 唯一标识
    li?: string, // 重复游客ID才需要
    la?: string, // 注册地址
    vc?: string, // 设备版本号
  };

  firstLogin: boolean = false;
  loginSuccess: boolean = false;
  isReconnecting: boolean = false;

  constructor(ctx: Context, bot: IIROSE_Bot)
  {
    this.ctx = ctx;
    this.bot = bot;

    // 重置状态
    this.isStarting = false;
    this.isStarted = false;
    this.disposed = false;
    this.live = null;
    this.reconnectTimer = null;
    this.event = [];
  }

  setDisposing(disposing: boolean)
  {
    this.disposed = disposing;
  }

  /**
   * 准备ws通信
   * @returns 
   */

  async prepare()
  {

    const iiroseList = ['m1', 'm2', 'm8', 'm9', 'm'];
    let faseter = 'www';
    let maximumSpeed = 100000;

    let allErrors: boolean;
    let retryCount = 0;
    const maxRetries = this.bot.config.maxRetries;

    do
    {
      // 检查是否正在停用
      if (this.disposed)
      {
        return;
      }

      allErrors = true;

      for (let webIndex of iiroseList)
      {
        // 在每次检查前都验证停用状态
        if (this.disposed)
        {
          return;
        }

        let speed: number | 'error' = 'error';
        try
        {
          speed = await this.getLatency(`wss://${webIndex}.iirose.com:8778`);
        } catch (error)
        {
          speed = 'error';
        }

        if (speed != 'error')
        {
          allErrors = false;
          if (maximumSpeed > speed)
          {
            faseter = webIndex;
            maximumSpeed = speed;
          }
        }
      }

      if (allErrors)
      {
        retryCount++;

        if (retryCount >= maxRetries)
        {
          this.bot.loggerError('达到最大重试次数，停止连接...');
          throw new Error('所有服务器都无法连接，达到最大重试次数');
        }

        this.bot.loggerWarn('所有服务器都无法连接，将在5秒后重试...');

        let cancelled = false;
        await new Promise<void>((resolve) =>
        {
          let count = 0;
          const checkInterval = setInterval(() =>
          {
            if (this.disposed)
            {
              clearInterval(checkInterval);
              this.bot.logInfo('websocket准备：插件正在停用，取消连接');
              cancelled = true;
              resolve();
              return;
            }
            count++;
            if (count >= 50)
            { // 5秒 = 50 * 100ms
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });

        // 如果被取消，立即返回
        if (cancelled)
        {
          return;
        }
      }

      // 再次检查
      if (this.disposed)
      {
        this.bot.logInfo('websocket准备：插件正在停用，取消连接');
        return;
      }
    } while (allErrors && !this.disposed && retryCount < maxRetries);

    let socket;
    try
    {
      if (!faseter)
      {
        faseter = 'www';
      }

      socket = new WebSocket(`wss://${faseter}.iirose.com:8778`);
      this.bot.loggerInfo(`websocket 客户端地址： wss://${faseter}.iirose.com:8778`);

      this.bot.ctx.on('dispose', () =>
      {
        if (socket && socket.readyState === WebSocket.OPEN)
        {
          socket.close();
        }
      });

    } catch (error)
    {
      if (this.disposed)
      {
        return;
      }
      this.bot.loggerError('websocket连接创建失败:', error);
      return;
    }

    this.bot.socket = socket;
    // socket = this.socket
    // this.socket.binaryType = 'arraybuffer'

    const roomIdReg = /\s*\[_([\\s\\S]+)_\]\s*/;
    const userNameReg = /\s*\[\\*([\\s\\S]+)\\*\]\s*/;

    const roomIdConfig = this.bot.config.roomId;
    const userNameConfig = this.bot.config.usename;
    let username = (userNameReg.test(userNameConfig)) ? userNameConfig.match(userNameReg)?.[1] : userNameConfig;
    let room = (roomIdReg.test(roomIdConfig)) ? roomIdConfig.match(roomIdReg)?.[1] : roomIdConfig;

    // 蔷薇游客登陆报文
    // this.loginObj = {
    //   r: room || this.bot.config.roomId,
    //   n: "‌",
    //   i: "cartoon/600215",
    //   // nc: "3d5d58",
    //   // s: "1",
    //   // st: "n",
    //   // mo: "",
    //   // uid: "X000000000000",
    //   // li: "152249236006",
    //   // mb: "",
    //   // mu: "01",
    //   // la: "MY",
    //   // vc: "1120",
    //   fp: `@${md5(``)}`
    // };

    if (this.bot.config.smStart && comparePassword(this.bot.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948'))
    {
      this.loginObj = {
        r: this.bot.config.smRoom,
        n: this.bot.config.smUsername,
        i: this.bot.config.smImage,
        nc: this.bot.config.smColor,
        s: this.bot.config.smGender,
        st: this.bot.config.smst,
        mo: this.bot.config.smmo,
        uid: this.bot.config.smUid,
        li: this.bot.config.smli,
        mb: this.bot.config.smmb,
        mu: this.bot.config.smmu,
        la: this.bot.config.smLocation,
        vc: this.bot.config.smvc,
        fp: `@${md5(this.bot.config.smUsername)}`
      };

      this.bot.loggerInfo('已启用蔷薇游客模式');
    } else
    {

      const hashedPassword = getMd5Password(this.bot.config.password);
      if (!hashedPassword)
      {
        this.bot.loggerError('登录失败：密码不能为空');
        throw new Error('密码不能为空');
      }

      this.loginObj = {
        r: room || this.bot.config.roomId,
        n: username || this.bot.config.usename,
        p: hashedPassword,
        st: 'n',
        mo: this.bot.config.Signature,
        mb: '',
        mu: '01',
        lr: this.bot.config.oldRoomId,
        rp: this.bot.config.roomPassword,
        fp: `@${md5(username || this.bot.config.usename)}`
      };
    }
    (this.loginObj.lr) ? '' : delete this.loginObj.lr;

    socket.addEventListener('open', async () =>
    {
      this.bot.loggerInfo('websocket 客户端连接中...');
      const loginPack = '*' + JSON.stringify(this.loginObj);

      await IIROSE_WSsend(this.bot, loginPack);

      this.event = startEventsServer(this.bot);
      // 清理旧的心跳定时器（如果存在）
      if (this.live)
      {
        clearInterval(this.live);
        this.live = null;
      }

      // 设置基础心跳包保活
      if (this.bot.config.keepAliveEnable)
      {
        this.startHeartbeat();
      }
    });

    return socket;
  }

  /**
   * 接受ws通信
   */
  accept()
  {
    this.firstLogin = false;
    this.loginSuccess = false;
    this.isReconnecting = false;
    // 花园登陆报文
    if (!this.bot.socket)
    {
      this.bot.loggerError('WebSocket connection is not established.');
      return;
    }

    this.bot.socket.addEventListener('message', async (event) =>
    {
      const array = new Uint8Array(event.data);

      let message: string;
      if (array[0] === 1)
      {
        message = pako.inflate(array.slice(1), {
          to: "string",
        });
      } else
      {
        message = Buffer.from(array).toString("utf8");
      }

      if (message.length < 500)
      {
        this.bot.fulllogInfo(`[WS接收]`, message);
      }

      const currentUsername = this.bot.config.smStart
        ? this.bot.config.smUsername
        : this.bot.config.usename;

      if (message.includes(">") && message.includes(currentUsername))
      {
        const messageIdMatch = message.match(/(\d{12,})$/);
        if (messageIdMatch)
        {
          const messageId = messageIdMatch[1];

          const userPattern = new RegExp(`>${currentUsername}>`, "i");
          if (userPattern.test(message))
          {
            if (this.bot.messageIdResolvers.length > 0)
            {
              const resolver = this.bot.messageIdResolvers.shift();
              if (resolver)
              {
                resolver(messageId);
              }
            }
          }
        }
      }

      if (!this.firstLogin)
      {
        this.firstLogin = true;

        if (message.startsWith(`%*"0`))
        {
          this.bot.loggerError(`登录失败：名字被占用，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"1`))
        {
          this.bot.loggerError("登录失败：用户名不存在");
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"2`))
        {
          this.bot.loggerError(`登录失败：密码错误，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"4`))
        {
          this.bot.loggerError(`登录失败：今日可尝试登录次数达到上限，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"5`))
        {
          this.bot.loggerError(`登录失败：房间密码错误，用户名：${this.loginObj.n}，房间id：${this.loginObj.r}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"x`))
        {
          this.bot.loggerError(`登录失败：用户被封禁，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"n0`))
        {
          this.bot.loggerError(`登录失败：房间无法进入，用户名：${this.loginObj.n}，房间id：${this.loginObj.r}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"`))
        {
          this.bot.logInfo(this.loginObj);
          this.bot.loggerInfo(`[${this.bot.config.uid}] 登陆成功：欢迎回来，${this.loginObj.n}！`);
        }
      }

      const funcObj = decoder(this.bot, message);
      // console.log(funcObj)
      // 将会话上报

      if (funcObj.manyMessage)
      {
        funcObj.manyMessage
          .slice()
          .reverse()
          .forEach((element) =>
          {
            if (!element.type)
            {
              return;
            }
            const test: Record<string, any> = {};
            const type = element.type;

            test[type] = element;
            decoderMessage(test, this.bot);
          });
      } else if (funcObj.hasOwnProperty("userlist"))
      {
        const userData = funcObj.userlist;
        if (!userData)
        {
          return;
        }

        if (!this.loginSuccess)
        {
          this.loginSuccess = true;
          this.bot.online();
        }
        userData.forEach(async (e) =>
        {
          if (!e.uid)
          {
            return;
          }
          let avatar = e.avatar;

          if (
            e.avatar.startsWith("cartoon") ||
            e.avatar.startsWith("scenery") ||
            e.avatar.startsWith("male") ||
            e.avatar.startsWith("popular") ||
            e.avatar.startsWith("anime")
          )
          {
            avatar = `https://static.codemao.cn/rose/v0/images/icon/${e.avatar}.jpg`;
          } else if (e.avatar.startsWith("http://r.iirose.com"))
          {
            avatar = `http://z.iirose.com/lib/php/function/loadImg.php?s=${e.avatar}`;
          }

          this.bot.addData.push({
            uid: e.uid,
            username: e.username,
            avatar: avatar,
            room: e.room,
            color: e.color,
            data: {},
          });

          // 更新自己的头像
        });

        this.bot.user = await this.bot.getSelf();

        this.bot.internal.initUserData();

        decoderMessage(funcObj, this.bot);
      } else
      {
        decoderMessage(funcObj, this.bot);
      }
    });
  }

  /**
   * 开始ws通信
   */
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
      // 如果不是重连状态，设置为连接中
      if (this.bot.status !== Universal.Status.RECONNECT)
      {
        this.bot.status = Universal.Status.CONNECT;
      }

      // 清理旧的连接和定时器
      this.cleanup();

      this.bot.socket = await this.prepare();

      if (!this.bot.socket)
      {
        throw new Error('WebSocket连接创建失败');
      }

      this.accept();
      this.setupEventListeners();
      this.isStarted = true;
    } catch (error)
    {
      // 如果插件正在停用，不记录错误
      if (!this.disposed)
      {
        this.bot.loggerError('WebSocket启动失败:', error);
      }
      // 确保清理状态
      this.isStarted = false;

      // 只有在非停用状态下才重新抛出错误
      if (!this.disposed)
      {
        throw error; // 重新抛出错误，让上层处理
      }
    } finally
    {
      this.isStarting = false;
    }
  }

  /**
   * 清理连接和定时器
   */
  private cleanup()
  {
    if (this.live)
    {
      clearInterval(this.live);
      this.live = null;
    }

    if (this.reconnectTimer)
    {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.event.length > 0)
    {
      stopEventsServer(this.event);
      this.event = [];
    }

    if (this.bot.socket)
    {
      // 移除所有事件监听器
      this.bot.socket.removeEventListener('open', () => { });
      this.bot.socket.removeEventListener('message', () => { });
      this.bot.socket.removeEventListener('close', () => { });
      this.bot.socket.removeEventListener('error', () => { });

      if (this.bot.socket.readyState === WebSocket.OPEN || this.bot.socket.readyState === WebSocket.CONNECTING)
      {
        this.bot.socket.close();
      }
      this.bot.socket = undefined;
    }
  }

  /**
   * 设置WebSocket事件监听器
   */
  private setupEventListeners()
  {
    if (!this.bot.socket) return;

    this.bot.socket.addEventListener('error', (error) =>
    {
      this.bot.loggerError('WebSocket 连接错误:', error);
      if (!this.disposed)
      {
        this.handleConnectionLoss();
      }
    });

    this.bot.socket.addEventListener('close', async (event) =>
    {
      const code = event.code;

      // 检查是否应该重连
      if (
        this.bot.status == Universal.Status.RECONNECT ||
        this.bot.status == Universal.Status.DISCONNECT ||
        this.bot.status == Universal.Status.OFFLINE ||
        code == 1000 ||
        this.disposed ||
        this.isReconnecting
      )
      {
        this.bot.logInfo("websocket停止：正常关闭，不重连");
        return;
      }

      this.bot.loggerWarn(`websocket异常关闭，代码: ${code}，将在5秒后重连`);
      this.handleConnectionLoss();
    });
  }

  /**
   * 启动心跳保活机制
   */
  private startHeartbeat()
  {
    if (this.live)
    {
      clearInterval(this.live);
    }

    this.live = setInterval(async () =>
    {
      if (this.disposed)
      {
        return;
      }

      if (this.bot.socket)
      {
        if (this.bot.socket.readyState === WebSocket.OPEN)
        {
          if (this.bot.status == Universal.Status.ONLINE)
          {
            this.bot.fulllogInfo(`发送空包（心跳保活） 实例: ${this.bot.user?.id || 'unknown'}`);
            try
            {
              await IIROSE_WSsend(this.bot, ''); // 心跳包不需要严格的错误处理
            } catch (error)
            {
              // 心跳发送失败不阻断后续逻辑
              this.bot.loggerWarn('心跳包发送失败:', error);
            }
          }
        } else if (this.bot.socket.readyState === WebSocket.CLOSED || this.bot.socket.readyState === WebSocket.CLOSING)
        {
          this.bot.loggerWarn(`心跳保活检测到连接异常 实例: ${this.bot.user?.id || 'unknown'}, readyState: ${this.bot.socket.readyState}`);
          this.handleConnectionLoss();
        }
      } else
      {
        this.bot.loggerWarn(`心跳保活检测到socket为空 实例: ${this.bot.user?.id || 'unknown'}`);
        this.handleConnectionLoss();
      }
    }, 30 * 1000); // 30秒心跳间隔
  }

  /**
   * 处理连接丢失，执行重连逻辑
   */
  private handleConnectionLoss()
  {
    if (this.isReconnecting || this.disposed)
    {
      return; // 避免重复重连
    }

    this.bot.loggerWarn(`检测到连接丢失，准备重连 实例: ${this.bot.user?.id || 'unknown'}`);

    this.isReconnecting = true;
    this.isStarting = false;
    this.isStarted = false;

    // 设置机器人状态为重连中
    this.bot.status = Universal.Status.RECONNECT;

    // 清理当前连接
    this.cleanup();

    // 设置重连定时器
    this.reconnectTimer = setTimeout(async () =>
    {
      if (this.disposed)
      {
        this.isReconnecting = false;
        return;
      }

      try
      {
        this.bot.loggerInfo(`开始重连 实例: ${this.bot.user?.id || 'unknown'}`);
        // 设置为连接中状态
        this.bot.status = Universal.Status.CONNECT;

        await this.start();
        this.isReconnecting = false;
      } catch (error)
      {
        if (!this.disposed)
        {
          this.bot.loggerError(`重连失败 实例: ${this.bot.user?.id || 'unknown'}:`, error);
          // 如果重连失败，等待更长时间后再次尝试
          this.isReconnecting = false;
          setTimeout(() =>
          {
            if (!this.disposed)
            {
              this.handleConnectionLoss();
            }
          }, 10000); // 10秒后再次尝试
        } else
        {
          this.isReconnecting = false;
        }
      }
    }, 5000);
  }

  /**
   * 关闭ws通信
   */
  async stop()
  {
    // 立即设置停用状态
    this.setDisposing(true);

    // 只有在真正停止时才设置为离线状态，重连时不设置
    if (!this.isReconnecting)
    {
      this.bot.status = Universal.Status.DISCONNECT;
    }

    // 重置状态
    this.isStarting = false;
    this.isStarted = false;

    // 清理所有定时器
    if (this.live)
    {
      clearInterval(this.live);
      this.live = null;
    }

    if (this.reconnectTimer)
    {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.event.length > 0)
    {
      stopEventsServer(this.event); // 停止事件服务器的逻辑
      this.event = []; // 清空事件数组
    }

    // 移除事件监听器和关闭连接
    if (this.bot.socket)
    {
      // 移除所有事件监听器
      this.bot.socket.removeEventListener('open', () => { });
      this.bot.socket.removeEventListener('message', () => { });
      this.bot.socket.removeEventListener('close', () => { });
      this.bot.socket.removeEventListener('error', () => { });

      // 强制关闭连接
      if (this.bot.socket.readyState === WebSocket.OPEN || this.bot.socket.readyState === WebSocket.CONNECTING)
      {
        this.bot.socket.close(1000, 'Plugin disposing');
      }
      this.bot.socket = undefined;
    }
  }

  /**
   * 获取延迟
   * @param url 
   * @returns 
   */
  private getLatency(url: string): Promise<number | 'error'>
  {
    return new Promise(async (resolve, reject) =>
    {

      // 检查是否正在停用
      if (this.disposed)
      {
        resolve('error');
        return;
      }

      try
      {
        const startTime = Date.now();

        let ws;
        try
        {
          ws = new WebSocket(url);
        } catch (wsError)
        {
          resolve('error');
          return;
        }
        const timeout: number = Math.min(this.bot.config.timeout, 3000); // 最多3秒超时
        const timeoutId = setTimeout(() =>
        {
          if (ws.readyState === WebSocket.OPEN)
          {
            ws.close();
          }
          resolve('error');
        }, timeout);

        // 添加停用检查
        const disposingCheckId = setInterval(() =>
        {
          if (this.disposed)
          {
            clearTimeout(timeoutId);
            clearInterval(disposingCheckId);
            if (ws.readyState === WebSocket.OPEN)
            {
              ws.close();
            }
            resolve('error');
          }
        }, 100);

        ws.addEventListener('open', () =>
        {
          const endTime = Date.now();
          const latency = endTime - startTime;
          clearTimeout(timeoutId);
          clearInterval(disposingCheckId);
          ws.close();
          resolve(latency);
        });

        ws.addEventListener('error', (error) =>
        {
          clearTimeout(timeoutId);
          clearInterval(disposingCheckId);
          ws.close();
          resolve('error');
        });

        ws.addEventListener('close', () =>
        {
          clearTimeout(timeoutId);
          clearInterval(disposingCheckId);
        });
      } catch (error)
      {
        resolve('error');
      }
    });
  }

}
// WebSocket发送锁，确保消息发送时序正确
let wsSendLock = Promise.resolve();

export async function IIROSE_WSsend(bot: IIROSE_Bot, data: string): Promise<void>
{
  const callId = Math.random().toString(36).substring(2, 8);

  wsSendLock = wsSendLock.then(async () =>
  {
    try
    {
      if (!bot.socket)
      { //  布豪！
        //  牙白！
        bot.loggerError("布豪！ !bot.socket !!! 请联系开发者");
        return;
      }
      if (bot.socket.readyState == 0)
      {
        bot.loggerError("布豪！ bot.socket.readyState == 0 !!! 请联系开发者");
        return;
      }

      const shortData = data.length > 50 ? data.substring(0, 50) + '...' : data;
      bot.fulllogInfo(`[WS发送-${callId}] 发送数据: ${shortData}`);

      const buffer = Buffer.from(data);
      const unintArray: any = Uint8Array.from(buffer);

      if (unintArray.length > 256)
      {
        const deflatedData = pako.gzip(data);
        const deflatedArray: any = new Uint8Array(deflatedData.length + 1);
        deflatedArray[0] = 1;
        deflatedArray.set(deflatedData, 1);
        bot.socket.send(deflatedArray);
      } else
      {
        bot.socket.send(unintArray);
      }
    } catch (error)
    {
      bot.loggerError(`[WS发送-${callId}] 发送失败:`, error);
    }
  });

  // 等待当前操作完成
  await wsSendLock;
};