import { generateMessageId } from '../../utils/utils';

/**
 * 构建公屏消息
 * @param message 消息内容
 * @param color 颜色
 * @returns {{messageId: string, data: string}}
 */
export default (message: any, color: string) =>
{
  const messageId = generateMessageId();

  if (message === 'cut')
  {
    return {
      messageId,
      data: `{0${JSON.stringify({
        m: message,
        mc: color,
        i: messageId,
      })}`
    };
  }
  return {
    messageId,
    data: JSON.stringify({
      m: message,
      mc: color,
      i: messageId,
    })
  };
};
