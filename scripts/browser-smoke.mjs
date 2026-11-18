import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

const port = Number(process.env.CHROME_DEBUG_PORT ?? 9223)
const baseUrl = process.env.SMOKE_URL ?? "http://127.0.0.1:41731/"
const runDir = mkdtempSync(join(tmpdir(), "alujoint-smoke-"))
const chromeCandidates = [
  process.env.CHROME_PATH,
  "/opt/google/chrome/chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((candidate) => typeof candidate === "string")
const chromePath = chromeCandidates.find((candidate) => existsSync(candidate))
if (!chromePath) {
  console.error("找不到 Chrome。用 CHROME_PATH 指定可执行文件路径。")
  process.exit(1)
}
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${join(runDir, "chrome-profile")}`,
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-gpu-sandbox",
    "--no-first-run",
    "--window-size=1440,900",
    baseUrl,
  ],
  { stdio: "ignore" },
)

const failures = []
const logs = []

function fail(message) {
  failures.push(message)
  console.error("FAIL", message)
}

function readBox(text) {
  const match = text.match(/包围盒 X ([0-9.]+) · Y ([0-9.]+) · Z ([0-9.]+)/)
  if (!match) return null
  return { x: Number(match[1]), y: Number(match[2]), z: Number(match[3]) }
}

async function waitFor(send, test, timeout = 8000) {
  const started = Date.now()
  let text = ""
  while (Date.now() - started < timeout) {
    text = await evaluate(send, "document.body.innerText")
    if (test(text)) return text
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return text
}

function hasBounds(text) {
  return readBox(text) !== null
}

async function page() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`)
      const pages = await response.json()
      const found = pages.find((item) => item.type === "page" && item.url === baseUrl && item.webSocketDebuggerUrl)
      if (found) return found
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
    if (message.method === "Runtime.consoleAPICalled") {
      const text = message.params.args.map((arg) => arg.value ?? arg.description).join(" ")
      logs.push(text)
    }
    if (message.method === "Runtime.exceptionThrown") {
      logs.push(message.params.exceptionDetails.text)
    }
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

async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text)
  }
  return result.result.value
}

async function shot(send, file) {
  const { data } = await send("Page.captureScreenshot", { format: "png" })
  const output = join(runDir, basename(file))
  writeFileSync(output, Buffer.from(data, "base64"))
  console.log("shot", output)
}

const frameReport = (expectedMeshes) => `(() => {
  const probe = window.__ALUJOINT_FRAME__
  if (!probe) return { error: "取景探针还没有挂上" }
  const { root, camera, canvas } = probe
  root.updateWorldMatrix(true, true)
  let Vector3 = null
  const meshes = []
  root.traverse((object) => {
    if (!object.isMesh || !object.geometry || !object.name) return
    object.geometry.computeBoundingBox()
    if (!object.geometry.boundingBox) return
    Vector3 = object.position.constructor
    const box = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld)
    const size = box.getSize(new Vector3())
    if (Math.max(size.x, size.y, size.z) > 300) return
    meshes.push({ name: object.name, box })
  })
  if (!Vector3 || meshes.length !== ${expectedMeshes}) return { error: "零件网格数量不符：" + meshes.length }
  const canvasRect = canvas.getBoundingClientRect()
  let visibleTop = canvasRect.top
  let visibleBottom = canvasRect.bottom
  const main = canvas.closest("main")
  if (main) {
    for (const child of main.children) {
      if (child.contains(canvas)) continue
      const rect = child.getBoundingClientRect()
      if (rect.width < 8 || rect.height < 8) continue
      if (rect.top <= canvasRect.top + 8 && rect.bottom > canvasRect.top) visibleTop = Math.max(visibleTop, rect.bottom)
      if (rect.bottom >= canvasRect.bottom - 8 && rect.top < canvasRect.bottom) visibleBottom = Math.min(visibleBottom, rect.top)
    }
  }
  const margin = 6
  const violations = []
  for (const mesh of meshes) {
    const { min, max } = mesh.box
    const corners = []
    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) {
          const point = new Vector3(x, y, z).project(camera)
          corners.push({
            sx: canvasRect.left + ((point.x + 1) / 2) * canvasRect.width,
            sy: canvasRect.top + ((1 - point.y) / 2) * canvasRect.height,
            ndc: Math.max(Math.abs(point.x), Math.abs(point.y)),
          })
        }
      }
    }
    const clipped = corners.filter((corner) => (
      corner.sx < canvasRect.left + margin
      || corner.sx > canvasRect.right - margin
      || corner.sy < visibleTop + margin
      || corner.sy > visibleBottom - margin
      || corner.ndc > 1
    ))
    if (clipped.length) {
      violations.push({
        name: mesh.name,
        clipped: clipped.length,
        sy: [Math.min(...corners.map((corner) => corner.sy)), Math.max(...corners.map((corner) => corner.sy))],
      })
    }
  }
  return {
    violations,
    meshCount: meshes.length,
    visibleTop,
    visibleBottom,
    canvasTop: canvasRect.top,
    canvasBottom: canvasRect.bottom,
  }
})()`

