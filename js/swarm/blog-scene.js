import {content} from './content.js';

export const sceneWidth=document.documentElement.clientWidth<1000?document.documentElement.clientWidth:1280;
const compact=sceneWidth!==1280;
export const navHeight=compact?108:64;
const nested=document.body.dataset.page==='article';
const prefix=nested?'../':'';
const url=file=>prefix+file;
const plain=html=>{const node=document.createElement('div');node.innerHTML=html.replace(/<br\s*\/?\s*>/gi,'\n');return node.textContent.trim();};
const text=(selector,root=document)=>root.querySelector(selector)?.textContent.trim()||'';
const originalTexts=new Map();
const articleCount=String(content.articles.length).padStart(2,'0');

// These are the same path / rect / text / guide / duplication records consumed
// by the supplied Swarm engine. There is no second animation implementation.
class Scene {
  constructor(api,base={els:[],tasks:[],groups:[],height:0}) {
    Object.assign(this,base);this.api=api;this.actions=[];
    this.left=compact?16:80;this.right=sceneWidth-this.left;
    this.pad=compact?24:36;this.x=this.left+this.pad;this.w=this.right-this.x-this.pad;
    this.index=new Map(this.els.map(el=>[el.id,el]));
  }
  add(el,type,deps=[]) {
    Object.assign(el,{v:0,vis:false,dx:0,dy:0});this.els.push(el);this.index.set(el.id,el);
    this.tasks.push({id:type[0]+':'+el.id,y:el.y??Math.min(...(el.pts||[{y:0}]).map(p=>p.y)),spec:{type,el:el.id},deps});
    return el.id;
  }
  line(id,x,y,x2,y2,deps=[]) {return this.add({kind:'path',id,pts:[{x,y},{x:x2,y:y2}],stroke:this.api.O.line,sw:1,placed:0,closed:false,shut:false,edit:false,owner:null,fillOn:false,add:true},'path',deps);}
  band(id,top,bottom) {
    this.line(id+'-bottom',-10000,bottom,10000,bottom);
    this.line(id+'-left',this.left,top,this.left,bottom);
    this.line(id+'-right',this.right,bottom,this.right,top);
  }
  rect(id,x,y,w,h,options={}) {
    return this.add({kind:'rect',id,x,y,w,h,r:options.r??8,fill:options.fill??this.api.O.card,stroke:options.stroke,draw:null,styled:false,image:options.image},'rect',options.deps);
  }
  label(id,x,y,value,style=this.api.R.body,w,options={}) {
    this.add({kind:'text',id,x,y,w,text:value,shown:'',st:style,size:style.size,align:options.align||'left',editing:false,selAll:false},'text',options.deps);
    const task=this.tasks.at(-1);task.spec.grow=options.grow||false;
    if(options.snap) task.spec.snap=options.snap;
    if(options.href) this.link(id,options.href,value);
    if(options.target) this.actions.push({el:id,target:options.target,label:value});
    return this.api.br(value,style,style.size,w).h;
  }
  guide(id,x,y) {this.add({kind:'guide',id,axis:'x',pos:x,cur:x,op:1,flash:0,dragging:false,y},'guide');return id;}
  link(el,href,label,current=false) {this.actions.push({el,href,label,current});}
  button(id,x,y,w,label,href,secondary=false) {
    this.rect(id,x,y,w,48,{fill:secondary?this.api.O.card:this.api.O.ink,stroke:secondary?this.api.O.line:undefined});
    this.label(id+'-text',x,y+13,label,secondary?this.api.R.btnDark:this.api.R.btn,w,{align:'center',deps:['r:'+id]});
    this.link(id,href,label);
  }
  duplicate(id,ids,copies) {
    const dependencies=this.tasks.filter(task=>ids.includes(task.spec.el)).map(task=>task.id);
    const group={id,ids,copies:[]}, duplicateTasks=[];
    copies.forEach((copy,k)=>{
      let count=0;
      const cloned=ids.map(id=>{
        const source=this.index.get(id), el={...source,id:`${id}~${k+1}`,x:source.x+copy.dx,y:source.y+copy.dy};
        if(el.kind==='text') el.text=copy.edits[count++]??el.text;
        this.els.push(el);this.index.set(el.id,el);return el.id;
      });
      group.copies.push({dx:copy.dx,dy:copy.dy,ids:cloned});
      const taskId=`d:${id}:${k}`;duplicateTasks.push(taskId);
      this.tasks.push({id:taskId,y:Math.min(...cloned.map(id=>this.index.get(id).y)),spec:{type:'dup',group:id,k},deps:dependencies});
    });
    group.copies.forEach(copy=>copy.ids.forEach((id,i)=>{
      const el=this.index.get(id),source=this.index.get(ids[i]);
      if(el.kind==='text' && el.text!==source.text) this.tasks.push({id:'e:'+id,y:el.y,spec:{type:'edit',el:id},deps:duplicateTasks});
    }));
    this.groups.push(group);
  }
  heading(id,title,description,top=24+navHeight) {
    const {R,he}=this.api,guide=this.guide(id+'-guide',this.x,top+20);
    const size=compact?Math.min(42,(this.w)/6):64;
    const h=this.label(id+'-title',this.x,top+70,title,he(size,600,1.16,this.api.O.ink,-.035),compact?this.w:850,{snap:guide,grow:true});
    const descY=top+70+h+28;
    const d=this.label(id+'-description',this.x,descY,description,R.lead,compact?this.w:720,{snap:guide});
    const bottom=descY+d+64;this.band(id,top,bottom);return bottom;
  }
  footer(top) {
    const {R,he}=this.api, end=top+(compact?360:280);
    this.band('footer',top,end);
    this.label('f-brand',this.x,top+44,"Yank's Blog",R.brand,undefined,{href:url('index.html')});
    this.label('f-copy',this.x,end-50,'© 2026 Yank.',R.small);
    const columns=[['阅读','文章归档','项目'],['关于','关于我','友链','联系我']];
    const links=[['posts.html','project.html'],['about.html','links.html','mailto:3051258379@qq.com']];
    columns.forEach((items,col)=>{
      const x=compact?this.x+col*this.w/2:560+col*260,y=top+(compact?110:44);
      this.label(`footer-${col}-heading`,x,y,items[0],he(14.5,600,1.4));
      items.slice(1).forEach((item,i)=>this.label(`footer-${col}-${i}`,x,y+34+i*30,item,R.item,undefined,{href:links[col][i].startsWith('mailto:')?links[col][i]:url(links[col][i])}));
    });
    this.height=end+90;
  }
}

