/* A DOM-based Swarm construction scene: only visual effects, no application state.
 * Uses each element's live bounds, so wrapping, Chinese type and responsive layouts
 * remain native. It can be removed without losing any content or navigation.
 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !window.IntersectionObserver) return;
  const elements = [...document.querySelectorAll('[data-build]')];
  if (!elements.length) return;
  // Seconds. Staggered teams give each block time to be drawn, filled and aligned.
  const tempo = { intro:1.6, travel:.42, outline:.38, settle:.42, stagger:.28, desktopTeams:4, mobileTeams:2 };
  const colors = ['#F24E1E','#A259FF','#1ABCFE','#0ACF83','#FF7262','#FFC700','#9747FF','#E8467C','#14AE5C','#0D99FF','#FF8A00','#00B5CE'];
  const pointer = '<path d="M4.6 3.9C4.2 3.1 4.9 2.4 5.7 2.8L20.6 9.4C21.5 9.8 21.4 11.1 20.4 11.3L13.9 12.9C13.4 13 13 13.4 12.9 13.9L11.3 20.4C11.1 21.4 9.8 21.5 9.4 20.6Z" fill="currentColor" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>';
  const pen = '<path d="M3 3L13.1 6.3L17.4 10.6L10.6 17.4L6.3 13.1Z" fill="currentColor" stroke="white" stroke-width="1.5"/><path d="M3.6 3.6L9 9" stroke="white"/><circle cx="10.2" cy="10.2" r="1.7" fill="none" stroke="white"/>';
  const cross = '<path d="M12 3V21M3 12H21" stroke="white" stroke-width="3.5"/><path d="M12 3V21M3 12H21" stroke="currentColor" stroke-width="1.5"/>';
  const beam = '<path d="M8 4H10Q12 4 12 7Q12 4 14 4H16M12 7V17M8 20H10Q12 20 12 17Q12 20 14 20H16" fill="none" stroke="white" stroke-width="3.5"/><path d="M8 4H10Q12 4 12 7Q12 4 14 4H16M12 7V17M8 20H10Q12 20 12 17Q12 20 14 20H16" fill="none" stroke="currentColor" stroke-width="1.5"/>';
  const stage = document.createElement('div');
  stage.className = 'build-stage';
  stage.setAttribute('aria-hidden','true');
  stage.innerHTML = '<svg class="build-guides"></svg><svg class="build-ruler build-ruler--top"></svg><svg class="build-ruler build-ruler--left"></svg><svg class="build-logo" viewBox="0 0 24 28"><path d="M0 0h7l5 9 5-9h7l-9 16v12H9V16Z" fill="currentColor"/></svg>';
  document.body.append(stage);
  const guideSvg = stage.querySelector('.build-guides');
  const logo = stage.querySelector('.build-logo');
  const skip = document.createElement('button');
  skip.type = 'button'; skip.className='build-skip'; skip.textContent='跳过动画 ↗';
  skip.setAttribute('aria-label','跳过入场动画，显示全部内容');
  document.body.append(skip);
  const workers = Array.from({length:18},(_,id)=>{
    const node=document.createElement('div');
    node.className='build-cursor'; node.style.color=colors[id%colors.length];
    node.innerHTML=`<svg viewBox="0 0 28 28" width="28" height="28">${pointer}</svg>`;
    stage.append(node);
    return {id,node,svg:node.firstChild,x:innerWidth/2,y:innerHeight/2,task:null,shape:'pointer',rotation:0};
  });
  const jobs = elements.map(el=>({el,state:'waiting',mode:el.dataset.build,oldHeight:el.style.minHeight,oldClip:el.style.clipPath,inert:el.inert,texts:null,details:[]}));
  let frame=0, time=0, last=performance.now(), started=false, finished=false, fontReady=false;
  let nextDispatch=0, nextTeam=0;
  const teamCount=workers.length/2;
  const queue=[];
  const readBounds = job => job.el.getBoundingClientRect();
  function reveal(job) {
    if(job.texts) job.texts.forEach(({node,text})=>node.textContent=text);
    job.details.forEach(el=>{el.removeAttribute('data-build-detail');el.style.removeProperty('--build-detail-opacity');});
    job.el.style.minHeight=job.oldHeight;
    job.el.style.clipPath=job.oldClip;
    job.el.inert=job.inert;
    job.el.removeAttribute('data-build-state');
    job.state='done';
  }
  function shape(worker,name) {
    if(worker.shape===name) return;
    worker.svg.innerHTML={pointer,pen,cross,beam}[name]; worker.shape=name;
  }
  function rulers() {
    const top=stage.querySelector('.build-ruler--top');
    const left=stage.querySelector('.build-ruler--left');
    top.innerHTML=Array.from({length:Math.ceil(innerWidth/50)},(_,i)=>`<line x1="${i*50}" x2="${i*50}" y1="${i%2?13:9}" y2="18"/>${i%2?'':`<text x="${i*50+3}" y="8">${i*50}</text>`}`).join('');
    left.innerHTML=Array.from({length:Math.ceil(innerHeight/50)},(_,i)=>`<line x1="${i%2?13:9}" x2="18" y1="${i*50}" y2="${i*50}"/>${i%2?'':`<text x="8" y="${i*50+3}" transform="rotate(-90 8 ${i*50+3})">${Math.round(scrollY+i*50)}</text>`}`).join('');
  }
  function wake() {
    if(finished || frame) return;
    last=performance.now(); frame=requestAnimationFrame(tick);
  }
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries) {
      if(!entry.isIntersecting) continue;
      const job=jobs.find(item=>item.el===entry.target);
      if(job.state==='waiting') {job.state='queued';queue.push(job);}
      observer.unobserve(entry.target);
    }
    wake();
  },{rootMargin:'0px 0px 80px 0px',threshold:0});
  for(const job of jobs) {
    job.el.dataset.buildState='waiting'; job.el.inert=true; observer.observe(job.el);
  }
  function start() {
    if(started || !fontReady || finished) return;
    started=true; nextDispatch=time; logo.classList.add('is-gone'); wake();
  }
  function begin(worker,job) {
    const bounds=readBounds(job);
    job.el.style.minHeight=`${bounds.height}px`;
    if(job.mode==='text') {
      const walker=document.createTreeWalker(job.el,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.textContent.trim() && !node.parentElement.closest('svg,code,pre')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
      job.texts=[];
      while(walker.nextNode()) {
        const node=walker.currentNode, text=node.textContent;
        job.texts.push({node,text,characters:Array.from(text)});
      }
      job.range=document.createRange();
    } else {
      job.details=[...job.el.children];
      job.details.forEach(el=>el.setAttribute('data-build-detail',''));
    }
    job.total=job.texts?.reduce((n,item)=>n+item.characters.length,0)||0;
    job.state='active';
    const helper=workers[worker.id+teamCount];
    worker.task={job,start:time,fromX:worker.x,fromY:worker.y,helperX:helper.x,helperY:helper.y,duration:job.mode==='text'?Math.min(2.3,1.05+job.total*.018):1.3};
    worker.node.style.opacity='1'; worker.rotation=0;
  }
  const ease=t=>1-Math.pow(1-t,3);
  const clamp=t=>Math.min(1,Math.max(0,t));
  function type(job,progress,bounds) {
    let remaining=Math.floor(job.total*progress), lastPart=null;
    for(const part of job.texts) {
      const text=part.characters.slice(0,Math.max(0,remaining)).join('');
      if(part.node.textContent!==text) part.node.textContent=text;
      if(text.length) lastPart={node:part.node,length:text.length};
      remaining-=part.characters.length;
    }
    if(lastPart) {
      job.range.setStart(lastPart.node,lastPart.length-1);
      job.range.setEnd(lastPart.node,lastPart.length);
      const caret=job.range.getBoundingClientRect();
      if(caret.height) return {x:caret.right,y:caret.top+caret.height/2};
    }
    return {x:bounds.x,y:bounds.y+14};
  }
  function selection(bounds,progress,typing) {
    const width=Math.max(1,bounds.width*(typing?1:progress));
    const height=Math.max(1,bounds.height*(typing?1:progress));
    const {x,y}=bounds;
    let output=`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#0D99FF" stroke-width="1"/>`;
    for(const [cx,cy] of [[x,y],[x+width,y],[x,y+height],[x+width,y+height]]) output+=`<rect x="${cx-3}" y="${cy-3}" width="6" height="6" fill="white" stroke="#0D99FF"/>`;
    if(width>100 && height>20) output+=`<rect x="${x+width/2-28}" y="${y+height+7}" width="56" height="16" rx="2" fill="#0D99FF"/><text x="${x+width/2}" y="${y+height+18}" fill="white" text-anchor="middle" font-family="Inter, sans-serif" font-size="9">${Math.round(width)} × ${Math.round(height)}</text>`;
    return output;
  }
  function tick(now) {
    frame=0;
    if(finished) return;
    try {
      time+=Math.min((now-last)/1000,.05);last=now;
      if(time>tempo.intro) start();
      let overlays='';
      if(started) {
        queue.sort((a,b)=>readBounds(a).top-readBounds(b).top);
        // Do not spend visible animation time on blocks already scrolled past.
        for(let i=queue.length-1;i>=0;i--) if(readBounds(queue[i]).bottom<0) reveal(queue.splice(i,1)[0]);
        const busy=workers.filter(worker=>worker.task).length;
        if(queue.length && time>=nextDispatch && busy<(innerWidth<760?tempo.mobileTeams:tempo.desktopTeams)) {
          for(let i=0;i<teamCount;i++) {
            const index=(nextTeam+i)%teamCount;
            if(workers[index].task) continue;
            begin(workers[index],queue.shift());
            nextTeam=(index+1)%teamCount;
            nextDispatch=time+tempo.stagger;
            break;
          }
        }
      }
      let active=0;
      for(const worker of workers) {
        if(!started) {
          const angle=time*.95+worker.id/18*Math.PI*2;
          const radius=(innerWidth<600?80:115)+Math.sin(time*2+worker.id)*9;
          worker.x=innerWidth/2+Math.cos(angle)*radius;
          worker.y=innerHeight/2+Math.sin(angle)*radius;
          worker.rotation=angle*180/Math.PI+128;
        } else if(worker.task) {
          active++;
          const {job,start:at,duration,fromX,fromY}=worker.task;
          const elapsed=time-at, bounds=readBounds(job);
          if(bounds.bottom<0 || bounds.top>innerHeight+120) {reveal(job);worker.task=null;worker.node.style.opacity='0';continue;}
          if(elapsed<tempo.travel) {
            shape(worker,'pointer');
            const p=ease(elapsed/tempo.travel);
            worker.x=fromX+(bounds.x-fromX)*p;worker.y=fromY+(bounds.y-fromY)*p;
          } else if(elapsed<tempo.travel+tempo.outline) {
            const p=ease((elapsed-tempo.travel)/tempo.outline);
            shape(worker,'cross');
            worker.x=bounds.x+bounds.width*p;worker.y=bounds.y;
            overlays+=selection(bounds,p,false);
          } else {
            const p=clamp((elapsed-tempo.travel-tempo.outline)/duration);
            job.el.dataset.buildState='active';
            if(job.mode==='text') {
              shape(worker,'beam');
              const caret=type(job,p,bounds);
              worker.x=caret.x;worker.y=caret.y;
            } else {
              shape(worker,p<.7?'cross':'pen');
              const shell=ease(clamp(p/.5));
              job.el.style.clipPath=`inset(0 ${(1-shell)*100}% ${(1-shell)*100}% 0)`;
              job.details.forEach((el,i)=>{
                const delay=.18+i/Math.max(1,job.details.length-1)*.38;
                el.style.setProperty('--build-detail-opacity',clamp((p-delay)/.28));
              });
              worker.x=bounds.x+bounds.width*p;worker.y=bounds.y+bounds.height*p;
            }
            overlays+=selection(bounds,1,true);
            if(p===1) {
              const settle=clamp((elapsed-tempo.travel-tempo.outline-duration)/tempo.settle);
              shape(worker,'pointer');
              worker.x+=(bounds.right-worker.x)*ease(settle);
              worker.y+=(bounds.bottom-worker.y)*ease(settle);
              overlays+=`<path d="M${bounds.x} 18V${innerHeight}M18 ${bounds.y}H${innerWidth}" stroke="#F24822" stroke-width=".75" opacity="${.55*(1-settle)}" fill="none"/>`;
              if(settle===1) {reveal(job);worker.task=null;}
            }
          }
        } else if(worker.id>=teamCount && workers[worker.id-teamCount].task) {
          // A second cursor measures the opposite edge while its teammate fills the block.
          const task=workers[worker.id-teamCount].task, bounds=readBounds(task.job);
          const elapsed=time-task.start, travel=ease(clamp(elapsed/tempo.travel));
          const progress=clamp((elapsed-tempo.travel)/(tempo.outline+task.duration));
          worker.node.style.opacity='1';worker.rotation=0;
          shape(worker,elapsed<tempo.travel?'pointer':'cross');
          worker.x=task.helperX+(bounds.right-task.helperX)*travel;
          worker.y=task.helperY+(bounds.y+bounds.height*progress-task.helperY)*travel;
        } else {
          worker.node.style.opacity='0';
        }
        worker.node.style.transform=`translate(${worker.x-5}px,${worker.y-4}px) rotate(${worker.rotation}deg)`;
      }
      guideSvg.innerHTML=overlays;
      stage.classList.toggle('is-working',active>0);
      skip.hidden=started && active===0 && queue.length===0;
      if(!started || active>0 || queue.length>0) frame=requestAnimationFrame(tick);
      else if(jobs.every(job=>job.state==='done')) cleanup();
    } catch(error) {
      cleanup();
      console.error('Visual construction was skipped:',error);
    }
  }
  function onResize() {
    // Finish currently measured blocks before the layout changes; future ones measure anew.
    for(const worker of workers) if(worker.task) {reveal(worker.task.job);worker.task=null;}
    rulers();wake();
  }
  function onScroll() {rulers();wake();}
  function onKey(event) {if(event.key==='Escape') cleanup();}
  function onMotion() {if(reduced.matches) cleanup();}
  function cleanup() {
    if(finished) return;
    finished=true;cancelAnimationFrame(frame);observer.disconnect();
    jobs.forEach(reveal);stage.remove();skip.remove();
    window.removeEventListener('scroll',onScroll);
    window.removeEventListener('resize',onResize);
    window.removeEventListener('keydown',onKey);
    window.removeEventListener('pagehide',cleanup);
    reduced.removeEventListener('change',onMotion);
  }
  skip.addEventListener('click',cleanup);
  window.addEventListener('keydown',onKey);
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onResize,{passive:true});
  window.addEventListener('pagehide',cleanup);
  reduced.addEventListener('change',onMotion);
  rulers();
  Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,2000))]).then(()=>{fontReady=true;wake();});
  wake();
})();
