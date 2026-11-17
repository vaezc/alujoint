# alujoint

# 铝构 · AluJoint

阶段性提交见 [docs/工作约定.md](docs/工作约定.md)。

个人用的欧标 20 铝型材研究页。目录里是已经转换的样品，外加一组角部连接。这不是嘉立创的网站，也没有收录整本系列。装配位置是教学示意，不是官方套件。

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

`npm run build` 先跑 `tsc -b`，再把静态文件写到 `dist/`。托管时构建命令用 `npm run build`，发布目录用 `dist`。当前没有接 Vercel，这份仓库本身不上线。

## 网格

`public/models/` 里的 GLB 来自已经下载的 STEP，用 cascadio 0.1.1 三角化后按 glTF 的米制写出。出处记在 `sources/`。

- `TXCJ.glb`：TXCJ-H6-2020-L100，单实体，100 × 20 × 20 mm。较小的那块网格是 Ø5 中心孔特征。
- `TYZC.glb`：下载名带 ZP-OB，文件内容是 TYZC-H6-206-2020-DZ 单体，32 × 32 × 19 mm，没有紧固件。再次下载的文件 SHA-256 相同，没有另存一只。
- `TPAA-D-6-M4.glb`、`TPAA-D-6-M5.glb`：镀锌碳钢 T 形螺母，外廓 10 × 4.5 × 6 mm。不是角座清单里的镀镍 TPAA-N。孔是简化圆柱。记录在 `sources/batch2/`。
- `TPDH.glb`：TPDH-206-T-ZP 装配。NAUO1 是本体，NAUO2–4 是三颗 EDLG-S1-M6-L12。合拢包围盒 31 × 31 × 31 mm。

角部连接的位置和爆炸方向写在 `src/data/joint.ts`。两根型材、H6 角座、EDLA、镀锌 TPAA-D、平垫和弹垫靠在角上，沿安装方向分开。这不是 ZP 清单：螺母不是镀镍 N，螺钉不是图上的 EDLG，角座不是 X6 带盖。盖板没有网格。M5 的 T 形螺栓单独在目录里。弹垫按网格显示为 0.9 mm 的平面开口环。

- `EDLA-S1-M4-L10.glb`：圆柱头 M4×10，网格 14 × 7 × 7 mm，轴沿文件 X。
- `EPDA-S1W-K-4.glb`：平垫 12 × 12 × 1 mm，孔轴沿文件 Z。
- `EPDB-S1W-B1-4.glb`：弹垫约 7.6 × 7.6 × 0.9 mm，平面开口环。
- `TPBT-G-M5-L10.glb`：T 形螺栓 10 × 13.2 × 6 mm。页面写欧标 20，没有单独确认槽系列 6。

## 页面上能做的事

左侧检索和筛选，点一条就载入视图。拖拽旋转，右键平移，滚轮缩放。取景和复位在视图下方，也可以按 `F` 和 `R`。端面连接件可以按 NAUO 点选，并用滑杆把三颗螺钉沿实例轴拉开。

## 当前进度与交接（2026-11-17）

目标：把嘉立创欧标铝型材全系列的型材与连接件做成 3D 可视化目录。这一步做的是「抓取 → STEP → GLB → 数据」管线，前端尚未接入。

### 已完成

- 枚举「铝型材及配件」12 大类 / 108 子分类，得到 **407 个产品系列**（serial）。
- 用登录态走官方接口下载 STEP：**363 个成功**（44 个失败，约 11%）。
- cascadio 0.1.1 转 GLB：**362 个成功**（1 个 C++ `double free` 崩溃），共约 **98MB**，在 `public/models/`。
- 生成 `public/data/catalog.generated.json`（362 条，含分类 / 型号 / 包围盒 / 网格数）。

### 下载 STEP 的接口链路

1. `POST /api/fa-platform/web/detail-page/selection/serial-lite`（带 `X-XSRF-TOKEN`，值取自 cookie）→ 返回 `productModel`、`productCodeAccessId`。
   - 选型规则：每个参数取首个可选值；型材多一个输入型 `L`（`paramRange`），统一取 `100`。
2. `POST /api/faMall/threed/requestModel`（`isDownloadRequest:1, modelType:"step"`）→ `requestKey`。
3. `GET /api/faMall/threed/getStatus?requestKey=` → `built_file.url`（Forface OSS 签名地址，需轮询到 `status:1`）。
4. `GET /api/faMall/threed/modelDownload?requestKey=&url=&fName=&fType=step` → STEP 文件。

补充：产品页是 SSR + JS 反爬（curl 拿到的是加密挑战页，要用真浏览器渲染）；`/category/` 页是干净 SSR，可直接 curl（内含 JSON-LD 分类树）。

### 产物与中间数据

- `scripts/pipeline/`：管线脚本 —— `crawl_cats.py`（分类树）、`enum_all.mjs`（list 页翻页枚举 serial）、`batch_download.mjs`（下载 STEP）、`batch_convert2.py` + `convert_one.py`（STEP→GLB，逐件子进程隔离崩溃）、`gen_catalog.py`（生成数据）、`requirements.txt`。
- `sources/pipeline/`：中间数据 —— `cat_tree.json`、`serials.jsonl`、`glb_meta.jsonl`、`all_ok.jsonl`、下载记录。
- `sources/raw/`：原始 STEP（约 218MB），已在 `.gitignore`，只留在本地。
- 登录 cookie 在 `~/.cache/alujoint-jlc/cookies.json`，不进仓库。

### 如何继续

1. 依赖：`python3 -m venv venv && venv/bin/pip install -r scripts/pipeline/requirements.txt`。
2. 下载：先启动带登录态的 Chrome 并导出 cookie 到上述路径，再 `node scripts/pipeline/batch_download.mjs <outDir> <result.jsonl> <serial列表.txt> <port> <profile>`。脚本里部分路径是当时写死的，按需改。
3. 转换：`venv/bin/python scripts/pipeline/batch_convert2.py <all_ok.jsonl> public/models sources/pipeline/glb_meta.jsonl`。
4. 生成：`python3 scripts/pipeline/gen_catalog.py`（输出 `public/data/catalog.generated.json`）。

### 已知问题 / 待办

- **44 个下载失败**：多为 `no built_file`（getStatus 30 秒内没出结果，可加长轮询）和 `no productModel`（TDB / TYZ 等系列选型规则不同）。清单在 `sources/pipeline/`。
- **1 个转换崩溃**：`LC-AEG15-5065-XL90`（cascadio `double free`，需换网格参数或换工具）。
- **前端未接入**：`App` / `CatalogList` / `Viewport` 仍只读手写 `samples`；`Viewport` 预加载了 9 个固定 GLB，需改成按需加载任意 GLB。
- **98MB 未压缩**：上线前建议 Draco / meshopt 压缩。
- **爆炸方向（第 2 条）未做**：计划读 GLB 节点层级自动推导 `explodeMm`。

### 注意

- 抓取依赖登录态，且站点 `robots.txt` 禁 `/api/` 和 `?` 参数；仅个人研究用途。cookie 是敏感凭据，不提交、不外传。
- 按 `docs/工作约定.md`：只推 `github.com/vaezc/alujoint`，不 force-push。本次仅本地提交，未推送。
