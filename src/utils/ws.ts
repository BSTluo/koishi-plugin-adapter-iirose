import { Context, sleep, Universal } from 'koishi';
import WebSocket from 'ws';

import { startEventsServer, stopEventsServer } from './utils';
import { getMd5Password, comparePassword } from './password';
import { fulllogInfo, loggerError, loggerInfo, loggerWarn, logInfo } from '..';
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
  private setTimeoutId: NodeJS.Timeout | null = null;
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
    this.setTimeoutId = null;
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
    fulllogInfo('[DEBUG] prepare() 开始执行');

    const iiroseList = ['m1', 'm2', 'm8', 'm9', 'm'];
    let faseter = 'www';
    let maximumSpeed = 100000;

    let allErrors: boolean;
    let retryCount = 0;
    const maxRetries = this.bot.config.maxRetries;

    fulllogInfo(`[DEBUG] prepare() 最大重试次数: ${maxRetries}`);

    do
    {
      // 检查是否正在停用
      if (this.disposed)
      {
        fulllogInfo('[DEBUG] prepare() 插件正在停用，取消连接');
        return;
      }

      fulllogInfo(`[DEBUG] prepare() 开始第 ${retryCount + 1} 次尝试连接`);
      allErrors = true;

      for (let webIndex of iiroseList)
      {
        // 在每次检查前都验证停用状态
        if (this.disposed)
        {
          fulllogInfo('[DEBUG] prepare() 插件正在停用，取消连接');
          return;
        }

        fulllogInfo(`[DEBUG] prepare() 测试服务器: ${webIndex}.iirose.com:8778`);
        fulllogInfo(`[DEBUG] prepare() 测试服务器: ${webIndex}.iirose.com:8778`);
        let speed: number | 'error' = 'error';
        try
        {
          speed = await this.getLatency(`wss://${webIndex}.iirose.com:8778`);
          fulllogInfo(`[DEBUG] prepare() 服务器 ${webIndex} 延迟结果: ${speed}`);
        } catch (error)
        {
          fulllogInfo(`[DEBUG] prepare() 服务器 ${webIndex} 测试失败:`, error);
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
        fulllogInfo(`[DEBUG] prepare() 所有服务器连接失败，重试次数: ${retryCount}/${maxRetries}`);

        if (retryCount >= maxRetries)
        {
          loggerError('达到最大重试次数，停止连接...');
          fulllogInfo('[DEBUG] prepare() 达到最大重试次数，抛出错误');
          throw new Error('所有服务器都无法连接，达到最大重试次数');
        }

        loggerWarn('所有服务器都无法连接，将在5秒后重试...');

        // 使用可中断的延迟机制
        let cancelled = false;
        await new Promise<void>((resolve) =>
        {
          let count = 0;
          const checkInterval = setInterval(() =>
          {
            if (this.disposed)
            {
              clearInterval(checkInterval);
              logInfo('websocket准备：插件正在停用，取消连接');
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
        logInfo('websocket准备：插件正在停用，取消连接');
        return;
      }
    } while (allErrors && !this.disposed && retryCount < maxRetries);

    fulllogInfo(`[DEBUG] prepare() 连接测试完成，选择服务器: ${faseter}, 延迟: ${maximumSpeed}ms`);

    let socket;
    try
    {
      if (!faseter)
      {
        faseter = 'www';
      }

      fulllogInfo(`[DEBUG] prepare() 开始创建 WebSocket 连接: wss://${faseter}.iirose.com:8778`);
      socket = new WebSocket(`wss://${faseter}.iirose.com:8778`);
      loggerInfo(`websocket 客户端地址： wss://${faseter}.iirose.com:8778`);
      fulllogInfo(`[DEBUG] prepare() WebSocket 连接创建成功`);

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
        fulllogInfo('[DEBUG] prepare() 插件正在停用，取消连接');
        return;
      }
      loggerError('websocket连接创建失败:', error);
      fulllogInfo('[DEBUG] prepare() WebSocket 连接创建失败，返回空');
      return;
    }

    fulllogInfo('[DEBUG] prepare() 设置 bot.socket');
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

    fulllogInfo('[DEBUG] prepare() 开始配置登录信息');

    if (this.bot.config.smStart && comparePassword(this.bot.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
    {
      fulllogInfo('[DEBUG] prepare() 使用蔷薇游客模式');
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

      loggerInfo('已启用蔷薇游客模式');
    } else
    {
      fulllogInfo('[DEBUG] prepare() 使用普通登录模式');
      fulllogInfo(`[DEBUG] prepare() 检查密码: ${this.bot.config.password ? '有密码' : '无密码'}`);

      const hashedPassword = getMd5Password(this.bot.config.password);
      if (!hashedPassword)
      {
        loggerError('登录失败：密码不能为空');
        fulllogInfo('[DEBUG] prepare() 密码为空，抛出错误');
        throw new Error('密码不能为空');
      }

      fulllogInfo('[DEBUG] prepare() 密码处理成功，创建登录对象');
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

    fulllogInfo('[DEBUG] prepare() 设置 WebSocket 事件监听器');
    socket.addEventListener('open', () =>
    {
      fulllogInfo('[DEBUG] WebSocket 连接已打开');
      loggerInfo('websocket 客户端连接中...');
      const loginPack = '*' + JSON.stringify(this.loginObj);

      fulllogInfo('[DEBUG] 发送登录包');
      IIROSE_WSsend(this.bot, loginPack);

      fulllogInfo('[DEBUG] 启动事件服务器');
      this.event = startEventsServer(this.bot);
      // 不要立即设置为在线，等待登录验证成功后再设置

      fulllogInfo('[DEBUG] 设置保活定时器');
      this.live = setInterval(() =>
      {
        if (this.bot.status == Universal.Status.ONLINE)
        {
          IIROSE_WSsend(this.bot, '');
        }
      }, 30 * 1000); // 半分钟发一次包保活
    });

    fulllogInfo('[DEBUG] prepare() 完成，返回 socket');
    return socket;
  }

  /**
   * 接受ws通信
   */
  accept()
  {
    fulllogInfo('[DEBUG] accept() 开始执行');
    this.firstLogin = false;
    this.loginSuccess = false;
    this.isReconnecting = false;
    // 花园登陆报文
    if (!this.bot.socket)
    {
      loggerError('WebSocket connection is not established.');
      fulllogInfo('[DEBUG] accept() WebSocket 连接未建立，返回');
      return;
    }

    fulllogInfo('[DEBUG] accept() 设置消息监听器');


    this.bot.socket.addEventListener('message', async (event) =>
    {
      // 清除旧的延迟
      if (this.bot.config.timeoutPlus && this.setTimeoutId)
      {
        clearTimeout(this.setTimeoutId);
        this.setTimeoutId = null;
      }
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

      const currentUsername = this.bot.config.smStart
        ? this.bot.config.smUsername
        : this.bot.config.usename;

      if (message.includes(">") && message.includes(currentUsername))
      {
        const messageIdMatch = message.match(/(\\d{12,})$/);
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
          loggerError(`登录失败：名字被占用，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"1`))
        {
          loggerError("登录失败：用户名不存在");
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"2`))
        {
          loggerError(`登录失败：密码错误，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"4`))
        {
          loggerError(`登录失败：今日可尝试登录次数达到上限，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"5`))
        {
          loggerError(`登录失败：房间密码错误，用户名：${this.loginObj.n}，房间id：${this.loginObj.r}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"x`))
        {
          loggerError(`登录失败：用户被封禁，用户名：${this.loginObj.n}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"n0`))
        {
          loggerError(`登录失败：房间无法进入，用户名：${this.loginObj.n}，房间id：${this.loginObj.r}`);
          this.bot.status = Universal.Status.OFFLINE;
          await this.bot.stop();
          await sleep(1000);
          this.ctx.scope.dispose();
          return;
        } else if (message.startsWith(`%*"`))
        {
          loggerInfo(`登陆成功：欢迎回来，${this.loginObj.n}！`);
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

        // 收到用户列表表示登录成功，现在可以设置为在线状态
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

      if (this.bot.config.timeoutPlus)
      {
        this.setTimeoutId = setTimeout(async () =>
        {
          // 检查是否正在停用
          if (this.disposed)
          {
            return;
          }

          loggerWarn("bot保活：时限内没能接收到消息，断开链接");
          // 设置重连标志，避免close事件重复重连
          this.isReconnecting = true;
          await this.stop();

          // 再次检查是否正在停用
          if (!this.disposed)
          {
            // 重置状态以允许重新启动
            this.isStarting = false;
            this.isStarted = false;
            await this.start();
            this.isReconnecting = false;
          }
        }, this.bot.config.timeoutPlus);// (默认)5分钟没有消息就断开连接
      }
    });
  }

  /**
   * 开始ws通信
   */
  async start()
  {
    fulllogInfo('[DEBUG] wsClient.start() 方法被调用');
    fulllogInfo(`[DEBUG] wsClient.start() 当前状态 - disposed: ${this.disposed}, isStarting: ${this.isStarting}, isStarted: ${this.isStarted}`);

    // 检查是否正在停用
    if (this.disposed)
    {
      fulllogInfo('[DEBUG] wsClient.start() 检测到已停用，直接返回');
      return;
    }

    // 防止重复启动
    if (this.isStarting || this.isStarted)
    {
      fulllogInfo('[DEBUG] wsClient.start() 检测到重复启动，直接返回');
      return;
    }


    this.isStarting = true;

    try
    {
      fulllogInfo('[DEBUG] wsClient.start() 开始清理旧连接');
      // 清理旧的连接和定时器，但不重置状态
      if (this.live)
      {
        clearInterval(this.live);
        this.live = null;
      }

      if (this.setTimeoutId)
      {
        clearTimeout(this.setTimeoutId);
        this.setTimeoutId = null;
      }

      if (this.event.length > 0)
      {
        stopEventsServer(this.event);
        this.event = [];
      }

      if (this.bot.socket)
      {
        this.bot.socket.removeEventListener('close', () => { });
        this.bot.socket.removeEventListener('message', () => { });
        this.bot.socket.close();
        this.bot.socket = undefined;
      }

      fulllogInfo('[DEBUG] wsClient.start() 准备调用 prepare()');
      this.bot.socket = await this.prepare();

      if (!this.bot.socket)
      {
        fulllogInfo('[DEBUG] wsClient.start() prepare() 返回空，抛出错误');
        throw new Error('WebSocket连接创建失败');
      }

      fulllogInfo('[DEBUG] wsClient.start() prepare() 成功，调用 accept()');
      this.accept();
      this.isStarted = true;
      fulllogInfo('[DEBUG] wsClient.start() 启动完成');
    } catch (error)
    {
      loggerError('WebSocket启动失败:', error);
      fulllogInfo('[DEBUG] wsClient.start() 启动失败，重置状态');
      // 确保清理状态
      this.isStarted = false;
      throw error; // 重新抛出错误，让上层处理
    } finally
    {
      fulllogInfo('[DEBUG] wsClient.start() 重置启动标志');
      this.isStarting = false;
    }

    this.bot.socket.addEventListener('error', (error) =>
    {
      loggerError('WebSocket 连接错误:', error);
      if (!this.disposed)
      {
        // 错误时也需要清理状态，准备重连
        this.isStarting = false;
        this.isStarted = false;
      }
    });

    this.bot.socket.addEventListener('close', async (event) =>
    {
      logInfo('websocket测试：接受到停止信号');
      const code = event.code;
      const reason = event.reason;

      if (
        this.bot.status == Universal.Status.RECONNECT ||
        this.bot.status == Universal.Status.DISCONNECT ||
        this.bot.status == Universal.Status.OFFLINE ||
        code == 1000 ||
        this.disposed ||
        this.isReconnecting  // 如果是超时保活重连，不执行此处的重连逻辑
      )
      {

        logInfo("websocket停止：因为某种原因不被动进行重启");
        logInfo("websocket停止：↑如果是因为bot保活，那上面那个就是预期行为");

        if (this.disposed)
        {
          logInfo("websocket停止：插件正在停用，不进行重连");
        }
        return;
      }

      // 立即检查是否正在停用，避免不必要的重连
      if (this.disposed)
      {
        loggerInfo("websocket重连：插件正在停用，取消重连");
        return;
      }

      loggerWarn(`websocket closed with ${code}`);

      // 重连逻辑
      if (!this.disposed)
      {
        // 重置状态以允许重连
        this.isStarting = false;
        this.isStarted = false;

        // 延迟5秒后重连，但要持续检查停用状态
        this.reconnectTimer = setTimeout(async () =>
        {
          if (this.disposed)
          {
            return;
          }

          try
          {
            this.bot.socket = await this.prepare();
            if (this.bot.socket && !this.disposed)
            {
              this.accept();
              this.isStarted = true;
            }
          } catch (error)
          {
            if (!this.disposed)
            {
              loggerError("websocket重连失败:", error);
            }
          }
        }, 5000);
      }
    });
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

    if (this.setTimeoutId)
    {
      clearTimeout(this.setTimeoutId);
      this.setTimeoutId = null;
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
  private getLatency(url: string): Promise<number | 'error'>;
  private getLatency(url: string): Promise<number | 'error'>
  {
    return new Promise(async (resolve, reject) =>
    {
      fulllogInfo(`[DEBUG] getLatency() 开始测试: ${url}`);

      // 检查是否正在停用
      if (this.disposed)
      {
        fulllogInfo(`[DEBUG] getLatency() 已停用，返回错误`);
        resolve('error');
        return;
      }

      try
      {
        const startTime = Date.now();
        fulllogInfo(`[DEBUG] getLatency() 创建 WebSocket 连接`);

        let ws;
        try
        {
          fulllogInfo(`[DEBUG] getLatency() 使用 ws 库创建连接`);
          ws = new WebSocket(url);
          fulllogInfo(`[DEBUG] getLatency() ws 库创建成功，状态: ${ws.readyState}`);
        } catch (wsError)
        {
          fulllogInfo(`[DEBUG] getLatency() ws 库创建失败:`, wsError);
          resolve('error');
          return;
        }
        const timeout: number = Math.min(this.bot.config.timeout, 3000); // 最多3秒超时
        fulllogInfo(`[DEBUG] getLatency() 设置超时时间: ${timeout}ms`);
        const timeoutId = setTimeout(() =>
        {
          fulllogInfo(`[DEBUG] getLatency() 超时触发，关闭连接`);
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
          fulllogInfo(`[DEBUG] getLatency() WebSocket 连接打开`);
          const endTime = Date.now();
          const latency = endTime - startTime;
          fulllogInfo(`[DEBUG] getLatency() 延迟测试完成: ${latency}ms`);
          clearTimeout(timeoutId);
          clearInterval(disposingCheckId);
          ws.close();
          resolve(latency);
        });

        ws.addEventListener('error', (error) =>
        {
          fulllogInfo(`[DEBUG] getLatency() WebSocket 连接错误:`, error);
          clearTimeout(timeoutId);
          clearInterval(disposingCheckId);
          ws.close();
          resolve('error');
        });

        ws.addEventListener('close', () =>
        {
          fulllogInfo(`[DEBUG] getLatency() WebSocket 连接已关闭`);
          clearTimeout(timeoutId);
          clearInterval(disposingCheckId);
        });
      } catch (error)
      {
        fulllogInfo(`[DEBUG] getLatency() 捕获异常:`, error);
        resolve('error');
      }
    });
  }

}


export function IIROSE_WSsend(bot: IIROSE_Bot, data: string)
{
  if (!bot.socket)
  { //  布豪！
    //  牙白！
    loggerError("布豪！ !bot.socket !!! 请联系开发者");
    return;
  }
  if (bot.socket.readyState == 0)
  {
    loggerError("布豪！ bot.socket.readyState == 0 !!! 请联系开发者");
    return;
  }
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
};