function set(scene,id,value,options={}) {
  const el=scene.index.get(id);if(!el)throw new Error('Unknown template element: '+id);
  originalTexts.set(id,el.text);Object.assign(el,{text:value},options);
}

function navigation(scene,original) {
  const {R}=scene.api;
  if(!compact) {
    if(scene.els.length===0) {
      const els=original.els.filter(el=>el.sticky),ids=new Set(els.map(el=>el.id));
      scene.els.push(...els);els.forEach(el=>scene.index.set(el.id,el));
      scene.tasks.push(...original.tasks.filter(task=>ids.has(task.spec.el)||task.spec.group==='nav'));
      scene.groups.push(...original.groups.filter(group=>group.id==='nav'));
    }
    set(scene,'brand',"Yank's Blog");
    ['文章','项目','关于','友链'].forEach((label,i)=>set(scene,i?`nav0~${i}`:'nav0',label));
    set(scene,'nav-btn-t','GitHub ↗');
    const navGroup=scene.groups.find(group=>group.id==='nav');
    if(navGroup) navGroup.copies.forEach((copy,i)=>{copy.edits=[['文章','项目','关于','友链'][i]||''];});
    scene.link('brand',url('index.html'),'首页');
    ['posts.html','project.html','about.html','links.html'].forEach((file,i)=>scene.link(i?`nav0~${i}`:'nav0',url(file),['文章','项目','关于','友链'][i],document.body.dataset.page===file.slice(0,-5)));
    scene.link('nav-btn','https://github.com/Yank233','GitHub');
  } else {
    scene.line('nav-top',-10000,24,10000,24);scene.band('nav',24,24+navHeight);
    scene.label('brand',scene.x,42,"Yank's Blog",R.brand,undefined,{href:url('index.html')});
    scene.rect('nav-github',scene.right-105,36,89,36,{fill:scene.api.O.ink});
    scene.label('nav-github-t',scene.right-105,44,'GitHub ↗',R.btn,89,{align:'center',deps:['r:nav-github']});
    scene.link('nav-github','https://github.com/Yank233','GitHub');
    ['首页','文章','项目','关于','友链'].forEach((name,i)=>scene.label('nav-'+i,scene.x+i*(scene.w-28)/4,96,name,{...R.nav,size:13},undefined,{href:url(['index.html','posts.html','project.html','about.html','links.html'][i])}));
    scene.els.forEach(el=>el.sticky=true);
  }
}

