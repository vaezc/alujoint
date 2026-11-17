import fs from "node:fs"
import os from "node:os"
import path from "node:path"

// Export the jlcfa cookies from a Chrome started with --remote-debugging-port.
// Usage: node scripts/pipeline/export_cookies.mjs [port] [output]
const port = Number(process.argv[2] || 9237)
const output = process.argv[3] || path.join(os.homedir(), ".cache/alujoint-jlc/cookies.json")

async function findPage() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const page = pages.find((item) => item.type === "page" && item.webSocketDebuggerUrl)
      if (page) return page
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error("Chrome 调试端口没有页面")
}

function connect(url) {
  const ws = new WebSocket(url)
  let id = 0
  const pending = new Map()
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const resolve = pending.get(message.id)
      pending.delete(message.id)
      resolve(message)
    }
  })
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve(async (method, params = {}) => {
        const messageId = ++id
        const result = await new Promise((done) => {
          pending.set(messageId, done)
          ws.send(JSON.stringify({ id: messageId, method, params }))
        })
        if (result.error) throw new Error(`${method}: ${JSON.stringify(result.error)}`)
        return result.result
      })
    })
    ws.addEventListener("error", () => reject(new Error("调试连接失败")))
  })
}

try {
  const page = await findPage()
  const send = await connect(page.webSocketDebuggerUrl)
  await send("Network.enable")
  const { cookies } = await send("Network.getAllCookies")
  const jlc = cookies.filter((cookie) => cookie.domain.includes("jlcfa.com"))
  if (jlc.length === 0) {
    console.error("没有拿到 jlcfa.com 的 cookie。先在打开的 Chrome 里登录。")
    process.exit(1)
  }
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, JSON.stringify(jlc, null, 2))
  console.log(`saved ${jlc.length} cookies -> ${output}`)
  console.log(jlc.map((cookie) => `${cookie.name}@${cookie.domain}`).join("\n"))
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
