import { Link } from "react-router-dom"

type SiteHeaderProps = {
  active: "library" | "guide"
}

/** 指南 / 案例页共用的顶栏。模型库直接用自己的工作台顶栏。 */
export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className="app-header">
      <Link className="brand" to="/" aria-label="回到模型库">
        <span className="brand-mark" aria-hidden="true" />
        <h1>铝构 <span>AluJoint</span></h1>
      </Link>
      <nav className="site-nav" aria-label="主导航">
        <Link to="/" aria-current={active === "library" ? "page" : undefined}>模型库</Link>
        <Link to="/guide" aria-current={active === "guide" ? "page" : undefined}>搭建指南</Link>
      </nav>
    </header>
  )
}
