import { IIROSE_Bot } from './bot'
import kick from './encoder/admin/kick'
import cutOne from './encoder/admin/media_cut'
import cutAll from './encoder/admin/media_clear'
import setMaxUser from './encoder/admin/setMaxUser'
import whiteList from './encoder/admin/whiteList'
import damaku from './encoder/messages/damaku'

export const EventsServer = (bot: IIROSE_Bot) => {
  bot.ctx.on('iirose/kick', data => {
    /* 示例data
    data: {
        username: '用户名'
    }
    */
    bot.send(kick(data.username))
  })

  bot.ctx.on('iirose/cut-one', data => {
    /* 示例data
    data: {
        id: '歌曲id'
    }
    */
    (data.hasOwnProperty('id')) ? bot.send(cutOne(data.id)) : bot.send(cutOne())
  })

  bot.ctx.on('iirose/cut-all', () => {
    /* 示例data
    （无）
    */
    bot.send(cutAll())
  })


  bot.ctx.on('iirose/setMaxUser', data => {
    /* 示例data
    data: {
      number: 人数（为空则清除限制？）
    }
    */
    (data.hasOwnProperty('number')) ? bot.send(setMaxUser(data.number)) : bot.send(setMaxUser())
  })

  bot.ctx.on('iirose/whiteList', data => {
    /* 示例data
    data: {
      username: 用户名,
      time: 持续时间（应该是秒）,
      intro: 大抵是备注？可忽略不填这一项
    }
    */
    (data.hasOwnProperty('intro')) ? bot.send(whiteList(data.username, data.time, data.intro)) : bot.send(whiteList(data.username, data.time))
  })

  bot.ctx.on('iirose/damaku', data => {
    /* 示例data
    data: {
      message: 弹幕内容,
      color: 16进制颜色代码（不带#）
    }
    */
    bot.send(damaku(data.message, data.color))
  })

  // 发音频视频的果然还是直接sendMessage.ts里面改好...
  // system那边真的有东西有用吗
  // user也是！！
  // 摸了摸了))
}