function desktopHome(original,api) {
  const s=new Scene(api),{R,O}=api;
  // Reuse the template's measured records and artboard IDs, but replace its
  // task graph with the blog content below. This keeps the original renderer's
  // typography, scaling and cursor choreography intact.
  original.els.forEach(el=>{el.vis=false;s.els.push(el);s.index.set(el.id,el);});
  s.tasks.push(...original.tasks);s.groups.push(...original.groups);
  s.height=original.height||4060;
  navigation(s,original);
  const replacements={
    'h-title':'Hello\nWorld.',
    'h-lead':'给岁月以文明，而不是给文明以岁月。\n这里是 Yank 的个人空间。\n一些技术笔记、生活记录，以及随手做的小玩意。',
    'h-btn1-t':'阅读文章','h-btn2-t':'了解我',
    'g-disp-t':'yank.build(ideas)','g-disp-s':'personal workspace · always in progress',
    'w0-n':'notes/tech','w0-s':'● 技术笔记','w0-n~1':'notes/life','w0-s~1':'● 生活记录',
    'w0-n~2':'projects/code','w0-s~2':'● 随手创造','w0-n~3':'friends/links','w0-s~3':'● 彼此连接',
    'g-stat':`${articleCount} 篇文章 · 02 个项目 · 持续记录中`,
    'l-label':'记录、探索与创造','logo0':'技术笔记','logo0~1':'博客开发','logo0~2':'生活记录','logo0~3':'灵感实验','logo0~4':'保持好奇',
    'f-title':'最近写下的。\n留给未来的自己。','f-lead':'把探索的过程留下来。\n技术、生活，以及那些还没有成形的想法。',
    'c-title':'一点好奇心，\n一点行动力。','c-body':'爱折腾的大一小登，喜欢整点小玩意。\n这个博客是我的个人空间，用来记录技术、生活和思考。','c-link':'更多关于我 ↗','c-file':'about.yank',
    'st-n':articleCount,'st-l':'篇文章，慢慢积累','st-n~1':'02','st-l~1':'个项目，边做边学','st-n~2':'03','st-l~2':'位朋友，彼此连接','st-n~3':'2026','st-l~3':'从这一年开始记录',
    'p-title':'从一个想法，\n到一点点实现。','ps-t':'记录','ps-b':'把技术笔记和生活碎片留下来。今天的小问题，也许就是明天的路标。','ps-t~1':'动手','ps-b~1':'写一点代码，做一个小工具。边学边做，在折腾中慢慢理解。','ps-t~2':'分享','ps-b~2':'把过程放在这里，和同样好奇的人交换想法。',
    '$-title':'不止于想法。\n也在动手实现。','$-lead':'一些做过的、正在做的、以及想做的事。\n从小项目开始，边做边学。',
    'pc-name':'个人博客','pc-price':'01','pc-per':'PERSONAL WEBSITE','pc-desc':'记录技术、生活和思考的个人站点。','pc-f1':'HTML / CSS','pc-f2':'JavaScript','pc-f3':'GitHub Pages','pc-btn-t':'查看项目 ↗',
    'pc-name~1':'游戏小工具','pc-price~1':'02','pc-per~1':'AUTOMATION TOOL','pc-desc~1':'GTA5 名钻赌场指纹破解脚本。','pc-f1~1':'Python','pc-f2~1':'imagehash','pc-f3~1':'自动化尝试','pc-btn-t~1':'查看项目 ↗',
    'pc-name~2':'下一个项目','pc-price~2':'03','pc-per~2':'WORK IN PROGRESS','pc-desc~2':'不知道要干啥，等等吧。','pc-f1~2':'保持好奇','pc-f2~2':'继续学习','pc-f3~2':'敬请期待','pc-btn-t~2':'全部项目 ↗',
    'x-title':'保持好奇，\n慢慢搭建。','x-lead':'记录技术、生活和思考。\n嗨，我是 Yank，很高兴在这里遇见你。','x-btn-t':'关于我 ↗','x-count':'YANK / PERSONAL PROFILE','x-note':'',
    'f-brand':"Yank's Blog",'f-copy':'© 2026 Yank.','fc-h':'阅读','fc-1':'文章归档','fc-2':'项目','fc-3':'','fc-h~1':'关于','fc-1~1':'关于我','fc-2~1':'友链','fc-3~1':'联系我','fc-h~2':'在别处','fc-1~2':'GitHub','fc-2~2':'Bilibili','fc-3~2':'回到顶部 ↑'
  };
  for(const [id,value] of Object.entries(replacements)) set(s,id,value);
  s.index.get('x-count').dyn=undefined;
  ['# about.yank','name: Yank','interests:','  - code','  - music','  - small ideas','learning:','  - frontend','  - algorithms','status: still learning','next: keep building','# 一点点，把想法变成现实。'].forEach((line,i)=>set(s,'c-ln'+i,line));
  s.rect('profile-photo',840,3378,300,280,{r:10,image:url('assets/profile.jpg')});
  for(const [id,href,label] of [
    ['h-btn1','posts.html','阅读文章'],['h-btn2','about.html','了解我'],['c-link','about.html','更多关于我'],['x-btn','about.html','关于我'],
    ['w0','posts.html','技术笔记'],['w0~1','posts.html','生活记录'],['w0~2','project.html','项目'],['w0~3','links.html','友链'],
    ['pc-btn','project.html','个人博客项目'],['pc-btn~1','project.html','指纹破解脚本'],['pc-btn~2','project.html','全部项目'],
    ['fc-1','posts.html','文章归档'],['fc-2','project.html','项目'],['fc-1~1','about.html','关于我'],['fc-2~1','links.html','友链']
  ]) s.link(id,url(href),label);
  s.link('fc-3~1','mailto:3051258379@qq.com','联系我');s.link('fc-1~2','https://github.com/Yank233','GitHub');s.link('fc-2~2','https://space.bilibili.com/1472106962','Bilibili');s.actions.push({el:'fc-3~2',target:'h-title',label:'回到顶部'});
  replaceHomeArticleGrid(s);
  return s;
}

