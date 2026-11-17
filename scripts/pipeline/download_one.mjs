import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { connect, downloadSerial, launchChrome, resolveChrome, setCookies } from "./downloader_core.mjs"

const chromePath = resolveChrome()
if (!chromePath) {
  console.error("找不到 Chrome。用 CHROME_PATH 指定可执行文件路径。")
  process.exit(1)
}

const serial = process.argv[2]
const outPath = process.argv[3]
const modelType = process.argv[4] || process.env.ALUJOINT_MODEL_TYPE || "step"
if (!serial) {
  console.error("用法：node download_one.mjs <serial> [输出 STEP 路径]")
  process.exit(1)
}

const cookieFile = process.env.ALUJOINT_COOKIES || path.join(os.homedir(), ".cache/alujoint-jlc/cookies.json")
const cookies = JSON.parse(fs.readFileSync(cookieFile, "utf8"))
const outDir = outPath ? path.dirname(outPath) : path.join(process.cwd(), "sources/raw")
const profile = path.join(os.homedir(), ".cache/alujoint-jlc/chrome-download-one")

const { chrome, page } = await launchChrome({ chromePath, port: 9233, profile })
const session = await connect(page)
await setCookies(session, cookies)
try {
  const rec = await downloadSerial(session, serial, outDir, { modelType })
  console.log(JSON.stringify(rec))
  if (rec.file && outPath) {
    fs.copyFileSync(rec.file, outPath)
    console.log("SAVED", outPath, fs.statSync(outPath).size, "bytes")
  }
  if (rec.err) process.exitCode = 1
} finally {
  session.ws.close()
  if (chrome) chrome.kill("SIGKILL")
}
