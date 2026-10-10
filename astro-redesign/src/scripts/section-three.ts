import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupSectionThree(bundle:{left:number;top:number;width:number}){
 const root=document.querySelector<HTMLElement>('.chapter--signals .section-three')!;
 const chapter=document.querySelector<HTMLElement>('.chapter--signals')!;
 const objectStage=document.querySelector<HTMLElement>('.object-stage')!;
 const find=(s:string)=>objectStage.querySelector<HTMLElement>(s) ?? root.querySelector<HTMLElement>(s)!;
 const images=[...objectStage.querySelectorAll<HTMLImageElement>('.s3-stage img[data-src]')];
 const load=()=>Promise.all(images.map(img=>{
  if(img.dataset.src&&!img.getAttribute('src'))img.src=img.dataset.src;
  return img.decode().catch(()=>{});
 }));
 const area=objectStage.getBoundingClientRect();
 const stage=objectStage.querySelector<HTMLElement>('.s3-stage')!.getBoundingClientRect();

 gsap.set(root,{visibility:'visible'});
 root.inert=false;
 gsap.set([find('.s3-stack'),find('.s3-band')],{
  left:bundle.left-(stage.left-area.left),
  top:bundle.top-(stage.top-area.top),
  width:bundle.width
 });
 const bounds=find('.s3-stack').getBoundingClientRect();

 // Copy belongs to Section 3 and scrolls with the chapter; only its entrance is timed.
 const eyebrow=root.querySelector<HTMLElement>('.s3-eyebrow')!;
 const paragraph=root.querySelector<HTMLElement>('.section-three__copy>p')!;
 const lines=[...root.querySelectorAll<HTMLElement>('.s3-line')];
 gsap.set([eyebrow,paragraph],{opacity:0});
 gsap.set(lines,{yPercent:110,opacity:.2});

 const copyTl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}})
  .fromTo(eyebrow,{x:-12},{opacity:1,x:0,duration:.34},0)
  .to(lines[0],{yPercent:0,opacity:1,duration:.58},.08)
  .fromTo(lines[1],{x:8},{x:0,yPercent:0,opacity:1,duration:.58},.20)
  .fromTo(paragraph,{y:10},{y:0,opacity:1,duration:.44},.34);

 // Section 2 owns the bound stack. Section 3 only opens it after the new world
 // is substantially in view.
 const physicalNodes=[
  find('.s3-stack'),find('.s3-band'),
  ...[...objectStage.querySelectorAll<HTMLElement>('.s3-paper')],
  find('.s3-lens'),find('.s3-decision')
 ];
 gsap.set(physicalNodes,{opacity:0});

 const physicalTl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
 physicalTl
  .to(find('.s3-stack'),{opacity:1,duration:.22},0)
  .to('.s2-handled img',{opacity:0,duration:.22},0)
  .to(find('.s3-band'),{opacity:1,duration:.10},.02)
  .to(find('.s3-band'),{y:65,opacity:0,duration:.36,ease:'power3.in'},.18);

 ['timing','content','budget'].forEach((name,i)=>{
  const el=find('.s3-'+name),r=el.getBoundingClientRect();
  physicalTl.fromTo(el,{
    x:bounds.left+bounds.width*.5-r.left-r.width*.5,
    y:bounds.top+bounds.height*.35-r.top-r.height*.5,
    scale:.82,
    rotation:3-i*3,
    opacity:0
   },{
    x:0,y:0,scale:1,rotation:0,opacity:1,
    duration:.42,ease:'power2.out'
   },.34+i*.11);
 });

 physicalTl
  .fromTo(find('.s3-lens'),{x:-35,y:20,rotation:-5,opacity:0},{
    x:30,y:-10,rotation:3,opacity:.42,duration:.58,ease:'power2.inOut'
   },.84)
  .to(find('.s3-stack'),{opacity:.30,duration:.48},.84)
  .to(find('.s3-stack'),{opacity:.08,duration:.34},1.36)
  .to(find('.s3-lens'),{opacity:.08,duration:.34},1.36)
  .fromTo(find('.s3-decision'),{y:25,opacity:0},{
    opacity:1,y:0,duration:.48,ease:'power3.out'
   },1.38)
  .fromTo(find('.s3-decision strong'),{y:8,opacity:0},{
    y:0,opacity:1,duration:.32
   },1.50)
  .fromTo(find('.s3-action'),{y:40,opacity:0},{
    opacity:1,y:0,duration:.40,ease:'power3.out'
   },1.82)
  .fromTo(find('.s3-action strong'),{y:6,opacity:0},{
    y:0,opacity:1,duration:.28
   },1.94)
  .to({}, {duration:.08},2.20);

 let ticket=0;
 const playPhysical=()=>{
  const current=++ticket;
  void load().then(()=>{
   if(current!==ticket)return;
   physicalTl.timeScale(1).play();
  });
 };
 const resetPhysical=()=>{
  ticket++;
  physicalTl.timeScale(2).reverse();
 };

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

 // Use a separate upward threshold so tiny scroll reversals do not make the stack nervous.
 const physicalReset=ScrollTrigger.create({
  trigger:chapter,
  start:'top 64%',
  onLeaveBack:resetPhysical
 });

 const finalize=ScrollTrigger.create({
  trigger:chapter,
  start:'top -20%',
  onEnter:()=>{
   if(physicalTl.progress()<1){
    ticket++;
    gsap.to(physicalTl,{time:physicalTl.duration(),duration:.30,ease:'power2.out'});
   }
  }
 });

 if(import.meta.env.DEV){
  const states={handoff:.05,signals:.38,focus:.62,decision:.78,final:1};
  const seek=async(p:number)=>{
   ticket++;
   await load();
   physicalTl.pause().progress(p);
   scrollTo(0,chapter.offsetTop);
  };
  (window as any).__sectionThree={seek,info:()=>({time:physicalTl.time(),duration:physicalTl.duration(),state:chapter.dataset.state})};
  const key=new URLSearchParams(location.search).get('s3');
  if(key&&key in states)void seek(states[key as keyof typeof states]);
 }

 return()=>{
  ticket++;
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
