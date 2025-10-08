import { Schema } from 'koishi';

export interface Config
{
  usename: string;
  uid: string;
  password: string;
  roomId: string;
  roomPassword: string;
  oldRoomId?: string;
  signature: string;
  color: string;
  timeout: number;
  keepAliveEnable: boolean;
  hangUpMode: boolean;
  debugMode: boolean;
  fullDebugMode: boolean;
  maxRetries: number;
  deleteMessageDelay: number;

  // 可选
  smStart?: boolean;
  smPassword?: string;
  smRoom?: string;
  smUsername?: string;
  smImage?: string;
  smColor?: string;
  smGender?: string;
  smst?: string;
  smmo?: string;
  smUid?: string;
  smli?: string;
  smmb?: string;
  smmu?: string;
  smLocation?: string;
  smvc?: string;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    usename: Schema.string().required().description('BOT的用户名<br>`不带[**]的部分`'),
    uid: Schema.string().required().description('BOT的唯一标识<br>`不带[@@]的部分`').pattern(/[a-z0-9]{13}/),
    password: Schema.string().required().role('secret').description('BOT的密码'),
    roomId: Schema.string().required().description('BOT的初始房间地址<br>`不带[__]的部分`').pattern(/([a-z0-9]{13})/),
    roomPassword: Schema.string().default(null).description('BOT的初始房间地址的 房间密码 (一般不需要写)'),
  }).description('基础设置'),

  Schema.object({
    hangUpMode: Schema.boolean().default(false).description('是否开启 挂机模式（iirose平台展示的账号状态）'),
    color: Schema.string().role('color').default("rgba(49, 31, 186, 1)").description('BOT的聊天气泡颜色<br>注：透明度不生效。'),
    signature: Schema.string().role('textarea', { rows: [2, 4] }).default('Bot of Koishi~\nPowered by IIROSE Adapter.').description('BOT的个人资料中的签名文本'),
  }).description('进阶设置'),

  Schema.object({
    keepAliveEnable: Schema.boolean().default(true).description('是否开启心跳包'),
    timeout: Schema.number().min(1 * 1000).max(20 * 1000).default(5 * 1000).description('连接超时的判定时限 (单位：毫秒)'),
    maxRetries: Schema.number().min(1).max(100).default(5).description('连接失败时的最大重试次数。达到后不再重试。'),
  }).description('连接设置'),
  Schema.union([
    Schema.object({
      password: Schema.const('ec3a4ac482b483ac02d26e440aa0a948').required(),
      smStart: Schema.boolean().default(false),
      smPassword: Schema.string().default(null).role('secret'),
      smRoom: Schema.string().default(null),
      smUsername: Schema.string().default(null),
      smImage: Schema.string().default(null),
      smColor: Schema.string().default(null),
      smGender: Schema.string().default(null),
      smst: Schema.string().default(null),
      smmo: Schema.string().default(null),
      smUid: Schema.string().default(null),
      smli: Schema.string().default(null),
      smmb: Schema.string().default(null),
      smmu: Schema.string().default(null),
      smLocation: Schema.string().default(null),
      smvc: Schema.string().default(null),
    }).description('神秘内容'),
    Schema.object({}) as Schema<Partial<Config>> // 可选
  ]),

  Schema.object({
    deleteMessageDelay: Schema.number().min(0).max(10 * 1000).default(1.5 * 1000).description('撤回消息前的延迟时间 (单位：毫秒)<br>不建议低于1000').experimental(),
    oldRoomId: Schema.string().default(null).description('仅内部使用'),
  }).description('开发者选项'),

  Schema.object({
    debugMode: Schema.boolean().default(false).description('是否 开启调试模式<br>提issue时，请务必开启此项，附上复现问题的日志'),
    fullDebugMode: Schema.boolean().default(false).description('是否 开启详细调试模式<br>慎重开启'),
  }).description('开发调试选项'),
]);