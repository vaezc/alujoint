# alujoint

# 铝构 · AluJoint

阶段性提交见 [docs/工作约定.md](docs/工作约定.md)，当前进度与交接见 [docs/交接进度.md](docs/交接进度.md)。

个人用的嘉立创铝型材研究页。目录包含手写样品、连接示意和批量抓取的代表型号。批量目录提供包围盒和网格数。这不是嘉立创的网站，也没有收录整本系列。装配位置是教学示意，不是官方套件。

## 运行

```bash
npm install
npm run dev
```

开发服务器监听 `41731`。生产构建：

```bash
npm run build
npm run preview
```

`main` 由 GitHub Actions 自动发布到 Cloudflare Pages 项目 `alujoint`。工作流按 `.node-version` 安装 Node，构建 `dist/`，启动生产预览并运行模型库和搭建指南两套浏览器检查，全部通过后再部署。每次发布结果见 [部署记录](https://github.com/vaezc/alujoint/actions/workflows/deploy-pages.yml)。

2026-11-25 核对了 `main` 提交 `876a7e0` 的发布，构建、两套浏览器检查和部署均通过。[GitHub Actions 记录](https://github.com/vaezc/alujoint/actions/runs/45522308552) · [Cloudflare Pages 站点](https://alujoint.pages.dev/)

## 网格

`public/models/` 里的厂商模型主要来自已下载的 STEP，用 cascadio 0.1.1 三角化后按 glTF 的米制写出。出处记在 `sources/`。自建的四孔板存为 `teaching-plate-45.glb`。

- `TXCJ.glb`：TXCJ-H6-2020-L100，单实体，100 × 20 × 20 mm。较小的那块网格是 Ø5 中心孔特征。
- `TYZC.glb`：下载名带 ZP-OB，文件内容是 TYZC-H6-206-2020-DZ 单体，32 × 32 × 19 mm，没有紧固件。再次下载的文件 SHA-256 相同，没有另存一只。
- `TPAA-D-6-M4.glb`、`TPAA-D-6-M5.glb`：镀锌碳钢 T 形螺母，外廓 10 × 4.5 × 6 mm。不是角座清单里的镀镍 TPAA-N。孔是简化圆柱。记录在 `sources/batch2/`。
- `TPDH.glb`：TPDH-206-T-ZP 装配。NAUO1 是本体，NAUO2–4 是三颗 EDLG-S1-M6-L12。合拢包围盒 31 × 31 × 31 mm。

角部连接的位置和爆炸方向写在 `src/data/joint.ts`。两根型材、H6 DZ 角座本体、`EDLA-S1-M4-L10` 螺钉、镀镍 `TPAA-N-6-M4` 螺母、平垫和弹垫沿安装方向分开。场景为教学组合，盖板尚无网格。镀锌 TPAA-D 和 M5 T 形螺栓作为独立条目展示。弹垫按网格显示为 0.9 mm 的平面开口环。

- `EDLA-S1-M4-L10.glb`：圆柱头 M4×10，网格 14 × 7 × 7 mm，轴沿文件 X。
- `EPDA-S1W-K-4.glb`：平垫 12 × 12 × 1 mm，孔轴沿文件 Z。
- `EPDB-S1W-B1-4.glb`：弹垫约 7.6 × 7.6 × 0.9 mm，平面开口环。
- `TPBT-G-M5-L10.glb`：T 形螺栓 10 × 13.2 × 6 mm。页面写欧标 20，没有单独确认槽系列 6。

## 页面上能做的事

左侧检索和筛选，点一条就按需载入对应 GLB。拖拽旋转，右键平移，滚轮缩放。取景和复位在视图下方，也可以按 `F` 和 `R`。`TPDH-206-T-ZP` 样品可以按 NAUO 点选，并用滑杆把三颗螺钉沿实例轴拉开。未配置零件实例的抓取条目支持整件点选。

连接方式目录包含 **12 种展示**。装配示意包括角码、端面 L 形（`TPDH-206-B-ZP`，两颗沉头螺钉）、内置端面贴侧面（TPDF）、角槽（TPDG）、槽内一字延长（TPLH）、自建 45° 外置教学板、三向端面立体角（TPDH-T）、135° 挤压角码（TPDC）、45° 型材连接板（`TPDD-206-2020A-ZP`）和三维连接件（TPDJ）。角码与自建教学板均用 `TPAA-N-6-M4`。面板角槽（TPCT）缺面板网格，弹性连接件（TPDS）适用 2020D/2020E，这两项当前为单件展示。

## 搭建指南与 V20 案例

搭建指南按横梁接立柱、型材接长、三向连接、安装板件和增加斜撑组织，共五个任务、13 条候选说明。角码、TPDH 端面 L 形、TPDF 内置端面贴侧面各有一套分步装配。V20 衣架案例提供结构、切料、板件、购物车、加工核对项和离线清单下载。[搭建指南](https://alujoint.pages.dev/guide) · [V20 衣架案例](https://alujoint.pages.dev/case/clothes-rack) · [八步 3D 装配](https://alujoint.pages.dev/guide/step/clothes-rack)

网页功能已交付并部署。指南有 9 条候选仍标「待核对」。V20 的配件、孔位及装配配合还需对照原稿、供方图和实物，整架承载、侧摆、抗倾覆和真人读者验收仍待完成。[实施报告](REPORT.md) · [交接进度](docs/交接进度.md)

## 目录与模型（2026-11-25）

- 枚举「铝型材及配件」的 108 个列表页，覆盖 12 个大类和 96 个子分类，得到 **407 个产品系列**（serial）。
- 407 个系列里 **407 个都有模型**。TDB21 的 STEP 始终不出 `built_file`，改用站点 STL 补齐。
- 转换：403 个 STEP 用 cascadio 0.1.1 转 GLB，另外 4 个（`LC-AEG15-5065-XL90`、`TDB127`、`TDB128`、`TDB21`）改用站点导出的 STL 转 GLB。
- `src/data/catalog.generated.json` 有 407 条。前端保留手写的 `TXCJ-H6-2020-L100`，去除同型号的抓取条目。目录共 **428 条**，由 406 条抓取条目、9 个手写样品、12 种连接展示和 1 套 V20 衣架组成。
- `public/models/` 共 **424 个 GLB**，合计约 38.8 MB。423 个带 `EXT_meshopt_compression`，`public/models/rack-inset-board.glb` 尚未做 meshopt 压缩。

### 下载 STEP 的接口链路

1. `POST /api/fa-platform/web/detail-page/selection/serial-lite`（带 `X-XSRF-TOKEN`，值取自 cookie）→ 返回 `productModel`、`productCodeAccessId`。
   - 选型规则：每个参数取首个可选值；型材多一个输入型 `L`（`paramRange`），统一取 `100`。
2. `POST /api/faMall/threed/requestModel`（`isDownloadRequest:1, modelType:"step"`）→ `requestKey`。
3. `GET /api/faMall/threed/getStatus?requestKey=` → `built_file.url`（Forface OSS 签名地址，需轮询到 `status:1`）。
4. `GET /api/faMall/threed/modelDownload?requestKey=&url=&fName=&fType=step` → STEP 文件。

`modelType` 也可以填 `stl` 或 `igs`，用于 STEP 请求不出文件、或 STEP 三角化崩溃/挂起的型号；STL 用 `scripts/pipeline/stl_to_glb.py` 转 GLB。

补充：产品页是 SSR + JS 反爬（curl 拿到的是加密挑战页，要用真浏览器渲染）；`/category/` 页是干净 SSR，可直接 curl（内含 JSON-LD 分类树）。

### 产物与中间数据

- `scripts/pipeline/`：管线脚本 —— `crawl_cats.py`（分类树）、`enum_all.mjs`（list 页翻页枚举 serial）、`batch_download.mjs` + `downloader_core.mjs`（登录态下载 STEP，页面内选参数）、`download_one.mjs`（单件下载）、`export_cookies.mjs`（从调试端口导出 cookie）、`batch_convert2.py` + `convert_one.py`（STEP→GLB，逐件子进程隔离崩溃）、`gen_catalog.py`（生成数据）、`requirements.txt`。
- `scripts/browser-smoke.mjs`：生产包/开发页的 Chrome 冒烟测试。Chrome 路径可用 `CHROME_PATH` 指定，未设置时依次找 Linux 与 macOS 的默认位置。
- `sources/pipeline/`：中间数据 —— `cat_tree.json`、`serials.jsonl`、`glb_meta.jsonl`、`all_ok.jsonl`、下载记录。
- `sources/raw/`：原始 STEP（约 218MB），已在 `.gitignore`，只留在本地。
- 登录 cookie 在 `~/.cache/alujoint-jlc/cookies.json`，不进仓库。

### 如何继续

1. 依赖：`python3.12 -m venv venv && venv/bin/pip install -r scripts/pipeline/requirements.txt`（cascadio 0.1.1 没有 CPython 3.14 的 wheel，本机用 3.12）。
2. 登录：用独立配置启动 Chrome，登录后导出 cookie：
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --remote-debugging-port=9237 \
     --user-data-dir="$HOME/.cache/alujoint-jlc/chrome-profile" \
     --no-first-run https://www.jlcfa.com/
   node scripts/pipeline/export_cookies.mjs 9237
   ```
   导出文件默认 `~/.cache/alujoint-jlc/cookies.json`，不进仓库。
3. 下载：`node scripts/pipeline/batch_download.mjs <outDir> <result.jsonl> <serial列表.txt>`。脚本会在页面里把每个参数的第一项选上（下拉用真实指针事件，单选用 click），再用当前选择调用 selection / requestModel / getStatus / modelDownload。单个下载用 `download_one.mjs <serial> [输出路径]`。Chrome 路径可用 `CHROME_PATH` 指定。
4. 转换：`venv/bin/python scripts/pipeline/batch_convert2.py <all_ok.jsonl> public/models sources/pipeline/glb_meta.jsonl`。进程非零退出但 GLB 可读时仍会收下，并在记录里写 `note`。
5. 生成：`python3 scripts/pipeline/gen_catalog.py`（默认读 `sources/pipeline/`，输出 `src/data/catalog.generated.json`；也可以传 `<中间数据目录> <输出文件>`）。
6. 压缩：`npm run compress:models`（meshopt，原地重写 `public/models/*.glb`；drei 自带解码器，前端不用改）。加 `--dry --limit N` 可先试跑。

### 已知问题 / 待办

- **4 个 STL 兜底**：XL90、TDB127、TDB128 的 STEP 在 cascadio 和 OCP 里都会挂住（最好一次跑了 15 分钟无输出）；TDB21 是 STEP 请求始终没有 `built_file`。四件都改用站点 STL，记录在 `glb_meta.jsonl` 的 `note` 里。STL 没有 STEP 的装配层级。
- **抓取目录**提供包围盒和网格数，尚未逐件对照官方图档。
- **压缩**可用 `npm run compress:models` 重跑。drei 自带 meshopt 解码器。
- **爆炸视图**：TPDH、TPDF、TPDG 和 TPLH 按 GLB 的零件实例分解。已记录方向的套件在 `src/data/connections.ts` 中配置，其余批量模型以原始姿态展示。TPDF 场景保留预装间隙，所需的型材加工尚未建模。

### 注意

- 抓取依赖登录态，且站点 `robots.txt` 禁 `/api/` 和 `?` 参数；仅个人研究用途。cookie 是敏感凭据，不提交、不外传。
- 仓库提交与发布约定见 [工作约定](docs/工作约定.md)。
