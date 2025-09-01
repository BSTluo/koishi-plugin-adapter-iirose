# 事件系统

本页面详细介绍了 IIROSE 适配器提供的所有事件类型及其使用方法。


## Koishi 通用事件

### before-send

消息发送前触发的事件。

```typescript
ctx.on('before-send', (session) => {
  console.log('即将发送消息:', session.content)
  // 可以在这里修改消息内容或阻止发送
})
```

**事件数据:** Koishi Session 对象

**使用场景:**
- 消息内容过滤
- 消息格式化
- 发送权限检查

### send

消息发送后触发的事件。

```typescript
ctx.on('send', (session) => {
  console.log('消息已发送:', session.messageId)
})
```

**事件数据:** Koishi Session 对象，包含已发送的消息ID

**使用场景:**
- 消息发送统计
- 发送日志记录
- 后续处理逻辑

### message

接收到消息时触发的事件。

```typescript
ctx.on('message', (session) => {
  console.log('收到消息:', session.content)
  console.log('发送者:', session.author.name)
  console.log('频道:', session.channelId)
})
```

**事件数据:** Koishi Session 对象

**使用场景:**
- 消息处理
- 自动回复
- 消息统计

### message-deleted

消息被撤回时触发的事件。

```typescript
ctx.on('message-deleted', (session) => {
  console.log('消息被撤回:', session.messageId)
  console.log('撤回者ID:', session.user.id)
  console.log('频道ID:', session.channelId)
  console.log('撤回时间:', session.timestamp)
})
```

**事件数据:** Koishi Session 对象，包含被撤回的消息信息

## IIROSE 特殊事件

IIROSE 适配器提供了丰富的平台特殊事件，涵盖房间管理、用户互动、经济系统等多个方面。

## 房间相关事件

### iirose/joinRoom

用户进入房间事件。

```typescript
ctx.on('iirose/joinRoom', (session, data) => {
  console.log('用户进入房间:', data.username)
  console.log('用户ID:', data.uid)
  console.log('房间:', data.room)
  
  // 发送欢迎消息
  session.send(`欢迎 ${data.username} 进入房间！`)
})
```

**事件数据结构:**
```typescript
interface JoinRoomData {
  uid: string
  username: string
  avatar: string
  room: string
  timestamp: number
}
```

### iirose/leaveRoom

用户离开房间事件。

```typescript
ctx.on('iirose/leaveRoom', (session, data) => {
  console.log('用户离开房间:', data.username)
  console.log('用户ID:', data.uid)
})
```

**事件数据结构:**
```typescript
interface LeaveRoomData {
  uid: string
  username: string
  room: string
  timestamp: number
}
```

### iirose/switchRoom

用户切换房间事件。

```typescript
ctx.on('iirose/switchRoom', (session, data) => {
  console.log('用户切换房间:', data.username)
  console.log('从房间:', data.fromRoom)
  console.log('到房间:', data.toRoom)
})
```

**事件数据结构:**
```typescript
interface SwitchRoomData {
  uid: string
  username: string
  fromRoom: string
  toRoom: string
  timestamp: number
}
```

### iirose/selfMove

机器人自身移动房间事件。

```typescript
ctx.on('iirose/selfMove', (session, data) => {
  console.log('机器人移动到房间:', data.roomId)
  console.log('房间名称:', data.roomName)
})
```

### iirose/BeforeMoveRoomStart

房间移动开始前事件。

```typescript
ctx.on('iirose/BeforeMoveRoomStart', (session, data) => {
  console.log('准备移动到房间:', data.targetRoom)
})
```

## 消息相关事件

### iirose/newDamaku

新弹幕事件。

```typescript
ctx.on('iirose/newDamaku', (session, data) => {
  console.log('收到弹幕:', data.message)
  console.log('发送者:', data.username)
  console.log('颜色:', data.color)
})
```

**事件数据结构:**
```typescript
interface DamakuData {
  uid: string
  username: string
  message: string
  color: string
  timestamp: number
}
```

### iirose/mailboxMessage

邮箱消息事件。

```typescript
ctx.on('iirose/mailboxMessage', (session, data) => {
  console.log('收到邮箱消息:', data.type)
  
  switch (data.type) {
    case 'follower':
      console.log('新关注者:', data.username)
      break
    case 'like':
      console.log('收到点赞:', data.username)
      break
    case 'payment':
      console.log('收到转账:', data.amount, '花瓣')
      break
    case 'notice':
      console.log('房间公告:', data.message)
      break
  }
})
```

