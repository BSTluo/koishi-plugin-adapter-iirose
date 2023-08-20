import { IIROSE_Bot } from "../bot"

export interface Stock {
  totality: number
  grossAmount: number
  unitPrice: number
  quantityOwned: number
  purse: number
}

export const stock = (message: string, bot: IIROSE_Bot) => {
  if (message.substr(0, 1) === '>') {
    const list = message.substr(1).split('>')[0].split('"')
    if(list.length == 5) {
      const data: Stock = {
        totality: Number(list[0]),
        grossAmount: Number(Number(list[1]).toFixed(2)),
        unitPrice: Number(Number(list[2]).toFixed(2)),
        quantityOwned: Number(list[3]),
        purse: Number(list[4])
      }
      bot.ctx.emit('iirose/stockBackCall', data)
      return(data)
    }
    return null
  }
}
