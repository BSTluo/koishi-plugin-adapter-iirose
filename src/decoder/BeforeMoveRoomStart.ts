export interface BeforeMoveRoomStart {
  can: true;
}

export const beforeMoveRoomStart = (message: string) => {
  if (message.substr(0, 1) === 'm') {
    const msg = {
      can: true
    };
    // selfWillMove
    return msg;
  }
};
