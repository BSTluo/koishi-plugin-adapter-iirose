# API 文档

## 注意事项

1. **连接状态**: 确保机器人处于在线状态再调用API
2. **权限检查**: 某些操作需要管理员权限
3. **频率限制**: 避免过于频繁的API调用
4. **错误处理**: 建议对所有API调用进行错误处理
5. **数据格式**: 返回的数据格式可能随IIROSE更新而变化
6. **网络异常**: 处理网络超时和连接失败的情况
7. **房间权限**: 某些操作需要在特定房间或具有特定权限才能执行



## 获取 Bot 实例

以下所有 bot 均通过这样获取：

```typescript
const bot = Object.values(ctx.bots).find(b => b.selfId === "your_bot_uid" || b.user?.id === "your_bot_uid");
if (!bot || bot.status !== Universal.Status.ONLINE) {
  ctx.logger.error(`机器人离线或未找到。`);
  return;
}
if (bot == null) return;

// 在这里继续使用 bot.方法
```

## Bot 通用方法

### sendMessage

向指定频道发送消息。

```typescript
sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
```

**参数:**
- `channelId`: 频道ID，格式为 `public:房间ID` 或 `private:用户ID`
- `content`: 消息内容，支持文本和图片
- `guildId`: 可选的群组ID
- `options`: 可选的发送选项

**返回值:** `Promise<string[]>` - 发送成功的消息ID列表

**示例:**
```typescript
// 发送公聊消息
await bot.sendMessage('public:room123abc456', 'Hello everyone!')

// 发送私聊消息
await bot.sendMessage('private:user123abc456', 'Hello!')

// 发送图片消息
await bot.sendMessage('public:room123abc456', h.image('https://example.com/image.jpg'))
```

### sendPrivateMessage

向指定用户发送私信。

```typescript
sendPrivateMessage(userId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
```

**参数:**
- `userId`: 用户ID
- `content`: 消息内容
- `guildId`: 可选的群组ID
- `options`: 可选的发送选项

**返回值:** `Promise<string[]>` - 发送成功的消息ID列表

**示例:**
```typescript
await bot.sendPrivateMessage('user123abc456', 'Hello private!')
```

### getSelf

获取机器人自身信息。

```typescript
getSelf(): Promise<Universal.User>
```

**返回值:** `Promise<Universal.User>` - 机器人用户信息

**示例:**
```typescript
const selfInfo = await bot.getSelf()
console.log('机器人名称:', selfInfo.name)
console.log('机器人ID:', selfInfo.id)
```

### getUser

获取指定用户信息。

```typescript
getUser(userId: string, guildId?: string): Promise<Universal.User>
```

**参数:**
- `userId`: 用户ID
- `guildId`: 可选的群组ID

**返回值:** `Promise<Universal.User>` - 用户信息对象

**示例:**
```typescript
const userInfo = await bot.getUser('user123abc456')
console.log('用户名:', userInfo.name)
console.log('头像:', userInfo.avatar)
```

### getMessage

获取指定频道中的特定消息详情。

```typescript
getMessage(channelId: string, messageId: string): Promise<any | undefined>
```

**参数:**
- `channelId`: 频道ID
- `messageId`: 消息ID

**返回值:** `Promise<any | undefined>` - 消息详情对象或undefined

**示例:**
```typescript
const message = await bot.getMessage('public:room123abc456', 'msg_key_123')
```

### deleteMessage

撤回指定频道中的特定消息。

```typescript
deleteMessage(channelId: string, messageId: string): Promise<void>
```

**参数:**
- `channelId`: 频道ID
- `messageId`: 消息ID

**返回值:** `Promise<void>`

**支持的撤回操作:**
- 公共频道消息撤回：支持撤回自己发送的消息
- 私信消息撤回：支持撤回自己发送的私信

**注意事项:**
- 只能撤回自己发送的消息
- 撤回后会触发 `message-deleted` 事件
- 撤回有时间限制，过久的消息可能无法撤回

**示例:**
```typescript
// 撤回公共频道消息
await bot.deleteMessage('public:room123abc456', 'msg_key_123')

// 撤回私信消息
await bot.deleteMessage('private:user123abc456', 'msg_key_456')
```


### kickGuildMember

踢出群组成员。

```typescript
kickGuildMember(guildId: string, userName: string, permanent?: boolean): Promise<void>
```

**参数:**
- `guildId`: 群组ID（房间ID）
- `userName`: 要踢出的用户名
- `permanent`: 是否永久踢出（可选）

**返回值:** `Promise<void>`

**示例:**
```typescript
await bot.kickGuildMember('room123abc456', 'baduser')
```

### muteGuildMember

禁言群组成员。

```typescript
muteGuildMember(guildId: string, userName: string, duration: number, reason?: string): Promise<void>
```

**参数:**
- `guildId`: 群组ID（房间ID）
- `userName`: 要禁言的用户名
- `duration`: 禁言时长（毫秒），超过99999秒视为永久禁言
- `reason`: 禁言原因（可选）

