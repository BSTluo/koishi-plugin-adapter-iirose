export interface MemberUpdateData
{
    type: 'join' | 'leave' | 'move';
    // Common fields
    timestamp: string;
    avatar: string;
    username: string;
    uid: string;
    // For move event
    targetRoomId?: string;
}

/**
 * Parses member update messages from the websocket.
 * Handles join, leave, update (refresh), and move events.
 * @param message The raw websocket message string.
 * @returns A structured member update object, or void if the message is not a member update.
 */
export const memberUpdate = (message: string): MemberUpdateData | void =>
{
    const parts = message.split('>');
    if (parts.length < 10) return;

    // Basic user info is consistent across these messages
    const timestamp = parts[0].slice(1); // remove leading "
    const avatar = parts[1];
    const username = parts[2];
    const uid = parts[8];

    // User Join (a new user enters the room)
    // The most reliable identifier for a join event is parts[3] being '1.
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

    // User Leave or Refresh
    // These events are identified by parts[3] being '3 and the message ending with >>2
    if (parts[3] === "'3" && secondToLastPart === '' && lastPart === '2')
    {
        return {
            type: 'leave', // Both leave and refresh are treated as a leave event. A refresh will fire a leave then a join.
            timestamp,
            avatar,
            username,
            uid,
        };
    }

    // User Move (user leaves the current room for another)
    // Example: "1761906832>...>栗子糖>'262b833e3bc5bc>s>...>...>>362b833e3bc5bc"
    const moveRoomIdMarker = "'2";
    if (parts[3].startsWith(moveRoomIdMarker))
    {
        const targetRoomIdFromPart3 = parts[3].slice(moveRoomIdMarker.length);
        const moveEndMarker = '3';
        if (lastPart.startsWith(moveEndMarker))
        {
            const targetRoomIdFromLastPart = lastPart.slice(moveEndMarker.length);
            // Verify the room ID is consistent
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