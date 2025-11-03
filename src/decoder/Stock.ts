import { IIROSE_Bot } from '../bot/bot';
import { comparePassword } from '../utils/password';

export interface Stock
{
  totalStock: number;
  totalMoney: number;
  unitPrice: number;
  personalStock: number;
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
        totalStock: Number(list[0]),
        totalMoney: Number(Number(list[1]).toFixed(4)),
        unitPrice: Number(Number(list[2]).toFixed(4)),
        personalStock: Number(list[3]),
        personalMoney: Number(list[4]),
      };

      bot.handleStockUpdate(data);
      return (data);
    }
    return null;
  }
};
