import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupSectionThree(bundle:{left:number;top:number;width:number}){
 const root=document.querySelector<HTMLElement>('.chapter--signals .section-three')!;
 const chapter=document.querySelector<HTMLElement>('.chapter--signals')!;
 const find=(s:string)=>document.querySelector<HTMLElement>(s)!;
 const objectStage=document.querySelector<HTMLElement>('.object-stage')!;
 const images=[...objectStage.querySelectorAll<HTMLImageElement>('.s3-stage img[data-src]')];
 const load=()=>Promise.all(images.map(img=>{
  if(img.dataset.src&&!img.getAttribute('src'))img.src=img.dataset.src;
  return img.decode().catch(()=>{});
 }));
 const area=objectStage.getBoundingClientRect(),stage=find('.s3-stage').getBoundingClientRect();

 gsap.set(root,{visibility:'visible'});
 root.inert=false;
 gsap.set([find('.s3-stack'),find('.s3-band')],{
  left:bundle.left-(stage.left-area.left),
  top:bundle.top-(stage.top-area.top),
  width:bundle.width
 });
 const bounds=find('.s3-stack').getBoundingClientRect();

 gsap.set(document.querySelectorAll('.s3-eyebrow,.section-three__copy>p,.s3-stack,.s3-band,.s3-paper,.s3-lens,.s3-decision'),{opacity:0});
 const lines=[...root.querySelectorAll<HTMLElement>('.s3-line')];
 gsap.set(lines,{yPercent:110,opacity:.2});

 // Copy arrives with the Section 3 world while the bound Section 2 stack remains untouched.
 const copyTl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}})
  .fromTo(find('.s3-eyebrow'),{x:-12},{opacity:1,x:0,duration:.36},0)
  .to(lines[0],{yPercent:0,opacity:1,duration:.60},.10)
  .fromTo(lines[1],{x:8},{x:0,yPercent:0,opacity:1,duration:.60},.22)
  .fromTo(find('.section-three__copy>p'),{y:10},{y:0,opacity:1,duration:.46},.34);

 // Physical Section 3 only begins once this chapter is substantially in view.
 // Until then the resolved bound stack from Section 2 is the persistent object.
 const physicalTl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
 physicalTl
  .to(find('.s3-stack'),{opacity:1,duration:.26},0)
  .to('.s2-handled img',{opacity:0,duration:.26},0)
  .to(find('.s3-band'),{opacity:1,duration:.10},0)
  .to(find('.s3-band'),{y:65,opacity:0,duration:.42,ease:'power2.in'},.12);

 ['timing','content','budget'].forEach((name,i)=>{
  const el=find('.s3-'+name),r=el.getBoundingClientRect();
  physicalTl.fromTo(el,{
    x:bounds.left+bounds.width*.5-r.left-r.width*.5,
    y:bounds.top+bounds.height*.35-r.top-r.height*.5,
    scale:.8,rotation:3-i*3,opacity:0
   },{
    x:0,y:0,scale:1,rotation:0,opacity:1,
    duration:.52,ease:'power2.out'
   },.18+i*.13);
 });

 physicalTl
  .fromTo(find('.s3-lens'),{x:-35,y:20,rotation:-5,opacity:0},{
    x:30,y:-10,rotation:3,opacity:.42,duration:.62,ease:'power2.inOut'
   },.82)
  .to(find('.s3-stack'),{opacity:.32,duration:.55},.82)
  .to(find('.s3-stack'),{opacity:.08,duration:.40},1.42)
  .to(find('.s3-lens'),{opacity:.08,duration:.40},1.42)
  .fromTo(find('.s3-decision'),{y:25,opacity:0},{opacity:1,y:0,duration:.50,ease:'power3.out'},1.45)
  .fromTo(find('.s3-decision strong'),{y:8,opacity:0},{y:0,opacity:1,duration:.36},1.58)
  .fromTo(find('.s3-action'),{y:40,opacity:0},{opacity:1,y:0,duration:.40,ease:'power3.out'},1.98)
  .fromTo(find('.s3-action strong'),{y:6,opacity:0},{y:0,opacity:1,duration:.28},2.10)
  .to({}, {duration:.18},2.36);

 let playTicket=0;
 const playPhysical=()=>{
  const ticket=++playTicket;
  void load().then(()=>{
   if(ticket!==playTicket)return;
   physicalTl.timeScale(1).play();
  });
 };
 const resetPhysical=()=>{
  playTicket++;
  physicalTl.timeScale(2).reverse();
 };

 // Start loading early, while the Section 2 stack still bridges into the new world.
 const copyTrigger=ScrollTrigger.create({
  trigger:chapter,
  start:'top 78%',
  onEnter:()=>{
   void load();
   copyTl.play();
  },
  onLeaveBack:()=>copyTl.reverse()
 });

 const physicalTrigger=ScrollTrigger.create({
  trigger:chapter,
  start:'top 20%',
  onEnter:playPhysical
 });

 // Hysteresis keeps small scroll reversals from making the object chatter.
 const physicalReset=ScrollTrigger.create({
  trigger:chapter,
  start:'top 68%',
  onLeaveBack:resetPhysical
 });

 const finalize=ScrollTrigger.create({
  trigger:chapter,
  start:'top -18%',
  onEnter:()=>{
   if(physicalTl.progress()<1){
    playTicket++;
    gsap.to(physicalTl,{time:physicalTl.duration(),duration:.32,ease:'power2.out'});
   }
  }
 });

 if(import.meta.env.DEV){
  const states={handoff:.04,signals:.35,focus:.58,decision:.78,final:1};
  const seek=async(p:number)=>{
   playTicket++;
   await load();
   physicalTl.pause().progress(p);
   scrollTo(0,chapter.offsetTop);
  };
  (window as any).__sectionThree={seek,info:()=>({time:physicalTl.time(),duration:physicalTl.duration(),state:chapter.dataset.state})};
  const key=new URLSearchParams(location.search).get('s3');
  if(key&&key in states)void seek(states[key as keyof typeof states]);
 }

 return()=>{
  playTicket++;
  copyTrigger.kill();
  physicalTrigger.kill();
  physicalReset.kill();
  finalize.kill();
  copyTl.kill();
  physicalTl.kill();
 };
}

const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const showStatic=()=>{
 if(!reduced.matches)return;
 const root=document.querySelector<HTMLElement>('.section-three')!;
 root.inert=false;
 document.querySelectorAll<HTMLImageElement>('.s3-stage img[data-src]').forEach(img=>{
  img.src=img.dataset.src!;
  img.loading='lazy';
 });
};
showStatic();
reduced.addEventListener('change',showStatic);