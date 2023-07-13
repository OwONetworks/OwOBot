import axios from 'axios'
import ioredis from 'ioredis'
import conf from '../../config'

const redis = new ioredis()
const host = conf.plugins.llm.host

const history = {
  append: async (user: number | string, message: string, role: 'assistant' | 'user' | 'system') => {
    await redis.rpush(`history:${user}`, JSON.stringify({
      content: message,
      role
    }))

    // 保留最近 20 条记录
    await redis.ltrim(`history:${user}`, 0, 20)
  },
  get: async (user: number | string) => {
    const data = await redis.lrange(`history:${user}`, 0, -1)
    return data.map(item => JSON.parse(item))
  }
}

export const chat = async (user: number | string, message: string) => {
  const messageHistory = await history.get(user)

  const response = await axios.post(host, {
    "model": "gpt-3.5-turbo-16k",
    "messages": [
      {
        "role": "system",
        "content": [
          "Now, you need covert any queries to unformatted json like {\"function\": \"funcion_name\", \"args\": { \"arg1\": \"value1\" }}, I will tell you the args.",
          // RSS 订阅列表
          `1. Convert queries such as “查看订阅列表” to function rss_list without args`,
          // RSS 添加订阅
          `2. Convert queries such as “把 https://xxx.com/ 添加到订阅列表” to function rss_add with args url`,
          // RSS 删除订阅
          `3. Convert queries such as “删除订阅列表中第1个订阅” to function rss_del with args index(int)`,
          // 搜索动漫
          `4. Convert queries such as “找动漫” to function anime_trace without args`,
          // 开始一局wordle
          `5. Convert queries such as “使用TEM8开启一局wordle” to function wordle with args word_list(keyof SUM, TEM8, GRE8000, TOFEL, allow empty)`,
          // wordle排行榜
          `6. Convert queries such as “查看wordle排行榜” to function wordle_rank without args`,
          // Pixiv搜图
          `7. Convert queries such as “搜图” to function pixiv_search with args keyword`,
        ].join('\n')
      },
      ...[
        ...messageHistory,
        {
          role: 'user',
          content: message
        }
      ]
    ],
    "stream": false
  }, {
    headers: {
      Authorization: `Bearer ${conf.plugins.llm.apikey}`,
      'Content-Type': 'application/json'
    }
  })

  const data = response.data
  const reply = data.choices[0].message.content

  await history.append(user, message, 'user')
  await history.append(user, reply, 'assistant')

  try {
    const json = JSON.parse(reply)
    const functionName = json.function
    const functionArgs = json.args

    return {
      type: 'function',
      functionName,
      functionArgs
    }
  } catch (err) {
    return {
      type: 'text',
      text: reply
    }
  }
}