import { Bot, Context, Fragment, Schema, Universal } from '@satorijs/satori';
import { SendOptions, WebSocket } from '@satorijs/protocol';
import { IIROSE_WSsend, WsClient } from './ws';
import { IIROSE_BotMessageEncoder } from './sendMessage';
import kick from './encoder/admin/kick';
import mute from './encoder/admin/mute';
import { messageObjList } from './messageTemp';

export class IIROSE_Bot<C extends Context = Context, T extends IIROSE_Bot.Config = IIROSE_Bot.Config> extends Bot<C, T> {
  platform: string = 'iirose';
  socket: WebSocket;
  constructor(ctx: C, config: T) {
    super(ctx, config);
    ctx.plugin(WsClient, this);
    this.selfId = ctx.config.uid;
    this.userId = ctx.config.uid;
  }

  async sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions) {
    const messages = await new IIROSE_BotMessageEncoder(this, `${channelId}:` + guildId, guildId, options).send(content);
    return messages.map(message => message.id);
  }

  async sendPrivateMessage(userId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]> {
    
    return this.sendMessage(`private:${userId}`, content);
  }

  async getSelf(): Promise<Universal.User> {
    return {
      name: this.ctx.config.usename,
      id: this.ctx.config.uid,
    };
  }

  async getMessage(channelId: string, messageId: string) {
    return messageObjList[messageId];
  }

  async kickGuildMember(guildId: string, userName: string, permanent?: boolean): Promise<void> {
    IIROSE_WSsend(this, kick(userName));
  }

  async muteGuildMember(guildId: string, userName: string, duration: number, reason?: string): Promise<void> {
    let time: string;

    // 永久禁言
    if ((duration / 1000) > 99999) {
      time = '&';
    } else {
      time = String(duration / 1000);
    }

    IIROSE_WSsend(this, mute('all', userName, time, reason));
  }
}

export namespace IIROSE_Bot {
  export interface Config extends WsClient.Config {
    usename: string;
    password: string;
    roomId: string;
  }

  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      usename: Schema.string().required().description('BOT用户名'),
      uid: Schema.string().required().description('BOT的唯一标识'),
      password: Schema.string().required().description('BOT的密码的32位md5'),
      roomId: Schema.string().required().description('BOT的初始房间地址'),
    }).description('BOT配置'),
    Schema.object({
      picLink: Schema.string().description('图床接口').default('https://f.iirose.com/lib/php/system/file_upload.php'),
      picBackLink: Schema.string().description('图床返回url(data为接口返回的data)').default('http://r.iirose.com/[data]'),
      musicLink: Schema.string().description('网易云音乐解析接口').default('https://api.xiaobaibk.com/api/music.163/?id=[musicid]'),
    }).description('其他配置'),
  ]);
}

IIROSE_Bot.prototype.platform = 'IIROSE_Bot';
