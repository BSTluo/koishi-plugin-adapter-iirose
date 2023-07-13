import { IIROSE_Bot } from './bot'
import * as IIROSE from './event'

export * from './bot'
export * from './ws'

export default IIROSE_Bot

declare module '@satorijs/core' {
  interface Events extends IIROSE.Events {}
}