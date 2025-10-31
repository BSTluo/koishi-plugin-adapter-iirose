import { Session } from 'koishi';

/**
 * Session 缓存
 */
export class SessionCache
{
    private sessions: Session[] = [];
    private maxSize: number;

    constructor(maxSize: number = 500)
    {
        this.maxSize = maxSize;
    }

    /**
     * 向缓存中添加一个新的 Session
     * @param session 要添加的 Session
     */
    public add(session: Session): void
    {
        this.sessions.push(session);
        // 如果超出最大容量，则移除最旧的 Session
        if (this.sessions.length > this.maxSize)
        {
            this.sessions.shift();
        }
    }

    /**
     * 根据引用信息查找匹配的 Session
     * @param quoteInfo 包含作者名和消息内容的对象
     * @returns 匹配的 Session，如果找不到则返回 undefined
     */
    public findQuote(quoteInfo: { username: string, content: string; }): Session | undefined
    {
        // 从最新到最旧进行查找，返回第一个匹配项
        for (let i = this.sessions.length - 1; i >= 0; i--)
        {
            const session = this.sessions[i];
            if (session.author?.name === quoteInfo.username && session.content === quoteInfo.content)
            {
                return session;
            }
        }
        return undefined;
    }

}