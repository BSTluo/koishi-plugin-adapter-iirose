import { IIROSE_Bot } from './bot';
import * as IIROSE from './event';

export * from './bot';
export * from './ws';

export * from './event';
export default IIROSE_Bot;

// export const using = ['database'];

declare module '@satorijs/core' {
  interface Events extends IIROSE.Events { }
}
