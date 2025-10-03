# 如何开始使用 IIROSE 适配器

:::warning 系统要求
本教程以 Windows 系统为例演示完整流程

**最低系统要求：** Windows Server 2016 或更高版本
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



:::warning 
### 重要
完成此步骤后需要 **重启 Koishi**，以强制刷新插件市场

---
:::

:::warning 
在此步骤中，如果你使用`第三步`的镜像源仍无法访问插件市场，请尝试更换为以下镜像源 并重试此步骤：
```bash
https://gitee.com/shangxueink/koishi-registry-aggregator/raw/gh-pages/market.json
```
:::

## 第四步：更新所有插件

在插件管理页面，点击"全部更新"按钮：

![更新插件](./../../public/assets/start/a24e3e01-a1c9-4ad3-ab0c-6664de7208e5.png)

## 第五步：安装 IIROSE 适配器

在插件市场搜索并安装 `adapter-iirose`：

![安装 adapter-iirose](./../../public/assets/start/a415c368-0240-4f3f-9e5c-d311c46e0355.png)


## 第六步：添加 adapter-iirose

![添加 adapter-iirose](./../../public/assets/start/718e8da7-98f1-4927-b04f-a73e23f5a482.png)

![配置界面](./../../public/assets/start/ec25fd4b-2767-46ac-a7a8-2bb280a9d001.png)

