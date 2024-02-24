import { Bot, Context, Fragment, Schema, Universal } from '@satorijs/satori';
import { SendOptions } from '@satorijs/protocol';
import { IIROSE_WSsend, WsClient } from './ws';
import { IIROSE_BotMessageEncoder } from './sendMessage';
import kick from './encoder/admin/kick';
import mute from './encoder/admin/mute';
import { messageObjList } from './messageTemp';
import { Internal, InternalType } from './internal';
import ws from 'ws';

export class IIROSE_Bot<C extends Context = Context, T extends IIROSE_Bot.Config = IIROSE_Bot.Config> extends Bot<C, T> {
  platform: string = 'iirose';
  socket: ws;

  constructor(ctx: C, config: T)
  {
    super(ctx, config);
    ctx.plugin(WsClient, this);
    this.selfId = ctx.config.uid;
    this.userId = ctx.config.uid;

    this.getSelf().then(v =>
    {
      this.user = v;
    });
  }

  async sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions)
  {
    const messages = await new IIROSE_BotMessageEncoder(this, `${channelId}:` + guildId, guildId, options).send(content);
    return messages.map(message => message.id);
  }

  async sendPrivateMessage(userId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {

    return this.sendMessage(`private:${userId}`, content);
  }

  public inject = ['database'];

  async getSelf(): Promise<Universal.User>
  {
    let user: Universal.User = await this.getUser(this.ctx.config.uid);
    if (user.id == 'error')
    {
      user = {
        id: this.ctx.config.uid,
        name: this.ctx.config.usename,
        avatar: 'http://p26-tt.byteimg.com/origin/pgc-image/cabc74beb5794b97b1b300a2b8817e05'
      };
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
    if (!this.ctx.database) { return user; }
    const userDataTemp = await this.ctx.database.get('iiroseUser', { uid: userId });

    if (userDataTemp.length > 0)
    {
      const userData = userDataTemp[0];
      user = {
        id: userId,
        name: userData.username,
        avatar: userData.avatar
      };
    }
    return user;
  }

  async getMessage(channelId: string, messageId: string)
  {
    return messageObjList[messageId];
  }

  async kickGuildMember(guildId: string, userName: string, permanent?: boolean): Promise<void>
  {
    IIROSE_WSsend(this, kick(userName));
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

    IIROSE_WSsend(this, mute('all', userName, time, reason));
  }

  internal: InternalType = new Internal(this);
}

export namespace IIROSE_Bot
{
  export interface Config extends WsClient.Config
  {
    usename: string;
    password: string;
    roomId: string;
    roomPassword: string;
    oldRoomId: string;
  }

  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      usename: Schema.string().required().description('BOT账号'),
      uid: Schema.string().required().description('BOT的唯一标识').pattern(/(\s*\[\@([\s\S]+)\@\]\s*)|([a-z0-9]+)/),
      password: Schema.string().required().role('secret').description('BOT的密码的[32位小写md5](https://cmd5.com/hash.aspx?s=)'),
      roomId: Schema.string().required().description('BOT的初始房间地址').pattern(/(\s*\[\_([\s\S]+)\_\]\s*)|([a-z0-9]+)/),
      roomPassword: Schema.string().default('').description('BOT的初始房间密码(可空)'),
      oldRoomId: Schema.string().default('').description('一般不需要填写，仅内部使用')
    }).description('BOT配置'),
    Schema.object({
      picFormData: Schema.string().description('图床formData包，[file]为图片文件').default('{"f[]": "[file]","i":"[uid]"}'),
      picLink: Schema.string().description('图床接口').default('https://f.iirose.com/lib/php/system/file_upload.php'),
      picBackLink: Schema.string().description('图床返回url(data为接口返回的data,可以使用data.xxx)').default('http://r.iirose.com/[data]'),
      timeout: Schema.number().min(100).max(5000).default(500).description('bot多久才连接超时(毫秒)')
    }).description('其他配置'),
  ]);
}

IIROSE_Bot.prototype.platform = 'IIROSE_Bot';
