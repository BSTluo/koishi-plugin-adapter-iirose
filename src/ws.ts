import { Adapter, Context, Logger, Schema } from '@satorijs/satori';
import { Status, WebSocket } from '@satorijs/protocol';
import { IIROSE_Bot } from './bot';
import pako from 'pako';
import { decoder } from './decoder';
import { decoderMessage } from './decoderMessage';
import { startEventsServer, stopEventsServer } from './utils';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const logger = new Logger('IIROSE-BOT');

export class WsClient<C extends Context = Context> extends Adapter.WsClient<C, IIROSE_Bot<C, IIROSE_Bot.Config & WsClient.Config>> {
  // WSurl: string = 'wss://m2.iirose.com:8778';
  private event: (() => boolean)[] = [];

  live: NodeJS.Timeout;
  loginObj: {
    r: string;
    n: string;
    p: string;
    st: string;
    mo: string;
    mb: string;
    mu: string;
  };

  constructor(ctx: C, bot: IIROSE_Bot<C, IIROSE_Bot.Config & WsClient.Config>) {
    super(ctx, bot);

    // ctx.on('dispose', () => {
    //   logger.info('offline to server: %c', this.WSurl)
    //   this.over(bot)
    // })
  }

  async prepare(): Promise<WebSocket> {
    const iiroseList = ['m1', 'm2', 'm8', 'm9', 'm'];
    let faseter = '';
    let maximumSpeed = 100000;

    for (let webIndex of iiroseList) {
      const speed: number | 'error' = await this.getLatency(`wss://${webIndex}.iirose.com:8778`);
      if (speed != 'error') {
        if (maximumSpeed > speed) {
          faseter = webIndex;
          maximumSpeed = speed;
        }
      }
    }

    if (faseter == '') {
      this.bot.stop();
      throw '您的网络异常，无法连接至IIROSE服务器';
    } else {
      const socket: WebSocket = this.bot.ctx.http.ws(`wss://${faseter}.iirose.com:8778`);
      this.bot.socket = socket;
      // socket = this.socket
      // this.socket.binaryType = 'arraybuffer'

      this.loginObj = {
        r: this.bot.ctx.config.roomId,
        n: this.bot.ctx.config.usename,
        p: this.bot.ctx.config.password,
        st: 'n',
        mo: '',
        mb: '',
        mu: '01',
      };

      socket.addEventListener('open', () => {

        logger.success('websocket client opening');
        const loginPack = '*' + JSON.stringify(this.loginObj);

        IIROSE_WSsend(this.bot, loginPack);
        this.event = startEventsServer(this.bot);
        this.bot.online();
        this.live = setInterval(() => {
          if (this.bot.status == Status.ONLINE) {
            IIROSE_WSsend(this.bot, '');
          }
        }, 30 * 1000); // 半分钟发一次包保活
      });

      return socket;
    }
  }

  accept() {
    // 花园登陆报文
    this.bot.socket.addEventListener('message', (event) => {
      // @ts-ignore
      const array = new Uint8Array(event.data);

      let message: string;
      if (array[0] === 1) {
        message = pako.inflate(array.slice(1), {
          to: 'string',
        });
      } else {
        message = Buffer.from(array).toString('utf8');
      }
      const funcObj = decoder(this.bot, message);
      // console.log(funcObj)
      // 将会话上报
      // eslint-disable-next-line no-prototype-builtins
      if (funcObj.hasOwnProperty('manyMessage')) {
        funcObj.manyMessage.slice().reverse().forEach(element => {
          const test = {};
          const type = element.type;
          test[type] = element;

          decoderMessage(test, this.bot);
        });
      } else {
        decoderMessage(funcObj, this.bot);
      }
    });
  }

  async start() {
    this.bot.socket = await this.prepare();
    this.accept();

    let time = 5;
    let tryTime = 0;

    this.bot.socket.addEventListener('close', async ({ code, reason }) => {
      if (this.bot.status == Status.RECONNECT || this.bot.status == Status.DISCONNECT || this.bot.status == Status.OFFLINE || code == 1000) { return; }
      logger.warn(`websocket closed with ${code}`);
      const restart = async () => {
        if (tryTime <= time) {
          logger.warn(`${reason.toString()}, will retry in ${5000}ms...`);
          setTimeout(async () => {
            this.bot.socket = await this.prepare();
            this.accept();
            tryTime++;
          }, 5000);
        } else {
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


  async stop() {
    this.bot.status = Status.DISCONNECT;
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

  private getLatency(url: string): Promise<number | 'error'> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const ws = this.bot.ctx.http.ws(url);
      const timeout: number = 400
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
    Adapter.WsClient.Config,
  ]);
}

export function IIROSE_WSsend(bot: IIROSE_Bot, data: string) {
  if (bot.socket.readyState == 0) { return; }
  const buffer = Buffer.from(data);
  const unintArray: any = Uint8Array.from(buffer);

  if (unintArray.length > 256) {
    const deflatedData = pako.gzip(data);
    const deflatedArray: any = new Uint8Array(deflatedData.length + 1);
    deflatedArray[0] = 1;
    deflatedArray.set(deflatedData, 1);
    bot.socket.send(deflatedArray);
  } else {
    bot.socket.send(unintArray);
  }
};
