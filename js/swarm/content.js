export const content = {
  "articles": [
    {
      "slug": "post4",
      "title": ".venv 虚拟环境管理",
      "date": "2026-08-22",
      "description": "Python 项目里 .venv 虚拟环境的创建、管理与清理经验。",
      "summary": "虽然还没到依赖互相打架的地步，但好习惯要提前养成，这样传Github的也不至于是依托彻底的大粪",
      "body": "<p>刚开始全都是全局pip装包，万一某个项目要 requests 2.x、另一个要 3.x，装来装去把系统环境搞成一锅粥。</p>\r\n\r\n      <h2>创建与激活</h2>\r\n      <p>Python 3.3+ 自带 venv 模块，不需要额外安装。在项目根目录执行：</p>\r\n      <p><code>python -m venv .venv</code></p>\r\n      <p>Windows 下激活：<code>.venv\\Scripts\\activate</code></p>\r\n      <p>激活后命令行提示符会多出 <code>(.venv)</code> 前缀，这时 <code>pip install</code> 装的所有包都会进到 .venv 里，而不是全局。</p>\r\n\r\n      <h2>依赖管理</h2>\r\n      <p>装好依赖后立刻导出清单，方便换机器或重建环境：</p>\r\n      <p><code>pip freeze &gt; requirements.txt</code></p>\r\n      <p>换到新环境后一条命令装回来：<code>pip install -r requirements.txt</code>。requirements.txt 应该提交到 git，这样别人克隆仓库后能一键复现。</p>\r\n\r\n      <h2>清理与重建</h2>\r\n      <p>.venv 目录本身不提交到 git（加进 .gitignore 即可）。如果环境装坏了，最省事的办法是直接删掉重建：</p>\r\n      <p><code>rm -rf .venv</code> 然后重新 <code>python -m venv .venv</code></p>\r\n      <p>反正依赖都在 requirements.txt 里，重建成本很低。这也是\"一切皆可重来\"的底气。</p>",
      "listTitle": ".venv 虚拟环境管理",
      "excerpt": "虽然还没到依赖互相打架的地步，但好习惯要提前养成",
      "homeExcerpt": "虽然还没到依赖互相打架的地步，但好习惯要提前养成，这样传Github的也不至于是依托彻底的大粪",
      "category": "技术笔记"
    },
    {
      "slug": "post2",
      "title": "友链搭建",
      "date": "2026-06-08",
      "description": "友链搭建",
      "summary": "鸽了好几天，友链现已基本成型",
      "body": "<p>首先加个Momu2的博客以及和睦社区官网</p>\r\n      <p>之后有认识的熟人就也一起搞一个</p>\r\n      <p>接下来做个BGM或者评论功能吧</p>\r\n      <p>至于期末考和四级什么的，无所谓了（战术摆烂</p>",
      "listTitle": "友链搭建",
      "excerpt": "友链已经基本成型，拉几个好友试试水",
      "homeExcerpt": "鸽了好几天，友链现已基本成型",
      "category": "生活记录"
    },
    {
      "slug": "post1",
      "title": "我的第一篇自建博客文章",
      "date": "2026-06-04",
      "description": "我的第一篇自建博客文章。",
      "summary": "由于用Hexo有点预制的感觉，所以决定从零开始搓一个轻量化的、好维护的小网站。",
      "body": "<p>我想要一个更简单、更可控的个人站点。于是含泪删掉捣鼓半天的Hexo文件，只保留 GitHub Pages 需要的静态文件。</p>\r\n      <p>以后添加文章时，只需要复制这篇文章的 HTML 文件，修改标题、日期和正文，再把入口加到首页和文章列表里。</p>\r\n\r\n      <h2>下一步</h2>\r\n      <p>我可以继续加入项目展示、主题切换，总之等我想起来搞吧。</p>",
      "listTitle": "我的第一篇文章",
      "excerpt": "按道理这一篇应该是占位符来着？",
      "category": "随笔"
    }
  ],
  "projects": [
    {
      "title": "Yank's Blog",
      "desc": "纯静态 HTML/CSS/JS，轻量化，易维护。用于记录技术、生活和想法。",
      "url": "https://github.com/Yank233/Yank233.github.io",
      "tags": [
        "HTML / CSS",
        "JavaScript",
        "GitHub Pages"
      ],
      "status": "PERSONAL WEBSITE",
      "symbol": "&lt;/&gt;"
    },
    {
      "title": "GTA5 名钻赌场<br>指纹破解脚本",
      "desc": "由于朋友指纹破解太菜，忙活半天成功拿到不到 10 万 GTA 游戏币，遂做之。",
      "url": "https://github.com/Yank233/GTAOL-GTA5-Diamond-Casino-Auto-Fingerprint-Hack",
      "tags": [
        "Python",
        "imagehash"
      ],
      "status": "AUTOMATION TOOL",
      "symbol": "⌘"
    },
    {
      "title": "不知道要干啥，<br>等等吧。",
      "desc": "敬请期待～",
      "tags": [
        "俺寻思中"
      ],
      "status": "WORK IN PROGRESS",
      "symbol": "…"
    }
  ],
  "friends": [
    {
      "name": "Momu2",
      "url": "https://blog.amitymc.com/",
      "desc": "欢迎来到 Momu2 的数字花园，记录学习、思考与创造。",
      "type": "DIGITAL GARDEN",
      "initial": "M"
    },
    {
      "name": "和睦小站",
      "url": "https://amitymc.com/",
      "desc": "一个温馨、自由、充满创造力的 Minecraft 社区。<br>在这里，每一次冒险都值得被记录。",
      "type": "MINECRAFT COMMUNITY",
      "initial": "和"
    },
    {
      "name": "LeftJun",
      "url": "https://leftjun.com/",
      "desc": "因为山就在那里",
      "type": "PERSONAL SPACE",
      "initial": "L"
    }
  ]
};
