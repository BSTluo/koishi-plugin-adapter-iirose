import { decode } from 'html-entities'
// import * as api from '../api'
// import config from '../../config'

interface data {
  timestamp: Number
  uid: string
  username: string
  avatar: string
  message: string
  color: string
  messageId: Number
}

export class PrivateMessage {
  public timestamp: Number
  public uid: string
  public username: string
  public avatar: string
  public message: string
  public color: string
  public messageId: Number

  constructor(data: data) {
    this.timestamp = data.timestamp
    this.uid = data.uid
    this.username = data.username
    this.avatar = data.avatar
    this.message = data.message
    this.color = data.color
    this.messageId = data.messageId
  }
}

export const privateMessage = (message: string) => {
  if (message.substr(0, 2) === '""') {
    const item = message.substr(2).split('<')

    for (const msg of item) {
      const tmp = msg.split('>')

      if (tmp.length === 11) {
        if (/^\d+$/.test(tmp[0])) {
          const msg = new PrivateMessage({
            timestamp: Number(tmp[0]),
            uid: tmp[1],
            username: decode(tmp[2]),
            avatar: tmp[3],
            message: decode(tmp[4]),
            color: tmp[5],
            messageId: Number(tmp[10]),
          })
          // PrivateMessage
          return msg
        }
      }
    }

    return null
  }
}
