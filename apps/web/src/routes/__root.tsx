import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: '玄机 XuanJi · 个人命理工作台',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        <header className="site-header">
          <Link className="brand" to="/">
            <b>玄机</b>
            <span>XuanJi</span>
          </Link>
          <nav aria-label="主导航">
            <Link to="/" activeOptions={{ exact: true }}>
              工作台
            </Link>
            <Link to="/profiles">档案</Link>
            <Link to="/history">历史</Link>
            <Link to="/methodology">方法</Link>
          </nav>
          <Link className="header-action" to="/profiles/new">
            新建命盘
          </Link>
        </header>
        <main>{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
