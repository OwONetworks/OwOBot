import fs from 'fs'
import path from 'path'
import logger from './logger'

const words = [
  // ...fs.readFileSync(path.join(process.cwd(), './dataset/tencent.txt'), 'utf-8').split('\n').map((item) => item.trim()).filter((item) => item),
  ...fs.readFileSync(path.join(process.cwd(), './dataset/finance.txt'), 'utf-8').split('\n').map((item) => item.trim()).filter((item) => item)
]

// 判断是否包含敏感词
const hasSensitive = (text: string) => {
  logger('Filter').info(`Checking ${text}`)

  if (!text) return false
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (text.indexOf(word) !== -1) {
      logger('Filter').info(`${text} => ${word}`)
      return true
    }
  }

  logger('Filter').info(`${text} => OK`)

  return false
}

export default hasSensitive
