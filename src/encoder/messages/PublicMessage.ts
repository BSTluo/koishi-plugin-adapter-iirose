export default (message: any, color: string) =>
{
  const messageId = Math.random().toString().substr(2, 12); // 生成消息ID

  if (message === 'cut')
  {
    return {
      messageId,
      data: `{0${JSON.stringify({
        m: message,
        mc: color,
        i: messageId,// messageid 
      })}`
    };
  }
  return {
    messageId,
    data: JSON.stringify({
      m: message,
      mc: color,
      i: messageId, // messageid 
    })
  };
};
