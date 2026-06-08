# Yank's Blog

> 一个从零手写的纯静态个人博客，深色科技风，轻量可控。

GitHub Pages 只需要仓库里有 `index.html`，所以直接用 HTML、CSS 和原生 JavaScript 维护，没有复杂框架。

## 📁 目录结构（更新不一定同步）

```text 
.
├── index.html              # 首页
├── posts.html              # 文章列表页
├── about.html              # 关于页
├── project.html            # 项目展示页
├── links.html              # 友人帐/友链页
├── posts/                  # 文章文件夹
├── css/
│   └── style.css           # 全站样式
├── js/
│   ├── GETBACK.js          # 标题切换
│   └── murmur.js           # 碎碎念展示
├── assets/
│   └── profile.jpg         # 头像
├── .gitignore
└── README.md
```

### 🚀 推送到 GitHub Pages

更新博客：

```bash
git add .
git commit -m "Update blog"
git push
```