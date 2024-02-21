import { Fragment } from '@satorijs/satori';
import { MessageType } from './decoder';
import { IIROSE_Bot } from './bot';
import { Stock } from './decoder/Stock';

export interface kickData {
  username: string;
}

export interface cutOne {
  id?: string;
}

export interface setMaxUser {
  maxMember: number;
}

export interface whiteList {
  username: string;
  time: string;
  intro?: string;
}

export interface damaku {
  message: string;
  color: string | '66ccff';
}

export interface move {
  roomId: string;
  roomPassword?: string;
}

export interface EventsCallBackOrigin {
  type: string;
  userId?: string;
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

export interface musicOrigin {
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
}

export interface StockGet {
  (stockData: Stock): void;
}

export namespace passiveEvent {
  export interface leaveRoomEvent extends EventsCallBackOrigin {
    data: MessageType['leaveRoom'];
  }

  export interface joinRoomEvent extends EventsCallBackOrigin {
    data: MessageType['joinRoom'];
  }

  export interface damakuEvent extends EventsCallBackOrigin {
    data: MessageType['damaku'];
  }

  export interface switchRoomEvent extends EventsCallBackOrigin {
    data: MessageType['switchRoom'];
  }

  export interface musicEvent extends EventsCallBackOrigin {
    data: MessageType['music'];
  }

  export interface paymentCallbackEvent extends EventsCallBackOrigin {
    data: MessageType['paymentCallback'];
  }

  export interface getUserListCallbackEvent extends EventsCallBackOrigin {
    data: MessageType['getUserListCallback'];
  }

  export interface userProfileCallbackEvent extends EventsCallBackOrigin {
    data: MessageType['userProfileCallback'];
  }

  export interface bankCallbackEvent extends EventsCallBackOrigin {
    data: MessageType['bankCallback'];
  }

  export interface mediaListCallbackEvent extends EventsCallBackOrigin {
    data: MessageType['mediaListCallback'];
  }

  export interface selfMoveEvent extends EventsCallBackOrigin {
    data: MessageType['selfMove'];
  }

  export interface mailboxMessageEvent extends EventsCallBackOrigin {
    data: MessageType['mailboxMessage'];
  }
}

export interface StockSession extends Stock {
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

export interface Events {
  'iirose/leaveRoom'(session: passiveEvent.leaveRoomEvent): void;
  'iirose/joinRoom'(session: passiveEvent.joinRoomEvent): void;
  'iirose/newDamaku'(session: passiveEvent.damakuEvent): void;
  'iirose/switchRoom'(session: passiveEvent.switchRoomEvent): void;
  'iirose/newMusic'(session: passiveEvent.musicEvent): void;
  'iirose/before-payment'(session: passiveEvent.paymentCallbackEvent): void;
  'iirose/before-getUserList'(session: passiveEvent.getUserListCallbackEvent): void;
  'iirose/before-userProfile'(session: passiveEvent.userProfileCallbackEvent): void;
  'iirose/before-bank'(session: passiveEvent.bankCallbackEvent): void;
  'iirose/before-mediaList'(session: passiveEvent.mediaListCallbackEvent): void;
  'iirose/selfMove'(session: passiveEvent.selfMoveEvent): void;
  'iirose/mailboxMessage'(session: passiveEvent.mailboxMessageEvent): void;
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
  'iirose/stockGet'(callBack: StockGet): void;
  'iirose/stockBackCall'(stockData: StockSession): void;
}
