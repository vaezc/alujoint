import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"

const port = 9223
const chrome = spawn(
  "/opt/google/chrome/chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--user-data-dir=/tmp/chrome-smoke",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-gpu-sandbox",
    "--no-first-run",
    "--window-size=1440,900",
    "http://127.0.0.1:41731/",
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

async function page() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`)
      const pages = await response.json()
      const found = pages.find((item) => item.type === "page" && item.webSocketDebuggerUrl)
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
  writeFileSync(file, Buffer.from(data, "base64"))
  console.log("shot", file)
}

const frameReport = `(() => {
  const canvas = document.querySelector("canvas")
  if (!canvas) return { error: "没有画布" }
  const resources = performance.getEntriesByType("resource").map((entry) => entry.name)
  const fiberUrl = resources.find((name) => name.includes("@react-three_fiber") || name.includes("react-three-fiber"))
  if (!fiberUrl) return { error: "没有找到 fiber 模块" }
  return import(fiberUrl).then((fiber) => {
    const root = fiber._roots.get(canvas)
    if (!root) return { error: "场景还没有挂上" }
    const { scene, camera } = root.store.getState()
    scene.updateMatrixWorld(true)
    let Vector3 = null
    const meshes = []
    scene.traverse((object) => {
      if (!object.isMesh || !object.geometry || !object.name) return
      object.geometry.computeBoundingBox()
      if (!object.geometry.boundingBox) return
      Vector3 = object.position.constructor
      const box = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld)
      const size = box.getSize(new Vector3())
      if (Math.max(size.x, size.y, size.z) > 300) return
      meshes.push({ name: object.name, box })
    })
    if (!Vector3 || meshes.length < 8) return { error: "零件网格还没到齐", count: meshes.length }
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
  })
})()`

async function assertFramed(send, label) {
  const report = await evaluate(send, frameReport)
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

try {
  const target = await page()
  const send = await connect(target.webSocketDebuggerUrl)
  await send("Runtime.enable")
  await send("Page.enable")
  await evaluate(send, "document.fonts ? document.fonts.ready : true")
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const opening = await evaluate(send, "document.body.innerText")
  if (!opening.includes("铝构")) fail("标题没有铝构")
  if (!opening.includes("整组爆炸")) fail("首页没有整组爆炸")
  if (!opening.includes("缺模型")) fail("首页没有缺模型的清单")
  if (!opening.includes("装配位置为教学示意")) fail("角部视图没有教学示意这句话")
  if (!opening.includes("EDLA-S1-M4-L10")) fail("清单没有 EDLA")
  if (!opening.includes("TPAA-D-6-M4")) fail("清单没有镀锌螺母")
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
  if (!explodedBounds || explodedBounds.x < 160 || explodedBounds.y < 150) {
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

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("TXCJ-H6-2020-L100")) button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 800))
  const profileText = await evaluate(send, "document.body.innerText")
  if (!profileText.includes("X 100")) fail(`型材包围盒不是 100 mm：${profileText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  if (profileText.includes("截面矢量")) fail("型材仍标成截面矢量")
  await shot(send, "/tmp/euro20-profile.png")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("TPAA-D-6-M4")) button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 800))
  const nutText = await evaluate(send, "document.body.innerText")
  const nutBox = readBox(nutText)
  if (!nutBox || nutBox.x < 9.5 || nutBox.x > 10.5 || nutBox.y < 4.3 || nutBox.y > 4.7 || nutBox.z < 5.8 || nutBox.z > 6.3) {
    fail(`T 形螺母包围盒不是 10×4.5×6：${nutText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  if (!nutText.includes("镀锌") || !nutText.includes("TPAA-N-6-M4")) fail("螺母说明没有区分镀锌 D 和镀镍 N")
  await shot(send, "/tmp/euro20-nut.png")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("TYZC-H6-206-2020-DZ")) button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 800))
  const tyzcText = await evaluate(send, "document.body.innerText")
  const tyzcBox = readBox(tyzcText)
  if (!tyzcBox || tyzcBox.x < 31 || tyzcBox.x > 33 || tyzcBox.y < 31 || tyzcBox.y > 33 || tyzcBox.z < 18 || tyzcBox.z > 20) {
    fail(`角座包围盒不是 32×32×19：${tyzcText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  if (tyzcText.includes("没有网格")) fail("角座视图仍是空的")
  await shot(send, "/tmp/euro20-tyzc.png")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("TPDH-206-T-ZP")) button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 800))
  const tpdhText = await evaluate(send, "document.body.innerText")
  if (!tpdhText.includes("螺钉 NAUO2") || !tpdhText.includes("NAUO3") || !tpdhText.includes("NAUO4")) {
    fail("端面连接件没有 NAUO2–4")
  }
  const tpdhBox = readBox(tpdhText)
  if (!tpdhBox || [tpdhBox.x, tpdhBox.y, tpdhBox.z].some((value) => value < 30 || value > 33)) {
    fail(`端面套件合拢包围盒不是 31 mm：${tpdhText.match(/包围盒[^\n]+/)?.[0] ?? "missing"}`)
  }
  await shot(send, "/tmp/euro20-tpdh.png")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "拉开") button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 500))
  const explodedText = await evaluate(send, "document.body.innerText")
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

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.trim() === "示意") button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 200))
  const filtered = await evaluate(send, "document.body.innerText")
  if (filtered.includes("TXCJ-H6-2020-L100")) fail("筛选「示意」后型材仍留在目录里")
  if (!filtered.includes("整组爆炸")) fail("筛选后没有整组爆炸")

  await evaluate(
    send,
    `document.querySelectorAll("button").forEach((button) => { if (button.textContent.includes("整组爆炸")) button.click() })`,
  )
  await new Promise((resolve) => setTimeout(resolve, 900))
  const sceneText = await evaluate(send, "document.body.innerText")
  if (!sceneText.includes("未验证配合")) fail("示意场景没有未验证标记")
  if (!sceneText.includes("型材，沿 X")) fail("示意场景没有两根型材的零件")
  await shot(send, "/tmp/euro20-scene.png")
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await new Promise((resolve) => setTimeout(resolve, 400))
  const mobileText = await evaluate(send, "document.body.innerText")
  if (!mobileText.includes("目录")) fail("窄屏没有目录按钮")
  await shot(send, "/tmp/euro20-mobile.png")
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
