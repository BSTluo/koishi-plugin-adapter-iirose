export interface PaymentCallback
{
  money: number;
}

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
