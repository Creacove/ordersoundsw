import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const section = document.querySelector<HTMLElement>('.section-two')!;
const hero = document.querySelector<HTMLElement>('[data-hero]')!;
const stage = hero.querySelector<HTMLElement>('.hero__stage')!;
const copy = hero.querySelector<HTMLElement>('.hero__copy')!;
const prop = (name:string) => section.querySelector<HTMLElement>(`[data-s2="${name}"]`)!;
const nav = document.querySelector<HTMLElement>('.hero__nav')!;
document.querySelector('.hero-journey__sticky')!.append(nav);
nav.style.zIndex = '60';
const images = [...section.querySelectorAll<HTMLImageElement>('img')];
const mm = gsap.matchMedia();
Promise.all(images.map(image => image.decode().catch(() => {}))).then(() => {
 mm.add({motion:'(prefers-reduced-motion: no-preference)',mobile:'(max-width:600px)',tablet:'(min-width:601px) and (max-width:1000px)'}, context => {
  if(!context.conditions?.motion) return;
  const mobile = context.conditions.mobile;
  const pieces = ['releases','marketing','business','opportunities','next'];
  const bounds = prop('record').getBoundingClientRect();
  const source = hero.querySelector('.hero__standin-sleeve')!.getBoundingClientRect();
  const stageBox = stage.getBoundingClientRect();
  const scale = bounds.width * .65 / source.width;
  const x = bounds.left - stageBox.left - (source.left-stageBox.left)*scale;
  const y = bounds.top - stageBox.top - (source.top-stageBox.top)*scale;
  const bridge = {progress:0};
  const sync = () => {
   hero.dispatchEvent(new CustomEvent('desk:scroll',{detail:{progress:bridge.progress}}));
   hero.style.setProperty('--s2-brand-opacity', String(1-Math.min(1,bridge.progress/.14)));
   copy.inert = bridge.progress > .1;
   section.inert = bridge.progress < .08;
  };
  hero.addEventListener('desk:ready',sync);
  gsap.set(section,{visibility:'visible'});
  gsap.set(prop('record'),{visibility:'hidden'});
  gsap.set(section.querySelector('.section-two__environment'),{opacity:0});
  gsap.set(section.querySelectorAll('.s2-line,.section-two__eyebrow'),{opacity:0,y:18});
  const timeline = gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.hero-journey',start:'top top',end:'bottom bottom',scrub:.65,invalidateOnRefresh:true}});
  timeline.to(bridge,{progress:1,duration:1,onUpdate:sync},0)
   .to(copy,{opacity:0,y:-24,duration:.09},.01)
   .to(hero.querySelector('.turn-control'),{autoAlpha:0,duration:.045},0)
   .to(stage,{x,y,scale,duration:.20,ease:'power2.inOut'},.01)
   .to(section.querySelector('.section-two__environment'),{opacity:1,duration:.18},.02)
   .to(section.querySelectorAll('.section-two__eyebrow,.s2-line'),{opacity:1,y:0,duration:.08,stagger:.018,ease:'power2.out'},.08);
  // One light field spans both sections. Broad daylight drifts with the turn;
  // the floor reflection opens during the spread, then quiets at resolution.
  timeline.to('.studio-daylight',{xPercent:6,yPercent:-2,rotation:2,duration:.66},0)
   .to('.studio-shade',{xPercent:4,yPercent:2,opacity:.7,duration:.66},0)
   .to('.studio-refraction',{opacity:.65,xPercent:5,duration:.28,ease:'power2.out'},.16)
   .to('.studio-daylight',{xPercent:9,rotation:0,opacity:.8,duration:.23,ease:'power2.inOut'},.72)
   .to('.studio-shade',{opacity:.42,xPercent:6,duration:.23},.72)
   .to('.studio-refraction',{opacity:.2,xPercent:9,duration:.23},.72)
   .to('.s2-bundle-contact',{opacity:.85,scaleX:1,duration:.10,ease:'power2.out'},.89);
  // The same sleeve travels through the scene; only its branding clears.

  const angles = [-5,4,3,-6,3];
  const arrivals = [.20,.27,.34,.41,.48];
  const stack = prop('handled').getBoundingClientRect();
  pieces.forEach((name,i) => {
   const el = prop(name),r=el.getBoundingClientRect();
   const startX=bounds.left+bounds.width*.3-r.left-r.width*.5;
   const startY=bounds.top+bounds.height*.35-r.top-r.height*.5;
   timeline.fromTo(el,{x:startX,y:startY,scale:.7,opacity:0,rotation:0},
    {x:0,y:0,scale:1,opacity:1,rotation:angles[i]*(mobile?.5:1),duration:.13,ease:'power2.out'},arrivals[i]);
   // Different paths settle into the photographed bundle's paper footprint.
   timeline.to(el,{x:stack.left+stack.width*(.46+i*.012)-r.left-r.width*.5,
    y:stack.top+stack.height*(.42+i*.025)-r.top-r.height*.5,
    rotation:-5+i*2,scale:Math.min(1.15,stack.width*.7/r.width),duration:.16,ease:'power2.inOut'},.72+i*.008)
    .to(el,{opacity:0,duration:.05},.88);
  });
  if(mobile) timeline.to(prop('business'),{opacity:0,duration:.05},.54);
  timeline.to(stage,{x:x-innerWidth*(mobile?.03:.035),y:y-innerHeight*(mobile?.025:.065),scale:scale*1.12,duration:.17,ease:'power2.inOut'},.72)
   .to(stage,{opacity:0,duration:.09,ease:'power2.inOut'},.82)
   .fromTo(prop('handled'),{opacity:0,y:5},{opacity:1,y:0,duration:.05},.88)
   .to(prop('handled'),{x:()=> {const area=section.getBoundingClientRect();return area.width*(mobile?.5:context.conditions?.tablet?.55:.72)-(stack.left+stack.width*.5);},y:()=>-innerHeight*(mobile?.07:.13),scale:mobile?1.48:1.22,duration:.10,ease:'power2.inOut'},.89);
  sync();
  if(import.meta.env.DEV){
   const states = {initial:.17,scattered:.67,gathering:.83,final:1};
   const state=new URLSearchParams(location.search).get('s2');
   const seek=(p:number)=>{timeline.scrollTrigger?.disable(false);timeline.progress(p);};
   (window as any).__sectionTwo={seek};
   if(state && state in states) seek(states[state as keyof typeof states]);
  }
  return () => {hero.removeEventListener('desk:ready',sync);hero.dispatchEvent(new CustomEvent('desk:scroll',{detail:{progress:0}}));copy.inert=false;section.inert=false;};
 });
});
