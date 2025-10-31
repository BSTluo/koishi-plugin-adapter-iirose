export interface MemberUpdateData
{
    type: 'join' | 'leave' | 'move';
    // 公共字段
    timestamp: string;
    avatar: string;
    username: string;
    uid: string;
    // 移动事件专用
    targetRoomId?: string;
}

/**
 * 解析来自 websocket 的成员更新消息。
 * 处理加入、离开、刷新和移动事件。
 * @param message 原始的 websocket 消息字符串。
 * @returns 一个结构化的成员更新对象，如果消息不是成员更新，则返回 void。
 */
export const memberUpdate = (message: string): MemberUpdateData | void =>
{
    const parts = message.split('>');
    if (parts.length < 10) return;

    // 基本用户信息在这些消息中是一致的
    const timestamp = parts[0].slice(1); // 移除开头的 "
    const avatar = parts[1];
    const username = parts[2];
    const uid = parts[8];

    // 用户加入（一个新用户进入房间）
    // 最可靠的加入事件标识符是 parts[3] 为 '1。
    if (parts[3] === "'1")
    {
        return {
            type: 'join',
            timestamp,
            avatar,
            username,
            uid,
        };
    }

    const lastPart = parts[parts.length - 1];
    const secondToLastPart = parts[parts.length - 2];

    // 用户离开或刷新
    // 这些事件由 parts[3] 为 '3 和消息以 >>2 结尾来识别
    if (parts[3] === "'3" && secondToLastPart === '' && lastPart === '2')
    {
        return {
            type: 'leave', // 离开和刷新都被视为离开事件。刷新会触发一个离开事件，然后是一个加入事件。
            timestamp,
            avatar,
            username,
            uid,
        };
    }

    // 用户移动（用户离开当前房间去往另一个房间）
    // 示例: "1761906832>...>栗子糖>'262b833e3bc5bc>s>...>...>>362b833e3bc5bc"
    const moveRoomIdMarker = "'2";
    if (parts[3].startsWith(moveRoomIdMarker))
    {
        const targetRoomIdFromPart3 = parts[3].slice(moveRoomIdMarker.length);
        const moveEndMarker = '3';
        if (lastPart.startsWith(moveEndMarker))
        {
            const targetRoomIdFromLastPart = lastPart.slice(moveEndMarker.length);
            // 验证房间 ID 是否一致
            if (targetRoomIdFromPart3 === targetRoomIdFromLastPart)
            {
                return {
                    type: 'move',
                    timestamp,
                    avatar,
                    username,
                    uid,
                    targetRoomId: targetRoomIdFromPart3,
                };
            }
        }
    }
};