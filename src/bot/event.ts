
import { Fragment, Session } from 'koishi';

import { Stock } from '../decoder/Stock';
import { MessageType } from '../decoder';
import { BroadcastMessage } from '../decoder/BroadcastMessage';
import { IIROSE_Bot } from './bot';

export interface kickData
{
  username: string;
}

export interface cutOne
{
  id?: string;
}

export interface setMaxUser
{
  maxMember: number;
}

export interface whiteList
{
  username: string;
  time: string;
  intro?: string;
}

export interface damaku
{
  message: string;
  color: string;
}

export interface move
{
  roomId: string;
  roomPassword?: string;
}

export interface EventsCallBackOrigin
{
  type: string;
  userId?: string;
  username?: string;
  timestamp?: number;
  author?: {
    userId: string;
    avatar: string;
    username: string;
  };
  platform: 'iirose';
  guildId?: string;
  selfId?: string;
  bot?: IIROSE_Bot;
  channelId?: string;
  send: (data: {
    public?: {
      message: Fragment;
    };
    private?: {
      message: Fragment;
      userId: string;
    };
  }) => void;
  data?: any;
}

export interface musicOrigin
{
  type: 'music' | 'video';
  name: string;
  signer: string;
  cover: string;
  link: string;
  url: string;
  duration: number;
  bitRate: number;
  color: string;
  lyrics: string;
  origin: 'netease' | 'bilibili' | 'null' | 'undefined' | null;
}

export interface StockGet
{
  (stockData: Stock): void;
}

export interface StockSession extends Stock
{
  send?: (data: {
    public?: {
      message: Fragment;
    };
    private?: {
      message: Fragment;
      userId: string;
    };
  }) => void;
  bot?: IIROSE_Bot;
}

export interface Events
{
  'iirose/member-update'(session: Session, data: MessageType['memberUpdate']): void;
  'iirose/newDamaku'(session: Session, data: MessageType['damaku']): void;
  'iirose/switchRoom'(session: Session, data: MessageType['switchRoom']): void;
  'iirose/newMusic'(session: Session, data: MessageType['music']): void;
  'iirose/before-payment'(session: Session, data: MessageType['paymentCallback']): void;
  'iirose/before-bank'(session: Session, data: MessageType['bankCallback']): void;
  'iirose/before-mediaList'(session: Session, data: MessageType['mediaListCallback']): void;
  'iirose/selfMove'(session: Session, data: MessageType['selfMove']): void;
  'iirose/mailboxMessage'(session: Session, data: MessageType['mailboxMessage']): void;
  'iirose/broadcast'(session: Session, data: BroadcastMessage): void;
  'iirose/kick'(kickData: kickData): void;
  'iirose/cut-one'(cutOne: cutOne): void;
  'iirose/cut-all'(): void;
  'iirose/setMaxUser'(setMaxUser: setMaxUser): void;
  'iirose/whiteList'(whiteList: whiteList): void;
  'iirose/damaku'(damaku: damaku): void;
  'iirose/moveRoom'(move: move): void;
  'iirose/makeMusic'(musicOrigin: musicOrigin): void;
  'iirose/stockSell'(numberData: number): void;
  'iirose/stockBuy'(numberData: number): void;
  'iirose/stock-update'(stockData: Stock): void;
}