## 音乐相关事件

### iirose/newMusic

新音乐播放事件。

```typescript
ctx.on('iirose/newMusic', (session, data) => {
  console.log('正在播放:', data.name)
  console.log('歌手:', data.signer)
  console.log('时长:', data.duration, '秒')
  console.log('来源:', data.origin)
})
```

**事件数据结构:**
```typescript
interface MusicData {
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

## 经济系统事件

### iirose/before-payment

支付前事件。

```typescript
ctx.on('iirose/before-payment', (session, data) => {
  console.log('即将进行支付:', data.amount, '花瓣')
  console.log('收款人:', data.recipient)
  console.log('留言:', data.message)
})
```

### iirose/before-bank

银行操作前事件。

```typescript
ctx.on('iirose/before-bank', (session, data) => {
  console.log('银行操作:', data.operation)
  console.log('金额:', data.amount)
})
```

### iirose/stockBackCall

股票操作回调事件。

```typescript
ctx.on('iirose/stockBackCall', (stockData) => {
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

## 用户信息事件

### iirose/before-getUserList

获取用户列表前事件。

```typescript
ctx.on('iirose/before-getUserList', (session, userList) => {
  console.log('房间用户数量:', userList.length)
  
  userList.forEach(user => {
    console.log('用户:', user.username, 'ID:', user.uid)
  })
})
```

### iirose/before-userProfile

获取用户资料前事件。

```typescript
ctx.on('iirose/before-userProfile', (session, data) => {
  console.log('查询用户资料:', data.username)
  console.log('用户等级:', data.level)
  console.log('注册时间:', data.registerTime)
})
```

### iirose/before-mediaList

获取媒体列表前事件。

```typescript
ctx.on('iirose/before-mediaList', (session, data) => {
  console.log('媒体列表长度:', data.list.length)
  console.log('当前播放:', data.current)
})
```

## 管理相关事件

### iirose/kick

踢人事件。

```typescript
ctx.on('iirose/kick', (kickData) => {
  console.log('踢出用户:', kickData.username)
})
```

### iirose/cut-one

切歌事件（单首）。

```typescript
ctx.on('iirose/cut-one', (cutData) => {
  console.log('切掉歌曲ID:', cutData.id)
})
```

### iirose/cut-all

清空播放列表事件。

```typescript
ctx.on('iirose/cut-all', () => {
  console.log('清空了播放列表')
})
```

### iirose/setMaxUser

设置房间最大人数事件。

```typescript
ctx.on('iirose/setMaxUser', (data) => {
  console.log('设置房间最大人数:', data.maxMember)
})
```

### iirose/whiteList

白名单操作事件。

```typescript
ctx.on('iirose/whiteList', (data) => {
  console.log('白名单操作:', data.username)
  console.log('时间:', data.time)
  console.log('说明:', data.intro)
})
```

## 自定义操作事件

### iirose/damaku

发送弹幕事件。

```typescript
ctx.on('iirose/damaku', (data) => {
  console.log('发送弹幕:', data.message)
  console.log('颜色:', data.color)
})
```

### iirose/moveRoom

移动房间事件。

```typescript
ctx.on('iirose/moveRoom', (data) => {
  console.log('移动到房间:', data.roomId)
  console.log('房间密码:', data.roomPassword)
})
```

### iirose/makeMusic

制作音乐事件。

```typescript
ctx.on('iirose/makeMusic', (musicData) => {
  console.log('制作音乐:', musicData.name)
  console.log('类型:', musicData.type)
  console.log('链接:', musicData.url)
})
```

## 股票交易事件

### iirose/stockSell

股票出售事件。

```typescript
ctx.on('iirose/stockSell', (amount) => {
  console.log('出售股票数量:', amount)
})
```

### iirose/stockBuy

股票购买事件。

```typescript
ctx.on('iirose/stockBuy', (amount) => {
  console.log('购买股票数量:', amount)
})
```

### iirose/stockGet

获取股票信息事件。

```typescript
ctx.on('iirose/stockGet', (callback) => {
  // 使用回调函数获取股票信息
  callback({
    price: 100,
    change: 5,
    volume: 1000
  })
})
```
