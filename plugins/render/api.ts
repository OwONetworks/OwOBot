import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const sleep = (time: number) => {
  return new Promise((reslove, reject) => {
    setTimeout(() => {
      reslove(true)
    }, time);
  })
}

interface Size {
  width: number,
  height: number
}

let bowser: puppeteer.Browser | null = null

export const renderHTML = (html: string, size: Size, delay: number): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!bowser) {
        bowser = await puppeteer.launch({
          args: [
            '--single-process',
            '--disable-site-isolation-trials',
            '--renderer-process-limit=4',
            '--no-sandbox',
            "--disable-web-security"
          ]
        })
      }
  
      const page = await bowser.newPage()
  
      page.setViewport({
        height: size.height,
        width: size.width
      })
  
      page.setContent(html)
  
      page.on('load', async () => {
        await sleep(delay)
        const img = await page.screenshot({
          fullPage: true,
          omitBackground: true,
          type: 'jpeg',
          quality: 75
        })
  
        resolve(Buffer.from(img))
      })

      page.on('error', (error) => {
        reject(error)
        page.close()
      })
    } catch (error) {
      reject(error)
    }
  })
}

export const render = async (template: string, options: {[index: string]: any}, size: Size) => {
  const template_data = fs.readFileSync(path.join(process.cwd(), `template/${template}.html`)).toString()

  let result = template_data

  for (const key in options) {
    const value = options[key]

    result = result.replace(`[[${key}]]`, value)
  }

  return await renderHTML(result, size, 500)
}