**返回值:** `Promise<void>`

**示例:**
```typescript
// 禁言10分钟
await bot.muteGuildMember('room123abc456', 'spammer', 10 * 60 * 1000, '刷屏')

// 永久禁言
await bot.muteGuildMember('room123abc456', 'baduser', 999999 * 1000, '违规')
```

## Bot Internal

Bot 的 `internal` 属性提供了更多高级管理功能：

```typescript
bot.internal: InternalType
```

### 房间管理

#### kick

踢出用户。

```typescript
bot.internal.kick(kickData: { username: string }): void
```

**参数:**
- `kickData`: 踢人数据对象
  - `username`: 要踢出的用户名

**返回值:** `void`

**示例:**
```typescript
bot.internal.kick({ username: 'baduser' })
```

#### setMaxUser

设置房间最大人数。

```typescript
bot.internal.setMaxUser(data: { maxMember: number }): void
```

**参数:**
- `data`: 设置数据对象
  - `maxMember`: 最大人数

**返回值:** `void`

**示例:**
```typescript
bot.internal.setMaxUser({ maxMember: 50 })
```

#### whiteList

白名单操作。

```typescript
bot.internal.whiteList(data: { username: string; time: string; intro?: string }): void
```

**参数:**
- `data`: 白名单数据对象
  - `username`: 用户名
  - `time`: 时间
  - `intro`: 说明（可选）

**返回值:** `void`

**示例:**
```typescript
bot.internal.whiteList({ 
  username: 'vipuser', 
  time: '24h', 
  intro: 'VIP用户' 
})
```

### 音乐管理

#### cutOne

切歌（单首）。

```typescript
bot.internal.cutOne(data: { id?: string }): void
```

**参数:**
- `data`: 切歌数据对象
  - `id`: 歌曲ID（可选，不提供则切当前歌曲）

**返回值:** `void`

**示例:**
```typescript
// 切指定歌曲
bot.internal.cutOne({ id: 'song123' })

// 切当前歌曲
bot.internal.cutOne({})
```

#### cutAll

清空播放列表。

```typescript
bot.internal.cutAll(): void
```

**返回值:** `void`

**示例:**
```typescript
bot.internal.cutAll()
```


Bot 的 `internal` 属性提供了更多高级功能：

```typescript
bot.internal: InternalType
```

### 用户相关

#### getUserByName

通过用户名获取用户信息。

```typescript
bot.internal.getUserByName(name: string): Promise<Universal.User | undefined>
```

**参数:**
- `name`: 用户名

**返回值:** `Promise<Universal.User | undefined>` - 用户信息对象或undefined

**示例:**
```typescript
const user = await bot.internal.getUserByName('张三')
if (user) {
  console.log('用户ID:', user.id)
  console.log('用户名:', user.name)
}
```

#### getUserById

通过用户ID获取用户信息。

```typescript
bot.internal.getUserById(id: string): Promise<Universal.User | undefined>
```

**参数:**
- `id`: 用户ID

**返回值:** `Promise<Universal.User | undefined>` - 用户信息对象或undefined

**示例:**
```typescript
const user = await bot.internal.getUserById('user123abc456')
if (user) {
  console.log('用户名:', user.name)
  console.log('头像:', user.avatar)
}
```

#### initUserData

初始化用户数据缓存。

```typescript
bot.internal.initUserData(): void
```

**返回值:** `void`

**说明:** 此方法会重新构建用户名和ID的映射关系，通常在获取用户列表后自动调用。

#### getUserList

获取用户列表。

```typescript
bot.internal.getUserList(): Promise<UserInfo[]>
```

**返回值:** `Promise<UserInfo[]>` - 用户信息列表

#### getUserProfile

获取用户详细资料。

```typescript
bot.internal.getUserProfile(userId: string): Promise<UserProfile>
```

**参数:**
- `userId`: 用户ID

**返回值:** `Promise<UserProfile>` - 用户详细资料

### 房间相关

#### moveRoom

切换房间。

```typescript
bot.internal.moveRoom(moveData: { roomId: string; roomPassword?: string }): Promise<void>
```

**参数:**
- `moveData`: 移动数据对象
  - `roomId`: 目标房间ID
  - `roomPassword`: 房间密码（如果需要）

**返回值:** `Promise<void>`

**示例:**
```typescript
// 移动到公开房间
await bot.internal.moveRoom({ roomId: 'newroom123456' })

// 移动到加密房间
await bot.internal.moveRoom({ 
  roomId: 'privateroom123456', 
  roomPassword: 'room_password' 
})
```

#### moveRoomStart

房间移动开始函数（内部使用）。

```typescript
bot.internal.moveRoomStart(): Promise<void>
```

**返回值:** `Promise<void>`

**说明:** 此方法一般不需要手动调用，在 `moveRoom` 方法中会自动调用。

