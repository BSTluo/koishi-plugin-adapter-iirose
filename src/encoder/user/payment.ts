/**
 * 支付回调信息
 */
export interface PaymentCallback
{
  money: number;
}

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

/**
 * 解析支付回调信息
 * @param message 消息
 * @returns {{money: number} | undefined}
 */
export const parsePaymentCallback = (message: string): PaymentCallback | undefined =>
{
  if (message.substring(0, 2) === '|$')
  {
    return {
      money: Number(message.substring(2)),
    };
  }
};
