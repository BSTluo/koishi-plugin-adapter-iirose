/**
 * 向用户支付
 * @param uid 目标用户UID
 * @param money 金额
 * @param message 附带消息 (可选)
 * @returns {string}
 */
export default (uid: string, money: number, message: string = '') =>
{
  const data = JSON.stringify({
    g: uid,
    c: money,
    m: message,
  });
  return `+$${data}`;
};
