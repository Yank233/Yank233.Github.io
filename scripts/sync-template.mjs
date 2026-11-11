// Keep the supplied Swarm renderer and animation engine; adapt only the content,
// responsive artboard, native links, images and accessibility controls.
import {readFile, writeFile} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
let source = await readFile(new URL('vendor/swarm-template.js', root), 'utf8');
function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Template integration point missing: ${before.slice(0,80)}`);
  source = source.replace(before, after);
}
source = source.replaceAll('\r\n', '\n');
source = 'import {createBlogScene, sceneWidth, navHeight, finishScene} from "./blog-scene.js";\n' + source;
// The original template's mark belongs to Swarm. Keep the same path-drawing
// choreography but give it Yank's own Y silhouette everywhere it is rendered.
source = source.replace(/, zc = \[[\s\S]*?\n\}\];\nfunction ap/, `, zc = [{
    d: "M26 26h26l18 31 18-31h26l-31 57v31H57V83Z",
    anchors: [[26,26],[52,26],[70,57],[88,26],[114,26],[83,83],[83,114],[57,114],[57,83]]
}];
function ap`);
replace('const Kt = 1280', 'const Kt = sceneWidth');
replace('const t = ap( () => this.cursors.filter(n => n.worked).length + this.retiredWorkers);', 'const t = createBlogScene(ap, {R, O, he, lt, br, zc}, () => this.cursors.filter(n => n.worked).length + this.retiredWorkers);\n        this.actions = t.actions;');
replace('  , mu = 64;', '  , mu = navHeight;');
// Preserve word boundaries in Latin text and measure Chinese wrapping correctly.
replace('const p = a.split(" ");', 'const p = a.match(/[\\u2E80-\\uFFFF]|[^\\s\\u2E80-\\uFFFF]+|\\s+/gu) || [];');
replace('const h = m ? m + " " + c : c;', 'const h = m + c;');
replace('    step(t) {\n', '    step(t) {\n        if (this.completed) return;\n');
// Keep the original dependency scheduler and task choreography, slightly slower.
replace('this.tempo = Ur(2.1 + this.vel / 900 + l.length / Math.max(1, this.cursors.length) * .5, 2.1, 4.5),', 'this.tempo = .85 * Ur(2.1 + this.vel / 900 + l.length / Math.max(1, this.cursors.length) * .5, 2.1, 4.5),');
replace('className: "el-text",', 'className: "el-text",\n        "data-scene-id": e.id,');
replace('className: "el-rect",', 'className: "el-rect",\n        "data-scene-id": e.id,');
replace('background: e.styled ? e.fill : "#D9D9D9",', 'background: e.styled ? e.image ? `url("${e.image}") center / cover no-repeat` : e.fill : "#D9D9D9",');
const actionStart = source.indexOf('const sceneActions = [');
const actionEnd = source.indexOf('function _p()', actionStart);
source = source.slice(0,actionStart) + `function SceneActions({engine}) {
    const {s,left} = engine.vp;
    return x.jsx("div", {className:"scene-actions", children:engine.actions.map((action,index)=>{
        const el=engine.els.get(action.el);
        if (!el || !el.vis) return null;
        const b=engine.bounds(el);
        return x.jsx("a", {
            className:"scene-action", href:action.href || "#"+action.target,
            "aria-label":action.label, "aria-current":action.current ? "page" : undefined,
            style:{left:left+b.x*s,top:(b.y+(el.sticky?engine.stick:0))*s,width:Math.max(b.w,24)*s,height:Math.max(b.h,30)*s},
            onClick:action.target ? event=>{
                event.preventDefault();engine.start();
                const target=engine.els.get(action.target);
                if(target) window.scrollTo({top:Math.max(0,(target.y-navHeight-44)*s),behavior:reducedMotion?"instant":"smooth"});
            }:undefined
        },index);
    })});
}
` + source.slice(actionEnd);
replace('        window.swarm = e;', `        window.swarm = e;
        document.body.classList.add("scene-ready");
        const fallback=document.querySelector(".site-shell");
        fallback?.setAttribute("inert", "");
        const skip=()=>{finishScene(e);n(value=>value+1);};
        const keyboard=event=>{if(event.key==="Escape")skip();};
        const preference=matchMedia("(prefers-reduced-motion: reduce)");
        const motion=()=>{if(preference.matches)skip();};
        window.addEventListener("keydown",keyboard);
        preference.addEventListener("change",motion);
        if(preference.matches) skip();
        const autoStart=setTimeout(()=>e.start(),1800);`);
// Reload only when the artboard changes; ordinary desktop resizing uses the original scaling.
replace('            const m = document.documentElement.clientWidth\n              , c = Math.min(1, m / Kt);', `            const m = document.documentElement.clientWidth;
            if ((m < 1000 ? m : 1280) !== Kt) { location.reload(); return; }
            const c = Math.min(1, m / Kt);`);
// Retain the template's 24px page inset and 64px sticky nav at every artboard width.
replace('const qt = "#0D99FF"\n  , rt = "#F24822"\n  , Be = 20\n  , hi = 24\n  , mu = navHeight;', 'const qt = "#0D99FF"\n  , rt = "#F24822"\n  , Be = 20\n  , hi = 24\n  , mu = navHeight;');
replace('            e.step((m - a) / 1e3),', '            e.step((m - a) / 1e3),');
replace('            u = requestAnimationFrame(p)\n        }', '            !e.completed && (u = requestAnimationFrame(p))\n        }');
replace('            cancelAnimationFrame(u),', '            clearTimeout(autoStart),\n            window.removeEventListener("keydown",keyboard),\n            preference.removeEventListener("change",motion),\n            cancelAnimationFrame(u),');
replace('children: [x.jsxs("div", {\n            className: "page",', 'children: [!e.completed && x.jsx("button", {className:"scene-skip",onClick:()=>{finishScene(e);n(v=>v+1);},children:"跳过动画 ↗"}),x.jsxs("div", {\n            className: "page",');
await writeFile(new URL('js/swarm/app.js', root), source);
