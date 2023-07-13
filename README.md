# OwOBot
- 这是一个跨平台的机器人
- 可以在QQ和Telegram上使用
- 你可以在 issue 和 QQ群(700080009) 中找到我们
- 我们自己使用的机器人可能会有一些特殊功能，我们不会把它们加入到这个项目中
- 你可以在 [这里](./docs/README.md) 找到更多的文档（目前还在编写中）

## 关于OwOBot
QQ部分使用 [icqq](https://github.com/icqqjs/icqq) 作为基础

Telegram部分使用 [telegraf](https://github.com/telegraf/telegraf) 作为基础

在底层部分对两个平台进行了封装，使得开发者可以使用相同的代码来同时支持两个平台

对于部分特殊功能(例如消息记录搜索)，它们与对应的平台绑定过深，所以无法完整的支持另一个平台

## 如何使用
与其他Nodejs/Typescript项目相同，安装nodejs，然后使用 `npm install` 安装依赖

接下来使用`npm run build`来编译项目

编译完成后，使用`npm run start`来运行项目

需要注意的是你需要把`config.example.json`重命名为`config.json`，并且填写其中的内容

同时`dataset`文件夹中的内容可以自行前往其他项目中获取，或者自行编写，这里的内容用于敏感词过滤，可以降低ChatGPT导致的封号风险

## 插件开发与使用
与其他机器人项目不同，本项目并没有规范的插件系统，而是直接import相应的文件

你可以在 `plugins` 文件夹中找到所有的插件

你可以在 `app.ts` 中找到所有的插件的导入

插件可以不调用任何机器人的功能，而仅仅是给其他插件提供一些底层功能，例如proxy插件为其他插件提供了一个可以使用的代理，用来改善国内网络环境下的使用体验

插件的编写不需要过多赘述，你可以参考 `plugins` 文件夹中的其他插件，相信你可以很快的上手

安装新的插件需要手动在 `app.ts` 中导入，例如 `plugin/test`，则需要填写 `test`

## 开发计划
- 我们计划将未来的开发重心放在Telegram与Discord上
- 同时改善更多功能的兼容性

## Credits
- [icqq](https://github.com/icqqjs/icqq)
- [telegraf](https://github.com/telegraf/telegraf)
- [flower_elf](https://twitter.com/u_flower_elf)
