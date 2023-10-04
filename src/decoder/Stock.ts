import { IIROSE_Bot } from '../bot'

export interface Stock {
  userId: string
  totalStock: number
  totalMoney: number
  unitPrice: number
  personalStock: number
  personalMoney: number
}

export const stock = (message: string, bot: IIROSE_Bot) => {
  if (message.substr(0, 1) === '>') {
    const list = message.substr(1).split('>')[0].split('"')
    if (list.length === 5) {
      const data: Stock = {
        userId: bot.ctx.config.uid,
        totalStock: Number(list[0]),
        totalMoney: Number(Number(list[1]).toFixed(2)),
        unitPrice: Number(Number(list[2]).toFixed(2)),
        personalStock: Number(list[3]),
        personalMoney: Number(list[4]),
      }

      bot.ctx.emit('iirose/stockBackCall', data)
      return (data)
    }
    return null
  }
}