// Replace the template's six feature slots, including their animation tasks.
// Hiding text alone leaves blank cells and lets the animation recreate copies.
function replaceHomeArticleGrid(s) {
  const gridIds=new Set(['rule-fgrid','left-fgrid','right-fgrid','f-mid','f-v1','f-v2','g-cell','g-cell-y']);
  const removed=new Set(s.els.filter(el=>gridIds.has(el.id)||/^fc-(title|body)(~\d+)?$/.test(el.id)).map(el=>el.id));
  s.els=s.els.filter(el=>!removed.has(el.id));
  removed.forEach(id=>s.index.delete(id));
  s.groups=s.groups.filter(group=>group.id!=='features');
  s.tasks=s.tasks.filter(task=>!removed.has(task.spec.el)&&task.spec.group!=='features');
  const validTasks=new Set(s.tasks.map(task=>task.id));
  s.tasks.forEach(task=>{task.deps=task.deps.filter(id=>validTasks.has(id));});
  s.actions=s.actions.filter(action=>!removed.has(action.el));
  const following=s.els.slice(), followingTasks=s.tasks.slice();
  const gridBottom=articleCards(s,960,content.articles.slice(0,4));
  const bottom=gridBottom+64;
  s.band('home-archive',gridBottom,bottom);
  s.label('home-all-posts',s.x,gridBottom+20,'全部文章 ↗',s.api.R.nav,160,{href:url('posts.html')});
  const shift=bottom-1440;
  // Move only the original content below the replaced grid, preserving its layout.
  following.forEach(el=>{
    if(Number.isFinite(el.y)&&el.y>=1440)el.y+=shift;
    if(el.pts)el.pts=el.pts.map(point=>({...point,y:point.y>=1440?point.y+shift:point.y}));
    if(el.tf&&el.tf.y>=1440)el.tf={...el.tf,y:el.tf.y+shift};
    if(el.kind==='guide'&&el.axis==='y'&&el.pos>=1440){el.pos+=shift;el.cur+=shift;}
  });
  followingTasks.forEach(task=>{if(task.y>=1440)task.y+=shift;});
  s.height+=shift;
}

