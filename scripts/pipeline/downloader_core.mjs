import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const STORE = `function findStore(){for(const el of document.querySelectorAll('*')){const fk=Object.keys(el).find(k=>k.startsWith('__reactFiber'));if(!fk)continue;let f=el[fk],g=0;while(f&&g++<900){const v=f.memoizedProps&&f.memoizedProps.value;if(v&&typeof v.getState==='function')return v;f=f.return}}return null}`

export function resolveChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter((candidate) => typeof candidate === "string")
  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

async function findPage(port, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const page = pages.find((item) => item.type === "page" && item.webSocketDebuggerUrl)
      if (page) return page
    } catch {
      // Chrome is still starting.
    }
    await sleep(250)
  }
  throw new Error("Chrome 调试端口没有页面")
}

export async function launchChrome({ chromePath, port, profile }) {
  fs.mkdirSync(profile, { recursive: true })
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-sandbox",
      "--window-size=1440,1200",
      "about:blank",
    ],
    { stdio: "ignore" },
  )
  const page = await findPage(port)
  return { chrome, page }
}

export async function attachChrome({ port }) {
  const page = await findPage(port)
  return { chrome: null, page }
}

export async function connect(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl)
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
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const messageId = ++id
      pending.set(messageId, resolve)
      ws.send(JSON.stringify({ id: messageId, method, params }))
    })
  await new Promise((resolve) => ws.addEventListener("open", resolve))
  await send("Page.enable")
  await send("Runtime.enable")
  await send("Network.enable")
  const evalv = async (expression, awaitPromise = false) => {
    const message = await send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
    })
    if (message.result?.exceptionDetails) {
      throw new Error(String(message.result.exceptionDetails.text).slice(0, 200))
    }
    return message.result?.result?.value
  }
  return { ws, send, evalv }
}

export async function setCookies(session, cookies) {
  for (const cookie of cookies) {
    await session.send("Network.setCookie", {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
    })
  }
}

async function clickAt(session, point) {
  await session.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y })
  await session.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: point.x,
    y: point.y,
    button: "left",
    clickCount: 1,
  })
  await session.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: point.x,
    y: point.y,
    button: "left",
    clickCount: 1,
  })
}

async function centerOf(session, expression) {
  return session.evalv(`(() => {
    const el = ${expression}
    if (!el) return null
    el.scrollIntoView({ block: 'center' })
    const rect = el.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, text: (el.innerText || '').trim().slice(0, 60) }
  })()`)
}

const SCAN = `(() => {
  const items = [...document.querySelectorAll('.params-item')]
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const radios = [...item.querySelectorAll('input[type=radio]')]
    if (radios.length) {
      if (!radios.some((radio) => radio.checked)) return { kind: 'radio', index: i, value: radios[0].value }
      continue
    }
    const combo = item.querySelector('[role=combobox]')
    if (combo) {
      const text = (combo.innerText || '').trim()
      if (text === '请选择' || text === '') return { kind: 'combo', index: i }
      continue
    }
    const input = item.querySelector('input[type=text], input[type=number]')
    if (input && !input.value) return { kind: 'text', index: i }
    const labels = [...item.querySelectorAll('li label, [role=radio]')]
    if (labels.length && !labels.some((label) => String(label.className).includes('primary'))) {
      return { kind: 'label', index: i }
    }
  }
  return { kind: 'none' }
})()`

async function pressTab(session) {
  await session.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    key: "Tab",
    code: "Tab",
  })
  await session.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    key: "Tab",
    code: "Tab",
  })
}