async function assertFramed(send, label, expectedMeshes = 17) {
  const report = await evaluate(send, frameReport(expectedMeshes))
  if (!report || report.error) {
    fail(`${label}无法测量取景：${report?.error ?? "empty"}`)
    return
  }
  if (report.violations.length) {
    const names = report.violations.map((item) => `${item.name}(${item.clipped})`).join(", ")
    fail(`${label}有零件超出可见区域：${names}；可见 ${report.visibleTop.toFixed(0)}–${report.visibleBottom.toFixed(0)}，画布 ${report.canvasTop.toFixed(0)}–${report.canvasBottom.toFixed(0)}`)
  } else {
    console.log(`FRAME_OK ${label} meshes=${report.meshCount}`)
  }
}

async function clickText(send, text) {
  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === ${JSON.stringify(text)}) button.click() })`,
  )
}

async function selectModel(send, model) {
  await evaluate(send, `(() => {
    const input = document.querySelector("#catalog-search")
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, ${JSON.stringify(model)})
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 150))
  const clicked = await evaluate(send, `(() => {
    const button = [...document.querySelectorAll("aside li button")].find((button) => button.textContent.includes(${JSON.stringify(model)}))
    button?.click()
    return Boolean(button)
  })()`)
  if (!clicked) fail("目录里找不到 " + model)
  await new Promise((resolve) => setTimeout(resolve, 650))
  await waitFor(send, hasBounds)
}

async function partPositions(send, name) {
  return evaluate(send, `(() => {
    const root = window.__ALUJOINT_FRAME__?.root
    const node = root?.getObjectByName(${JSON.stringify(name)})
    const body = root?.getObjectByName("NAUO1")
    if (!node || !body) return null
    root.updateWorldMatrix(true, true)
    const center = body.matrixWorld.elements.slice(12, 15)
    const positions = []
    node.traverse((part) => positions.push(part.matrixWorld.elements.slice(12, 15).map((value, index) => value - center[index])))
    return positions
  })()`)
}

function assertTravel(before, after, expected, label) {
  if (!before || !after || before.length !== after.length || after.some((position, part) =>
    position.some((value, axis) => Math.abs(value - before[part][axis] - expected[axis]) > 0.1))) {
    fail(`${label} 的实例或子网格位移不符：${JSON.stringify({ before, after, expected })}`)
  }
}


