export default (roomId: string, password?: string) =>
{
    return `m${roomId}${(password) ? '>' + password : ''}`;
};
