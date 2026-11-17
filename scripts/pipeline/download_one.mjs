import { spawn } from "node:child_process"
import fs from "node:fs"
const CHROME = process.env.HOME + "/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome"
const PORT = 9233
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const serialId = process.argv[2]
const outPath = process.argv[3]

const cookies = JSON.parse(fs.readFileSync(process.env.HOME + "/.cache/alujoint-jlc/cookies.json", "utf8"))
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--user-data-dir=/tmp/chrome-dl", "--no-first-run", "--no-sandbox", "--window-size=1440,900", "about:blank"], { stdio: "ignore" })
let page
for (let i = 0; i < 80; i++) { try { const d = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); page = d.find((x) => x.type === "page" && x.webSocketDebuggerUrl); if (page) break } catch {} await sleep(250) }
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const evalv = async (x, awaitPromise = false) => { const m = await send("Runtime.evaluate", { returnByValue: true, awaitPromise, expression: x }); if (m.result?.exceptionDetails) console.error("EXC", JSON.stringify(m.result.exceptionDetails).slice(0, 200)); return m.result?.result?.value }
await new Promise((r) => (ws.onopen = r))
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable")

for (const c of cookies) {
  await send("Network.setCookie", { name: c.name, value: c.value, domain: c.domain, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite })
}
await send("Page.navigate", { url: `https://www.jlcfa.com/serial/${serialId}.html` })
await sleep(9000)

const init = await evalv(`(()=>{
  function findStore(){for(const el of document.querySelectorAll('*')){const fk=Object.keys(el).find(k=>k.startsWith('__reactFiber'));if(!fk)continue;let f=el[fk],g=0;while(f&&g++<900){const v=f.memoizedProps&&f.memoizedProps.value;if(v&&typeof v.getState==='function')return v;f=f.return}}return null}
  const s=findStore();if(!s)return {err:'no store'};
  const st=s.getState();const sd=st.selectionData||{},sdata=st.serialData||{};
  if(!sd.serialAccessId)return {err:'not ready'};
  return {serialCode:sdata.serialCode,serialName:sdata.serialName,serialBizKey:sdata.serialBizKey,belongCategoryCode:sdata.belongCategoryCode,serialAccessId:sd.serialAccessId,
    productCodeList:(sd.productCodeList||[]).map(x=>({v:x.value,aid:x.valueAccessId})),
    params:(sd.paramSelectionList||[]).map(p=>({name:p.paramName,aid:p.paramAccessId,attrType:p.paramAttributeType,vals:(p.paramValueInfoList||[]).map(v=>({v:v.value,aid:v.valueAccessId}))}))};
})()`)
console.log("init:", JSON.stringify(init).slice(0, 600))
if (!init || init.err) { ws.close(); chrome.kill("SIGKILL"); process.exit(1) }

// 构造选型 payload（代表型号：productCode 首个 + 每参数首个值）
const slBody = {
  serialBizKey: init.serialBizKey,
  serialCode: init.serialCode,
  productCode: init.productCodeList[0]?.aid || "",
  paramSelectionList: await evalv(`(()=>{
    function findStore(){for(const el of document.querySelectorAll('*')){const fk=Object.keys(el).find(k=>k.startsWith('__reactFiber'));if(!fk)continue;let f=el[fk],g=0;while(f&&g++<900){const v=f.memoizedProps&&f.memoizedProps.value;if(v&&typeof v.getState==='function')return v;f=f.return}}return null}
    const sd=findStore().getState().selectionData;
    return (sd.paramSelectionList||[]).map(pp=>{const f=(pp.paramValueInfoList||[])[0]||{};const val=f.valueAccessId||(pp.paramRange?"100":"");return Object.assign({},pp,{singleParamValue:val,selected:true})});
  })()`),
}
const xsrfExpr = `(()=>{const t=document.cookie.split('; ').find(x=>x.startsWith('XSRF-TOKEN='));return t?decodeURIComponent(t.split('=')[1]):''})()`
const xsrf = await evalv(xsrfExpr)
const post = async (url, body) => evalv(`fetch(${JSON.stringify(url)},{method:'POST',headers:{'Content-Type':'application/json','X-XSRF-TOKEN':${JSON.stringify(xsrf)}},credentials:'include',body:JSON.stringify(${JSON.stringify(body)})}).then(r=>r.text())`, true)
const get = async (url) => evalv(`fetch(${JSON.stringify(url)},{credentials:'include'}).then(r=>r.text())`, true)

const slRaw = await post("/api/fa-platform/web/detail-page/selection/serial-lite", slBody)
const sl = JSON.parse(slRaw)
console.log("serial-lite:", sl.success, "productModel=", sl.data?.productModel, "pcAid=", sl.data?.productCodeAccessId)
const productModel = sl.data.productModel
const productCodeAccessId = sl.data.productCodeAccessId
const productCode = sl.data.productCode

const rmBody = {
  attrInfo: init.params.map((p) => ({ name: p.name, value: (p.vals[0] && p.vals[0].aid) || (p.attrType===1 ? "100" : "") })),
  isDownloadRequest: 1, modelType: "step", productCode, productCodeAccessId, productModel,
}
const rm = JSON.parse(await post("/api/faMall/threed/requestModel", rmBody))
console.log("requestModel:", JSON.stringify(rm.data))
const requestKey = rm.data.requestKey
let built = null
for (let i = 0; i < 20; i++) {
  const st = JSON.parse(await get(`/api/faMall/threed/getStatus?requestKey=${requestKey}&_t=${Date.now()}`))
  const d = st.data
  if (d?.built_file?.url) { built = d.built_file; break }
  if (d?.status === 2) { console.log("build failed", JSON.stringify(d).slice(0, 200)); break }
  await sleep(1500)
}
if (!built) { console.log("no built_file"); ws.close(); chrome.kill("SIGKILL"); process.exit(1) }
const fileName = `${productModel}(jlcfa).step`
const dlUrl = `/api/faMall/threed/modelDownload?requestKey=${requestKey}&url=${encodeURIComponent(built.url)}&fileName=${encodeURIComponent(fileName)}&fType=step&_t=${Date.now()}`
const b64 = await evalv(`fetch(${JSON.stringify(dlUrl)},{credentials:'include'}).then(r=>r.arrayBuffer()).then(buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)})`, true)
if (!b64) { console.log("download failed"); ws.close(); chrome.kill("SIGKILL"); process.exit(1) }
fs.mkdirSync(outPath.substring(0, outPath.lastIndexOf("/")), { recursive: true })
fs.writeFileSync(outPath, Buffer.from(b64, "base64"))
console.log("SAVED", outPath, fs.statSync(outPath).size, "bytes |", productModel)
ws.close(); chrome.kill("SIGKILL")
