import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { App } from "./App"
import { Guide } from "./routes/Guide"
import { GuideTask } from "./routes/GuideTask"
import { Case } from "./routes/Case"
import { Assemble } from "./routes/Assemble"
import "./index.css"

const root = document.getElementById("root")
if (!root) throw new Error("缺少 #root")

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/guide/:task" element={<GuideTask />} />
        <Route path="/guide/step/:joint" element={<Assemble />} />
        <Route path="/case/:id" element={<Case />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
