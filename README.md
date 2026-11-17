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
