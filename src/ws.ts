// import { Universal, Adapter, Logger, Schema } from '@satorijs/satori';
import { Context, Universal, Adapter, Logger, Schema } from 'koishi';
import { IIROSE_Bot } from './bot';
import pako from 'pako';
import { decoder } from './decoder';
import { decoderMessage } from './decoderMessage';
import { startEventsServer, stopEventsServer } from './utils';
import md5 from 'md5';

// declare module 'koishi' {
//   interface Tables
//   {
//     iiroseUser: iiroseUser;
//   }
// }

// export interface iiroseUser
// {
//   uid: string;
//   username: string;
//   avatar: string;
//   room: string;
//   color: string;
//   data: Record<string, string>;
// }

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const logger = new Logger('IIROSE-BOT');

export class WsClient<C extends Context = Context> extends Adapter.WsClient<C, IIROSE_Bot<C, IIROSE_Bot.Config & WsClient.Config>>
{
  // WSurl: string = 'wss://m2.iirose.com:8778';
  private event: (() => boolean)[] = [];
  // public inject = ['database'];

  live: NodeJS.Timeout | null = null;

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
  }

  move: boolean = false;

  constructor(ctx: C, bot: IIROSE_Bot<C, IIROSE_Bot.Config & WsClient.Config>)
  {
    super(ctx, bot);
    // ctx.model.extend('iiroseUser', {
    //   // 向用户表中注入字符串字段 foo
    //   uid: 'string',
    //   username: 'string',
    //   avatar: 'string',
    //   room: 'string',
    //   color: 'string',
    //   data: 'json'
    // }, {
    //   primary: 'uid'
    // });
  }

  /**
   * 准备ws通信
   * @returns 
   */

  async prepare()
  {
    const iiroseList = ['m1', 'm2', 'm8', 'm9', 'm'];
    let faseter = '';
    let maximumSpeed = 100000;

    let allErrors: boolean;

    do
    {
      allErrors = true;
      for (let webIndex of iiroseList)
      {
        const speed: number | 'error' = await this.getLatency(`wss://${webIndex}.iirose.com:8778`);
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
    } while (allErrors);

    const socket = await this.bot.ctx.http.ws(`wss://${faseter}.iirose.com:8778`);
    this.bot.socket = socket;
    // socket = this.socket
    // this.socket.binaryType = 'arraybuffer'

    const roomIdReg = /\s*\[_([\s\S]+)_\]\s*/;
    const userNameReg = /\s*\[\*([\s\S]+)\*\]\s*/;

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

    if (this.bot.config.smStart && this.bot.config.smPassword === 'ec3a4ac482b483ac02d26e440aa0a948d309c822')
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
      }
    } else
    {
      this.loginObj = {
        r: room || this.bot.config.roomId,
        n: username || this.bot.config.usename,
        p: this.bot.config.password,
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

    socket.addEventListener('open', () =>
    {

      logger.success('websocket client opening');
      const loginPack = '*' + JSON.stringify(this.loginObj);

      IIROSE_WSsend(this.bot, loginPack);
      this.event = startEventsServer(this.bot);
      this.bot.online();
      this.live = setInterval(() =>
      {
        if (this.bot.status == Universal.Status.ONLINE)
        {
          IIROSE_WSsend(this.bot, '');
        }
      }, 30 * 1000); // 半分钟发一次包保活
    });

    return socket;
  }

  /**
   * 接受ws通信
   */
  accept()
  {

    // 花园登陆报文
    if (!this.bot.socket) { return; }
    this.bot.socket.addEventListener('message', async (event) =>
    {
      // @ts-ignore
      const array = new Uint8Array(event.data);

      let message: string;
      if (array[0] === 1)
      {
        message = pako.inflate(array.slice(1), {
          to: 'string',
        });
      } else
      {
        message = Buffer.from(array).toString('utf8');
      }
      // console.log(message.slice(0, 5));
      const funcObj = decoder(this.bot, message);
      // console.log(funcObj)
      // 将会话上报

      if (funcObj.manyMessage)
      {
        funcObj.manyMessage.slice().reverse().forEach(element =>
        {
          if (!element.type) { return; }
          const test: Record<string, any> = {};
          const type = element.type;

          test[type] = element;
          decoderMessage(test, this.bot);
        });
      } else if (funcObj.hasOwnProperty('userlist'))
      {
        const userData = funcObj.userlist;
        if (!userData) { return; }
        userData.forEach(async e =>
        {
          if (!e.uid) { return; }
          let avatar = e.avatar;

          if (e.avatar.startsWith('cartoon') || e.avatar.startsWith('scenery') || e.avatar.startsWith('male') || e.avatar.startsWith('popular') || e.avatar.startsWith('anime'))
          {
            avatar = `https://static.codemao.cn/rose/v0/images/icon/${e.avatar}.jpg`;
          }
          else if (e.avatar.startsWith('http://r.iirose.com'))
          {
            avatar = `http://z.iirose.com/lib/php/function/loadImg.php?s=${e.avatar}`;
          }

          this.bot.addData.push({
            uid: e.uid,
            username: e.username,
            avatar: avatar,
            room: e.room,
            color: e.color,
            data: {}
          });

          // 更新自己的头像
        });

        this.bot.user = await this.bot.getSelf();

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
    this.bot.socket = await this.prepare();
    this.accept();

    let time = 5;
    let tryTime = 0;

    this.bot.socket.addEventListener('close', async ({ code, reason }) =>
    {
      if (this.bot.status == Universal.Status.RECONNECT || this.bot.status == Universal.Status.DISCONNECT || this.bot.status == Universal.Status.OFFLINE || code == 1000) { return; }
      logger.warn(`websocket closed with ${code}`);
      // 重连
      const restart = async () =>
      {

        if (tryTime <= time)
        {
          logger.warn(`${reason.toString()}, will retry in ${5000}ms...`);
          setTimeout(async () =>
          {
            this.bot.socket = await this.prepare();
            this.accept();
            tryTime++;
          }, 5000);
        } else
        {
          const message = `failed to connect to IIROSE, code: ${code}`;
          logger.error(message);

          tryTime = 0;
          if (!this.bot.socket) { return; }
          this.bot.socket.removeEventListener('close', () => { });
          this.bot.socket.removeEventListener('message', () => { });
          return this.stop();
        }
      };

      restart();
    });
  }


  /**
   * 关闭ws通信
   */
  async stop()
  {
    this.bot.status = Universal.Status.DISCONNECT;

    if (this.event.length > 0)
    {
      stopEventsServer(this.event); // 停止事件服务器的逻辑
    }

    // 移除事件监听器
    if (this.socket)
    {
      this.socket.removeEventListener('close', () => { });
      this.socket.removeEventListener('message', () => { });
      this.socket.close();
    }

    if (this.bot.socket)
    {
      this.bot.socket.removeEventListener('close', () => { });
      this.bot.socket.removeEventListener('message', () => { });
      this.bot.socket.close();
    }
    this.bot.socket = undefined;
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
      const startTime = Date.now();
      const ws = await this.bot.ctx.http.ws(url);
      const timeout: number = this.bot.config.timeout;
      const timeoutId = setTimeout(() =>
      {
        ws.close();
        resolve('error');
      }, timeout);

      ws.addEventListener('open', () =>
      {
        const endTime = Date.now();
        const latency = endTime - startTime;
        clearTimeout(timeoutId);
        resolve(latency);
        ws.close();
      });

      ws.addEventListener('error', (error) =>
      {
        clearTimeout(timeoutId);
        resolve('error');
      });
    });
  }

}

export namespace WsClient
{
  export interface Config extends Adapter.WsClientConfig { }

  // export const Config: Schema<Config> = Schema.intersect([
  //   Adapter.WsClientConfig,
  // ] as const);
}

export function IIROSE_WSsend(bot: IIROSE_Bot, data: string)
{
  if (!bot.socket) { return; }
  if (bot.socket.readyState == 0) { return; }
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
