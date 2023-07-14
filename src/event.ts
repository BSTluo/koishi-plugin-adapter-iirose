export interface Events {
  'iirose/leaveRoom'(input: any): void
  'iirose/joinRoom'(input: any): void
  'iirose/newDamaku'(input: any): void
  'iirose/newMusic'(input: any): void
  'iirose/before-payment'(input: any): void
  'iirose/before-getUserList'(input: any): void
  'iirose/before-userProfile'(input: any): void
  'iirose/before-bank'(input: any): void
  'iirose/before-mediaList'(input: any): void
  'iirose/selfMove'(input: any): void
  'iirose/mailboxMessage'(input: any): void
  'iirose/kick'(input: any): void
  'iirose/cut-one'(input: any): void
  'iirose/cut-all'(input: any): void
  'iirose/setMaxUser'(input: any): void
  'iirose/whiteList'(input: any): void
  'iirose/damaku'(input: any): void
}