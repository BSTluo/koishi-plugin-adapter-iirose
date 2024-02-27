import { Universal, Adapter, Context, Logger, Schema } from '@satorijs/satori';
import { } from 'koishi';
import { IIROSE_Bot } from './bot';
import pako from 'pako';
import { decoder } from './decoder';
import { decoderMessage } from './decoderMessage';
import { startEventsServer, stopEventsServer } from './utils';
import md5 from 'md5'

declare module 'koishi' {
  interface Tables {
    iiroseUser: iiroseUser;
  }
}

export interface iiroseUser {
  uid: string;
  username: string;
  avatar: string;
  room: string;
  color: string;
  data: Record<string, string>;
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const logger = new Logger('IIROSE-BOT');

export class WsClient<C extends Context = Context> extends Adapter.WsClient<C, IIROSE_Bot<C, IIROSE_Bot.Config & WsClient.Config>>
{
  // WSurl: string = 'wss://m2.iirose.com:8778';
  private event: (() => boolean)[] = [];
  public inject = ['database'];

  live: NodeJS.Timeout;
  loginObj: {
    r: string;
    n: string;
    p: string;
    st: string;
    mo: string;
    mb: string;
    mu: string;
    lr: string;
    rp: string;
    fp: string;
  };

  constructor(ctx: C, bot: IIROSE_Bot<C, IIROSE_Bot.Config & WsClient.Config>) {
    super(ctx, bot);

    ctx.model.extend('iiroseUser', {
      // 向用户表中注入字符串字段 foo
      uid: 'string',
      username: 'string',
      avatar: 'string',
      room: 'string',
      color: 'string',
      data: 'json'
    }, {
      primary: 'uid'
    });
  }

  /**
   * 准备ws通信
   * @returns 
   */
  async prepare() {
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

    const roomIdConfig = this.bot.ctx.config.roomId;
    const userNameConfig = this.bot.ctx.config.usename;
    let username = (userNameReg.test(userNameConfig)) ? userNameConfig.match(userNameReg)[1] : userNameConfig;

    this.loginObj = {
      r: (roomIdReg.test(roomIdConfig)) ? roomIdConfig.match(roomIdReg)[1] : roomIdConfig,
      n: username,
      p: this.bot.ctx.config.password,
      st: 'n',
      mo: this.bot.ctx.config.Signature,
      mb: '',
      mu: '01',
      lr: this.bot.ctx.config.oldRoomId,
      rp: this.bot.ctx.config.roomPassword,
      fp: `@${md5(username)}`
    };

    (this.loginObj.lr) ? '' : delete this.loginObj.lr;

    socket.addEventListener('open', () => {

      logger.success('websocket client opening');
      const loginPack = '*' + JSON.stringify(this.loginObj);

      IIROSE_WSsend(this.bot, loginPack);
      this.event = startEventsServer(this.bot);
      this.bot.online();
      this.live = setInterval(() => {
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
  accept() {
    // 花园登陆报文
    this.bot.socket.addEventListener('message', async (event) => {
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

      const funcObj = decoder(this.bot, message);
      // console.log(funcObj)
      // 将会话上报

      if (funcObj.hasOwnProperty('manyMessage'))
      {
        funcObj.manyMessage.slice().reverse().forEach(element => {

          const test = {};
          const type = element.type;
          test[type] = element;

          decoderMessage(test, this.bot);
        });
      } else if (funcObj.hasOwnProperty('userlist'))
      {
        const userData = funcObj.userlist;
        const addData = [];
        userData.forEach(async e => {
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

          addData.push({
            uid: e.uid,
            username: e.username,
            avatar: avatar,
            room: e.room,
            color: e.color,
            data: {}
          });

          // 更新自己的头像
        });

        this.ctx.database.upsert('iiroseUser', addData);
        this.bot.user = await this.bot.getSelf();
      } else
      {
        decoderMessage(funcObj, this.bot);
      }
    });
  }

  /**
   * 开始ws通信
   */
  async start() {
    this.bot.socket = await this.prepare();
    this.accept();

    let time = 5;
    let tryTime = 0;

    this.bot.socket.addEventListener('close', async ({ code, reason }) => {
      if (this.bot.status == Universal.Status.RECONNECT || this.bot.status == Universal.Status.DISCONNECT || this.bot.status == Universal.Status.OFFLINE || code == 1000) { return; }
      logger.warn(`websocket closed with ${code}`);


      // 重连
      const restart = async () => {

        if (tryTime <= time)
        {
          logger.warn(`${reason.toString()}, will retry in ${5000}ms...`);
          setTimeout(async () => {
            this.bot.socket = await this.prepare();
            this.accept();
            tryTime++;
          }, 5000);
        } else
        {
          const message = `failed to connect to IIROSE, code: ${code}`;
          logger.error(message);

          tryTime = 0;
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
  async stop() {
    this.bot.status = Universal.Status.DISCONNECT;
    if (this.event.length > 0) { stopEventsServer(this.event); }
    this.socket?.removeEventListener('close', () => { });
    this.socket?.removeEventListener('message', () => { });
    this.bot.socket?.removeEventListener('close', () => { });
    this.bot.socket?.removeEventListener('message', () => { });

    this.socket?.close();
    this.bot.socket?.close();
    this.socket = null;
    this.bot.socket = null;
  }

  /**
   * 获取延迟
   * @param url 
   * @returns 
   */
  private getLatency(url: string): Promise<number | 'error'> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      const ws = await this.bot.ctx.http.ws(url);
      const timeout: number = this.config['timeout'];
      const timeoutId = setTimeout(() => {
        ws.close();
        resolve('error');
      }, timeout);

      ws.addEventListener('open', () => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        clearTimeout(timeoutId);
        resolve(latency);
        ws.close();
      });

      ws.addEventListener('error', (error) => {
        clearTimeout(timeoutId);
        resolve('error');
      });
    });
  }

}

export namespace WsClient {
  export interface Config extends Adapter.WsClientConfig { }

  export const Config: Schema<Config> = Schema.intersect([
    Adapter.WsClientConfig,
  ] as const);
}

export function IIROSE_WSsend(bot: IIROSE_Bot, data: string) {
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