#### getRoomInfo

获取当前房间信息。

```typescript
bot.internal.getRoomInfo(): Promise<RoomInfo>
```

**返回值:** `Promise<RoomInfo>` - 房间信息

### 经济系统

#### getBank

获取银行信息。

```typescript
bot.internal.getBank(): Promise<BankInfo>
```

**返回值:** `Promise<BankInfo>` - 银行信息

#### payment

进行支付操作。

```typescript
bot.internal.payment(uid: string, money: number, message?: string): void
```

**参数:**
- `uid`: 收款用户ID
- `money`: 支付金额
- `message`: 支付留言（可选）

**返回值:** `void`

**示例:**
```typescript
// 转账给用户，附带留言
bot.internal.payment('user123abc456', 100, '感谢支持！')

// 转账给用户，不附带留言
bot.internal.payment('user123abc456', 50)
```

#### stockBuy

购买股票。

```typescript
bot.internal.stockBuy(amount: number): void
```

**参数:**
- `amount`: 购买数量

**返回值:** `void`

**示例:**
```typescript
// 购买100股
bot.internal.stockBuy(100)
```

#### stockSell

出售股票。

```typescript
bot.internal.stockSell(amount: number): void
```

**参数:**
- `amount`: 出售数量

**返回值:** `void`

**示例:**
```typescript
// 出售50股
bot.internal.stockSell(50)
```

#### stockGet

获取股票信息。

```typescript
bot.internal.stockGet(callback: (stockData: StockSession) => void): void
```

**参数:**
- `callback`: 回调函数，接收股票数据

**返回值:** `void`

**示例:**
```typescript
// 获取股票信息
bot.internal.stockGet((stockData) => {
  console.log('股票价格:', stockData.price)
  console.log('涨跌:', stockData.change)
  console.log('成交量:', stockData.volume)
  
  // 可以发送消息
  if (stockData.send) {
    stockData.send({
      public: {
        message: `当前股价: ${stockData.price} 花瓣`
      }
    })
  }
})
```

### 音乐相关

#### makeMusic

播放音乐或视频。

```typescript
bot.internal.makeMusic(musicInfo: MusicOrigin): void
```

**参数:**
- `musicInfo`: 音乐信息对象

**MusicOrigin 类型定义:**
```typescript
interface MusicOrigin {
  type: 'music' | 'video'
  name: string
  signer: string
  cover: string
  link: string
  url: string
  duration: number
  bitRate: number
  color: string
  lyrics: string
  origin: 'netease' | 'bilibili' | 'null' | 'undefined' | null
}
```

**返回值:** `void`

**示例:**
```typescript
// 播放音乐
bot.internal.makeMusic({
  type: 'music',
  name: '歌曲名称',
  signer: '歌手名称',
  cover: 'https://example.com/cover.jpg',
  link: 'https://example.com/music.mp3',
  url: 'https://example.com/music.mp3',
  duration: 240, // 秒
  bitRate: 320,
  color: '#66ccff',
  lyrics: '歌词内容',
  origin: 'netease'
})

// 播放视频
bot.internal.makeMusic({
  type: 'video',
  name: '视频标题',
  signer: '作者',
  cover: 'https://example.com/thumbnail.jpg',
  link: 'https://example.com/video.mp4',
  url: 'https://example.com/video.mp4',
  duration: 180,
  bitRate: 1000,
  color: '#ff6666',
  lyrics: '',
  origin: 'bilibili'
})
```

#### playMusic

播放音乐。

```typescript
bot.internal.playMusic(musicInfo: MusicInfo): Promise<boolean>
```

**参数:**
- `musicInfo`: 音乐信息对象

**返回值:** `Promise<boolean>` - 播放是否成功

#### getMediaList

获取媒体列表。

```typescript
bot.internal.getMediaList(): Promise<MediaInfo[]>
```

**返回值:** `Promise<MediaInfo[]>` - 媒体信息列表

### 弹幕相关

#### damaku

发送弹幕。

```typescript
bot.internal.damaku(damakuData: { message: string; color: string }): void
```

**参数:**
- `damakuData`: 弹幕数据对象
  - `message`: 弹幕内容
  - `color`: 弹幕颜色（十六进制颜色代码）

**返回值:** `void`

**示例:**
```typescript
// 发送红色弹幕
bot.internal.damaku({
  message: 'Hello World!',
  color: '#ff0000'
})

// 发送蓝色弹幕
bot.internal.damaku({
  message: '这是一条弹幕',
  color: '#0066ff'
})
```

#### sendDamaku

发送弹幕（旧版本兼容方法）。

```typescript
bot.internal.sendDamaku(message: string, color?: string): Promise<boolean>
```

**参数:**
- `message`: 弹幕内容
- `color`: 弹幕颜色（可选）

**返回值:** `Promise<boolean>` - 发送是否成功

**示例:**
```typescript
await bot.internal.sendDamaku('Hello World!', '#ff0000')
```
