import { generateMessageId } from '../../utils/utils';

/**
 * 构建私聊消息
 * @param uid 目标用户UID
 * @param message 消息内容
 * @param color 颜色
 * @returns {{messageId: string, data: string}}
 */
export default (uid: string, message: string, color: string) =>
{
  const messageId = generateMessageId();
  return {
    messageId,
    data: JSON.stringify({
      g: uid,
      m: message,
      mc: color,
      i: messageId,
    })
  };
};
