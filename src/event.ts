import { Session } from "@satorijs/satori"
import { MessageType } from "./decoder"

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
  'iirose/kick'(input: any): void
  'iirose/cut-one'(input: any): void
  'iirose/cut-all'(input: any): void
  'iirose/setMaxUser'(input: any): void
  'iirose/whiteList'(input: any): void
  'iirose/damaku'(input: any): void
}