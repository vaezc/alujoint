// 搭建指南回归：指南 → 任务 → 分步（切步） → 案例 → 底板 → 模型库。
// 需要先启动生产预览（默认 41731）或开发服务器。
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"

const port = 9295
const base = process.env.GUIDE_BASE || "http://127.0.0.1:41731"
const candidates = [
  process.env.CHROME_PATH,
  "/opt/google/chrome/chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean)
const chromePath = candidates.find((p) => existsSync(p))
if (!chromePath) {
  console.error("找不到 Chrome。用 CHROME_PATH 指定。")
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const chrome = spawn(chromePath, [
  "--headless=new", `--remote-debugging-port=${port}`, "--user-data-dir=/tmp/alujoint-guide-smoke",
  "--no-first-run", "--no-sandbox", "--window-size=1440,900",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "about:blank",
], { stdio: "ignore" })

let page
for (let i = 0; i < 80; i++) {
  try {
    const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    page = pages.find((x) => x.type === "page" && x.webSocketDebuggerUrl)
    if (page) break
  } catch {}
  await sleep(250)
}
if (!page) { console.error("Chrome 调试端口没有页面"); process.exit(1) }

const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const failures = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const evalv = async (x) => (await send("Runtime.evaluate", { returnByValue: true, expression: x })).result?.result?.value
const fail = (msg) => { failures.push(msg); console.error("FAIL", msg) }
const ok = (msg) => console.log("OK", msg)

async function go(path) {
  await send("Page.navigate", { url: base + path })
  await sleep(2500)
}

await new Promise((r) => (ws.onopen = r))
await send("Page.enable"); await send("Runtime.enable")

// 1. 指南首页：5 任务 + 案例入口 + 导航
await go("/guide")
const home = await evalv(`(()=>({
  cards: document.querySelectorAll('.guide-tasks .guide-card').length,
  caseLink: document.querySelectorAll('.guide-case a[href="/case/clothes-rack"]').length,
  nav: document.body.innerText.includes('搭建指南'),
  thumbs: [...document.querySelectorAll('.guide-card-thumb')].every((i)=>i.complete && i.naturalWidth>0),
}))()`)
if (home?.cards !== 5) fail(`指南首页任务数=${home?.cards}`); else ok("指南 5 个任务")
if (!home?.caseLink) fail("指南首页缺案例入口"); else ok("案例入口")
if (!home?.nav) fail("缺主导航"); else ok("主导航")

// 2. 任务详情：候选 + 分步入口
await go("/guide/beam-to-post")
const task = await evalv(`(()=>({
  options: document.querySelectorAll('.guide-option').length,
  steps: [...document.querySelectorAll('.guide-option-actions a')].filter(a=>a.textContent.includes('分步装配')).length,
}))()`)
if (!task?.options) fail("任务无候选"); else ok(`任务候选 ${task.options} 个，分步入口 ${task.steps} 个`)
if (!task?.steps) fail("任务缺分步入口")

// 3. 分步：切步改变当前项与高亮
await go("/guide/step/corner")
const step1 = await evalv(`(()=>{const li=document.querySelector('.step-list li.is-current');return {text:li?li.innerText:null, total:document.querySelectorAll('.step-list li').length, hasControls:!!document.querySelector('.step-controls')}})()`)
if (!step1?.total) fail("分步无步骤"); else ok(`分步 ${step1.total} 步，控件 ${step1.hasControls}`)
if (!step1?.hasControls) fail("分步缺取景/爆炸控件")
const nextOk = await evalv(`(()=>{const bs=[...document.querySelectorAll('.step-nav button')];const b=bs.find(x=>x.textContent.includes('下一步'));if(!b)return false;const k=Object.keys(b).find(x=>x.startsWith('__reactProps'));b[k].onClick({preventDefault(){},stopPropagation(){}});return true})()`)
await sleep(600)
const step2 = await evalv(`(()=>{const li=document.querySelector('.step-list li.is-current');return li?li.innerText:null})()`)
if (!nextOk || step1.text === step2) fail("下一步未切步"); else ok("切步生效")

// 4. 案例：购物车 5 项 + 底板区块
await go("/case/clothes-rack")
const cs = await evalv(`(()=>({
  cart: [...document.querySelectorAll('.case-table tbody tr')].length,
  bottom: !!document.querySelector('#bottom'),
  steps: document.querySelectorAll('.case-steps li').length,
}))()`)
if (!cs?.bottom) fail("案例缺底板区块"); else ok("案例底板区块")
if (cs.steps !== 7) fail(`案例装配步骤=${cs.steps}`); else ok("案例 7 步装配")

// 5. 回模型库：3D 加载
await go("/?sample=clothes-rack")
await sleep(4000)
const meshes = await evalv(`(()=>{const f=window.__ALUJOINT_FRAME__;if(!f)return 0;let n=0;f.root.traverse(o=>{if(o.isMesh)n++});return n})()`)
if (!meshes) fail("模型库 3D 未加载"); else ok(`模型库 3D 网格 ${meshes}`)

// 6. 直达 + 刷新：分步页刷新后仍在
await go("/guide/step/side-tee")
await send("Page.reload", { ignoreCache: true })
await sleep(3000)
const reloaded = await evalv(`document.querySelectorAll('.step-list li').length`)
if (!reloaded) fail("分步页刷新后为空"); else ok(`分步页刷新保留 ${reloaded} 步`)

// 7. 窄屏无横向溢出
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await go("/guide")
const overflow = await evalv(`(()=>{const el=document.documentElement;return {scroll:el.scrollWidth,client:el.clientWidth}})()`)
if (!overflow || overflow.scroll > overflow.client + 1) fail(`窄屏横向溢出 ${JSON.stringify(overflow)}`); else ok("窄屏无横向溢出")
await send("Emulation.clearDeviceMetricsOverride")

ws.close(); chrome.kill("SIGKILL")
if (failures.length) { console.error(`\nGUIDE_SMOKE_FAIL ${failures.length}`); process.exit(1) }
console.log("\nGUIDE_SMOKE_OK")
