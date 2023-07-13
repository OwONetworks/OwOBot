import WebSocket from 'ws'
import logger from '../../lib/logger'

const isNum = (str: string) => {
  return !isNaN(Number(str))
}

export default (target: string) => {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket('wss://api.misaka.io/v2/probe/ws', {
      headers: {
        Origin: 'https://ping.sx'
      }
    })

    const counter = {
      total: -1,
      success: 0,
    }

    const taskList: {
      [key: string]: {
        country: string,
        location: string,
        provider: string
      }
    } = {}

    const resultList: {
      [key: string]: number[]
    } = {}

    const end = () => {
      socket.close()
      // 处理结果
      const data = []
      for (const id in resultList) {
        const result = resultList[id]
        result.shift()
        const validResult = result.filter(item => item !== -1)

        const { country, location, provider } = taskList[id]
        const max = Math.max(...validResult)
        const min = Math.min(...validResult)
        const avg = validResult.reduce((a, b) => a + b, 0) / validResult.length
        const loss = result.filter(item => item === -1).length
        const sent = result.length
        const stdev = Math.sqrt(validResult.map(item => Math.pow(item - avg, 2)).reduce((a, b) => a + b, 0) / validResult.length)

        data.push({
          country,
          location,
          provider,
          ip: target,
          loss: loss,
          sent: sent,
          avg: avg ? avg.toFixed(3) : 0,
          best: min ? min.toFixed(3) : '-',
          worst: max ? max.toFixed(3) : '-',
          stdev: stdev ? stdev.toFixed(3) : '-',
        })
      }

      resolve(data)
    }

    setTimeout(() => end(), 30e3);

    socket.on('close', () => {
      end()
    })

    socket.on('message', data => {
      const msg = data.toString()
      try {
        const data = JSON.parse(msg)
        if (data.created && data.tasks) {
          const { tasks } = data
          for (const task of tasks) {
            taskList[task.id] = {
              country: task.country,
              location: task.location,
              provider: task.provider
            }
          }

          counter.total = tasks.length
        }
      } catch (error) {
        const cmd = msg.split('/')
        const type = cmd[0]
        const id = cmd[1]
        const subtype = cmd[2]
        const value = cmd[3]

        // logger("Ping").debug(`Received ${type}/${subtype} -> ${value}`)

        if (type === '.') {
          // 发送请求
          socket.send(JSON.stringify({
            "type": "ping",
            "options": {
              "target": target,
              "port": 443,
              "version": "auto",
              "nameserver": "",
              "server_type": "udp",
              "query_type": "A",
              "recursive_bit": true,
              "remote_dns": true,
              "probe": "89"
            }
          }))
        } else if (type === 'P') {
          if (subtype === 'C') {

            // 结束
            counter.success++

            logger("Ping").debug(`Ping ${id} finished, ${counter.success}/${counter.total}`)

            if (counter.success === counter.total) end()
          } else {
            // 返回ping
            if (!resultList[id]) resultList[id] = []
            resultList[id].push(!isNum(value) ? -1 : Number(value))
          }
        }
      }
    })
  })
}