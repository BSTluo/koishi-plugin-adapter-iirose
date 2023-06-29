export interface Damaku {
  username: string,
  avatar: string,
  message: string,
  color: string,
}

export const damaku = (message: string) => {
  if (message.substr(0, 1) === '=') {
    const list = message.substr(1).split('>')

    for (const item of list) {
      if (item.length === 6) {
        const msg = {
          username: item[0],
          avatar: item[5],
          message: item[1],
          color: item[2]
        }
        // damaku
        return msg
      }
    }

    return null
  }
}
