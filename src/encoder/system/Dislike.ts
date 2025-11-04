export default (uid: string, message: string = '') =>
{
    // 点踩功能
    let data = `+!${uid}`;
    if (message)
    {
        data += ` ${message}`;
    }
    return data;
};