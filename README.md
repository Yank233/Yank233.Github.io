# Yank's Blog

这是一个不依赖 Hexo 的纯静态个人博客。GitHub Pages 只需要仓库里有 `index.html`，所以这里直接用 HTML、CSS 和少量可选 JavaScript 维护。

## 目录说明

```text
.
├─ index.html              # 首页
├─ posts.html              # 文章列表页
├─ about.html              # 关于页
├─ posts/
│  └─ first-post.html      # 示例文章
├─ css/
│  └─ style.css            # 全站样式
├─ js/                     # 以后放交互脚本
├─ assets/                 # 图片、头像、图标等资源
└─ .gitignore
```

## 平时改哪里

- 改首页内容：编辑 `index.html`
- 改文章列表：编辑 `posts.html`
- 改关于页：编辑 `about.html`
- 改文章正文：编辑 `posts/*.html`
- 改颜色、字体、布局：编辑 `css/style.css`
- 放图片/头像：放进 `assets/`，然后在 HTML 里引用，例如 `<img src="assets/avatar.png" alt="头像">`

## 新增一篇文章

1. 复制 `posts/first-post.html`，改名，例如 `posts/my-new-post.html`
2. 修改新文件里的：
   - `<title>`
   - `meta description`
   - 日期
   - `<h1>` 标题
   - 正文内容
3. 在 `posts.html` 里复制一块 `.post-card`，把链接改成新文章地址
4. 如果希望首页也展示，在 `index.html` 的“最近文章”区域也加一块 `.post-card`

## 添加评论系统

推荐用 Giscus：它基于 GitHub Discussions，适合 GitHub Pages 静态站。

大致步骤：

1. 确认你的博客仓库是公开仓库
2. 在 GitHub 仓库开启 Discussions
3. 安装/授权 Giscus GitHub App
4. 打开 https://giscus.app/ 生成脚本
5. 把生成的 `<script>` 粘贴到文章页的这个位置：

```html
<section class="comments-placeholder" id="comments">
  <!-- 把 Giscus 脚本放这里 -->
</section>
```

如果你想要匿名评论，可以考虑 Waline 或 Twikoo，但它们通常需要额外后端服务。

## 推送到 GitHub Pages

如果当前目录还没有 `.git`，先初始化：

```powershell
git init
git remote add origin https://github.com/Yank233/Yank233.github.io.git
```

第一次提交并推送：

```powershell
git add .
git commit -m "Build static blog"
git branch -M main
git push -u origin main
```

以后每次更新：

```powershell
git add .
git commit -m "Update blog"
git push
```

推送后 GitHub Pages 通常会在几十秒到几分钟内刷新。
