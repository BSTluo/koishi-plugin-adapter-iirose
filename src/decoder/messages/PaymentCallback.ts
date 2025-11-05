export interface PaymentCallback
{
  money: number;
}

/**
 * 解析支付回调信息
 * @param message 消息
 * @returns {{money: number} | undefined}
 */
export const paymentCallback = (message: string) =>
{
  if (message.substring(0, 2) === '|$')
  {
    // paymentCallback
    return {
      money: Number(message.substring(2)),
    };
  }
};
