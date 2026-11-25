// 搭建指南回归：指南 → 任务 → 分步（切步） → 案例 → 底板 → 模型库。
// 需要先启动生产预览（默认 41731）或开发服务器。
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

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
const runDir = mkdtempSync(join(tmpdir(), "alujoint-guide-"))
const chrome = spawn(chromePath, [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${join(runDir, "profile")}`,
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
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const evalv = async (x) => (await send("Runtime.evaluate", { returnByValue: true, expression: x })).result?.result?.value
async function waitFor(expression, description) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await evalv(`Boolean(${expression})`)) return
    await sleep(150)
  }
  throw new Error(`${description}（${await evalv("location.href")}）`)
}

async function click(selector) {
  const query = JSON.stringify(selector)
  await waitFor(`document.querySelector(${query})`, selector)
  const point = await evalv(`(() => {
    const el = document.querySelector(${query})
    el.scrollIntoView({ block: "center", inline: "nearest" })
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  for (const type of ["mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", { type, ...point, button: "left", clickCount: 1 })
  }
}

async function follow(path) {
  await click(`a[href='${path}']`)
  await waitFor(`location.pathname + location.search === ${JSON.stringify(path)}`, path)
}

async function backTo(path) {
  await evalv("history.back()")
  await waitFor(`location.pathname === ${JSON.stringify(path)}`, "浏览器后退到 " + path)
}

async function expectMobileFit() {
  await waitFor(`[document.documentElement, ...document.querySelectorAll("main, .step-panel")]
    .every(el => el.scrollWidth <= el.clientWidth + 1)`, "窄屏内容超出页面")
}

const litMeshes = `(() => {
  let count = 0
  window.__ALUJOINT_FRAME__?.root.traverse(o => {
    if (o.isMesh && [o.material].flat().some(m => m.emissiveIntensity === 0.55)) count++
  })
  return count
})()`

// Inspect the rendered materials, so a highlighted clamp cannot stand in for a nut.
function rackSupportState(step) {
  return `(() => {
    const pieces = []
    window.__ALUJOINT_FRAME__?.root.traverse(mesh => {
      if (mesh.isMesh && /^(M4SlotNut|ShaftClamp$|M4MountScrew)/.test(mesh.name)) pieces.push(mesh)
    })
    const nuts = pieces.filter(mesh => mesh.name.startsWith("M4SlotNut"))
    const mounts = pieces.filter(mesh => !nuts.includes(mesh))
    const solid = mesh => [mesh.material].flat().every(m => m.opacity === 1 && !m.transparent)
    const ghost = mesh => [mesh.material].flat().every(m => m.opacity < 1 && m.transparent)
    const lit = mesh => [mesh.material].flat().every(m => m.emissiveIntensity > 0)
    return nuts.length === 4 && mounts.length === 6 && nuts.every(solid) &&
      (${step} !== 2 || nuts.every(lit)) && mounts.every(${step} < 6 ? ghost : solid)
  })()`
}

try {
  await new Promise((resolve) => { ws.onopen = resolve })
  await send("Page.enable")
  await send("Runtime.enable")
  await send("Page.navigate", { url: base })
  await follow("/guide")
  await waitFor("document.querySelectorAll('.guide-tasks a').length === 5", "指南五项任务")
  await follow("/guide/beam-to-post")
  for (const joint of ["corner", "side-tee"]) {
    await follow("/guide/step/" + joint)
    await click(".step-nav button:last-child")
    await waitFor("document.querySelector('.step-list li:nth-child(2).is-current')", "下一步")
    await waitFor(litMeshes + (joint === "corner" ? " >= 2" : " > 0"), "步骤模型高亮")
    await click(".step-nav button:first-child")
    await waitFor("document.querySelector('.step-list li:first-child.is-current')", "上一步")
    await click(".step-controls button:nth-of-type(4)")
    await waitFor("document.querySelector('.step-slider input').value === '100'", "拉开")
    await click(".step-controls button:first-child")
    await click(".step-controls button:nth-child(2)")
    await waitFor("document.querySelector('.step-slider input').value === '0'", "复位")
    await send("Page.reload", { ignoreCache: true })
    await waitFor("document.querySelector('.step-list')", "分步刷新")
    await backTo("/guide/beam-to-post")
  }
  await backTo("/guide")
  await follow("/guide/panel")
  await waitFor("document.querySelectorAll('.guide-option .assembly-diagram').length === 3", "三种板件截面")
  await click("a[href='/case/clothes-rack#top-board']")
  await waitFor("location.hash === '#top-board' && document.querySelector('#top-board')?.innerText.includes('装顶板')", "覆盖顶板案例落点")
  await backTo("/guide/panel")
  await backTo("/guide")
  await follow("/case/clothes-rack")
  await click("a[href='#bottom']")
  await waitFor("location.hash === '#bottom'", "底板锚点")
  await follow("/guide/beam-to-post")
  await follow("/case/clothes-rack")
  await waitFor("document.querySelectorAll('.case-table tbody:first-of-type')[0]?.rows.length === 5", "五项采购")
  await waitFor("decodeURIComponent(document.querySelector('a[download]').href).includes('8. 装顶板')", "离线清单")
  for (const width of [320, 390]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true })
    await expectMobileFit()
    await follow("/guide/step/clothes-rack")
    await expectMobileFit()
    await waitFor("document.querySelectorAll('.step-list li').length === 8", "衣架八步")
    for (let i = 1; i <= 8; i++) {
      if (i > 1) await click(".step-nav button:last-child")
      await waitFor(`document.querySelector('.step-list li:nth-child(${i}).is-current')`, "衣架步骤 " + i)
      await waitFor(litMeshes + " > 0", "衣架零件高亮")
      if (i >= 2 && i <= 6) await waitFor(rackSupportState(i), "衣架螺母及支座状态，第 " + i + " 步")
      if (i === 6) {
        const capture = await send("Page.captureScreenshot", { format: "png" })
        writeFileSync(join(runDir, `rack-shaft-${width}.png`), Buffer.from(capture.result.data, "base64"))
      }
    }
    await follow("/case/clothes-rack")
  }
  await follow("/?sample=clothes-rack")
  await waitFor("document.body.innerText.includes('衣架') && window.__ALUJOINT_FRAME__?.root.children.length > 0", "返回衣架模型")
  console.log("GUIDE_SMOKE_OK", runDir)
} finally {
  ws.close()
  chrome.kill("SIGKILL")
}