async function selectParams(session) {
  const choices = []
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const state = await session.evalv(SCAN)
    if (!state || state.kind === "none") return choices
    if (state.kind === "radio") {
      const value = await session.evalv(`(() => {
        const item = [...document.querySelectorAll('.params-item')][${state.index}]
        const radio = item && [...item.querySelectorAll('input[type=radio]')].find((r) => !r.checked)
        if (!radio) return null
        radio.click()
        return radio.value
      })()`)
      choices.push(`radio:${value}`)
      await sleep(400)
      continue
    }
    if (state.kind === "label") {
      const value = await session.evalv(`(() => {
        const item = [...document.querySelectorAll('.params-item')][${state.index}]
        const label = item && [...item.querySelectorAll('li label, [role=radio]')].find((el) => !String(el.className).includes('primary'))
        if (!label) return null
        label.click()
        return (label.innerText || '').trim().slice(0, 40)
      })()`)
      choices.push(`label:${value}`)
      await sleep(400)
      continue
    }
    if (state.kind === "text") {
      const value = await session.evalv(`(() => {
        ${STORE}
        const store = findStore()
        if (!store) return null
        const sd = store.getState().selectionData || {}
        const param = (sd.paramSelectionList || [])[${state.index}]
        if (!param) return null
        const first = (param.paramValueInfoList || [])[0]
        const range = param.paramRange
        if (range) {
          const raw = 100
          const clamped = Math.min(range.maxValue, Math.max(range.minValue, raw))
          const step = range.step || 1
          return String(Math.round(clamped / step) * step)
        }
        return (first && first.value) || '100'
      })()`)
      if (!value) return choices
      // Text inputs commit through real typing + Enter, not synthetic value setters.
      const point = await centerOf(
        session,
        `[...document.querySelectorAll('.params-item')][${state.index}]?.querySelector('input[type=text], input[type=number]')`,
      )
      if (!point) return choices
      await clickAt(session, point)
      await sleep(150)
      await session.evalv(`(() => {
        const input = [...document.querySelectorAll('.params-item')][${state.index}]?.querySelector('input[type=text], input[type=number]')
        if (!input) return false
        input.focus()
        input.select()
        return true
      })()`)
      await session.send("Input.insertText", { text: value })
      await sleep(150)
      await pressTab(session)
      choices.push(`text:${value}`)
      await sleep(450)
      continue
    }
    // combo: Radix select needs real pointer events, not element.click().
    const trigger = await centerOf(
      session,
      `[...document.querySelectorAll('.params-item')][${state.index}]?.querySelector('[role=combobox]')`,
    )
    if (!trigger) return choices
    await clickAt(session, trigger)
    await sleep(500)
    const option = await centerOf(session, `[...document.querySelectorAll('[role=option]')].find((el) => el.offsetParent !== null)`)
    if (!option) {
      await sleep(400)
      continue
    }
    await clickAt(session, option)
    choices.push(`combo:${option.text}`)
    await sleep(700)
  }
  return choices
}

async function waitStore(session, timeout = 25000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const ready = await session.evalv(`(() => { ${STORE} const s = findStore(); if (!s) return false; const sd = s.getState().selectionData || {}; return Boolean(sd.serialAccessId) })()`)
    if (ready) return true
    await sleep(400)
  }
  return false
}

