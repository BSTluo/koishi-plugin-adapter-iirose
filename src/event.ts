import { Session, Fragment } from "@satorijs/satori"
import { MessageType } from "./decoder"
import { IIROSE_Bot } from "./bot"
import { Stock } from "./decoder/Stock"

export interface kickData {
  username: string
}

export interface cutOne {
  id?: string
}

export interface setMaxUser {
  maxMember: number
}

export interface whiteList {
  username: string
  time: string
  intro?: string
}

export interface damaku {
  message: string
  color: string | '66ccff'
}

export interface move {
  roomId: string
}

export interface EventsCallBackOrigin {
  type: string
  userId?: string
  timestamp?: number
  author?: {
    userId: string,
    avatar: string,
    username: string,
  }
  platform: 'iirose'
  guildId?: string
  selfId?: string
  bot?: IIROSE_Bot
  channelId?: string
  send: (data: {
    public?: {
      message: Fragment
    }
    private?: {
      message: Fragment
      userId: string
    }
  }) => void
}

export interface musicOrigin {
  type: 'music' | 'video'
  name: string
  signer: string
  cover: string
  link: string
  url: string
  duration: number
  bitRate: number
  color: string
}

export interface StockGet {
  (stockData: Stock):void
}

export interface Events {
  'iirose/leaveRoom'(session: EventsCallBackOrigin, data: MessageType['leaveRoom']): void
  'iirose/switchRoom'(session: EventsCallBackOrigin, data: MessageType['switchRoom']): void
  'iirose/joinRoom'(session: EventsCallBackOrigin, data: MessageType['joinRoom']): void
  'iirose/newDamaku'(session: EventsCallBackOrigin, data: MessageType['damaku']): void
  'iirose/newMusic'(session: EventsCallBackOrigin, data: MessageType['music']): void
  'iirose/before-payment'(session: EventsCallBackOrigin, data: MessageType['paymentCallback']): void
  'iirose/before-getUserList'(session: EventsCallBackOrigin, data: MessageType['getUserListCallback']): void
  'iirose/before-userProfile'(session: EventsCallBackOrigin, data: MessageType['userProfileCallback']): void
  'iirose/before-bank'(session: EventsCallBackOrigin, data: MessageType['bankCallback']): void
  'iirose/before-mediaList'(session: EventsCallBackOrigin, data: MessageType['mediaListCallback']): void
  'iirose/selfMove'(session: EventsCallBackOrigin, data: MessageType['selfMove']): void
  'iirose/mailboxMessage'(session: EventsCallBackOrigin, data: MessageType['mailboxMessage']): void
  'iirose/kick'(kickData: kickData): void
  'iirose/cut-one'(cutOne: cutOne): void
  'iirose/cut-all'(): void
  'iirose/setMaxUser'(setMaxUser: setMaxUser): void
  'iirose/whiteList'(whiteList: whiteList): void
  'iirose/damaku'(damaku: damaku): void
  'iirose/moveRoom'(move: move): void
  'iirose/makeMusic'(musicOrigin: musicOrigin): void
  'iirose/stockSell'(numberData: number): void
  'iirose/stockBuy'(numberData: number): void
  'iirose/stockGet'(callBack: StockGet): void
  'iirose/stockBackCall'(stockData: Stock): void
}