import { Session } from "@satorijs/satori"
import { MessageType } from "./decoder"

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

export interface Events {
  'iirose/leaveRoom'(session: Session, data: MessageType['leaveRoom']): void
  'iirose/joinRoom'(session: Session, data: MessageType['joinRoom']): void
  'iirose/newDamaku'(session: Session, data: MessageType['damaku']): void
  'iirose/newMusic'(session: Session, data: MessageType['music']): void
  'iirose/before-payment'(session: Session, data: MessageType['paymentCallback']): void
  'iirose/before-getUserList'(session: Session, data: MessageType['getUserListCallback']): void
  'iirose/before-userProfile'(session: Session, data: MessageType['userProfileCallback']): void
  'iirose/before-bank'(session: Session, data: MessageType['bankCallback']): void
  'iirose/before-mediaList'(session: Session, data: MessageType['mediaListCallback']): void
  'iirose/selfMove'(session: Session, data: MessageType['selfMove']): void
  'iirose/mailboxMessage'(session: Session, data: MessageType['mailboxMessage']): void
  'iirose/kick'(kickData: kickData): void
  'iirose/cut-one'(cutOne: cutOne): void
  'iirose/cut-all'(): void
  'iirose/setMaxUser'(setMaxUser: setMaxUser): void
  'iirose/whiteList'(whiteList: whiteList): void
  'iirose/damaku'(damaku: damaku): void
}