export async function downloadSerial(session, serial, outDir, options = {}) {
  const modelType = options.modelType || process.env.ALUJOINT_MODEL_TYPE || "step"
  const rec = { serial, file: null, productModel: null, serialCode: null, category: null, bytes: 0, err: null }
  try {
    await session.send("Page.navigate", { url: `https://www.jlcfa.com/serial/${serial}.html` })
    if (!(await waitStore(session))) {
      rec.err = "no store"
      return rec
    }
    rec.choices = await selectParams(session)
    if (process.env.ALUJOINT_DEBUG) {
      const values = await session.evalv(`(() => { ${STORE} const store = findStore(); const sd = store.getState().selectionData || {}; return (sd.paramSelectionList || []).map((param) => ({ name: param.paramName, single: param.singleParamValue })) })()`)
      console.log("VALUES", JSON.stringify(values))
    }
    const raw = await session.evalv(`(() => {
      ${STORE}
      const store = findStore()
      if (!store) return null
      const state = store.getState()
      const sd = state.selectionData || {}
      return {
        serialBizKey: state.serialData?.serialBizKey,
        serialCode: state.serialData?.serialCode,
        category: state.serialData?.belongCategoryCode,
        productCode: (sd.productCodeList || []).map((item) => item.valueAccessId)[0] || "",
        params: sd.paramSelectionList || [],
      }
    })()`)
    if (!raw) {
      rec.err = "no selection data"
      return rec
    }
    rec.serialCode = raw.serialCode
    rec.category = raw.category
    const xsrf = await session.evalv(`(() => { const item = document.cookie.split('; ').find((x) => x.startsWith('XSRF-TOKEN=')); return item ? decodeURIComponent(item.split('=')[1]) : '' })()`)
    const post = async (url, body) => {
      const text = await session.evalv(
        `fetch(${JSON.stringify(url)},{method:'POST',headers:{'Content-Type':'application/json','X-XSRF-TOKEN':${JSON.stringify(xsrf)}},credentials:'include',body:JSON.stringify(${JSON.stringify(body)})}).then((r) => r.text())`,
        true,
      )
      try {
        return JSON.parse(text)
      } catch {
        return null
      }
    }
    const get = async (url) => session.evalv(`fetch(${JSON.stringify(url)},{credentials:'include'}).then((r) => r.text())`, true)

    const slBody = { serialBizKey: raw.serialBizKey, serialCode: raw.serialCode, productCode: raw.productCode, paramSelectionList: raw.params }
    let sl = await post("/api/fa-platform/web/detail-page/selection/serial-lite", slBody)
    if (!sl) {
      // Aliyun WAF challenge: give the page JS a moment, then retry once.
      await sleep(4000)
      sl = await post("/api/fa-platform/web/detail-page/selection/serial-lite", slBody)
    }
    if (!sl?.data?.productModel) {
      rec.err = sl ? "no productModel" : "waf challenge"
      return rec
    }
    rec.productModel = sl.data.productModel

    const rm = await post("/api/faMall/threed/requestModel", {
      attrInfo: raw.params.map((param) => ({ name: param.paramName, value: param.singleParamValue })),
      isDownloadRequest: 1,
      modelType,
      productCode: sl.data.productCode,
      productCodeAccessId: sl.data.productCodeAccessId,
      productModel: sl.data.productModel,
    })
    if (!rm?.data?.requestKey) {
      rec.err = rm ? "no requestKey" : "waf challenge"
      return rec
    }
    let built = null
    for (let i = 0; i < 120; i += 1) {
      const status = JSON.parse(await get(`/api/faMall/threed/getStatus?requestKey=${rm.data.requestKey}&_t=${Date.now()}`))
      if (process.env.ALUJOINT_DEBUG) console.log("STATUS", i, JSON.stringify(status.data).slice(0, 300))
      if (status.data?.built_file?.url) {
        built = status.data.built_file
        break
      }
      if (status.data?.status === 2) {
        rec.err = "build failed"
        break
      }
      await sleep(1500)
    }
    if (!built) {
      rec.err = rec.err || "no built_file"
      return rec
    }
    const fileName = `${rec.productModel}(jlcfa).${modelType}`
    const dlUrl = `/api/faMall/threed/modelDownload?requestKey=${rm.data.requestKey}&url=${encodeURIComponent(built.url)}&fileName=${encodeURIComponent(fileName)}&fType=${modelType}&_t=${Date.now()}`
    const b64 = await session.evalv(
      `fetch(${JSON.stringify(dlUrl)},{credentials:'include'}).then((r) => r.arrayBuffer()).then((buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s) })`,
      true,
    )
    if (!b64) {
      rec.err = "download failed"
      return rec
    }
    const safe = rec.productModel.replace(/[^\w.-]+/g, "_")
    fs.mkdirSync(outDir, { recursive: true })
    const file = path.join(outDir, `${rec.serialCode}-${safe}.${modelType}`)
    fs.writeFileSync(file, Buffer.from(b64, "base64"))
    rec.file = file
    rec.modelType = modelType
    rec.bytes = fs.statSync(file).size
  } catch (error) {
    rec.err = String(error).slice(0, 200)
  }
  return rec
}
