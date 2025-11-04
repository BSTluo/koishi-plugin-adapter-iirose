export interface SelfMove
{
  id: string;
}

export const selfMove = (message: string) =>
{
  if (message.substring(0, 2) === '-*')
  {
    const msg = {
      id: message.substring(2),
    };

    // SelfMove
    return msg;
  }
};
