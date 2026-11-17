import { spawn } from "node:child_process"
import fs from "node:fs"
const CHROME = process.env.HOME + "/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome"
const PORT = 9232
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tree = JSON.parse(fs.readFileSync("/tmp/opencode/cat_tree.json", "utf8"))
// 优先：铝型材、连接配件、紧固件、装饰、支脚
const prio = ["铝型材", "型材连接配件", "型材专用紧固件", "型材装饰配件", "支脚·地脚板·底座·角件", "铝型材框架", "机械防护栏", "倍速链系列型材", "封板配件", "精益管及配件", "悬臂/悬臂组件/控制箱", "板材"]
const lists = [...tree.lists].sort((a, b) => prio.indexOf(a.category) - prio.indexOf(b.category))
const OUT = "/tmp/opencode/serials.jsonl"
fs.writeFileSync(OUT, "")
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--user-data-dir=/tmp/chrome-enumall", "--no-first-run", "--no-sandbox", "--window-size=1440,900", "about:blank"], { stdio: "ignore" })
let page
for (let i = 0; i < 80; i++) { try { const d = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); page = d.find((x) => x.type === "page" && x.webSocketDebuggerUrl); if (page) break } catch {} await sleep(250) }
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const evalv = async (x) => (await send("Runtime.evaluate", { returnByValue: true, expression: x })).result?.result?.value
await new Promise((r) => (ws.onopen = r))
await send("Page.enable"); await send("Runtime.enable")

const collect = `(()=>{const s=new Set();for(const a of document.querySelectorAll('a[href*="/serial/"]')){const m=a.getAttribute('href').match(/\\/serial\\/(\\d+)/);if(m)s.add(m[1])}return [...s]})()`
const pagesInfo = `(()=>{const nums=[...document.querySelectorAll('button')].map(b=>(b.innerText||'').trim()).filter(t=>/^\\d+$/.test(t)).map(Number);return {max:nums.length?Math.max(...nums):1,total:(document.body.innerText.match(/共\\s*(\\d+)\\s*[条个件]/)||[])[1]||null}})()`

function log(o) { fs.appendFileSync(OUT, JSON.stringify(o) + "\n") }
let done = 0
for (const L of lists) {
  const rec = { listId: L.id, category: L.category, title: L.title, serials: [], pages: 0, total: null, err: null }
  try {
    await send("Page.navigate", { url: `https://www.jlcfa.com/list/${L.id}.html` })
    await sleep(8500)
    const all = new Set(await evalv(collect) || [])
    const info = await evalv(pagesInfo) || { max: 1 }
    rec.pages = info.max; rec.total = info.total
    for (let p = 2; p <= info.max; p++) {
      const ok = await evalv(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>(e.innerText||'').trim()==='${p}');if(!b)return false;b.click();return true})()`)
      if (!ok) break
      await sleep(2400)
      for (const s of await evalv(collect) || []) all.add(s)
    }
    rec.serials = [...all]
  } catch (e) { rec.err = String(e) }
  log(rec)
  done++
  console.log(`[${done}/${lists.length}] ${L.category}/${L.title} → ${rec.serials.length} serials (${rec.total||"?"}) ${rec.err||""}`)
  await sleep(800)
}
console.log("DONE")
ws.close(); chrome.kill("SIGKILL")
