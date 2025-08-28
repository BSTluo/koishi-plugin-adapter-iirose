import { Context, Logger } from 'koishi';
import { IIROSE_Bot } from './bot/bot';
import * as IIROSE from './bot/event';
import { Config } from './config';

export const name = 'adapter-iirose';

export const inject = {
  required: ['http', 'logger', 'filemanager'],
  optional: ['database']
};

export const reusable = true;
export const filter = false;
export { Config };

export const usage = `
---

## 配置项说明

<p>➣ <a href="https://bstluo.github.io/koishi-plugin-adapter-iirose/" target="_blank">完整教程请点击我 查看文档</a></p>


1. BOT账号是指 用户名不带[**]的部分。
2. BOT唯一标识是 唯一标识不带[@@]的纯小写英文+数字部分。
3. BOT密码，将密码贴入配置项即可。
4. 房间id是 房间地址不带[__]的部分。
5. 请确保机器人用户名、密码正确！（如手动变更，请修改配置）。
6. 请注意，需要使用 filemanager 插件上传图片。不配置 filemanager 插件将无法发送富媒体消息。
7. 任何反馈、需求、求助，可以加入社区群 1059933235 。

---

本插件所需依赖：

- http、logger、database
- [filemanager （需要额外安装）](/market?keyword=filemanager+email:1946831552@qq.com)

---

<p>➣ <a href="https://bstluo.github.io/koishi-plugin-adapter-iirose/" target="_blank">点击此处 查看文档</a></p>

---
`;

export * from './bot/bot';
export * from './utils/ws';
export * from './bot/event';


declare module '@satorijs/core' {
  interface Events extends IIROSE.Events { }
}

export let loggerError: (message: any, ...args: any[]) => void;
export let loggerInfo: (message: any, ...args: any[]) => void;
export let loggerDebug: (message: any, ...args: any[]) => void;
export let loggerWarn: (message: any, ...args: any[]) => void;
export let logInfo: (message: any, ...args: any[]) => void;
export let fulllogInfo: (message: any, ...args: any[]) => void;

const logger = new Logger(`DEV:${name}`);

export function apply(ctx: Context, config: Config)
{

  ctx.on('ready', () =>
  {
    let isDisposing = false;
    let bot: IIROSE_Bot | null = null;

    // 全局函数
    logInfo = (message: any, ...args: any[]) =>
    {
      if (config.debugMode)
      {
        logger.info(`[${config.uid}]`, message, ...args);
      }
    };
    fulllogInfo = (message: any, ...args: any[]) =>
    {
      if (config.fullDebugMode)
      {
        logger.info(`[${config.uid}]`, message, ...args);
      }
    };
    loggerInfo = (message: any, ...args: any[]) =>
    {
      ctx.logger.info(message, ...args);
    };
    loggerDebug = (message: any, ...args: any[]) =>
    {
      ctx.logger.debug(message, ...args);
    };
    loggerWarn = (message: any, ...args: any[]) =>
    {
      ctx.logger.warn(message, ...args);
    };
    loggerError = (message: any, ...args: any[]) =>
    {
      ctx.logger.error(message, ...args);
    };

    ctx.on('dispose', async () =>
    {
      if (isDisposing) return;

      isDisposing = true;
      fulllogInfo('[IIROSE] 插件正在停用，设置停用标志');

      if (bot)
      {
        try
        {
          // 立即停用
          bot.setDisposing(true);
          await Promise.race([
            bot.stop(),
            new Promise(resolve => setTimeout(resolve, 1000))
          ]);
          loggerInfo('[IIROSE] 适配器已停止运行。');
        } catch (error)
        {
          loggerError('[IIROSE] 适配器停止失败:', error);
        } finally
        {
          bot = null;
        }
      }
    });

    ctx.on('ready', async () =>
    {
      if (isDisposing)
      {
        fulllogInfo('[IIROSE] 插件正在停用，跳过适配器启动');
        return;
      }

      fulllogInfo('[IIROSE] 插件准备就绪，开始启动适配器');

      // 清理旧实例
      if (bot)
      {
        try
        {
          bot.setDisposing(true);
          // 重连标志
          if (bot.wsClient)
          {
            bot.wsClient.isReconnecting = true;
          }
          await Promise.race([
            bot.stop(),
            new Promise(resolve => setTimeout(resolve, 500))
          ]);
        } catch (error)
        {
          loggerError('[IIROSE] 清理旧适配器失败:', error);
        }
      }

      if (isDisposing)
      {
        fulllogInfo('[IIROSE] 插件正在停用，取消适配器创建');
        return;
      }

      // 创建机器人
      bot = new IIROSE_Bot(ctx, config);

      fulllogInfo('[IIROSE] 机器人实例创建完成，Koishi 将自动启动');
    });
  });
}
