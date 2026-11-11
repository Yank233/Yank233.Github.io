// Generates complete static HTML. No client-side router or content fetching is needed.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articles = JSON.parse(await readFile(path.join(root, 'content/articles.json'), 'utf8')).reverse();
await import('./sync-template.mjs');
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const mark = '<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M0 0h7l5 9 5-9h7l-9 16v12H9V16Z" fill="currentColor"/></svg>';
const arrow = '<span aria-hidden="true">↗</span>';
const external = 'target="_blank" rel="noopener noreferrer"';
const navigation = [['index.html','首页'],['posts.html','文章'],['project.html','项目'],['about.html','关于'],['links.html','友链']];

function page({title, description, active, content, nested = false, article = false}) {
  const prefix = nested ? '../' : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#F8F9FA">
  <title>${title === '首页' ? "Yank's Blog" : esc(title) + " · Yank's Blog"}</title>
  <link rel="icon" href="${prefix}assets/yank-mark.svg" type="image/svg+xml">
  <link rel="preload" href="${prefix}assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${prefix}css/site.css">
  <script type="module" src="${prefix}js/swarm/app.js"></script>
</head>
<body class="blog-site${article ? ' article-page' : ''}" data-page="${article?'article':active.replace('.html','')}">
  <div id="root" aria-label="由协作光标搭建的博客"></div>
  <a class="sw-skip-link sw-button sw-button--small" href="#main">跳至正文</a>
  <div class="site-shell">
    <header class="blog-header">
      <a class="sw-brand" href="${prefix}index.html" aria-label="Yank's Blog 首页">${mark}<span>Yank's Blog<span class="brand-period">.</span></span></a>
      <nav class="blog-nav" aria-label="主导航">${navigation.map(([file,label]) => `<a href="${prefix}${file}"${active === file ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
      <a class="sw-button sw-button--small header-github" href="https://github.com/Yank233" ${external}>GitHub ${arrow}</a>
    </header>
    <main id="main" tabindex="-1">${content}</main>
    <footer class="blog-footer">
      <div class="footer-main"><a class="sw-brand" href="${prefix}index.html">${mark}<span>Yank's Blog.</span></a><p>记录技术、生活和思考。<br>保持好奇，慢慢搭建。</p></div>
      <nav aria-label="页脚导航"><a href="${prefix}posts.html">文章归档</a><a href="${prefix}about.html">关于我</a><a href="mailto:3051258379@qq.com">联系我 ${arrow}</a><a href="#main">回到顶部 ↑</a></nav>
      <div class="footer-bottom"><span>© 2026 Yank.</span><span class="mono">一个持续搭建中的个人空间。</span></div>
    </footer>
  </div>
</body>
</html>
`;
}

const label = (number, text) => `<p class="section-label mono"><span>${number}</span> / ${text}</p>`;
function heading(number, english, title, description, right = '') {
  return `<header class="page-heading"><div data-build="text">${label(number,english)}<h1>${title}</h1>${description ? `<p class="heading-description">${description}</p>` : ''}</div>${right}</header>`;
}
function postRows(items, home = false) {
  return items.map((item, i) => `<article class="post-row" data-build="panel">
    <div class="post-index mono">${String(i + 1).padStart(2,'0')}</div>
    <div class="post-info"><div class="post-meta"><span class="category">${item.category}</span><time datetime="${item.date}">${item.date.replaceAll('-','.')}</time></div><h${home?3:2}><a href="posts/${item.slug}.html">${esc(item.listTitle)}</a></h${home?3:2}><p>${esc(home ? item.homeExcerpt || item.excerpt : item.excerpt)}</p></div>
    <a class="row-arrow" href="posts/${item.slug}.html" aria-label="阅读：${esc(item.title)}">↗</a>
  </article>`).join('');
}
const tags = values => `<div class="tags">${values.map(value=>`<span>${value}</span>`).join('')}</div>`;

const home = `
  <section class="home-hero">
    <div class="hero-copy">
      <p class="section-label mono" data-build="text"><span class="status-dot"></span> PERSONAL BLOG / SINCE 2026</p>
      <h1 data-build="text">Hello<br>World<span class="hero-period">.</span></h1>
      <p class="hero-quote" data-build="text">给岁月以文明，<br class="mobile-break">而不是给文明以岁月。</p>
      <p class="hero-description" data-build="text">这里是 Yank 的个人空间。<br>一些技术笔记、生活记录，以及随手做的小玩意。</p>
      <div class="hero-actions" data-build="panel"><a class="sw-button" href="posts.html">阅读文章 <span aria-hidden="true">↗</span></a><a class="sw-button sw-button--secondary" href="about.html">了解我 <span aria-hidden="true">→</span></a></div>
    </div>
    <div class="hero-workspace">
      <div class="workspace-label mono" data-build="text"><span>YANK / WORKSPACE</span><span>01—∞</span></div>
      <div class="workspace-root" data-build="panel"><div class="terminal-symbol" aria-hidden="true">›_</div><div><strong>ideas.build()</strong><span>把想法，慢慢变成现实。</span></div><span class="workspace-light" aria-hidden="true"></span></div>
      <div class="workspace-branches" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="workspace-nodes"><a href="posts.html" class="workspace-node" data-build="panel"><span class="node-number mono">01</span><strong>技术笔记</strong><span class="mono">notes / learning</span></a><a href="posts.html" class="workspace-node" data-build="panel"><span class="node-number mono">02</span><strong>生活记录</strong><span class="mono">life / thoughts</span></a><a href="project.html" class="workspace-node" data-build="panel"><span class="node-number mono">03</span><strong>灵感实验</strong><span class="mono">ideas / making</span></a></div>
      <div class="workspace-code sw-code" data-build="panel"><div class="sw-code__bar"><span class="sw-code__dots" aria-hidden="true"><i></i><i></i><i></i></span><span>about.yank</span></div><pre><code><span class="sw-code__comment">// 一点好奇心，一点行动力。</span>
<span class="sw-code__key">const</span> yank = {
  loves: [<span class="code-string">'code'</span>, <span class="code-string">'music'</span>],
  status: <span class="code-string">'still learning'</span>,
  next: <span class="code-string">'keep building'</span>
};</code></pre></div>
      <div class="workspace-footer mono" data-build="text"><span class="status-dot"></span> SMALL IDEAS. SOMETHING REAL.</div>
    </div>
  </section>
  <div class="site-index"><span class="mono">EXPLORE THE SPACE</span><a href="posts.html"><strong>${String(articles.length).padStart(2,'0')}</strong> 篇文章</a><a href="project.html"><strong>02</strong> 个项目</a><a href="links.html"><strong>03</strong> 位朋友</a><span>持续记录中 <span class="status-dot"></span></span></div>
  <section aria-labelledby="latest-heading"><div class="section-heading"><div data-build="text">${label('01','LATEST NOTES')}<h2 id="latest-heading">最近写下的。</h2></div><a class="text-link" href="posts.html">全部文章 <span aria-hidden="true">↗</span></a></div>${postRows(articles.slice(0,4),true)}</section>
  <section class="home-bottom"><div class="home-about" data-build="panel"><div class="small-portrait"><img src="assets/profile.jpg" alt="Yank 的头像：戴皇冠的小猫" width="1080" height="1080" loading="lazy"></div><div>${label('02','BEHIND THE WORDS')}<h2>嗨，我是 Yank。</h2><p>爱折腾的大一小登，喜欢整点小玩意。</p><a class="text-link" href="about.html">再多认识一点 ↗</a></div></div><div class="home-project" data-build="panel">${label('03','SIDE PROJECTS')}<h2>不止于想法。</h2><p>一些做过的、正在做的、以及想做的事。</p><a class="text-link" href="project.html">看看我的项目 ↗</a></div></section>`;

const archive = `${heading('01','ARCHIVE','文章<span class="heading-dot">.</span>','把探索的过程留下来，给未来的自己一个路标。',`<div class="heading-stat mono" data-build="text"><strong>${String(articles.length).padStart(2,'0')}</strong><span>ENTRIES / 2026</span></div>`)}<div class="archive-strip"><span class="mono">2026</span><span>技术笔记 · 博客开发 · 生活记录</span><span class="mono">NEWEST FIRST ↓</span></div><section aria-label="全部文章">${postRows(articles)}</section>`;

const about = `
  <section class="about-hero"><div class="about-copy" data-build="text">${label('02','ABOUT ME')}<h1>嗨，我是<br>Yank<span class="heading-dot">.</span></h1><p class="about-bio">爱折腾的大一小登，<br>喜欢整点小玩意。</p><div class="social-actions"><a class="sw-button" href="https://github.com/Yank233" ${external}>GitHub ↗</a><a class="sw-button sw-button--secondary" href="https://space.bilibili.com/1472106962" ${external}>Bilibili ↗</a></div></div><figure class="portrait-panel" data-build="panel"><img src="assets/profile.jpg" alt="Yank 的头像：戴着金色皇冠的小猫" width="1080" height="1080"><figcaption class="mono"><span>YANK / PERSONAL PROFILE</span><span>FIG. 01</span></figcaption></figure></section>
  <section class="about-intro split-section"><div data-build="text">${label('01','THIS LITTLE PLACE')}<h2>关于这个博客。</h2></div><div data-build="text"><p class="large-body">一个可以写技术笔记、生活记录和想法仓库的小项目。</p><p>网站现在是纯静态结构，没有复杂框架，想改哪里就改哪里。</p></div></section>
  <div class="about-grid"><section data-build="panel">${label('02','TOOLBOX')}<h2>边学，边做。</h2><p>从最基础的东西开始，一点点搭建。</p>${tags(['HTML / CSS','JavaScript'])}</section><section data-build="panel">${label('03','NOW & NEXT')}<h2>最近在忙什么。</h2><dl class="status-list"><div><dt>正在做</dt><dd>博客页面优化、项目展示页</dd></div><div><dt>最近在学</dt><dd>前端，算法竞赛</dd></div><div><dt>下一个目标</dt><dd>继续完善个人博客</dd></div></dl></section></div>
  <section><div class="section-heading"><div data-build="text">${label('04','SMALL THOUGHTS')}<h2>碎碎念。</h2></div><span class="mono faint">THOUGHTS, UNFILTERED.</span></div><div class="thought-grid">${['身后的乡土正在崩塌，面前的路途只有迷雾','去码头整点薯条','那无休止跳动的心脏，今天辛苦了'].map((text,i)=>`<blockquote data-build="text"><span class="quote-mark" aria-hidden="true">“</span><p>${text}</p><span class="mono">NOTE / ${String(i+1).padStart(2,'0')}</span></blockquote>`).join('')}</div></section>
  <section class="contact-section" data-build="panel"><div>${label('05','SAY HELLO')}<h2>有什么想聊的？</h2><p>可以通过下面的方式找到我。</p></div><div class="contact-links"><a href="mailto:3051258379@qq.com">3051258379@qq.com ↗</a><a href="https://github.com/Yank233" ${external}>GitHub / @Yank233 ↗</a></div></section>`;

const projects = [
 {title:"Yank's Blog",desc:'纯静态 HTML/CSS/JS，轻量化，易维护。用于记录技术、生活和想法。',url:'https://github.com/Yank233/Yank233.github.io',tags:['HTML / CSS','JavaScript','GitHub Pages'],status:'PERSONAL WEBSITE',symbol:'&lt;/&gt;'},
 {title:'GTA5 名钻赌场<br>指纹破解脚本',desc:'由于朋友指纹破解太菜，忙活半天成功拿到不到 10 万 GTA 游戏币，遂做之。',url:'https://github.com/Yank233/GTAOL-GTA5-Diamond-Casino-Auto-Fingerprint-Hack',tags:['Python','imagehash'],status:'AUTOMATION TOOL',symbol:'⌘'},
 {title:'不知道要干啥，<br>等等吧。',desc:'敬请期待～',tags:['俺寻思中'],status:'WORK IN PROGRESS',symbol:'…'}
];
const project = `${heading('03','PROJECTS','不止于想法<span class="heading-dot">.</span>','一些做过的、正在做的、以及想做的事。','<span class="heading-note mono" data-build="text">BUILD. BREAK.<br>LEARN. REPEAT.</span>')}<section class="project-grid" aria-label="我的项目">${projects.map((p,i)=>`<article class="project-card" data-build="panel"><div class="project-top"><span class="project-symbol" aria-hidden="true">${p.symbol}</span><span class="mono">0${i+1}</span></div><p class="mono project-status">${p.status}</p><h2>${p.url?`<a href="${p.url}" ${external}>${p.title}</a>`:p.title}</h2><p class="project-description">${p.desc}</p>${tags(p.tags)}${p.url?`<a class="text-link" href="${p.url}" ${external}>在 GitHub 查看 ↗</a>`:'<span class="project-pending mono">敬请期待</span>'}</article>`).join('')}</section><section class="split-section working-section"><div data-build="text">${label('04','ON THE DESK')}<h2>当前正在做。</h2></div><ol class="working-list" data-build="text"><li><span class="mono">01</span>博客页面优化</li><li><span class="mono">02</span>学习前端框架</li><li><span class="mono">03</span>算法竞赛刷题中</li></ol></section>`;

const friends = [
 {name:'Momu2',url:'https://blog.amitymc.com/',desc:'欢迎来到 Momu2 的数字花园，记录学习、思考与创造。',type:'DIGITAL GARDEN',initial:'M'},
 {name:'和睦小站',url:'https://amitymc.com/',desc:'一个温馨、自由、充满创造力的 Minecraft 社区。<br>在这里，每一次冒险都值得被记录。',type:'MINECRAFT COMMUNITY',initial:'和'},
 {name:'LeftJun',url:'https://leftjun.com/',desc:'因为山就在那里',type:'PERSONAL SPACE',initial:'L'}
];
const links = `${heading('04','FRIENDS','在别处，遇见<span class="heading-dot">.</span>','独立的小站，互相连接。这里有一些值得停留的地方。','<div class="heading-stat mono" data-build="text"><strong>03</strong><span>CONNECTED SPACES</span></div>')}<section class="friend-list" aria-label="友情链接">${friends.map((f,i)=>`<a class="friend-row" data-build="panel" href="${f.url}" ${external}><span class="friend-avatar" aria-hidden="true">${f.initial}</span><div><span class="mono friend-type">0${i+1} / ${f.type}</span><h2>${f.name}</h2><p>${f.desc}</p><span class="mono friend-url">${f.url.replace(/\/$/,'')}</span></div><span class="friend-arrow" aria-hidden="true">↗</span></a>`).join('')}</section><section class="contact-section" data-build="panel"><div>${label('05','KEEP IN TOUCH')}<h2>让小站彼此相连。</h2><p>有什么想聊的，随时来信。</p></div><a class="sw-button" href="mailto:3051258379@qq.com">联系 Yank ↗</a></section>`;

function articlePage(item, index) {
  let section = 0;
  const headings = [];
  const body = item.body.replace(/<p>\s*<code>([^<]*)<\/code>\s*<\/p>/g, '<p class="article-command"><code>$1</code></p>').replace(/<h2>([\s\S]*?)<\/h2>/g, (_,text)=>{
    const id=`section-${++section}`;
    headings.push({id,text});
    return `<h2 id="${id}">${text}</h2>`;
  });
  const next=articles[index+1], prev=articles[index-1];
  const content=`<div class="article-breadcrumb"><a href="../posts.html">← 全部文章</a><span class="mono">NOTES / ${String(index+1).padStart(2,'0')}</span></div><article><header class="article-heading" data-build="text"><div class="post-meta"><span class="category">${item.category}</span><time datetime="${item.date}">${item.date.replaceAll('-','.')}</time></div><h1>${esc(item.title)}</h1><p class="article-summary">${esc(item.summary)}</p><a class="article-author" href="../about.html"><img src="../assets/profile.jpg" alt="" width="32" height="32"><span>Yank</span><span class="mono">/ ${Math.max(1,Math.ceil(item.body.replace(/<[^>]+>/g,'').length/350))} MIN READ</span></a></header><div class="article-layout"><aside class="article-aside"><p class="mono">ON THIS PAGE</p><nav aria-label="文章目录"><a href="#article-content">正文</a>${headings.map(h=>`<a href="#${h.id}">${h.text}</a>`).join('')}</nav><p class="aside-note">记录探索，<br>也记录过程。</p></aside><div class="article-body" id="article-content">${body}<div class="article-end mono"><span></span> END OF NOTE</div></div></div></article><nav class="article-pagination" aria-label="相邻文章">${prev?`<a href="${prev.slug}.html"><span class="mono">← NEWER NOTE</span><strong>${esc(prev.title)}</strong></a>`:'<a href="../posts.html"><span class="mono">← BACK TO ARCHIVE</span><strong>回到文章列表</strong></a>'}${next?`<a href="${next.slug}.html"><span class="mono">OLDER NOTE →</span><strong>${esc(next.title)}</strong></a>`:'<a href="../posts.html"><span class="mono">ALL NOTES ↗</span><strong>从第一篇开始，再读一次。</strong></a>'}</nav>`;
  return page({title:item.title,description:item.description,active:'posts.html',content,nested:true,article:true});
}

for (const [file,title,description,content] of [
 ['index.html','首页','Yank 的个人博客，记录技术、生活和思考。',home],
 ['posts.html','文章','Yank 的技术笔记、博客开发记录和生活随笔。',archive],
 ['about.html','关于','关于 Yank，爱折腾、喜欢整点小玩意的大一学生。',about],
 ['project.html','项目','Yank 做过的、正在做的、以及想做的项目。',project],
 ['links.html','友链','Yank 的好友们与值得停留的独立小站。',links]
]) await writeFile(path.join(root,file),page({title,description,active:file,content}));
for (let i=0;i<articles.length;i++) await writeFile(path.join(root,`posts/${articles[i].slug}.html`),articlePage(articles[i],i));
await writeFile(path.join(root,'posts/template.html'),page({title:'{{TITLE}}',description:'{{DESCRIPTION}}',active:'posts.html',nested:true,article:true,content:`<div class="article-breadcrumb"><a href="../posts.html">← 全部文章</a></div><article><header class="article-heading"><p class="section-label mono">{{DATE}} / NOTE</p><h1>{{TITLE}}</h1><p class="article-summary">{{DESCRIPTION}}</p></header><div class="article-body article-body--standalone">{{CONTENT}}</div></article>`}));
console.log(`Built 5 main pages, ${articles.length} complete articles and the article template.`);
await writeFile(path.join(root,'js/swarm/content.js'),`export const content = ${JSON.stringify({articles,projects,friends},null,2)};\n`);



