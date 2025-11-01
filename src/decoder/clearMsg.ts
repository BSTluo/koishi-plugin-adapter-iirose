import { h } from 'koishi';
import { IIROSE_Bot } from '../bot/bot';

export async function clearMsg(msg: string, bot: IIROSE_Bot)
{
    // 处理 markdown 元素：移除开头的 `\\\\\\*\n` 前缀
    msg = msg.replace(/^\\\\\\\*\n/, '');

    // 处理 a 元素：移除开头的反斜杠
    msg = msg.replace(/\\(https*:\/\/[\s\S]+)/g, '$1');

    // 优先处理历史遗留的图片格式 `[url#e]`，将其转换为裸链接
    msg = msg.replace(/\[((https*:\/\/[\s\S]+?\.(png|jpg|jpeg|gif))(#e)*)\]/g, '$1');

    async function replaceAsync(str: string, regex: RegExp, asyncFn: (...args: any[]) => Promise<string>)
    {
        const promises: Promise<string>[] = [];
        str.replace(regex, (...args) =>
        {
            promises.push(asyncFn(...args));
            return '';
        });
        const data = await Promise.all(promises);
        return str.replace(regex, () => data.shift()!);
    }

    // 处理图片 (同步)
    const imageUrlRegex = /((?:https?:\/\/[\s\S]+?)\.(?:png|jpg|jpeg|gif)(?:#e)?)/g;
    msg = msg.replace(imageUrlRegex, (match) =>
    {
        const cleanUrl = match.replace(/#e$/, '');
        return h.image(cleanUrl).toString();
    });

    // 处理 at-by-name (异步)
    // 消耗前后空格，但将空格捕获以便在替换时放回
    const atNameRegex = /(\s)\[\*([\s\S]+?)\*\](\s)/g;
    msg = await replaceAsync(msg, atNameRegex, async (raw, space1, name, space2) =>
    {
        const user = await bot.internal.getUserByName(name);
        // 如果找到了用户，就进行替换；否则，返回原始字符串（包括空格）
        if (user)
        {
            return `${space1}${h('at', { id: user.id, name }).toString()}${space2}`;
        }
        return raw;
    });

    // 处理 at-by-id (异步)
    const atIdRegex = /(\s)\[@([\s\S]+?)@\](\s)/g;
    msg = await replaceAsync(msg, atIdRegex, async (raw, space1, id, space2) =>
    {
        const user = await bot.internal.getUserById(id);
        if (user)
        {
            return `${space1}${h('at', { id, name: user.name }).toString()}${space2}`;
        }
        return raw;
    });

    // 处理 sharp 元素（提及频道）
    const sharpRegex = /(\s)\[_([\s\S]+?)\](\s)/g;
    msg = await replaceAsync(msg, sharpRegex, async (raw, space1, channelId, space2) =>
    {
        // 如果找到了频道ID，就进行替换；否则，返回原始字符串（包括空格）
        if (channelId)
        {
            // 移除频道ID末尾的下划线
            const cleanChannelId = channelId.replace(/_+$/, '');
            return `${space1}${h('sharp', { id: cleanChannelId }).toString()}${space2}`;
        }
        return raw;
    });

    return msg;
}
