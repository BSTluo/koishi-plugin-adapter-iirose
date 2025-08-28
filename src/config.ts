import { Schema } from 'koishi';

export interface Config
{
  usename: string;
  uid: string;
  password: string;
  roomId: string;
  roomPassword: string;
  oldRoomId?: string;
  Signature: string;
  color: string;
  timeout: number;
  timeoutPlusEnable: boolean;
  timeoutPlus: number;
  hangUpMode: boolean;
  debugMode: boolean;
  fullDebugMode: boolean;
  maxRetries: number;

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
    usename: Schema.string().required().description('BOT用户名<br>`不带[**]的部分`'),
    uid: Schema.string().required().description('BOT的唯一标识<br>`不带[@@]的部分`').pattern(/[a-z0-9]{13}/),
    password: Schema.string().required().role('secret').description('BOT的密码'),
    roomId: Schema.string().required().description('BOT的初始房间地址<br>`不带[__]的部分`').pattern(/([a-z0-9]{13})/),
    roomPassword: Schema.string().default('').description('BOT的初始房间密码(可空)'),
    Signature: Schema.string().default('').description('BOT签名'),
    color: Schema.string().role('color').default('rgba(102, 204, 255, 1)').description('BOT气泡颜色（RGBA）<br>透明度通道无效。')
  }).description('基础设置'),
  Schema.object({
    timeout: Schema.number().min(100).max(5000).default(500).description('连接超时限制 (单位：毫秒)'),
    timeoutPlusEnable: Schema.boolean().default(false).description('bot保活：是否开启').experimental(),
    timeoutPlus: Schema.number().min(200000).default(500000).description('bot保活：多久后服务器仍未响应就强制重连 (单位：毫秒)').experimental(),
    hangUpMode: Schema.boolean().default(false).description('是否开启 挂机模式（iirose平台展示的账号状态）'),
    maxRetries: Schema.number().min(1).max(100).default(10).description('连接失败时的最大重试次数<br>达到后 将自动关闭插件。'),
  }).description('进阶设置'),
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
    Schema.object({}) as Schema<Partial<Config>> // 可选
  ]),

  Schema.object({
    oldRoomId: Schema.string().default('').description('仅内部使用'),
    debugMode: Schema.boolean().default(false).description('是否 开启调试模式<br>提issue时，请务必开启此项，附上复现问题的日志'),
    fullDebugMode: Schema.boolean().default(false).description('是否 开启详细调试模式<br>慎重开启'),
  }).description('开发者选项'),
]);