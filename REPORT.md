# AluJoint 搭建指南第一版 · 实施报告

收敛：P1/P2 返修已落地，自动化检查通过；**独立读者验收未做**，复制为「待做」标明。

## 审查返修对照（docs/assembly-guide-review.md）

| 编号 | 返修项 | 状态 | 证据 |
| --- | --- | --- | --- |
| P1-1 | 指南首页加 V20 案例入口；连接卡片加分步入口；案例可返回 | 完成 | `src/routes/Guide.tsx` `guide-case`；`GuideTask.tsx` 分步按钮；`Case.tsx` 返回 |
| P1-2 | 用角码（scene-corner）做分步，TPDF 加入「横梁接立柱」 | 完成 | `src/data/guide.ts` `beam-to-post` 加 `scene-side-tee`；`assembleSteps.corner`；`Assemble` 支持 `corner` |
| P1-3 | 核正 TPDF 加工杆件，缺依据标待核对 | 完成 | `connections.ts` side-tee `summary`/`machining`；`guide.ts` TPDF 加工字段均标「待核对」 |
| P2-4 | 3D 同步当前步骤、多件高亮、中文名、取景/爆炸控件、切示例回第一步 | 完成 | `Viewport` 支持 `Selection[]`；`Assemble.tsx` 多高亮 + `step-controls` + `key` 重建 |
| P2-5 | 五项购物车与套内材料拆开 | 完成 | `Case.tsx` 购物车 5 项 + 套装内明细 |
| P2-6 | 底板链接到板托实际装法 | 完成 | `Case.tsx`「底板与板托」区块 + `#bottom` 链接 |
| P2-7 | 任务定位小图；来源标签区分厂家/自建 | 部分完成 | 来源标签已区分（`drawingLabel`，自建板标「自建参考」）；定位小图未做 |
| 复验 | build/lint/smoke、窄屏、更新报告 | 部分完成 | 见下；独立读者验收与完整点击回归未做 |

## 原验收标准

| 条目 | 状态 | 证据 |
| --- | --- | --- |
| 桌面/移动端可找到指南 | 完成 | 顶栏导航；390px 截图 |
| 指南/案例直达、刷新、返回 | 完成 | 路由 `/guide`、`/case/:id`、`/?sample=` |
| 五任务进入有效内容 | 完成 | `GuideTask` |
| 角码与内置展示加工/先后/工具入口 | 完成 | `GuideTask` 字段；`Assemble` 步骤 |
| 两个分步示例前后切换、高亮同步 | 完成 | `Assemble` 多高亮 + 越界保护 |
| 切回模型库后爆炸/复位/搜索可用 | 完成 | `smoke` 覆盖模型库 |
| V20 案例可查到切料/板件/采购/加工/流程 | 完成 | `Case.tsx` |
| 短梁/底板可跳对应说明 | 完成 | `Case` 顶部链接 + `#bottom` |
| build/lint/smoke | 完成 | 见下 |

## 实跑结果

- `npm run build`：通过。
- `npm run lint`：仅 `Viewport.tsx:111` 1 条历史 react warning（与审查基点一致），无新增。
- `npm run smoke`：`SMOKE_OK`。
- 截图：`/tmp/opencode/r-{guide,task,step-corner,case}.png`；窄屏 `guide390.png`、`step390.png`、`case390.png`。

## 任务范围外改动

- 引入 `react-router-dom@7`；`src/main.tsx` 改 `BrowserRouter`。
- 新增 `src/components/SiteHeader.tsx`、`src/routes/{Guide,GuideTask,Assemble,Case}.tsx`、`src/data/guide.ts`。
- `Viewport` 的 `selection` 扩展为 `Selection | Selection[] | null`（模型库单选保持兼容）。
- `index.css` 追加导航、指南、案例、分步样式。
- 保留并修正工作区原有的 `src/data/connections.ts`（TPDF/TPDJ/TPDC 位置；TPDF 加工杆件说明）。

## 未完成 / 阻塞

- **任务定位小图**（P2-7）：没有现成缩略图资源，未做。
- **独立读者验收**：尚未请未参与设计的读者只看站点复述采购/加工/先装件/检查项。
- **TPDF 加工杆件**：按官方图改为「接收型材侧面孔 + 支接型材槽内螺母」，孔径/孔深仍待实物或图档核对。
- 完整点击流（指南→角码/TPDF 步骤→案例→返回模型库）未做自动化回归，仅逐页截图核对。
