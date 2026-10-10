import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setupSectionThree } from './section-three';

gsap.registerPlugin(ScrollTrigger);

const section=document.querySelector<HTMLElement>('.chapter--work .section-two')!;
const chapter=document.querySelector<HTMLElement>('.chapter--work')!;
const hero=document.querySelector<HTMLElement>('[data-hero]')!;
const heroChapter=document.querySelector<HTMLElement>('.chapter--hero')!;
const objectStage=document.querySelector<HTMLElement>('.object-stage')!;
const stage=objectStage.querySelector<HTMLElement>('.hero__stage')!;
const prop=(name:string)=>objectStage.querySelector<HTMLElement>('[data-s2="'+name+'"]')!;
const images=[...objectStage.querySelectorAll<HTMLImageElement>('[data-s2] img')];
const load=()=>Promise.all(images.map(img=>img.decode().catch(()=>{})));
const mm=gsap.matchMedia();

mm.add({motion:'(prefers-reduced-motion:no-preference)',mobile:'(max-width:600px)',tablet:'(min-width:601px) and (max-width:1000px)'},context=>{
 if(!context.conditions?.motion){section.inert=false;return;}
 const mobile=context.conditions.mobile,tablet=context.conditions.tablet;
 const pieces=['releases','marketing','business','opportunities','next'];
 const bounds=prop('record').getBoundingClientRect(),stack=prop('handled').getBoundingClientRect();
 const area=objectStage.getBoundingClientRect();
 const source=stage.querySelector('.hero__standin-sleeve')!.getBoundingClientRect(),stageBox=stage.getBoundingClientRect();
 const scale=bounds.width*.65/source.width;
 const x=bounds.left-stageBox.left-(source.left-stageBox.left)*scale;
 const y=bounds.top-stageBox.top-(source.top-stageBox.top)*scale;

 gsap.set(prop('record'),{visibility:'hidden'});
 gsap.set(section,{visibility:'visible'});

 const lines=[...section.querySelectorAll<HTMLElement>('.s2-line')];
 const eyebrow=section.querySelector<HTMLElement>('.section-two__eyebrow')!;
 gsap.set(lines,{opacity:.2,yPercent:110,x:10});
 gsap.set(eyebrow,{opacity:0,y:12});

 // Copy enters with the scrolling chapter, then belongs to normal page flow.
 const copyTl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}})
  .to(eyebrow,{opacity:1,y:0,duration:.34},0)
  .to(lines[0],{opacity:1,yPercent:0,x:0,duration:.52},.08)
  .to(lines[1],{opacity:1,yPercent:0,x:0,duration:.52},.20)
  .to(lines[2],{opacity:1,yPercent:0,x:0,duration:.52},.32);

 // The physical performance is intentionally short: reveal, read, gather, resolve.
 // The bound Desk stack is the payoff of Section 2 and then holds.
 const physicalTl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
 physicalTl
  .to(stage,{x,y,scale,duration:.42,ease:'power3.inOut'},0)
  .to(objectStage.querySelector('.turn-control'),{autoAlpha:0,duration:.18},0);

 const angles=[-5,4,3,-6,3];
 const arrivals=[.12,.22,.32,.42,.52];
 arrivals.forEach((at,i)=>{
  const el=prop(pieces[i]),r=el.getBoundingClientRect();
  physicalTl.fromTo(el,{
    x:bounds.left+bounds.width*.3-r.left-r.width*.5,
    y:bounds.top+bounds.height*.35-r.top-r.height*.5,
    scale:.72,opacity:0,rotation:0
   },{
    x:0,y:0,scale:1,opacity:1,
    rotation:angles[i]*(mobile?.5:1),
    duration:.35,ease:'power2.out'
   },at)
   .to(el,{
    x:stack.left+stack.width*(.46+i*.012)-r.left-r.width*.5,
    y:stack.top+stack.height*(.42+i*.025)-r.top-r.height*.5,
    rotation:-5+i*2,
    scale:Math.min(1.15,stack.width*.7/r.width),
    duration:.38,ease:'power3.inOut'
   },.86+i*.018)
   .to(el,{opacity:0,duration:.14,ease:'power1.out'},1.25);
 });

 physicalTl
  .to(stage,{opacity:0,y:y-14,scale:scale*1.04,duration:.30,ease:'power2.inOut'},1.00)
  .to('.s2-bundle-contact',{opacity:.85,scaleX:1,duration:.25,ease:'power2.out'},1.23)
  .fromTo(prop('handled'),{opacity:0,y:5},{
    opacity:1,
    x:area.width*(mobile?.5:tablet?.55:.72)-(stack.left-area.left+stack.width*.5),
    y:-area.height*(mobile?.07:.13),
    scale:mobile?1.48:1.22,
    duration:.34,ease:'power3.out'
   },1.24)
  .to({}, {duration:.08},1.52);

 // Measure the resolved bundle once so Section 3 can inherit it exactly.
 physicalTl.progress(1);
 const final=prop('handled').getBoundingClientRect();
 const bundle={left:final.left-area.left,top:final.top-area.top,width:final.width};
 physicalTl.progress(0).pause();

 const cleanupThree=setupSectionThree(bundle);
 let playTicket=0;
 const playPhysical=()=>{
  const ticket=++playTicket;
  void load().then(()=>{
   if(ticket!==playTicket)return;
   gsap.killTweensOf(physicalTl);
   physicalTl.timeScale(1).play();
  });
 };
 const resetPhysical=()=>{
  playTicket++;
  gsap.killTweensOf(physicalTl);
  physicalTl.timeScale(2.2).reverse();
 };

 // Start returning the sleeve almost as soon as Section 1 begins to leave, so it is fully front-facing before Section 2 takes over.
 const heroReturn=ScrollTrigger.create({
  trigger:heroChapter,
  start:'bottom 88%',
  onEnter:()=>{hero.dataset.handoff='front';hero.dispatchEvent(new CustomEvent('desk:return-front'));},
  onLeaveBack:()=>{hero.dataset.handoff='back';hero.dispatchEvent(new CustomEvent('desk:return-back'));}
 });

 // Let Section 2 copy arrive before the physical work expands.
 const copyTrigger=ScrollTrigger.create({
  trigger:chapter,
  start:'top 78%',
  onEnter:()=>copyTl.play(),
  onLeaveBack:()=>copyTl.reverse()
 });

 const physicalTrigger=ScrollTrigger.create({
  trigger:chapter,
  start:'top 20%',
  onEnter:playPhysical
 });

 // Hysteresis: do not nervously reverse at the same threshold.
 const physicalReset=ScrollTrigger.create({
  trigger:chapter,
  start:'top 68%',
  onLeaveBack:resetPhysical
 });

 // Defensive only: a very fast swipe should still leave Section 2 resolved.
 const finalize=ScrollTrigger.create({
  trigger:chapter,
  start:'top -10%',
  onEnter:()=>{
   if(physicalTl.progress()<1){
    const ticket=++playTicket;
    physicalTl.pause();
    void load().then(()=>{
     if(ticket!==playTicket)return;
     gsap.killTweensOf(physicalTl);
     gsap.to(physicalTl,{time:physicalTl.duration(),duration:.28,ease:'power2.out'});
    });
   }
  }
 });

 if(import.meta.env.DEV){
  const states={initial:.05,scattered:.50,gathering:.74,final:1};
  const seek=async(p:number)=>{
   playTicket++;
   await load();
   physicalTl.pause().progress(p);
   scrollTo(0,chapter.offsetTop);
  };
  (window as any).__sectionTwo={seek,info:()=>({time:physicalTl.time(),duration:physicalTl.duration(),state:chapter.dataset.state})};
  const state=new URLSearchParams(location.search).get('s2');
  if(state&&state in states)void seek(states[state as keyof typeof states]);
 }

 return()=>{
  playTicket++;
  heroReturn.kill();
  copyTrigger.kill();
  physicalTrigger.kill();
  physicalReset.kill();
  finalize.kill();
  copyTl.kill();
  gsap.killTweensOf(physicalTl);
  physicalTl.kill();
  cleanupThree();
 };
});