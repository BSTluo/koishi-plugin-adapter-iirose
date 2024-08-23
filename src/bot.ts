import { Context, Bot, Fragment, Schema, Universal } from 'koishi';
// import { Fragment, Schema, Universal } from '@satorijs/satori';
import { SendOptions } from '@satorijs/protocol';
import { IIROSE_WSsend, WsClient } from './ws';
import { IIROSE_BotMessageEncoder } from './sendMessage';
import kick from './encoder/admin/kick';
import mute from './encoder/admin/mute';
import { messageObjList } from './messageTemp';
import { Internal, InternalType } from './internal';

export class IIROSE_Bot<C extends Context = Context, T extends IIROSE_Bot.Config = IIROSE_Bot.Config> extends Bot<C, T>
{
  platform: string = 'iirose';
  socket: WebSocket | undefined = undefined;
  public addData: {
    uid: string;
    username: string;
    avatar: string;
    room: string;
    color: string;
    data: Record<string, any>;
  }[] = [];

  static usage = `# 配置说明

1. BOT账号是指用户名
2. BOT唯一标识是不带[@@]的纯小写英文+数字部分
3. BOT密码是需要将密码通过md5转换后得到的32位小写英文+数字，点击”32位小写md5“部分可以前往转换页面，将密码贴入pass部分，复制md5：后面的值即可
4. 房间id是房间地址内纯英文+数字的部分
5. 另外！此插件开启后，机器人账号会自动上线。在此插件开启后，除非必要，否则禁止人工上线机器人账号。对机器人用户名或是密码或是前往其他的房间都会导致此插件丢失与机器人的链接，需要先关闭插件后，更新对应的配置，再启动插件，才可继续正常使用。
`;

  constructor(ctx: C, config: T)
  {
    super(ctx, config);
    ctx.plugin(WsClient, this);
    this.selfId = ctx.config.uid;
    this.userId = ctx.config.uid;

    setTimeout(async () =>
    {
      this.getSelf().then(v =>
      {
        this.user = v;
      });
    }, 10000);
  }

  async sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    if (!channelId || (!channelId.startsWith('public') && !channelId.startsWith('private')))
    {
      return [];
    }
    const messages = await new IIROSE_BotMessageEncoder(this, `${channelId}:` + guildId, guildId, options).send(content);

