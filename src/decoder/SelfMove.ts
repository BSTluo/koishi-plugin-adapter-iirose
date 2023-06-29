export interface SelfMove {
  id: string
}

export const selfMove = (message: string) => {
  if (message.substr(0, 2) === '-*') {
    const msg = {
      id: message.substr(2)
    }

    // SelfMove
    return msg
  }
}
