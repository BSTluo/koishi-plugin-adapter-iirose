export default (uid: string, message: string, color: string) =>
{
  const messageId = Math.random().toString().substr(2, 12); // 生成消息ID
  return {
    messageId,
    data: JSON.stringify({
      g: uid,
      m: message,
      mc: color,
      i: messageId, // messageid 
    })
  };
};