function graph(s,top) {
  const {R,O,lt}=s.api,x=s.x,w=s.w,gap=16,cell=(w-gap)/2;
  s.rect('g-disp',x,top,w,64,{fill:O.ink,r:10});
  s.label('g-disp-t',x+20,top+11,'yank.build(ideas)',R.nodeWhite,w-40,{deps:['r:g-disp']});
  s.label('g-disp-s',x+20,top+35,'personal workspace',lt(12,'#8F949B'),w-40,{deps:['r:g-disp']});
  s.line('g-stem',x+w/2,top+64,x+w/2,top+95,['r:g-disp']);
  s.line('g-bus',x+cell/2,top+95,x+w-cell/2,top+95,['p:g-stem']);
  for(let col=0;col<2;col++)s.line('g-branch'+col,x+cell/2+col*(cell+gap),top+95,x+cell/2+col*(cell+gap),top+128,['p:g-bus']);
  s.rect('w0',x,top+128,cell,80,{stroke:O.line,r:10});
  s.label('w0-n',x+12,top+145,'notes/tech',{...R.nodeName,size:12},cell-24,{deps:['r:w0']});
  s.label('w0-s',x+12,top+172,'● 技术笔记',lt(11,O.accent),cell-24,{deps:['r:w0']});
  s.duplicate('workers',['w0','w0-n','w0-s'],[{dx:cell+gap,dy:0,edits:['notes/life','● 生活记录']},{dx:0,dy:112,edits:['projects/code','● 随手创造']},{dx:cell+gap,dy:112,edits:['friends/links','● 彼此连接']}]);
  ['posts.html','posts.html','project.html','links.html'].forEach((file,i)=>s.link(i?'w0~'+i:'w0',url(file),['技术笔记','生活记录','项目','友链'][i]));
  s.rect('g-track',x,top+360,w,6,{r:3,fill:'#E1E3E6'});s.rect('g-fill',x,top+360,w*.65,6,{r:3,fill:O.accent,deps:['r:g-track']});
  s.label('g-stat',x,top+386,`${articleCount} 篇文章 · 02 个项目 · 持续记录`,R.small,w);
  return top+438;
}

function articleCards(s,top,items=content.articles) {
  const {R,he,O}=s.api;
  let y=top;
  const cols=compact?1:3;
  for(let row=0;row<Math.ceil(items.length/cols);row++) {
    const heights=[];
    const columns=Math.min(cols,items.length-row*cols),gap=(s.right-s.left)/columns;
    for(let col=0;col<columns;col++) {
      const i=row*cols+col,item=items[i];if(!item)continue;
      const x=s.x+col*gap,w=gap-s.pad*2;
      s.label('post-meta-'+i,x,y+32,item.category+' / '+item.date,R.small,w);
      const height=s.label('post-title-'+i,x,y+64,item.listTitle,R.h3,w,{href:url('posts/'+item.slug+'.html')});
      const body=s.label('post-excerpt-'+i,x,y+80+height,item.excerpt,R.body,w);
      heights.push(80+height+body+42);
    }
    const end=y+Math.max(...heights,240);s.band('post-row-'+row,y,end);
    for(let col=1;col<columns;col++)s.line('post-div-'+row+'-'+col,s.left+col*gap,y,s.left+col*gap,end);
    y=end;
  }
  return y;
}

