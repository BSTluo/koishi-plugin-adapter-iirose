import { decode } from 'html-entities'

export interface replyMessage {
  message: string
  username: string
  time: number
}

interface data {
  timestamp: number
  avatar: string
  username: string
  message: string
  color: string
  uid: string
  title: string
  messageId: number
  replyMessage: replyMessage[] | null
}

export class PublicMessage {
  public timestamp: number
  public avatar: string
  public username: string
  public message: string
  public color: string
  public uid: string
  public title: string
  public messageId: number
  public replyMessage: replyMessage[] | null

  constructor(data: data) {
    this.timestamp = data.timestamp
    this.avatar = data.avatar
    this.username = data.username
    this.message = data.message
    this.color = data.color
    this.uid = data.uid
    this.title = data.title
    this.messageId = data.messageId
    this.replyMessage = data.replyMessage
  }
}

const replyMsg = (msg: string): replyMessage[] | null => {
  if (msg.includes(' (_hr) ')) {
    const replies: replyMessage[] = []

    msg.split(' (hr_) ').forEach(e => {
      if (e.includes(' (_hr) ')) {
        const tmp = e.split(' (_hr) ')
        const user = tmp[1].split('_')

        replies.unshift({
          message: decode(tmp[0]),
          username: decode(user[0]),
          time: Number(user[1]),
        })

        replies.sort((a, b) => {
          return (a.time - b.time)
        })
      } else {
        // @ts-ignore
        replies.unshift(e)
      }
    })

    return replies
  }

  return null
}

export const publicMessage = (input: string) => {
  if (input.substring(0, 1) !== '"') return null

  const message: string = input.substring(1)

  if (message.indexOf('<') !== -1) {
    const tmp1 = message.split('<')
    tmp1.forEach(e => {
      const tmp = e.split('>')
      if (/^\d+$/.test(tmp[0])) {
        if (tmp.length === 11) {
          const reply = replyMsg(tmp[3])
          // PublicMessage
          return new PublicMessage({
            timestamp: Number(tmp[0]),
            avatar: tmp[1],
            username: decode(tmp[2]),
            message: decode(reply ? String(reply.shift()) : tmp[3]),
            color: tmp[5],
            uid: tmp[8],
            title: tmp[9] === "'108" ? '花瓣' : tmp[9],
            messageId: Number(tmp[10]),
            replyMessage: reply,
          })
        } else if (tmp.length === 12) {
          if (tmp[3] === "'1") {
            const msg = {
              timestamp: Number(tmp[0]),
              avatar: tmp[1],
              username: decode(tmp[2]),
              color: tmp[5],
              uid: tmp[8],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              room: tmp[10],
            }
            // JoinRoom
            return msg
          } else if (tmp[3].substr(0, 2) === "'2") {
            const msg = {
              timestamp: Number(tmp[0]),
              avatar: tmp[1],
              username: decode(tmp[2]),
              color: tmp[5],
              uid: tmp[8],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              room: tmp[10],
              targetRoom: tmp[3].substr(2),
            }
            // SwitchRoom
            return msg
          } else if (tmp[3] === "'3") {
            const msg = {
              timestamp: Number(tmp[0]),
              avatar: tmp[1],
              username: decode(tmp[2]),
              color: tmp[5],
              uid: tmp[8],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              room: tmp[10],
            }
            // LeaveRoom
            return msg
          }
        }
      }
    })

    return null
  } else {
    const tmp = message.split('>')
    if (tmp.length === 11) {
      if (/^\d+$/.test(tmp[0])) {
        const reply = replyMsg(tmp[3])
        const message = reply ? String(reply.shift()) : tmp[3]

        const msg = {
          timestamp: Number(tmp[0]),
          avatar: tmp[1],
          username: decode(tmp[2]),
          message: decode(message),
          color: tmp[5],
          uid: tmp[8],
          title: tmp[9] === "'108" ? '花瓣' : tmp[9],
          messageId: Number(tmp[10]),
          replyMessage: reply,
        }
        // PublicMessage
        return new PublicMessage(msg)
      }
    }
  }
}
