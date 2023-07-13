import axios from 'axios'
import { FileElem, segment } from 'icqq'
import bot from '../../lib/bot'
import fs from 'fs'
import path from 'path'
import child_process from 'child_process'
import FormData from 'form-data'
import conf from '../../config'

const download = (url: string, filename: string): Promise<string> => {
  const ext = filename.split('.').pop()
  const targetFile = path.join(process.cwd(), `data/${Math.random().toString(36).slice(2)}.${ext}`)
  const writer = fs.createWriteStream(targetFile)

  const response = axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.then(res => {
    res.data.pipe(writer)
  })

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(targetFile))
    writer.on('error', reject)
  })
}

/**
 * @description 使用ffmpeg转码成wav格式
 * @param filename 文件名
 */
const transfer = (filename: string) => {
  const targetFile = path.join(process.cwd(), `data/${Math.random().toString(36).slice(2)}.wav`)
  const cmd = `ffmpeg -i ${filename} -acodec pcm_s16le -ac 1 -ar 16000 ${targetFile}`
  return new Promise((resolve, reject) => {
    try {
      child_process.exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve(targetFile)
        }
      })
    } catch (error) {
      return null
    }
  })
}

export const toArm_inDocker = (data: Buffer): Promise<Buffer> => {
  const id = Math.random().toString(36).slice(2)
  const image = 'jrottenberg/ffmpeg'
  const cmd = `-i /data/${id}.wav -acodec libopencore_amrnb -ac 1 -ar 8000 /data/${id}.amr`
  const targetFile = path.join(process.cwd(), `data/${id}.amr`)
  const fromFile = path.join(process.cwd(), `data/${id}.wav`)

  return new Promise((resolve, reject) => {
    fs.writeFileSync(fromFile, data)
    child_process.exec(`docker run --rm -v ${process.cwd()}/data:/data ${image} ${cmd}`, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        const buf = fs.readFileSync(targetFile)

        fs.unlinkSync(targetFile)
        fs.unlinkSync(fromFile)

        resolve(buf)
      }
    })
  })
}

const allowTypes = [
  'mp3',
  'wav',
  'm4a',
  'flac',
  'ape',
  'ogg',
  'wma',
  'aac'
]

const pending: { [key: string]: {
  text: string,
  timestamp: number
}} = {}

const clone = async (filename: string, text: string) => {
  const url = conf.plugins.clone.api
  const form = new FormData()

  form.append('text', text)
  form.append('file', fs.createReadStream(filename))
  form.append('synt_path', 'synthesizer/saved_models/my_run8_25k.pt')

  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    responseType: 'arraybuffer'
  })

  const data = res.data
  const amr = await toArm_inDocker(data)

  return amr
}

bot.bots.oicq.__api__.on('message.group', async (event) => {
  const id = `${event.group_id}-${event.user_id}`
  if (!pending[id]) return

  const task = pending[id]

  const file = event.message.find(m => m.type === 'file') as FileElem

  if (!file) return

  const maxSize = 1024 * 1024 * 10
  if (file.size > maxSize) {
    event.reply(`文件体积过大, 最大支持 10MB`)
    return
  }

  const ext = file.name.split('.').pop() as string

  if (!allowTypes.includes(ext)) {
    event.reply(`不支持的文件格式, 支持的格式为 ${allowTypes.join(', ')}`)
    return
  }

  const file_obj = await event.group.fs.download(file.fid)
  const filename = file.name
  try {
    const raw_file = await download(file_obj.url, filename)
    const wav_file = await transfer(raw_file) as string

    if (!wav_file) {
      event.reply("转码失败")
      return
    }

    event.reply("正在合成中, 请稍后...")

    const data = await clone(wav_file, task.text)
    
    event.reply(segment.record(data))

    fs.unlinkSync(raw_file)
    fs.unlinkSync(wav_file)
  } catch (error) {
    event.reply("合成失败")
  }

  delete pending[id]
})

bot.command_group(/\/clone (.*)/, 'clone.clone', async (match, event) => {
  const text = match[1]

  const id = `${event.group.id}-${event.sender.id}`
  delete pending[id]

  if (text.length > 50) {
    event.reply(bot.segment().text("文本长度不能超过50字"), true)
    return
  }

  pending[id] = {
    text,
    timestamp: Date.now()
  }

  event.reply(bot.segment().text("任务提交成功，请在5分钟内发送一个音频文件"), true)
})

bot.command_group(/\/c (.*)/, 'clone.preset', async (match, event) => {
  const text = match[1]

  if (text.length > 50) {
    event.reply(bot.segment().text("文本长度不能超过50字"), true)
    return
  }

  event.reply(bot.segment().text("任务提交成功 (注: /clone 命令可以上传自定义语音)"), true)

  const filename = path.join(process.cwd(), 'default.wav')
  const data = await clone(filename, text)

  event.reply(bot.segment().audio(data))
})

setInterval(() => {
  const now = Date.now()
  for (const key in pending) {
    if (now - pending[key].timestamp > 1000 * 60 * 5) {
      delete pending[key]
    }
  }
}, 5e3)