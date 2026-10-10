import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupSectionThree(bundle:{left:number;top:number;width:number}){
 const root=document.querySelector<HTMLElement>('.chapter--signals .section-three')!;
 const chapter=document.querySelector<HTMLElement>('.chapter--signals')!;
 const find=(s:string)=>document.querySelector<HTMLElement>(s)!;
 const objectStage=document.querySelector<HTMLElement>('.object-stage')!;
 const handled=find('.s2-handled');
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

 // Copy arrives with the chapter before we touch the bound Desk stack.
 const copyTl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}})
  .fromTo(find('.s3-eyebrow'),{x:-12},{opacity:1,x:0,duration:.34},0)
  .to(lines[0],{yPercent:0,opacity:1,duration:.58},.10)
  .fromTo(lines[1],{x:8},{x:0,yPercent:0,opacity:1,duration:.58},.20)
  .fromTo(find('.section-three__copy>p'),{y:10},{y:0,opacity:1,duration:.44},.34);

 // Section 3 starts only after the new world is substantially in view.
 // Until this performance begins, Section 2's bound stack remains untouched.
 const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
 tl
  .to(find('.s3-stack'),{opacity:1,duration:.24},0)
  .to(handled.querySelector('img'),{opacity:0,duration:.24},0)
  .to(find('.s3-band'),{opacity:1,duration:.10},0)
  .to(find('.s3-band'),{y:65,opacity:0,duration:.34,ease:'power2.in'},.12);

 ['timing','content','budget'].forEach((name,i)=>{
  const el=find('.s3-'+name),r=el.getBoundingClientRect();
  tl.fromTo(el,{
    x:bounds.left+bounds.width*.5-r.left-r.width*.5,
    y:bounds.top+bounds.height*.35-r.top-r.height*.5,
    scale:.8,
    rotation:3-i*3
   },{
    x:0,y:0,scale:1,rotation:0,opacity:1,
    duration:.46,ease:'power2.out'
   },.22+i*.11);
 });

 tl
  .fromTo(find('.s3-lens'),{x:-35,y:20,rotation:-5},{x:30,y:-10,rotation:3,opacity:.42,duration:.58,ease:'power2.inOut'},.76)
  .to(find('.s3-stack'),{opacity:.32,duration:.48},.76)
  .to(find('.s3-stack'),{opacity:.08,duration:.36},1.30)
  .to(find('.s3-lens'),{opacity:.08,duration:.36},1.30)
  .fromTo(find('.s3-decision'),{y:25},{opacity:1,y:0,duration:.46,ease:'power3.out'},1.30)
  .fromTo(find('.s3-decision strong'),{y:8,opacity:0},{y:0,opacity:1,duration:.34},1.44)
  .fromTo(find('.s3-action'),{y:40},{opacity:1,y:0,duration:.38,ease:'power3.out'},1.82)
  .fromTo(find('.s3-action strong'),{y:6,opacity:0},{y:0,opacity:1,duration:.28},1.92)
  .to({}, {duration:.08},2.18);

 let ticket=0;
 const play=()=>{
  const id=++ticket;
  void load().then(()=>{
   if(id!==ticket)return;
   tl.timeScale(1).play();
  });
 };
 const reset=()=>{
  ticket++;
  tl.timeScale(2.1).reverse();
  gsap.to(handled.querySelector('img'),{opacity:1,duration:.22,overwrite:true});
 };

 const copyTrigger=ScrollTrigger.create({
  trigger:chapter,
  start:'top 78%',
  onEnter:()=>copyTl.play(),
  onLeaveBack:()=>copyTl.reverse()
 });

 // This is the important handoff: new background/copy first, then the bundle opens.
 const physicalTrigger=ScrollTrigger.create({
  trigger:chapter,
  start:'top 20%',
  onEnter:play
 });

 // Hysteresis avoids flickering when the user nudges the scroll direction.
 const physicalReset=ScrollTrigger.create({
  trigger:chapter,
  start:'top 66%',
  onLeaveBack:reset
 });

 // Defensive finalization for a fast swipe only.
 const finalize=ScrollTrigger.create({
  trigger:chapter,
  start:'top -10%',
  onEnter:()=>{
   if(tl.progress()<1){
    ticket++;
    tl.tweenTo(tl.duration(),{duration:.30,ease:'power2.out'});
   }
  }
 });

 if(import.meta.env.DEV){
  const states={handoff:.06,signals:.38,focus:.62,decision:.82,final:1};
  const seek=async(p:number)=>{
   ticket++;
   await load();
   tl.pause().progress(p);
   scrollTo(0,chapter.offsetTop);
  };
  (window as any).__sectionThree={seek,info:()=>({time:tl.time(),duration:tl.duration(),state:chapter.dataset.state})};
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
  tl.kill();
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
