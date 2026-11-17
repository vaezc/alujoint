import { spawn } from "node:child_process"
import fs from "node:fs"
const CHROME = process.env.HOME + "/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome"
const PORT = Number(process.argv[5] || 9238)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const OUT_DIR = process.argv[2] || "/home/vae/person/alujoint/sources/raw"
const RESULT = process.argv[3] || "/tmp/opencode/downloaded.jsonl"
fs.mkdirSync(OUT_DIR, { recursive: true })

const SERIALS_FILE = process.argv[4] || "/tmp/opencode/serials.jsonl"
const serials = SERIALS_FILE.endsWith(".txt")
  ? fs.readFileSync(SERIALS_FILE, "utf8").trim().split("\n").filter(Boolean)
  : [...new Set(fs.readFileSync(SERIALS_FILE, "utf8").trim().split("\n").flatMap((l) => { try { return JSON.parse(l).serials || [] } catch { return [] } }))]
console.log("total serials:", serials.length)
const done = new Set()
if (fs.existsSync(RESULT)) for (const l of fs.readFileSync(RESULT, "utf8").split("\n")) { try { const r = JSON.parse(l); if (r.file) done.add(r.serial) } catch {} }
console.log("already done:", done.size)

const cookies = JSON.parse(fs.readFileSync(process.env.HOME + "/.cache/alujoint-jlc/cookies.json", "utf8"))
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.argv[6] || "/tmp/chrome-batch"}`, "--no-first-run", "--no-sandbox", "--window-size=1440,1200", "about:blank"], { stdio: "ignore" })
let page
for (let i = 0; i < 80; i++) { try { const d = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); page = d.find((x) => x.type === "page" && x.webSocketDebuggerUrl); if (page) break } catch {} await sleep(250) }
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const evalv = async (x, aw = false) => { const m = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: aw, expression: x }); if (m.result?.exceptionDetails) return null; return m.result?.result?.value }
await new Promise((r) => (ws.onopen = r))
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable")
for (const c of cookies) await send("Network.setCookie", { name: c.name, value: c.value, domain: c.domain, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite })

const findStore = `function findStore(){for(const el of document.querySelectorAll('*')){const fk=Object.keys(el).find(k=>k.startsWith('__reactFiber'));if(!fk)continue;let f=el[fk],g=0;while(f&&g++<900){const v=f.memoizedProps&&f.memoizedProps.value;if(v&&typeof v.getState==='function')return v;f=f.return}}return null}`

async function handle(serial) {
  const rec = { serial, file: null, productModel: null, serialCode: null, category: null, bytes: 0, err: null }
  try {
    await send("Page.navigate", { url: `https://www.jlcfa.com/serial/${serial}.html` })
    await sleep(8000)
    const init = await evalv(`(()=>{${findStore}const s=findStore();if(!s)return {err:'no store'};const st=s.getState();const sd=st.selectionData||{},sd2=st.serialData||{};if(!sd.serialAccessId)return {err:'not ready'};
      return {serialCode:sd2.serialCode,serialName:sd2.serialName,serialBizKey:sd2.serialBizKey,belongCategoryCode:sd2.belongCategoryCode,
      productCodeList:(sd.productCodeList||[]).map(x=>x.valueAccessId),
      params:(sd.paramSelectionList||[]).map(p=>({name:p.paramName,attrType:p.paramAttributeType,first:(p.paramValueInfoList||[])[0]?{v:(p.paramValueInfoList[0].value),aid:p.paramValueInfoList[0].valueAccessId}:null,isRange:!!p.paramRange}))};
    })()`)
    if (!init || init.err) { rec.err = (init && init.err) || "init null"; return rec }
    rec.serialCode = init.serialCode; rec.category = init.belongCategoryCode
    const slBody = {
      serialBizKey: init.serialBizKey, serialCode: init.serialCode, productCode: init.productCodeList[0] || "",
      paramSelectionList: await evalv(`(()=>{${findStore}const sd=findStore().getState().selectionData;return (sd.paramSelectionList||[]).map(pp=>{const f=(pp.paramValueInfoList||[])[0]||{};const val=f.valueAccessId||(pp.paramRange?"100":"");return Object.assign({},pp,{singleParamValue:val,selected:true})})})()`),
    }
    const xsrf = await evalv(`(()=>{const t=document.cookie.split('; ').find(x=>x.startsWith('XSRF-TOKEN='));return t?decodeURIComponent(t.split('=')[1]):''})()`)
    const post = async (url, body) => evalv(`fetch(${JSON.stringify(url)},{method:'POST',headers:{'Content-Type':'application/json','X-XSRF-TOKEN':${JSON.stringify(xsrf)}},credentials:'include',body:JSON.stringify(${JSON.stringify(body)})}).then(r=>r.text())`, true)
    const get = async (url) => evalv(`fetch(${JSON.stringify(url)},{credentials:'include'}).then(r=>r.text())`, true)
    const sl = JSON.parse(await post("/api/fa-platform/web/detail-page/selection/serial-lite", slBody))
    if (!sl?.data?.productModel) { rec.err = "no productModel"; return rec }
    rec.productModel = sl.data.productModel
    const rm = JSON.parse(await post("/api/faMall/threed/requestModel", {
      attrInfo: init.params.map((p) => ({ name: p.name, value: p.first?.aid || (p.attrType === 1 ? "100" : "") })),
      isDownloadRequest: 1, modelType: "step", productCode: sl.data.productCode, productCodeAccessId: sl.data.productCodeAccessId, productModel: sl.data.productModel,
    }))
    if (!rm?.data?.requestKey) { rec.err = "no requestKey"; return rec }
    let built = null
    for (let i = 0; i < 20; i++) {
      const st = JSON.parse(await get(`/api/faMall/threed/getStatus?requestKey=${rm.data.requestKey}&_t=${Date.now()}`))
      if (st.data?.built_file?.url) { built = st.data.built_file; break }
      if (st.data?.status === 2) { rec.err = "build failed"; break }
      await sleep(1500)
    }
    if (!built) { rec.err = rec.err || "no built_file"; return rec }
    const fileName = `${rec.productModel}(jlcfa).step`
    const dlUrl = `/api/faMall/threed/modelDownload?requestKey=${rm.data.requestKey}&url=${encodeURIComponent(built.url)}&fileName=${encodeURIComponent(fileName)}&fType=step&_t=${Date.now()}`
    const b64 = await evalv(`fetch(${JSON.stringify(dlUrl)},{credentials:'include'}).then(r=>r.arrayBuffer()).then(buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)})`, true)
    if (!b64) { rec.err = "download failed"; return rec }
    const safe = rec.productModel.replace(/[^\w.-]+/g, "_")
    const path = `${OUT_DIR}/${init.serialCode}-${safe}.step`
    fs.writeFileSync(path, Buffer.from(b64, "base64"))
    rec.file = path; rec.bytes = fs.statSync(path).size
  } catch (e) { rec.err = String(e).slice(0, 200) }
  return rec
}

let n = 0
for (const serial of serials) {
  n++
  if (done.has(serial)) { console.log(`[${n}/${serials.length}] skip ${serial}`); continue }
  const rec = await handle(serial)
  fs.appendFileSync(RESULT, JSON.stringify(rec) + "\n")
  console.log(`[${n}/${serials.length}] ${rec.serialCode || serial} → ${rec.productModel || "-"} ${rec.bytes ? rec.bytes + "B" : ""} ${rec.err || ""}`)
  await sleep(600)
}
console.log("DONE")
ws.close(); chrome.kill("SIGKILL")