function projects(s,top) {
  const {R,he,O}=s.api, cols=compact?1:3, gap=24, width=(s.w-gap*(cols-1))/cols;
  let bottom=top;
  content.projects.forEach((item,i)=>{
    const x=s.x+(i%cols)*(width+gap),y=top+Math.floor(i/cols)*440;
    s.rect('project-'+i,x,y,width,406,{r:14,stroke:O.line});
    const deps=['r:project-'+i],tx=x+28,tw=width-56;
    s.label('project-type-'+i,tx,y+28,item.status,R.small,tw,{deps});
    s.label('project-number-'+i,tx,y+66,'0'+(i+1),R.price,tw,{deps});
    const height=s.label('project-title-'+i,tx,y+134,plain(item.title),R.h3,tw,{deps});
    s.label('project-description-'+i,tx,y+146+height,item.desc,R.body,tw,{deps});
    s.label('project-tags-'+i,tx,y+294,item.tags.join(' / '),R.small,tw,{deps});
    s.button('project-link-'+i,tx,y+338,tw,item.url?'查看项目 ↗':'敬请期待',item.url||url('project.html'));
    bottom=Math.max(bottom,y+440);
  });
  s.band('projects',top-32,bottom);return bottom;
}

function compactHome(s) {
  const {R,he,O}=s.api,guide=s.guide('g-hero',s.x,152);
  const titleY=202;
  const h=s.label('h-title',s.x,titleY,'Hello\nWorld.',{...R.h1,size:64},s.w,{snap:guide,grow:true});
  const leadY=titleY+h+34;
  const lead=s.label('h-lead',s.x,leadY,'给岁月以文明，而不是给文明以岁月。\n这里是 Yank 的个人空间。\n一些技术笔记、生活记录，以及随手做的小玩意。',R.lead,s.w,{snap:guide});
  const btnY=leadY+lead+34,bw=(s.w-12)/2;
  s.button('h-btn1',s.x,btnY,bw,'阅读文章',url('posts.html'));s.button('h-btn2',s.x+bw+12,btnY,bw,'了解我',url('about.html'),true);
  const heroEnd=btnY+94;s.band('hero-copy',132,heroEnd);
  let y=graph(s,heroEnd+40);s.band('hero-graph',heroEnd,y);
  ['技术笔记','博客开发','生活记录','灵感实验'].forEach((value,i)=>s.label('logo-'+i,s.x+(i%2)*s.w/2,y+30+Math.floor(i/2)*46,value,R.logo,s.w/2));
  s.band('logos',y,y+132);y+=132;
  y=s.heading('features','最近写下的。','把探索的过程留下来，给未来的自己一个路标。',y);
  y=articleCards(s,y,content.articles.slice(0,4));
  y=s.heading('about-code','一点好奇心，\n一点行动力。','爱折腾的大一小登，喜欢整点小玩意。',y);
  s.rect('code-window',s.x,y+32,s.w,314,{fill:O.code,r:12});
  ['# about.yank','name: Yank','interests:','  - code','  - music','status: still learning','next: keep building'].forEach((line,i)=>s.label('code-line-'+i,s.x+20,y+60+i*32,line,R.code,s.w-40,{deps:['r:code-window']}));
  s.band('code',y,y+378);y+=378;
  y=s.heading('projects-heading','不止于想法。','一些做过的、正在做的、以及想做的事。',y);
  y=projects(s,y+32);
  y=s.heading('about-heading','保持好奇，\n慢慢搭建。','嗨，我是 Yank，很高兴在这里遇见你。',y);
  s.rect('profile-photo',s.x,y+32,s.w,s.w,{r:10,image:url('assets/profile.jpg')});
  s.button('about-link',s.x,y+s.w+64,s.w,'更多关于我 ↗',url('about.html'));
  s.band('portrait',y,y+s.w+150);s.footer(y+s.w+150);
}

