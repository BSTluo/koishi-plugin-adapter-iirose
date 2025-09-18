# 开发指南

本页面为开发者提供使用 IIROSE 适配器进行插件开发的详细指南。

## 环境准备

### 前置要求

- Node.js >= 22.0.0
- Koishi 4.18.8+
- TypeScript 

### 安装依赖
在koishi项目模板安装
```bash
yarn clone BSTluo/koishi-plugin-adapter-iirose
yarn dev
```

---

## IIROSE 开发方法

### 监听ws消息

浏览器打开 https://iirose.com/ 页面

打开 `开发人员工具`（按下F12），

选择 `控制台` 标签页。

在`JavaScript上下文`处，选择`mainFrame(mesages.html)`

在控制台输入函数
```JavaScript
function proxyFunction(targetFunction, callback) {
        return ((...param) => {
            if (callback(param, targetFunction) != true)
                return targetFunction(...param)
        });
    }


    socket.send = proxyFunction(socket.send.bind(socket), (p) => {
        console.log("send", p)
    });
    socket._onmessage = proxyFunction(socket._onmessage.bind(socket), (p) => {
        console.log("onMessage", p)
    });

```


### 更多文档

**https://github.com/XCWQW1/iirose-docs**
