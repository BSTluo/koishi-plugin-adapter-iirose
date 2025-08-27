# 如何开始使用 IIROSE 适配器

:::warning 系统要求
本教程以 Windows 系统为例演示完整流程

**最低系统要求：** Windows Server 2012 或更高版本
:::

## 机器人认证须知

:::tip 重要提醒
**机器人账号必须进行认证！**

1. **认证方式：** 与站长私聊发送："我希望将`@你的用户名`设置为我的机器人账号"
2. **认证标识：** 当你的机器人账号出现"人工智能"头衔时，表示认证成功
3. **风险警告：** 未认证的机器人账号会被认定为脚本发言，**可能导致封号**

**注意事项：**
- 机器人账号无法通过发言获得花钞奖励
- 机器人发言不会计入房间热度
:::


## 第一步：安装 Koishi 框架

1. 访问 Koishi 官方安装指南：https://koishi.chat/zh-CN/manual/starter/windows.html
2. 下载并安装 Koishi

:::tip 遇到问题？
如果在安装过程中遇到任何问题，

请前往 **Koishi 官方交流群** 寻求帮助 ->

https://koishi.chat/zh-CN/about/contact.html
:::

## 第二步：启动 Koishi

1. 在 Windows 开始菜单中找到并打开 Koishi

![启动 Koishi](./../../public/assets/start/698dd082-9d58-45b2-aa7c-ed4241dd1d45.png)

2. 启动后会看到 Koishi 控制台界面

![Koishi 控制台](./../../public/assets/start/0d576fa6-c5e4-4f5d-8466-04b87c805892.png)

## 第三步：配置插件市场源

由于官方插件市场源可能存在访问问题，需要更新插件市场配置：

![配置插件市场源](./../../public/assets/start/67482a19-b762-44f7-881f-d137f7fab3a9.png)

:::warning 重要
完成此步骤后需要**重启 Koishi**，以强制刷新插件市场
:::

## 第四步：更新所有插件

在插件管理页面，点击"全部更新"按钮：

![更新插件](./../../public/assets/start/a24e3e01-a1c9-4ad3-ab0c-6664de7208e5.png)

## 第五步：安装必需插件

### 5.1 安装 IIROSE 适配器

在插件市场搜索并安装 `adapter-iirose`：

![安装 adapter-iirose](./../../public/assets/start/a415c368-0240-4f3f-9e5c-d311c46e0355.png)

### 5.2 安装文件管理器插件

搜索并安装 `koishi-plugin-filemanager`（必需依赖）：

![安装 filemanager](./../../public/assets/start/5c903073-ba73-4f5b-8c34-215262d4f6ac.png)

## 第六步：添加插件到配置

### 6.1 添加 adapter-iirose

![添加 adapter-iirose](./../../public/assets/start/718e8da7-98f1-4927-b04f-a73e23f5a482.png)

![配置界面](./../../public/assets/start/ec25fd4b-2767-46ac-a7a8-2bb280a9d001.png)

### 6.2 添加 filemanager

确保两个插件都已添加到配置中：

![确认插件配置](./../../public/assets/start/8db921a4-4f75-4ba3-9427-375084a7c6ef.png)

## 第七步：注册 IIROSE 账号

### 7.1 访问官网注册

1. 前往 https://iirose.com/ 完成账号注册流程

![IIROSE 官网](./../../public/assets/start/9195fc6d-0403-4df3-ae12-7c081c00150f.png)

2. 注册完成后，会自动进入聊天室

![进入聊天室](./../../public/assets/start/e868a30c-7222-4bdc-b389-c3b4eec3f0e4.png)

### 7.2 完善账号信息

1. 将鼠标移至屏幕最左侧 或 从左向右滑动，呼出导航菜单
2. 完成账号注册流程

![导航菜单](./../../public/assets/start/fb15a550-b662-415c-89b3-969063e4840d.png)

![完成注册](./../../public/assets/start/66afb4ef-3c44-46fe-b821-824ea523ba3f.png)

## 第八步：获取配置信息

### 8.1 获取用户名

注册完成后，返回房间列表，调出菜单栏查看账号数据：

![查看用户名](./../../public/assets/start/3872f47a-27fa-431b-a589-4b1d8a4f0b99.png)

![用户信息](./../../public/assets/start/5c6267e4-6726-454a-b904-8951408c0550.png)

![账号详情](./../../public/assets/start/248037d0-4ae6-4881-88b8-a12e8f173baa.png)

![用户数据](./../../public/assets/start/bdd2164b-1dc6-4fe3-8feb-7c6ed8acb504.png)

> 不带`[**]`的部分

### 8.2 获取唯一标识

找到并记录你的唯一标识（UID）：

![查看 UID](./../../public/assets/start/81e3a033-f45a-4a46-ad03-d2807cee5310.png)

![复制 UID](./../../public/assets/start/83641deb-1269-45ab-b7e5-8dcbadcf730d.png)

> 不带`[@@]`的部分

### 8.3 设置密码

在配置中填写你的账号密码：

![设置密码](./../../public/assets/start/7c5c9e2a-9c5a-49d2-a953-83816acd1a33.png)

![确认密码](./../../public/assets/start/fdc345bb-349c-42d6-b9c5-613a97c72e4b.png)

### 8.4 获取房间地址

找到你想要机器人加入的房间地址：

![查看房间](./../../public/assets/start/e360b85c-429e-4509-b105-b6fa0bbe5538.png)

![房间列表](./../../public/assets/start/3e58afa2-c683-454e-97b3-98cf64955d9d.png)

![房间详情](./../../public/assets/start/7cbd8f92-475f-42eb-9890-b4550966f327.png)

![房间地址](./../../public/assets/start/6e744935-1fc2-421e-a74c-5fcd11b1aadf.png)

![复制地址](./../../public/assets/start/d5afc876-30ea-4cbe-82e5-60d6ed42ce0f.png)
> 不带`[__]`的部分
![配置房间](./../../public/assets/start/28e90fb6-f129-4d4c-bbea-459259bb5e20.png)

## 第九步：启动插件

### 9.1 启动 filemanager

首先启动文件管理器插件：

![启动 filemanager](./../../public/assets/start/af3c3cdd-1dbf-458c-9104-3a7d5b46c612.png)

### 9.2 启动 adapter-iirose

然后启动 IIROSE 适配器：

![启动适配器](./../../public/assets/start/e2c1195a-3d03-4822-b9ac-02dca4daeeb6.png)

### 9.3 验证连接

启动成功后，机器人应该会出现在你指定的房间中。


![连接成功](./../../public/assets/start/28597275-0eb9-4c13-aebd-6b4fb83f9a13.png)

:::warning 连接失败？
如果机器人没有出现在房间中，请检查：
- 优先**查看日志**
- **账户密码**是否正确
- 网络连接是否正常
:::

## 🎉 完成！

当机器人成功出现在你的房间后，你可以：

1. **安装更多插件：** 前往插件市场安装你喜欢的功能插件
2. **配置插件：** 大部分 Koishi 插件都支持 IIROSE 平台
3. **开始使用：** 享受你的 IIROSE 机器人吧！