function article(s) {
  const {R,he,lt,O}=s.api,heading=document.querySelector('.article-heading');
  let y=24+navHeight;
  s.label('back-to-posts',s.x,y+32,'← 全部文章',R.nav,undefined,{href:url('posts.html')});
  y+=90;
  const width=compact?s.w:900, title=text('h1',heading);
  const titleHeight=s.label('article-title',s.x,y,title,he(compact?32:48,600,1.3,O.ink,-.035),width,{grow:true});
  const summaryHeight=s.label('article-summary',s.x,y+titleHeight+26,text('.article-summary',heading),R.lead,width);
  s.label('article-meta',s.x,y+titleHeight+summaryHeight+54,text('.post-meta',heading)||text('.section-label',heading),R.small,width);
  s.rect('article-avatar',s.x,y+titleHeight+summaryHeight+90,32,32,{r:16,image:url('assets/profile.jpg')});
  s.label('article-author',s.x+44,y+titleHeight+summaryHeight+94,'Yank',R.item,undefined,{href:url('about.html')});
  const bodyTop=y+titleHeight+summaryHeight+158;s.band('article-heading',24+navHeight,bodyTop);
  y=bodyTop+48;
  const x=compact?s.x:400,w=compact?s.w:720,navItems=[];
  const nodes=[...document.querySelector('.article-body').children].filter(el=>el.matches('p,h2,h3,pre'));
  if(!nodes.length)s.label('article-placeholder',x,y,text('.article-body'),R.body,w);
  nodes.forEach((node,i)=>{
    const id=node.id||'article-block-'+i,isHeading=/^H[23]$/.test(node.tagName),command=node.classList.contains('article-command');
    if(isHeading){y+=20;navItems.push({id,text:node.textContent});}
    const style=isHeading?he(26,600,1.3):command?{...R.code,pre:false}:he(16,400,1.8,O.muted);
    let height;
    if(command){height=s.api.br(node.textContent,style,style.size,w-40).h;s.rect(id+'-panel',x,y,w,height+36,{fill:O.code});s.label(id,x+20,y+18,node.textContent,style,w-40,{deps:['r:'+id+'-panel']});height+=36;}
    else height=s.label(id,x,y,node.textContent,style,w);
    y+=height+(isHeading?24:28);
  });
  if(!compact){s.line('article-sidebar',360,bodyTop,360,y+30);s.label('toc-label',s.x,bodyTop+48,'ON THIS PAGE',R.small);navItems.forEach((item,i)=>s.label('toc-'+i,s.x,bodyTop+92+i*42,item.text,R.item,220,{target:item.id}));}
  const end=y+30;s.band('article-body',bodyTop,end);
  const links=[...document.querySelectorAll('.article-pagination a')];
  let paginationEnd=end+64;
  links.forEach((link,i)=>{const xx=compact?s.x:s.x+i*560, yy=compact?paginationEnd:end+40,ww=compact?s.w:480;const hh=s.label('article-next-'+i,xx,yy,link.textContent.trim(),R.item,ww,{href:link.getAttribute('href')});paginationEnd=compact?yy+hh+28:Math.max(paginationEnd,yy+hh+40);});
  s.footer(paginationEnd+16);
}

