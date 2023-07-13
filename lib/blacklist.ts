import axios from 'axios'
import { getLogger } from 'log4js'

const list: { [index: number]: string[] } = {}

const update = async () => {
  if (process.argv.includes('--dev')) return
  try {
    const resp = await axios.get('http://127.0.0.1:8180/api/v1/db/data/noco/p_trp9yef09dxk21/users/views/users', {
      params: {
        offset: '0',
        limit: '100',
      },
      headers: {
        'xc-token': 'ENFSTZI8uLVPisU8NNEZXot0bu-wsI5BDc0kZIqi',
      }
    })

    // 清空list
    for (const key in list) {
      delete list[key]
    }

    for (const user of resp.data.list) {
      list[user.uid] = user.actions.split(',').map((tag: string) => tag.trim())
    }
  } catch (error) {
    getLogger('blacklist').error('更新黑名单失败', error)
  }
}

export default (id: number, action: string) => {
  if (!list[id]) {
    return false
  }

  if (list[id].includes(action)) {
    getLogger('blacklist').info(`用户${id}被禁止${action} (rule)`)
    return true
  }

  if (list[id].includes('all')) {
    getLogger('blacklist').info(`用户${id}被禁止${action} (all)`)
    return true
  }
}

update()

setInterval(update, 5000)
