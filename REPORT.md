# AluJoint 搭建指南第一版 · 实施报告

收敛：P1/P2 返修、定位小图、完整点击流回归、独立读者验收均已完成；加工参数与量化标准按项目边界保留「待核对 / 待实测」。

## 审查返修对照（docs/assembly-guide-review.md）

| 编号 | 返修项 | 状态 | 证据 |
| --- | --- | --- | --- |
| P1-1 | 指南首页加 V20 案例入口；连接卡片加分步入口；案例可返回 | 完成 | `src/routes/Guide.tsx` `guide-case`；`GuideTask.tsx` 分步按钮；`Case.tsx` 返回 |
| P1-2 | 用角码（scene-corner）做分步，TPDF 加入「横梁接立柱」 | 完成 | `guide.ts` `beam-to-post` 含 `scene-side-tee`；`assembleSteps.corner`；`Assemble` 支持 `corner` |
| P1-3 | 核正 TPDF 加工杆件，缺依据标待核对 | 完成 | `connections.ts` side-tee `summary`/`machining`；`guide.ts` TPDF 字段 |
| P2-4 | 3D 同步步骤、多件高亮、中文名、取景/爆炸控件、切示例回第一步 | 完成 | `Viewport` 支持 `Selection[]`；`Assemble.tsx` `step-controls` + `key` 重建 |
| P2-5 | 五项购物车与套内材料拆开 | 完成 | `Case.tsx` 购物车 5 项（购/装）+ 套装内明细 |
| P2-6 | 底板链接到板托实际装法 | 完成 | `Case.tsx`「底板与板托」区块 + `#bottom` |
| P2-7 | 任务定位小图；来源标签区分厂家/自建 | 完成 | `public/guide/*.png` 5 张缩略图 + `Guide.tsx` 卡片；`drawingLabel` 区分自建参考 |
| 复验 | build/lint/smoke、窄屏、点击流回归、报告 | 完成 | `scripts/guide-smoke.mjs`、窄屏截图、本报告 |

## 原验收标准

| 条目 | 状态 | 证据 |
| --- | --- | --- |
| 桌面/移动端可找到指南 | 完成 | 顶栏导航；390px 截图 |
| 指南/案例直达、刷新、返回 | 完成 | 路由 + `public/_redirects`（SPA 回退）；`guide-smoke` 刷新用例 |
| 五任务进入有效内容 | 完成 | `GuideTask` |
| 角码与内置展示加工/先后/工具入口 | 完成 | `GuideTask` 字段；`Assemble` 步骤 |
| 两个分步示例前后切换、高亮同步 | 完成 | `Assemble` 多高亮；`guide-smoke` 切步用例 |
| 切回模型库后爆炸/复位/搜索可用 | 完成 | `smoke` 覆盖模型库 |
| V20 案例可查到切料/板件/采购/加工/流程 | 完成 | `Case.tsx` |
| 短梁/底板可跳对应说明 | 完成 | `Case` 顶部链接 + `#bottom` |

## 实跑结果

- `npm run build`：通过。
- `npm run lint`：仅 `Viewport.tsx:111` 1 条历史 react warning，无新增。
- `npm run smoke`：`SMOKE_OK`（模型库/爆炸/取景/12 连接/移动端）。
- `npm run smoke:guide`：`GUIDE_SMOKE_OK`，覆盖：指南 5 任务 + 案例入口、任务候选与分步入口、分步切换、案例 7 步与底板区块、模型库 3D 加载、分步页刷新保留、390px 无横向溢出。
- 截图：`/tmp/opencode/r-{guide,task,step-corner,case}.png`、`r-guide-thumb.png`；窄屏 `guide390.png`、`step390.png`、`case390.png`。

## 独立读者验收（2026-11-19）

方法：把指南 / 分步 / 案例页的可见文本交给**未参与设计的 AI（agy）**，要求只依据文字回答四个问题。

- **能答出**：V20 单买五项（套装、光轴、支座、M4 螺钉购 100 装 4、T 螺母购 20 装 4）；装配先后（脚杯→角码预紧→调平→板托→落板→光轴穿支座→锁底脚→居中锁夹紧→最后顶板）；检查六项（垂直方正、底板四角干涉、光轴居中余量、T 螺母横跨槽肩、底脚贴实、螺钉未顶槽底、侧摆、倾覆）。
- **答不出 / 不确定**：各连接加工孔径孔深（已标待核对）、M6 孔位与深度、T 螺母能否后装（已补说明并标待核对）、盖板托装法（已补并标待核对）、无量化合格标准、承重未实测。
- **结论**：「买什么 / 先装什么 / 怎么查」基本可读；加工参数与量化标准仍属项目边界外的待核项，已在页面明示。

## 任务范围外改动

- 引入 `react-router-dom@7`；`main.tsx` 改 `BrowserRouter`；`public/_redirects` 提供 SPA 回退。
- 新增 `SiteHeader.tsx`、`routes/{Guide,GuideTask,Assemble,Case}.tsx`、`data/guide.ts`、`scripts/guide-smoke.mjs`、`public/guide/*.png`。
- `Viewport` 的 `selection` 扩展为 `Selection | Selection[] | null`（模型库单选兼容）。
- 保留并修正 `connections.ts`（TPDF/TPDJ/TPDC 位置；TPDF 加工杆件说明）。

## 未完成 / 阻塞

- **量化验收标准**（垂直度、侧摆阈值、承载力）：项目边界外，需实测或标准来源。
- **加工孔径/孔深、M6 孔位**：需按官方图档或实物核对，页面已标「待核对」。
- **独立读者验收是 AI 模拟**，非真人读者；真人验收仍建议上线前做一次。