function about(s) {
  const {R,he}=s.api;
  let y=24+navHeight,portraitX=compact?s.x:776,portraitW=compact?s.w:388;
  s.label('about-title',s.x,y+104,'嗨，我是\nYank.',{...R.h1,size:compact?52:64},compact?s.w:580,{grow:true});
  s.label('about-lead',s.x,y+276,'爱折腾的大一小登，\n喜欢整点小玩意。',R.lead,compact?s.w:500);
  const bw=compact?(s.w-12)/2:184;
  s.button('about-github',s.x,y+386,bw,'GitHub ↗','https://github.com/Yank233');s.button('about-bili',s.x+bw+12,y+386,bw,'Bilibili ↗','https://space.bilibili.com/1472106962',true);
  const photoY=compact?y+494:y+74;
  s.rect('profile-photo',portraitX,photoY,portraitW,portraitW,{image:url('assets/profile.jpg'),r:10});
  const end=compact?photoY+portraitW+48:y+572;
  if(!compact)s.line('hero-div',740,y,740,end);s.band('about-hero',y,end);y=end;
  y=s.heading('about-blog','关于这个博客。','一个可以写技术笔记、生活记录和想法仓库的小项目。',y);
  const blocks=[['边学，边做。','从最基础的东西开始，一点点搭建。\nHTML / CSS · JavaScript'],['最近在忙什么。','正在做：博客页面优化、项目展示页。\n最近在学：前端，算法竞赛。\n下一个目标：继续完善个人博客。'],['碎碎念。','身后的乡土正在崩塌，面前的路途只有迷雾。\n去码头整点薯条。\n那无休止跳动的心脏，今天辛苦了。']];
  blocks.forEach(([title,body],i)=>{const top=y;s.label('about-section-title-'+i,s.x,y+44,title,R.h2,compact?s.w:440);const bx=compact?s.x:700,by=y+(compact?114:44),height=s.label('about-section-body-'+i,bx,by,body,R.body,compact?s.w:440);y=Math.max(y+220,by+height+48);s.band('about-section-'+i,top,y);});
  y=s.heading('contact','有什么想聊的？','可以通过邮件联系我，也可以在 GitHub 找到我。',y);
  s.label('contact-email',s.x,y+36,'3051258379@qq.com ↗',R.lead,s.w,{href:'mailto:3051258379@qq.com'});s.footer(y+124);
}

export function createBlogScene(originalFactory,api,count) {
  const original=originalFactory(count),page=document.body.dataset.page;
  if(page==='index'&&!compact)return desktopHome(original,api);
  const s=new Scene(api);navigation(s,original);
  if(page==='index')compactHome(s);
  else if(page==='article')article(s);
  else if(page==='about')about(s);
  else if(page==='posts') {
    const y=s.heading('archive','文章。','把探索的过程留下来，给未来的自己一个路标。');
    s.footer(articleCards(s,y));
  } else if(page==='project') {
    let y=s.heading('projects-heading','不止于想法。','一些做过的、正在做的、以及想做的事。');
    y=projects(s,y+40);y=s.heading('on-the-desk','当前正在做。','博客页面优化。\n学习前端框架。\n算法竞赛刷题中。',y);s.footer(y);
  } else if(page==='links') {
    let y=s.heading('friends-heading','在别处，遇见。','独立的小站，互相连接。这里有一些值得停留的地方。');
    content.friends.forEach((friend,i)=>{
      const top=y,x=compact?s.x:s.x+140,w=compact?s.w:s.w-140;
      s.label('friend-name-'+i,x,y+44,friend.name,api.R.h2,w,{href:friend.url});
      const h=s.label('friend-description-'+i,x,y+108,plain(friend.desc),api.R.body,w);
      s.label('friend-url-'+i,x,y+132+h,friend.url,api.R.small,w,{href:friend.url});y+=h+206;s.band('friend-'+i,top,y);
    });s.footer(y);
  }
  return s;
}

export function finishScene(engine) {
  engine.start();engine.completed=true;engine.cursors=[];engine.rulers={want:0,t:0,lastNeed:-10};
  for(const el of engine.list) {
    el.vis=el.kind!=='guide';el.dx=el.dy=0;
    if(el.kind==='text'){el.shown=el.text;el.size=el.st.size;el.editing=el.selAll=false;}
    if(el.kind==='rect'){el.styled=true;el.draw=null;}
    if(el.kind==='path'){el.placed=el.pts.length+1;el.shut=el.closed;el.fillOn=true;el.edit=false;}
    el.v++;
  }
  engine.tasks.forEach(task=>{task.state='done';});
}


