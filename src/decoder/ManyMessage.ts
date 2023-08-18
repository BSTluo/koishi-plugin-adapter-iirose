import { decode } from 'html-entities'

export interface replyMessage {
  message: string
  username: string
  time: number
}

interface data {
  type?: string
  timestamp: number
  avatar: string
  username: string
  message?: string
  color: string
  uid: string
  title?: string
  messageId?: number
  replyMessage?: replyMessage[] | null
}

export class ManyMessage {
  public timestamp: number
  public avatar: string
  public username: string
  public message: string
  public color: string
  public uid: string
  public title: string
  public messageId: number
  public replyMessage: replyMessage[] | null
  public type: string | null

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
    this.type = data.type
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

export const manyMessage = (input: string) => {
  if (input.substring(0, 1) !== '"') return null
  const message: string = input.substring(1)
  
  if (message.indexOf('<') !== -1) {
    const tmp1 = message.split('<')
  
    let output: ManyMessage[] = []
  
    tmp1.forEach(e => {
      const tmp = e.split('>')
      tmp[0] = tmp[0].replace('"', '')

      if (/^\d+$/.test(tmp[0])) {
        if (tmp.length === 11) {

          // PrivateMessage
          if(tmp[8] === '3') {
            output.push(new ManyMessage({
              type: 'privateMessage',
              timestamp: Number(tmp[0]),
              avatar: tmp[3],
              username: decode(tmp[2]),
              message: decode(tmp[4]),
              color: tmp[5],
              uid: tmp[1],
              messageId: Number(tmp[10])
            }))
          } else {
            const reply = replyMsg(tmp[3])
            output.push(new ManyMessage({
              type: 'publicMessage',
              timestamp: Number(tmp[0]),
              avatar: tmp[1],
              username: decode(tmp[2]),
              message: decode(reply ? String(reply.shift()) : tmp[3]),
              color: tmp[5],
              uid: tmp[8],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              messageId: Number(tmp[10]),
              replyMessage: reply,
            }))
          }
        } else if (tmp.length === 12) {
          if (tmp[3] === "'1") {
            const msg = {
              type: 'joinRoom',
              timestamp: Number(tmp[0]),
              avatar: tmp[1],
              username: decode(tmp[2]),
              color: tmp[5],
              uid: tmp[8],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              room: tmp[10],
            }
            // JoinRoom
            output.push(new ManyMessage(msg))
          } else if (tmp[3].substr(0, 2) === "'2") {
            const msg = {
              type: 'switchRoom',
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
            output.push(new ManyMessage(msg))
          } else if (tmp[3] === "'3") {
            const msg = {
              type: 'leaveRoom',
              timestamp: Number(tmp[0]),
              avatar: tmp[1],
              username: decode(tmp[2]),
              color: tmp[5],
              uid: tmp[8],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              room: tmp[10],
            }
            // LeaveRoom
            output.push(new ManyMessage(msg))
          }
        }
      }
    })
    return output
  }
}