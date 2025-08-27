export interface MessageInfo
{
  messageId: string;
  isDirect: boolean;
  content: string;
  timestamp: number;
  author: {
    userId: string;
    avatar: string;
    username: string;
    nickname: string;
  };
}

export interface messageObjList
{
  [key: string]: MessageInfo;
}

export const messageObjList: messageObjList = {};
