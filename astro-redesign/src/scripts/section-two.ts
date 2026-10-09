import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector<HTMLElement>('.section-two')!;
const hero = document.querySelector<HTMLElement>('[data-hero]')!;
const prop = (name: string) => section.querySelector<HTMLElement>(`[data-s2="${name}"]`)!;
const nav = hero.querySelector<HTMLElement>('.hero__nav')!;
document.querySelector('.hero-journey__sticky')!.append(nav);
nav.style.zIndex = '60';
const images = [...section.querySelectorAll<HTMLImageElement>('img')];
const mm = gsap.matchMedia();
Promise.all(images.map(image => image.decode().catch(() => {}))).then(() => {
 mm.add('(prefers-reduced-motion: no-preference)', () => {
  const mobile = innerWidth <= 600;
  const record = prop('record');
  const pieces = ['releases','marketing','business','opportunities','next'];
  const timeline = gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
   trigger:'.hero-journey',start:'top top',end:'bottom bottom',scrub:.6,invalidateOnRefresh:true,
  }});
  const bounds = record.getBoundingClientRect();
  const original = hero.querySelector('.hero__standin-sleeve')!.getBoundingClientRect();
  const sourceScale = original.height / (bounds.width * .75);
  gsap.set(section,{autoAlpha:1});
  gsap.set(section.querySelector('.section-two__environment'),{opacity:0});
  gsap.set(section.querySelector('.section-two__copy'),{opacity:0,y:12});
  gsap.set(record,{opacity:0});
  timeline.to(hero.querySelectorAll('.hero__copy,.turn-control'),{opacity:0,y:-12,duration:.07},0)
   .fromTo(record,{x:original.left-bounds.left,y:original.top-bounds.top,scale:sourceScale,transformOrigin:'0 0'},
    {x:0,y:0,scale:1,duration:.12},0)
   .to(record,{opacity:1,duration:.035},.025)
   .to(hero.querySelector('.hero__stage'),{opacity:0,duration:.035},.025)
   .to(section.querySelector('.section-two__environment'),{opacity:1,duration:.1},.025)
   .to(section.querySelector('.section-two__copy'),{opacity:1,y:0,duration:.09},.035);
  const angles = [-5,4,3,-6,3];
  pieces.forEach((name,i) => {
   const element = prop(name), r = element.getBoundingClientRect();
   const x = bounds.left + bounds.width*.35 - (r.left+r.width*.5);
   const y = bounds.top + bounds.height*.35 - (r.top+r.height*.5);
   timeline.fromTo(element,{x,y,scale:.65,opacity:0,rotation:0},{x:0,y:0,scale:1,opacity:1,rotation:mobile?angles[i]*.5:angles[i],duration:.15},.12+i*.085);
   // Each sheet aligns and lays down into the same bundle footprint.
   const stack = prop('handled').getBoundingClientRect();
   timeline.to(element,{x:stack.left+stack.width*.46-r.left-r.width*.5,
    y:stack.top+stack.height*.42-r.top-r.height*.5,rotation:-8+i*2,
    scale:.74+i*.025,duration:.15},.72+i*.008)
    .to(element,{opacity:0,duration:.06},.87);
  });
  if(mobile){timeline.to(prop('business'),{opacity:0,duration:.06},.53).to(prop('releases'),{opacity:1,duration:.05},.56);}
  timeline.to(record,{x:()=>innerWidth*(mobile?-.08:-.04),y:()=>-innerHeight*(mobile?.04:.13),scale:mobile?1.1:1.15,duration:.16},.72)
   .fromTo(prop('handled'),{opacity:0,y:8},{opacity:1,y:0,duration:.06},.87)
   .to({}, {duration:.07},.93);
  if(import.meta.env.DEV){
   const states = {initial:.10,scattered:.67,gathering:.82,final:1};
   const state = new URLSearchParams(location.search).get('s2');
   if(state && state in states){timeline.scrollTrigger?.disable(false);timeline.progress(states[state as keyof typeof states]);}
   (window as any).__sectionTwo = {seek:(progress:number)=>{timeline.scrollTrigger?.disable(false);timeline.progress(progress);}};
  }
  return () => {timeline.scrollTrigger?.kill();timeline.kill();};
 });
});
