import { generateMessageId } from '../../utils/utils';

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
