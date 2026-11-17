import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { connect, downloadSerial, launchChrome, resolveChrome, setCookies } from "./downloader_core.mjs"

const ROOT = path.resolve(import.meta.dirname, "../..")
const chromePath = resolveChrome()
if (!chromePath) {
  console.error("找不到 Chrome。用 CHROME_PATH 指定可执行文件路径。")
  process.exit(1)
}

const OUT_DIR = process.argv[2] || path.join(ROOT, "sources/raw")
const RESULT = process.argv[3] || path.join(ROOT, "sources/pipeline/downloaded.rerun.jsonl")
const SERIALS_FILE = process.argv[4] || path.join(ROOT, "sources/pipeline/serials.jsonl")
const PORT = Number(process.argv[5] || 9238)
const PROFILE = process.argv[6] || path.join(os.homedir(), ".cache/alujoint-jlc/chrome-download")

const cookieFile = process.env.ALUJOINT_COOKIES || path.join(os.homedir(), ".cache/alujoint-jlc/cookies.json")
if (!fs.existsSync(cookieFile)) {
  console.error(`没有 cookie 文件：${cookieFile}。先登录并导出 cookie。`)
  process.exit(1)
}
const cookies = JSON.parse(fs.readFileSync(cookieFile, "utf8"))

const serials = SERIALS_FILE.endsWith(".txt")
  ? fs.readFileSync(SERIALS_FILE, "utf8").trim().split("\n").filter(Boolean)
  : [
      ...new Set(
        fs
          .readFileSync(SERIALS_FILE, "utf8")
          .trim()
          .split("\n")
          .flatMap((line) => {
            try {
              return JSON.parse(line).serials || []
            } catch {
              return []
            }
          }),
      ),
    ]
console.log("total serials:", serials.length)

const done = new Set()
if (fs.existsSync(RESULT)) {
  for (const line of fs.readFileSync(RESULT, "utf8").split("\n")) {
    try {
      const rec = JSON.parse(line)
      if (rec.file) done.add(rec.serial)
    } catch {}
  }
}
console.log("already done:", done.size)
fs.mkdirSync(path.dirname(RESULT), { recursive: true })

const { chrome, page } = await launchChrome({ chromePath, port: PORT, profile: PROFILE })
const session = await connect(page)
await setCookies(session, cookies)

try {
  let index = 0
  for (const serial of serials) {
    index += 1
    if (done.has(serial)) {
      console.log(`[${index}/${serials.length}] skip ${serial}`)
      continue
    }
    const rec = await downloadSerial(session, serial, OUT_DIR)
    fs.appendFileSync(RESULT, JSON.stringify(rec) + "\n")
    console.log(
      `[${index}/${serials.length}] ${rec.serialCode || serial} → ${rec.productModel || "-"} ${rec.bytes ? rec.bytes + "B" : ""} ${rec.err || ""} ${(rec.choices || []).join(",")}`,
    )
    await new Promise((resolve) => setTimeout(resolve, 600))
  }
  console.log("DONE")
} finally {
  session.ws.close()
  if (chrome) chrome.kill("SIGKILL")
}
