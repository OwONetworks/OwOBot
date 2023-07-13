import fs from 'fs'
import path from 'path'
import { getLogger } from 'log4js'

const logger = getLogger('storageObj')

const root = path.join(process.cwd(), 'data')

const cache: { [index: string]:  {
  obj: {[index: number|string]: any},
  outdated: boolean
} } = {}

const saveData = (name: string, obj: {[index: string | number]: any}) => {
  fs.writeFileSync(path.join(root, `${name}.json`), JSON.stringify(obj))
}

const createProxy = (name: string, obj: any, path: string, callback: () => void): {[index: number|string]: any} => {
  // 使用缓存
  if (cache[`${name}.${path}`]) {
    logger.info(`use cache: ${name}, root.${path}`)
    return cache[`${name}.${path}`].obj
  }

  logger.info(`createProxy: ${name}, root.${path}`)

  const proxy = new Proxy(obj, {
    get: (target, key: string) => {
      if (typeof target[key] === 'object') {
        return createProxy(name, target[key], `${path}.${key}`, callback)
      }

      return target[key] as any
    },
    set: (target, key: string, value) => {
      target[key] = value

      for (const key of Object.keys(cache)) {
        if (key.startsWith(`${name}.${path}`)) {
          delete cache[key]
        }
      }

      callback()
      return true
    },
    deleteProperty: (target, key: string) => {
      delete target[key]

      for (const key of Object.keys(cache)) {
        if (key.startsWith(`${name}.${path}`)) {
          delete cache[key]
        }
      }

      callback()
      return true
    }
  })

  cache[`${name}.${path}`] = proxy

  return proxy
}

export default {
  createObject: (name: string) => {
    let obj = {}

    try {
      obj = JSON.parse(fs.readFileSync(path.join(root, `${name}.json`), 'utf-8'))
    } catch (e) {
      logger.warn(`Failed to load data: ${name}`)
    }

    return createProxy(name, obj, '', () => saveData(name, obj))
  }
}
