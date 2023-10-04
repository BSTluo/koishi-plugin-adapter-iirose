import { Logger } from '@satorijs/satori'
import { IIROSE_Bot } from './bot'
import kickFunction from './encoder/admin/kick'
import cutOneFunction from './encoder/admin/media_cut'
import cutAllFunction from './encoder/admin/media_clear'
import setMaxUserFunction from './encoder/admin/setMaxUser'
import whiteListFunction from './encoder/admin/whiteList'
import damakuFunction from './encoder/messages/damaku'
import mediaCard from './encoder/messages/media_card'
import mediaData from './encoder/messages/media_data'
import StockBuy from './encoder/user/StockBuy'
import StockSell from './encoder/user/StockSell'
import StockGet from './encoder/user/StockGet'
import { IIROSE_WSsend } from './ws'

const logger = new Logger('IIROSE-BOT')

export const EventsServer = (bot: IIROSE_Bot) => {
  bot.ctx.on('iirose/moveRoom', async moveData => {
    const roomId = moveData.roomId
    if (bot.config.roomId === roomId) { return logger.debug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 ') }
    bot.config.roomId = roomId

    /*
    await bot.adapter.stop(bot)
    await bot.adapter.start(bot)
    */
    bot.status = 4
    await bot.stop()
    await bot.start()
  })

  bot.ctx.on('iirose/kick', kickData => {
    /* 示例data
    kickData: {
        username: '用户名'
    }
    */
    IIROSE_WSsend(bot, kickFunction(kickData.username))
  })

  bot.ctx.on('iirose/cut-one', cutOne => {
    /* 示例data
    cutOneData: {
        id: '歌曲id'
    }
    */
    // eslint-disable-next-line no-prototype-builtins
    (cutOne.hasOwnProperty('id')) ? IIROSE_WSsend(bot, cutOneFunction(cutOne.id)) : IIROSE_WSsend(bot, cutOneFunction())
  })

  bot.ctx.on('iirose/cut-all', () => {
    /* 示例data
    （无）
    */
    IIROSE_WSsend(bot, cutAllFunction())
  })

  bot.ctx.on('iirose/setMaxUser', setMaxUser => {
    /* 示例data
    setMaxUser: {
      maxMember: 人数（为空则清除限制？）
    }
    */
    // eslint-disable-next-line no-prototype-builtins
    (setMaxUser.hasOwnProperty('number')) ? IIROSE_WSsend(bot, setMaxUserFunction(setMaxUser.maxMember)) : IIROSE_WSsend(bot, setMaxUserFunction())
  })

  bot.ctx.on('iirose/whiteList', whiteList => {
    /* 示例data
    data: {
      username: 用户名,
      time: 持续时间（应该是秒）,
      intro: 大抵是备注？可忽略不填这一项
    }
    */

    // eslint-disable-next-line max-len, no-prototype-builtins
    (whiteList.hasOwnProperty('intro')) ? IIROSE_WSsend(bot, whiteListFunction(whiteList.username, whiteList.time, whiteList.intro)) : IIROSE_WSsend(bot, whiteListFunction(whiteList.username, whiteList.time))
  })

  bot.ctx.on('iirose/damaku', damaku => {
    /* 示例data
    data: {
      message: 弹幕内容,
      color: 16进制颜色代码（不带#）
    }
    */
    IIROSE_WSsend(bot, damakuFunction(damaku.message, damaku.color))
  })

  bot.ctx.on('iirose/makeMusic', musicOrigin => {
    const { type, name, signer, cover, link, url, duration, bitRate, color } = musicOrigin
    IIROSE_WSsend(bot, mediaCard(type, name, signer, cover, bitRate, color))
    IIROSE_WSsend(bot, mediaData(type, name, signer, cover, link, url, duration))
  })

  bot.ctx.on('iirose/stockBuy', numberData => {
    IIROSE_WSsend(bot, StockBuy(numberData))
  })

  bot.ctx.on('iirose/stockSell', numberData => {
    IIROSE_WSsend(bot, StockSell(numberData))
  })

  bot.ctx.on('iirose/stockGet', callBack => {
    IIROSE_WSsend(bot, StockGet())
    bot.ctx.once('iirose/stockBackCall', stockData => {
      return callBack(stockData)
    })
  })
  // 发音频视频的果然还是直接sendMessage.ts里面改好...
  // system那边真的有东西有用吗
  // user也是！！
  // 摸了摸了))
}
