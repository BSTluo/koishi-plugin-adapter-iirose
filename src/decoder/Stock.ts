import { IIROSE_Bot } from '../bot/bot';

export interface Stock
{
  unitPrice: number;
  totalStock: number;
  personalStock: number;
  totalMoney: number;
  personalMoney: number;
}

export const stock = (message: string, bot: IIROSE_Bot) =>
{
  if (message.substr(0, 1) === '>')
  {
    const list = message.substr(1).split('>')[0].split('"');
    if (list.length === 5)
    {

      const data: Stock = {
        unitPrice: Number(Number(list[2]).toFixed(4)),
        totalStock: Number(list[0]),
        personalStock: Number(list[3]),
        totalMoney: Number(Number(list[1]).toFixed(4)),
        personalMoney: Number(list[4]),
      };

      bot.handleStockUpdate(data);
      return (data);
    }
    return null;
  }
};
