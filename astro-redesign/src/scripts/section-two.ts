import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cueChapter } from './chapter-cue';
import { setupSectionThree } from './section-three';

gsap.registerPlugin(ScrollTrigger);
const section=document.querySelector<HTMLElement>('.section-two')!;
const chapter=document.querySelector<HTMLElement>('.chapter--work')!;
const hero=document.querySelector<HTMLElement>('[data-hero]')!;
const copy=hero.querySelector<HTMLElement>('.hero__copy')!;
const stage=hero.querySelector<HTMLElement>('.hero__stage')!;
const workCopy=section.querySelector<HTMLElement>('.section-two__copy')!;
const signals=document.querySelector<HTMLElement>('.journey-stage .section-three')!;
const signalCopy=signals.querySelector<HTMLElement>('.section-three__copy')!;
const nav=hero.querySelector<HTMLElement>('.hero__nav')!;
document.querySelector('.journey-nav')!.append(nav);
const prop=(name:string)=>section.querySelector<HTMLElement>('[data-s2="'+name+'"]')!;
const images=[...section.querySelectorAll<HTMLImageElement>('img')];
const load=()=>Promise.all(images.map(img=>img.decode().catch(()=>{})));
const mm=gsap.matchMedia();

mm.add({motion:'(prefers-reduced-motion:no-preference)',mobile:'(max-width:600px)',tablet:'(min-width:601px) and (max-width:1000px)'},context=>{
 if(!context.conditions?.motion){section.inert=false;return;}
 const mobile=context.conditions.mobile,tablet=context.conditions.tablet;
 const pieces=['releases','marketing','business','opportunities','next'];
 const bounds=prop('record').getBoundingClientRect(),stack=prop('handled').getBoundingClientRect();
 const area=section.getBoundingClientRect();
 const source=hero.querySelector('.hero__standin-sleeve')!.getBoundingClientRect(),stageBox=stage.getBoundingClientRect();
 const scale=bounds.width*.65/source.width;
 const x=bounds.left-stageBox.left-(source.left-stageBox.left)*scale;
 const y=bounds.top-stageBox.top-(source.top-stageBox.top)*scale;
 const bridge={progress:0};
 const sync=()=>hero.dispatchEvent(new CustomEvent('desk:scroll',{detail:{progress:bridge.progress}}));
 hero.addEventListener('desk:ready',sync);
 gsap.set(prop('record'),{visibility:'hidden'});
 const lines=[...section.querySelectorAll('.s2-line')];
 gsap.set(section,{visibility:'visible'});
 gsap.set(lines,{opacity:.2,yPercent:110,x:10});
 gsap.set(section.querySelector('.section-two__eyebrow'),{opacity:0,y:12});
 const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
 tl.to(bridge,{progress:1,duration:1,onUpdate:sync},0)
  .to(stage,{x,y,scale,duration:.85,ease:'power2.inOut'},0)
  .to(hero.querySelector('.turn-control'),{autoAlpha:0,duration:.25},0)
  .to(section.querySelector('.section-two__eyebrow'),{opacity:1,y:0,duration:.34},.08);
 [.16,.36,.62].forEach((at,i)=>tl.to(lines[i],{opacity:1,yPercent:0,x:0,duration:.55},at));
 // The completed chapter keeps its final statement readable on return.
 tl.to('.studio-daylight',{xPercent:10,yPercent:-2,rotation:2,opacity:1,duration:1.6,ease:'power2.inOut'},0)
  .to('.studio-shade',{xPercent:8,yPercent:2,scale:1.08,opacity:1,duration:.85},.28)
  .to('.studio-refraction:not(.journey-focus-light)',{opacity:.65,xPercent:5,duration:.9},.28)
  .to('.studio-daylight',{xPercent:9,rotation:0,opacity:.8,duration:.65},1.65)
  .to('.studio-shade',{opacity:.42,xPercent:6,scale:1,duration:.65},1.65)
  .to('.studio-refraction:not(.journey-focus-light)',{opacity:.2,xPercent:9,duration:.65},1.65)
  .to('.s2-bundle-contact',{opacity:.85,scaleX:1,duration:.4},2.15);
 const angles=[-5,4,3,-6,3];
 [.28,.48,.55,.68,.8].forEach((at,i)=>{
  const el=prop(pieces[i]),r=el.getBoundingClientRect();
  tl.fromTo(el,{x:bounds.left+bounds.width*.3-r.left-r.width*.5,y:bounds.top+bounds.height*.35-r.top-r.height*.5,scale:.7,opacity:0,rotation:0},
   {x:0,y:0,scale:1,opacity:1,rotation:angles[i]*(mobile?.5:1),duration:.55},at)
   .to(el,{x:stack.left+stack.width*(.46+i*.012)-r.left-r.width*.5,y:stack.top+stack.height*(.42+i*.025)-r.top-r.height*.5,
    rotation:-5+i*2,scale:Math.min(1.15,stack.width*.7/r.width),duration:.55,ease:'power2.inOut'},1.65+i*.025)
   .to(el,{opacity:0,duration:.2},2.13);
 });
 tl.to(stage,{opacity:0,y:y-20,scale:scale*1.06,duration:.4,ease:'power2.inOut'},1.85)
  .fromTo(prop('handled'),{opacity:0,y:5},{opacity:1,y:0,duration:.25},2.13)
  .to(prop('handled'),{x:area.width*(mobile?.5:tablet?.55:.72)-(stack.left-area.left+stack.width*.5),y:-area.height*(mobile?.07:.13),scale:mobile?1.48:1.22,duration:.42,ease:'power2.inOut'},2.18);
 // Measure the shared bundle footprint once, without coupling chapter clocks.
 tl.progress(1);
 const final=prop('handled').getBoundingClientRect();
 const bundle={left:final.left-area.left,top:final.top-area.top,width:final.width};
 tl.progress(0).pause();
 const cleanupThree=setupSectionThree(bundle);
 const control=cueChapter(chapter,tl,load,'top 70%',[{at:'top 70%',time:1.5},{at:'top 8%',time:tl.duration()}]);
 // Only the artwork stays on stage. Copy occupies real document space.
 document.querySelector('.chapter--hero .chapter__copy')!.append(copy);
 chapter.querySelector('.chapter__copy')!.append(workCopy);
 document.querySelector('.chapter--signals .chapter__copy')!.append(signalCopy);
 // A viewport reading window keeps naturally scrolling copy clear of the
 // navigation and, on small screens, the physical objects below it.
 const hosts=[...document.querySelectorAll<HTMLElement>('.chapter__copy')];
 const clipCopy=()=>hosts.forEach(host=>{
  const r=host.getBoundingClientRect();
  const heroHost=host.parentElement?.classList.contains('chapter--hero');
  const signalHost=host.parentElement?.classList.contains('chapter--signals');
  const bottom=innerHeight*(mobile?(heroHost?.52:signalHost?.42:.37):tablet?(heroHost?.52:.4):heroHost?.9:.72);
  const right=mobile||tablet||heroHost?0:innerWidth*.60;
  if(mobile||tablet){host.style.clipPath=`inset(${Math.max(0,110-r.top)}px 0 ${Math.max(0,r.bottom-bottom)}px 0)`;host.style.maskImage='';return;}
  const topFade=Math.max(0,(heroHost?70:110)-r.top);
  const bottomFade=Math.min(r.height,bottom-r.top);
  host.style.clipPath=`inset(0 ${right}px 0 0)`;
  host.style.maskImage=`linear-gradient(to bottom,transparent ${topFade}px,#000 ${topFade+42}px,#000 ${Math.max(topFade+42,bottomFade-42)}px,transparent ${bottomFade}px)`;
 });
 const readingWindow=ScrollTrigger.create({trigger:'.hero-journey',start:'top top',end:'bottom bottom',onUpdate:clipCopy,onRefresh:clipCopy});
 clipCopy();
 // Only this camera is scrubbed. Object/light/copy timelines run on time.
 const camera=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.hero-journey',start:'top top',end:'bottom bottom',scrub:.3}})
  .fromTo('.journey-camera',{yPercent:0},{yPercent:mobile?-10:-15,duration:1},0)
  .fromTo('.studio-atmosphere',{yPercent:0},{yPercent:mobile?-14:-22,duration:1},0);
 if(import.meta.env.DEV){
  const states={initial:.22,scattered:.57,gathering:.78,final:1};
  const seek=async(p:number)=>{await control.seek(p);scrollTo(0,chapter.offsetTop);};
  (window as any).__sectionTwo={seek,info:()=>({time:tl.time(),duration:tl.duration(),state:chapter.dataset.state})};
  const state=new URLSearchParams(location.search).get('s2');if(state&&state in states)void seek(states[state as keyof typeof states]);
 }
 return()=>{readingWindow.kill();hosts.forEach(host=>{host.style.clipPath='';host.style.maskImage='';});control.dispose();cleanupThree();camera.scrollTrigger?.kill();camera.kill();hero.removeEventListener('desk:ready',sync);hero.append(copy);section.prepend(workCopy);signals.prepend(signalCopy);hero.dispatchEvent(new CustomEvent('desk:scroll',{detail:{progress:0}}));};
});
