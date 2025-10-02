import { generateMessageId } from '../../utils/utils';

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
