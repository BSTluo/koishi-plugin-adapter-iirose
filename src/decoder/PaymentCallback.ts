export interface PaymentCallback {
  money: number;
}

export const paymentCallback = (message: string) => {
  if (message.substr(0, 2) === '|$') {
    // paymentCallback
    return {
      money: Number(message.substr(2)),
    };
  }
};