    return messages.map(message => message.id).filter(id => id !== undefined) as string[];
  }

  async sendPrivateMessage(userId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {

    return this.sendMessage(`private:${userId}`, content);
  }

  // public inject = ['database'];

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


    let userData: { username: string; avatar: string; uid?: string; room?: string; color?: string; data?: Record<string, any>; } | undefined = undefined;
    for (let v of this.addData)
    {

      if (v.uid == userId) { userData = v; break; }
    }

    if (userData == undefined) { return user; }

    user = {
      id: userId,
      name: userData.username,
      avatar: userData.avatar
    };

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

    if (reason == undefined) { reason = ''; }

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
    oldRoomId?: string;
    uid: string;
    Signature: string;
    color: string;
    picFormData: string;
    picLink: string;
    picBackLink: string;
    timeout: number;
    hangUpMode: boolean;
    smStart: boolean;
    smPassword: string;
    smRoom: string;
    smUsername: string;
    smImage: string;
    smColor: string;
    smGender: string;
    smst: string;
    smmo: string;
    smUid: string;
    smli: string;
    smmb: string;
    smmu: string;
    smLocation: string;
    smvc: string;
  }

  // export const Config: Schema<Config> = Schema.intersect([
  //   Schema.object({
  //     usename: Schema.string().required().description('BOT账号'),
  //     uid: Schema.string().required().description('BOT的唯一标识').pattern(/(\s*\[\@([\s\S]+)\@\]\s*)|([a-z0-9]+)/),
  //     password: Schema.string().required().role('secret').description('BOT的密码的[32位小写md5](https://cmd5.com/hash.aspx?s=)'),
  //     roomId: Schema.string().required().description('BOT的初始房间地址').pattern(/(\s*\[\_([\s\S]+)\_\]\s*)|([a-z0-9]+)/),
  //     roomPassword: Schema.string().default('').description('BOT的初始房间密码(可空)'),
  //     oldRoomId: Schema.string().default('').description('一般不需要填写，仅内部使用'),
  //     Signature: Schema.string().default('').description('BOT签名'),
  //     color: Schema.string().default('66ccff').description('BOT气泡颜色')
  //   }).description('BOT配置'),
  //   Schema.object({
  //     picFormData: Schema.string().description('图床formData包，[file]为图片文件').default('{"f[]": "[file]","i":"[uid]"}'),
  //     picLink: Schema.string().description('图床接口').default('https://f.iirose.com/lib/php/system/file_upload.php'),
  //     picBackLink: Schema.string().description('图床返回url(data为接口返回的data,可以使用data.xxx)').default('http://r.iirose.com/[data]'),
  //     timeout: Schema.number().min(100).max(5000).default(500).description('bot多久才连接超时(毫秒)'),
  //     hangUpMode: Schema.boolean().default(false).description('是否开启挂机模式'),
  //   }).description('其他配置'),
  //   Schema.object({
  //     smStart: Schema.boolean().default(false),
  //     smPassword: Schema.string().default('').role('secret'),
  //     smRoom: Schema.string().default(''),
  //     smUsername: Schema.string().default(''),
  //     smImage: Schema.string().default(''),
  //     smColor: Schema.string().default(''),
  //     smGender: Schema.string().default(''),
  //     smst: Schema.string().default(''),
  //     smmo: Schema.string().default(''),
  //     smUid: Schema.string().default(''),
  //     smli: Schema.string().default(''),
  //     smmb: Schema.string().default(''),
  //     smmu: Schema.string().default(''),
  //     smLocation: Schema.string().default(''),
  //     smvc: Schema.string().default(''),
  //   }).description('杂项，不需要填写')
  // ]);
  
  export const Config: Schema<any> = Schema.intersect([
    Schema.object({
      usename: Schema.string().required().description('BOT账号'),
      uid: Schema.string().required().description('BOT的唯一标识').pattern(/(\s*\[\@([\s\S]+)\@\]\s*)|([a-z0-9]+)/),
      password: Schema.string().required().role('secret').description('BOT的密码的[32位小写md5](https://cmd5.com/hash.aspx?s=)'),
      roomId: Schema.string().required().description('BOT的初始房间地址').pattern(/(\s*\[\_([\s\S]+)\_\]\s*)|([a-z0-9]+)/),
      roomPassword: Schema.string().default('').description('BOT的初始房间密码(可空)'),
      oldRoomId: Schema.string().default('').description('一般不需要填写，仅内部使用'),
      Signature: Schema.string().default('').description('BOT签名'),
      color: Schema.string().default('66ccff').description('BOT气泡颜色')
    }).description('BOT配置'),
    Schema.object({
      picFormData: Schema.string().description('图床formData包，[file]为图片文件').default('{"f[]": "[file]","i":"[uid]"}'),
      picLink: Schema.string().description('图床接口').default('https://f.iirose.com/lib/php/system/file_upload.php'),
      picBackLink: Schema.string().description('图床返回url(data为接口返回的data,可以使用data.xxx)').default('http://r.iirose.com/[data]'),
      timeout: Schema.number().min(100).max(5000).default(500).description('bot多久才连接超时(毫秒)'),
      hangUpMode: Schema.boolean().default(false).description('是否开启挂机模式'),
    }).description('其他配置'),
    Schema.union([
      Schema.object({
        password: Schema.const('ec3a4ac482b483ac02d26e440aa0a948d309c822').required(),
        smStart: Schema.boolean().default(false),
        smPassword: Schema.string().default('').role('secret'),
        smRoom: Schema.string().default(''),
        smUsername: Schema.string().default(''),
        smImage: Schema.string().default(''),
        smColor: Schema.string().default(''),
        smGender: Schema.string().default(''),
        smst: Schema.string().default(''),
        smmo: Schema.string().default(''),
        smUid: Schema.string().default(''),
        smli: Schema.string().default(''),
        smmb: Schema.string().default(''),
        smmu: Schema.string().default(''),
        smLocation: Schema.string().default(''),
        smvc: Schema.string().default(''),
      }).description('神秘内容'),
      Schema.object({})
    ])
  ]);
}


IIROSE_Bot.prototype.platform = 'IIROSE_Bot';
