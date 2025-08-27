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
```javascript
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
```javascript
await bot.sendPrivateMessage('user123abc456', 'Hello private!')
```

### getSelf

获取机器人自身信息。

```typescript
getSelf(): Promise<Universal.User>
```

**返回值:** `Promise<Universal.User>` - 机器人用户信息

**示例:**
```javascript
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
```javascript
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
```javascript
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

**注意:** IIROSE 平台暂不支持消息撤回功能，此方法为空实现。

**示例:**
```javascript
await bot.deleteMessage('public:room123abc456', 'msg_key_123')
```

## Bot 管理方法

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
```javascript
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
```javascript
// 禁言10分钟
await bot.muteGuildMember('room123abc456', 'spammer', 10 * 60 * 1000, '刷屏')

// 永久禁言
await bot.muteGuildMember('room123abc456', 'baduser', 999999 * 1000, '违规')
```

## Bot Internal 方法

Bot 的 `internal` 属性提供了更多高级功能：

```typescript
bot.internal: InternalType
```

### 用户相关

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
bot.internal.moveRoom(roomId: string, password?: string): Promise<void>
```

**参数:**
- `roomId`: 目标房间ID
- `password`: 房间密码（如果需要）

**返回值:** `Promise<void>`

**示例:**
```javascript
await bot.internal.moveRoom('newroom123456', 'room_password')
```

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

#### makePayment

进行支付操作。

```typescript
bot.internal.makePayment(userId: string, amount: number, message?: string): Promise<boolean>
```

**参数:**
- `userId`: 收款用户ID
- `amount`: 支付金额
- `message`: 支付留言（可选）

**返回值:** `Promise<boolean>` - 支付是否成功

#### stockBuy

购买股票。

```typescript
bot.internal.stockBuy(amount: number): Promise<boolean>
```

**参数:**
- `amount`: 购买数量

**返回值:** `Promise<boolean>` - 购买是否成功

#### stockSell

出售股票。

```typescript
bot.internal.stockSell(amount: number): Promise<boolean>
```

**参数:**
- `amount`: 出售数量

**返回值:** `Promise<boolean>` - 出售是否成功

#### getStock

获取股票信息。

```typescript
bot.internal.getStock(): Promise<StockInfo>
```

**返回值:** `Promise<StockInfo>` - 股票信息

### 音乐相关

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

#### sendDamaku

发送弹幕。

```typescript
bot.internal.sendDamaku(message: string, color?: string): Promise<boolean>
```

**参数:**
- `message`: 弹幕内容
- `color`: 弹幕颜色（可选）

**返回值:** `Promise<boolean>` - 发送是否成功

**示例:**
```javascript
await bot.internal.sendDamaku('Hello World!', '#ff0000')
```
