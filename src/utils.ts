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

const logger = new Logger('IIROSE-BOT')

export const EventsServer = (bot: IIROSE_Bot) => {
  bot.ctx.on('iirose/moveRoom', async moveData => {
    const roomId = moveData.roomId
    if (bot.config.roomId == roomId) { return logger.debug(' [IIROSE-BOT] 移动房间失败，当前所在房间已为目标房间 ') }
    bot.config.roomId = roomId

    /*
    await bot.adapter.stop(bot)
    await bot.adapter.start(bot)
    */
    bot.status = "reconnect"
    await bot.adapter.stop(bot)
    await bot.adapter.start(bot)
    return
  })

  bot.ctx.on('iirose/kick', kickData => {
    /* 示例data
    kickData: {
        username: '用户名'
    }
    */
    bot.send(kickFunction(kickData.username))
    return
  })

  bot.ctx.on('iirose/cut-one', cutOne => {
    /* 示例data
    cutOneData: {
        id: '歌曲id'
    }
    */
    (cutOne.hasOwnProperty('id')) ? bot.send(cutOneFunction(cutOne.id)) : bot.send(cutOneFunction())
    return
  })

  bot.ctx.on('iirose/cut-all', () => {
    /* 示例data
    （无）
    */
    bot.send(cutAllFunction())
    return
  })


  bot.ctx.on('iirose/setMaxUser', setMaxUser => {
    /* 示例data
    setMaxUser: {
      maxMember: 人数（为空则清除限制？）
    }
    */
    (setMaxUser.hasOwnProperty('number')) ? bot.send(setMaxUserFunction(setMaxUser.maxMember)) : bot.send(setMaxUserFunction())
    return
  })

  bot.ctx.on('iirose/whiteList', whiteList => {
    /* 示例data
    data: {
      username: 用户名,
      time: 持续时间（应该是秒）,
      intro: 大抵是备注？可忽略不填这一项
    }
    */

    (whiteList.hasOwnProperty('intro')) ? bot.send(whiteListFunction(whiteList.username, whiteList.time, whiteList.intro)) : bot.send(whiteListFunction(whiteList.username, whiteList.time))
    return
  })

  bot.ctx.on('iirose/damaku', damaku => {
    /* 示例data
    data: {
      message: 弹幕内容,
      color: 16进制颜色代码（不带#）
    }
    */
    bot.send(damakuFunction(damaku.message, damaku.color))
    return
  })

  bot.ctx.on('iirose/makeMusic', musicOrigin => {
    const { type, name, signer, cover, link, url, duration, bitRate, color } = musicOrigin
    console.log(musicOrigin)
    bot.send(mediaCard(type, name, signer, cover, bitRate, color))
    bot.send(mediaData(type, name, signer, cover, link, url, duration))
    return
  })

  bot.ctx.on('iirose/stockBuy', numberData => {
    bot.send(StockBuy(numberData))
    return
  })

  bot.ctx.on('iirose/stockSell', numberData => {
    bot.send(StockSell(numberData))
    return
  })

  bot.ctx.on('iirose/stockGet', callBack => {
    bot.send(StockGet())
    bot.ctx.once('iirose/stockBackCall', stockData => {
      return callBack(stockData)
    })
    return
  })
  // 发音频视频的果然还是直接sendMessage.ts里面改好...
  // system那边真的有东西有用吗
  // user也是！！
  // 摸了摸了))
}