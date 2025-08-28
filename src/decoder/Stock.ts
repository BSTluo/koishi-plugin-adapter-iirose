import { IIROSE_Bot } from '../bot/bot';
import { comparePassword } from '../utils/password';

export interface Stock
{
  userId: string;
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

      let uid = bot.ctx.config.uid;

      if (bot.config.smStart && comparePassword(bot.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
      {
        uid = bot.ctx.config.smUid;
      }

      const data: Stock = {
        userId: uid,
        totalStock: Number(list[0]),
        totalMoney: Number(Number(list[1]).toFixed(4)),
        unitPrice: Number(Number(list[2]).toFixed(4)),
        personalStock: Number(list[3]),
        personalMoney: Number(list[4]),
      };

      bot.ctx.emit('iirose/stockBackCall', data);
      return (data);
    }
    return null;
  }
};
