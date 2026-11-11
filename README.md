# Yank's Blog

直接沿用 Swarm 模板的画布、标尺、网格、Inter / JetBrains Mono 字体、黑色按钮和协作光标构建引擎，只替换页面内容、链接和头像。

## 页面

- `index.html`：个人主页、最近文章、作者与项目入口。
- `posts.html`：全部文章归档。
- `posts/post1.html`、`posts/post2.html` 与 `posts/post4.html`：保留完整原文的文章页。
- `posts/template.html`：相同版式的文章模板。
- `about.html`：个人介绍、最新头像、技术栈、状态、碎碎念与联系信息。
- `project.html`：两个已公开项目与待定项目。
- `links.html`：三个友链及原链接。

## 预览

在这个目录执行：

```sh
node scripts/serve.mjs
```

打开 `http://localhost:5173/`。如果该端口已占用，可以设置 `PORT` 后启动。全部页面、字体、头像都在本目录内，可以将此目录直接作为静态站点部署；不需要父目录资源或安装依赖。

## 编辑内容与页面

`content/articles.json` 保存三篇文章的完整正文、标题、日期和摘要。修改后运行：

```sh
node scripts/build.mjs
```

该脚本生成五个内容主页面、文章页和模板。共享导航、页脚及主页面内容在 `scripts/build.mjs` 中。生成后的 HTML 本身就是完整静态页面，也可以直接编辑；再次运行生成器会使用生成器与内容文件的版本覆盖 HTML。

## 样式入口

重建页面统一加载 `css/site.css`，按 CSS layer 引入：

| 文件 | 用途 |
| --- | --- |
| `tokens.css` | 全站颜色、字体、尺寸、间距与层级 |
| `base.css` | 基础排版、焦点与通用文字类 |
| `layout.css` | 版心、栅格与自然流布局 |
| `components.css` | 按钮、卡片、代码块、表单等通用组件 |
| `motion.css` | 可选的通用入场样式 |
| `swarm-scene.css` | 直接来自 Swarm 模板的画布、协作光标、标尺、选框与构建视觉层 |
| `blog-scene.css` | 博客内容接入、无脚本回退和移动端外壳 |

新博客页面加载模板引擎 `js/swarm/app.js`，不加载旧播放器、主题、统计或 SPA 导航脚本。

## 构建视觉层

博客页面加载模板引擎 `js/swarm/app.js`，其原始协作逻辑保存在 `vendor/swarm-template.js`；`js/swarm/blog-scene.js` 只负责把博客内容映射到模板的 path、rect、text、guide 和 duplicate 任务记录。

- 模板原生任务包括路径绘制、矩形拉伸、文字逐字输入、选框、标尺、吸附参考线和复制组件。
- 首页和内页都由同一套 18 个协作光标完成，滚动后继续施工；移动端按模板画布缩放，不重新套一套卡片动画。
- “跳过动画”或 Esc 立即显示全部内容。
- “跳过动画”或 Esc 立即显示全部内容。
- 系统选择减少动态效果时直接显示页面。
- 禁用 JavaScript 时文章、导航与链接仍可访问。
- 视觉任务结束后停止动画帧并移除浮层。

后续新增页面复用 `site-shell`、`blog-header`、`blog-footer` 和共享 CSS 即可。新博客目前未接入主题切换、访问统计或新的业务交互。