try {
  const target = await page()
  const send = await connect(target.webSocketDebuggerUrl)
  await send("Runtime.enable")
  await send("Page.enable")
  await evaluate(send, "document.fonts ? document.fonts.ready : true")
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const opening = await waitFor(send, hasBounds)
  if (!opening.includes("铝构")) fail("标题没有铝构")
  if (!opening.includes("型材角部连接（角码）")) fail("首页没有整组爆炸")
  if (!opening.includes("缺模型")) fail("首页没有缺模型的清单")
  if (!opening.includes("装配位置为教学示意")) fail("角部视图没有教学示意这句话")
  if (!opening.includes("EDLA-S1-M4-L10")) fail("清单没有 EDLA")
  if (!opening.includes("TPAA-N-6-M4")) fail("角码场景没有镀镍螺母")
  if (!opening.includes("428 / 428 个条目")) fail("抓取目录没有全部接入清单")
  if (opening.includes("没有可用的 WebGL")) fail("SwiftShader 下 WebGL 仍然不可用")
  const openBox = readBox(opening)
  if (!openBox || openBox.x < 90 || openBox.x > 150 || openBox.y < 90 || openBox.y > 150 || openBox.z > 40) {
    fail(`角部合拢不像靠在一起的两根型材：${opening.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await clickText(send, "合拢")
  await clickText(send, "取景")
  await new Promise((resolve) => setTimeout(resolve, 600))
  await assertFramed(send, "合拢")
  await clickText(send, "拉开")
  await new Promise((resolve) => setTimeout(resolve, 700))
  const fullExplode = await evaluate(send, `document.querySelector('input[aria-label="爆炸程度"]').value`)
  if (Number(fullExplode) !== 100) fail(`整组没有拉到 100%：${fullExplode}`)
  const explodedBounds = readBox(await evaluate(send, "document.body.innerText"))
  if (!explodedBounds || explodedBounds.x < 135 || explodedBounds.y < 155) {
    fail(`100% 爆炸包围盒没有拉开长型材：${JSON.stringify(explodedBounds)}`)
  }
  await assertFramed(send, "100%爆炸")
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  })
  await clickText(send, "合拢")
  await clickText(send, "取景")
  await new Promise((resolve) => setTimeout(resolve, 500))
  await shot(send, "/tmp/desktop-joint-collapsed.png")
  await clickText(send, "拉开")
  await new Promise((resolve) => setTimeout(resolve, 700))
  await shot(send, "/tmp/desktop-joint-exploded.png")
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await clickText(send, "合拢")
  await new Promise((resolve) => setTimeout(resolve, 300))
  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "播放") button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 700))
  const played = await evaluate(send, `document.querySelector('input[aria-label="爆炸程度"]').value`)
  if (Number(played) < 8) fail(`播放没有推动滑杆：${played}`)
  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "暂停") button.click() })`,
  )
  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "取景") button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 400))
  await shot(send, "/tmp/euro20-joint.png")

  await selectModel(send, "TXCJ-H6-2020-L100")
  const profileText = await waitFor(send, (text) => /包围盒 X 100/.test(text))
  if (!profileText.includes("X 100")) fail(`型材包围盒不是 100 mm：${profileText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  if (profileText.includes("截面矢量")) fail("型材仍标成截面矢量")
  await shot(send, "/tmp/euro20-profile.png")

  await selectModel(send, "TPAA-D-6-M4")
  const nutText = await waitFor(send, hasBounds)
  const nutBox = readBox(nutText)
  if (!nutBox || nutBox.x < 9.5 || nutBox.x > 10.5 || nutBox.y < 4.3 || nutBox.y > 4.7 || nutBox.z < 5.8 || nutBox.z > 6.3) {
    fail(`T 形螺母包围盒不是 10×4.5×6：${nutText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  if (!nutText.includes("镀锌") || !nutText.includes("TPAA-N-6-M4")) fail("螺母说明没有区分镀锌 D 和镀镍 N")
  await shot(send, "/tmp/euro20-nut.png")

  await selectModel(send, "TYZC-H6-206-2020-DZ")
  const tyzcText = await waitFor(send, hasBounds)
  const tyzcBox = readBox(tyzcText)
  if (!tyzcBox || tyzcBox.x < 31 || tyzcBox.x > 33 || tyzcBox.y < 31 || tyzcBox.y > 33 || tyzcBox.z < 18 || tyzcBox.z > 20) {
    fail(`角座包围盒不是 32×32×19：${tyzcText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  if (tyzcText.includes("没有网格")) fail("角座视图仍是空的")
  await shot(send, "/tmp/euro20-tyzc.png")

  await selectModel(send, "TPDH-206-T-ZP")
  const tpdhText = await waitFor(send, hasBounds)
  if (!tpdhText.includes("螺钉 NAUO2") || !tpdhText.includes("NAUO3") || !tpdhText.includes("NAUO4")) {
    fail("端面连接件没有 NAUO2–4")
  }
  const tpdhClosed = await partPositions(send, "NAUO2")
  const tpdhBox = readBox(tpdhText)
  if (!tpdhBox || [tpdhBox.x, tpdhBox.y, tpdhBox.z].some((value) => value < 30 || value > 33)) {
    fail(`端面套件合拢包围盒不是 31 mm：${tpdhText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  await shot(send, "/tmp/euro20-tpdh.png")
  const tpdhNext = await partPositions(send, "NAUO3")
  await evaluate(send, `(() => {
    const slider = document.querySelector("main input[type=range]")
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(slider, "20")
    slider.dispatchEvent(new Event("input", { bubbles: true }))
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 200))
  assertTravel(tpdhClosed, await partPositions(send, "NAUO2"), [33, 0, 0], "TPDH 第一颗螺钉先退出")
  assertTravel(tpdhNext, await partPositions(send, "NAUO3"), [0, 0, 0], "TPDH 第二颗螺钉等待")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "拉开") button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 500))
  const explodedText = await waitFor(send, (text) => {
    const box = readBox(text)
    return box !== null && box.x > 55 && box.y > 55 && box.z > 55
  })
  const exploded = readBox(explodedText)
  if (!exploded || exploded.x < 55 || exploded.y < 55 || exploded.z < 55) {
    fail(`拉开后三轴没有分开：${explodedText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "螺钉 NAUO2") button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 200))
  await shot(send, "/tmp/euro20-tpdh-exploded.png")
  assertTravel(tpdhClosed, await partPositions(send, "NAUO2"), [55, 0, 0], "TPDH 沉头螺钉")
  await clickText(send, "合拢")
  await new Promise((resolve) => setTimeout(resolve, 350))
  assertTravel(tpdhClosed, await partPositions(send, "NAUO2"), [0, 0, 0], "TPDH 复位")

  for (const [model, travel] of [
    ["TPDF-206-D4.5-ZP", [0, 0, -24]],
    ["TPDG-206-D5-ZP", [10, 0, 0]],
    ["TPLH-206-Y-ZP", [0, 22, 0]],
  ]) {
    await selectModel(send, model)
    const closed = await partPositions(send, "NAUO2")
    if (closed?.length !== 3) fail(model + " 应有一个螺钉实例和两个子网格")
    await clickText(send, "拉开")
    await new Promise((resolve) => setTimeout(resolve, 550))
    assertTravel(closed, await partPositions(send, "NAUO2"), travel, model)
  }

  await selectModel(send, "TPAA-N-6-M4")
  if (await evaluate(send, "Boolean(document.querySelector(\"main input[type=range]\"))")) {
    fail("单个带特征网格的 T 形螺母出现了爆炸控件")
  }

  await evaluate(
    send,
    `(() => {
      const input = document.querySelector("#catalog-search")
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
      setter.call(input, "TDB01-LC-AEG01-4460-9-LA100")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })()`,
  )
  await new Promise((resolve) => setTimeout(resolve, 300))
  const searchText = await evaluate(send, "document.body.innerText")
  if (!searchText.includes("TDB01-LC-AEG01-4460-9-LA100")) fail("检索没有命中抓取目录条目")
  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("TDB01-LC-AEG01-4460-9-LA100")) button.click() })`,
  )
  const catalogText = await waitFor(send, hasBounds)
  if (!catalogText.includes("批量目录条目")) fail("抓取目录条目没有标明来源")
  if (!catalogText.includes("没有逐件核对")) fail("抓取目录条目没有保留未核对说明")
  await shot(send, "/tmp/euro20-catalog-item.png")

  await evaluate(
    send,
    `(() => {
      const input = document.querySelector("#catalog-search")
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
      setter.call(input, "LC-AEG15-5065-XL90")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })()`,
  )
  await new Promise((resolve) => setTimeout(resolve, 300))
  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("LC-AEG15-5065-XL90")) button.click() })`,
  )
  const xl90Text = await waitFor(send, hasBounds)
  const xl90Box = readBox(xl90Text)
  if (!xl90Box || xl90Box.x < 95 || xl90Box.x > 100 || xl90Box.z < 88 || xl90Box.z > 92) {
    fail(`XL90 备用 STL 转出的包围盒不对：${JSON.stringify(xl90Box)}`)
  }
  await shot(send, "/tmp/euro20-xl90.png")
  await evaluate(
    send,
    `(() => {
      const input = document.querySelector("#catalog-search")
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
      setter.call(input, "")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })()`,
  )
  await new Promise((resolve) => setTimeout(resolve, 300))

  const fasteners = await evaluate(send, `(() => {
    const group = [...document.querySelectorAll("aside section")].find((section) =>
      section.querySelector("button[aria-expanded]")?.textContent.includes("型材专用紧固件"))
    const toggle = group?.querySelector("button[aria-expanded]")
    if (!toggle) return null
    const count = group.querySelectorAll("li").length
    toggle.click()
    return count
  })()`)
  if (fasteners !== 45) fail("型材专用紧固件分组条数不对：" + fasteners)
  await new Promise((resolve) => setTimeout(resolve, 150))
  const collapsed = await evaluate(send, `[...document.querySelectorAll("button[aria-expanded=false]")].some((button) => button.textContent.includes("型材专用紧固件"))`)
  if (!collapsed) fail("型材专用紧固件分组没有折叠")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "示意") button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 200))
  const filtered = await evaluate(send, "document.body.innerText")
  if (await evaluate(send, `[...document.querySelectorAll("button")].some((button) => button.textContent.includes("TXCJ-H6-2020-L100"))`)) fail("筛选「示意」后型材仍留在目录里")
  if (!filtered.includes("型材角部连接（角码）")) fail("筛选后没有整组爆炸")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("型材角部连接（角码）")) button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 900))
  const sceneText = await waitFor(send, (text) => text.includes("型材，沿 X"))
  if (!sceneText.includes("未验证配合")) fail("示意场景没有未验证标记")
  if (!sceneText.includes("型材，沿 X")) fail("示意场景没有两根型材的零件")
  await shot(send, "/tmp/euro20-scene.png")

  for (const [model, meshes] of [
    ["端面连接 · L 形", 7],
    ["端面贴侧面 · 内置", 9],
    ["角部 · 角槽件", 10],
    ["直线延长 · 槽内一字连接", 13],
    ["斜接 · 45° 外置连接板", 21],
    ["立体角 · 三向端面连接", 10],
    ["斜接 · 135° 挤压角码", 9],
    ["斜接 · 45° 型材连接板", 20],
    ["立体角 · 三维连接件", 14],
    ["面板角 · 面板角槽连接件", 9],
    ["弹性 · 弹性连接件", 1],
  ]) {
    await selectModel(send, model)
    await clickText(send, "取景")
    await new Promise((resolve) => setTimeout(resolve, 350))
    await assertFramed(send, model, meshes)
    if (model.includes("直线延长") || model.includes("斜接") || model.includes("三向端面") || model.includes("三维连接件")) {
      await clickText(send, "拉开")
      await new Promise((resolve) => setTimeout(resolve, 400))
      await assertFramed(send, model + " · 拉开", meshes)
    }
    if (model.includes("内置") && !(await evaluate(send, `document.querySelector("main").innerText.includes("预装位置")`))) {
      fail("TPDF 场景缺少预装位置控件")
    }
  }
  await selectModel(send, "型材角部连接（角码）")
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await new Promise((resolve) => setTimeout(resolve, 400))
  const mobileText = await evaluate(send, "document.body.innerText")
  if (!mobileText.includes("目录")) fail("窄屏没有目录按钮")
  const mobileWidths = await evaluate(send, `[
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
    document.querySelector(".model-stage").getBoundingClientRect().width,
    document.querySelector("#model-view").getBoundingClientRect().width,
  ]`)
  if (mobileWidths[0] > mobileWidths[1] + 1 || mobileWidths[2] > mobileWidths[3] + 1) {
    fail("移动工作台横向溢出：" + JSON.stringify(mobileWidths))
  }
  await shot(send, "/tmp/euro20-mobile.png")
  await evaluate(send, `(() => {
    const trigger = [...document.querySelectorAll("header button")].find((button) => button.textContent.trim() === "目录")
    trigger.focus()
    trigger.click()
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 350))
  const mobileCatalog = await evaluate(send, `(() => {
    const panel = document.querySelector('.workspace-sheet[data-open]')
    return panel?.getAttribute("data-presentation") === "sheet" &&
      panel.getBoundingClientRect().height > 400 &&
      document.activeElement.id === "mobile-catalog-search"
  })()`)
  if (!mobileCatalog) fail("移动目录没有展开为可操作的底部面板，或焦点没有进入检索框")
  await shot(send, "/tmp/mobile-catalog.png")
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
  await new Promise((resolve) => setTimeout(resolve, 350))
  if (!(await evaluate(send, `!document.querySelector(".workspace-sheet[data-open]") && document.activeElement.textContent.trim() === "目录"`))) {
    fail("Escape 没有关闭移动目录并恢复焦点")
  }
  await clickText(send, "说明")
  await new Promise((resolve) => setTimeout(resolve, 350))
  if (!(await evaluate(send, `document.querySelector(".workspace-sheet[data-open]")?.textContent.includes("清单与爆炸")`))) {
    fail("移动说明面板缺少模型清单")
  }
  await evaluate(send, `document.querySelector('.workspace-sheet [aria-label="回到视图"]')?.click()`)
  await new Promise((resolve) => setTimeout(resolve, 350))
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await evaluate(
    send,
    `(() => {
      const input = document.querySelector("#catalog-search")
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
      setter.call(input, "没有这种零件")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })()`,
  )
  await new Promise((resolve) => setTimeout(resolve, 200))
  const empty = await evaluate(send, "document.body.innerText")
  if (!empty.includes("没有对上的条目")) fail("空检索没有空状态")

  await send("Page.navigate", { url: new URL("?sample=clothes-rack", baseUrl).href })
  const rackText = await waitFor(send, (text) => text.includes("衣架 · 2020 框架和 Ø16 光轴") && hasBounds(text), 12000)
  const rack = readBox(rackText)
  if (!rack || Math.abs(rack.x - 920) > 0.5 || Math.abs(rack.y - 1502) > 0.5 || Math.abs(rack.z - 440) > 0.5) {
    fail("衣架外廓应为 920 × 1502 × 440 mm：" + JSON.stringify(rack))
  }
  const rackCartSpecs = [
    "BAGA-C2-A-A-N-D16-L900",
    "BETV-C2N1-GP-D16-H50",
    "EDLA-S1-M4-L12",
    "购 100 颗，装 4 颗",
    "TPAA-N-6-M4",
    "购 20 颗，装 4 颗",
  ]
  if (rackCartSpecs.some((spec) => !rackText.includes(spec)) || rackText.includes("转接板")) {
    fail("衣架清单的直装方案与购物车不符")
  }
  const shaftFit = await evaluate(send, `(() => {
    const root = window.__ALUJOINT_FRAME__?.root
    const shaft = root?.getObjectByName("SolidShaft")
    if (!shaft) return null
    root.updateWorldMatrix(true, true)
    function box(object) {
      object.geometry.computeBoundingBox()
      return object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld)
    }
    const shaftBox = box(shaft)
    const supports = []
    const screws = []
    const nuts = []
    root.traverse((part) => {
      if (part.name === "ShaftClamp") supports.push(box(part))
      if (part.name.startsWith("M4MountScrew")) screws.push(box(part))
      if (part.name.startsWith("M4SlotNut")) nuts.push(box(part))
    })
    supports.sort((a, b) => a.min.x - b.min.x)
    if (supports.length !== 2 || root.getObjectByName("OffsetAdapter")) return null
    return [
      shaftBox.max.x - shaftBox.min.x,
      supports[1].min.x - supports[0].min.x,
      supports[0].min.x - shaftBox.min.x,
      shaftBox.max.x - supports[1].max.x,
      supports[0].max.y - shaftBox.max.y,
      screws.length,
      nuts.length,
    ]
  })()`)
  const expectedFit = [900, 880, 5, 5, 42, 4, 4]
  if (!shaftFit || shaftFit.some((value, index) => Math.abs(value - expectedFit[index]) > 0.05)) {
    fail("衣架光轴长度、支座间距、两端伸出、梁下净空或紧固件数量不符：" + JSON.stringify(shaftFit))
  }
  await shot(send, "/tmp/clothes-rack.png")

  const webglErrors = logs.filter((line) => {
    const text = String(line)
    if (/Clock:|Context Lost|lose_context/i.test(text)) return false
    return /error|Error|WebGL/i.test(text)
  })
  if (webglErrors.length) fail(`控制台：${webglErrors.join(" | ")}`)

  if (failures.length) {
    console.error(JSON.stringify({ failures, logs }, null, 2))
    process.exitCode = 1
  } else {
    console.log("SMOKE_OK")
  }
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  chrome.kill("SIGKILL")
}
