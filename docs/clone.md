# 语音克隆
[返回目录](./README.md)

## 默认语音
- 在项目根目录中，你可以看到一个`default.wav`的文件，这是语音克隆所使用的默认语音
- 你可以替换它，但是请注意，你需要使用相同的文件名，并且使用相同的格式

## 服务端配置
- 本项目使用的服务端是MockingBird
- 如果希望快速使用，可以使用 [这个](https://hub.docker.com/r/jiada/mocking_bird) Docker镜像
- 对应的配置项是`config.plugins.clone`，你需要填写你的MockingBird服务端地址
- 同时这个功能需要您的服务器上装有Docker，用于运行MockingBird和语音转码