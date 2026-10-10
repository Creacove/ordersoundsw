import gsap from 'gsap';
import { cueChapter } from './chapter-cue';

export function setupSectionThree(bundle:{left:number;top:number;width:number}){
 const root=document.querySelector<HTMLElement>('.chapter--signals .section-three')!;
 const chapter=document.querySelector<HTMLElement>('.chapter--signals')!;
 const find=(s:string)=>document.querySelector<HTMLElement>(s)!;
 const objectStage=document.querySelector<HTMLElement>('.object-stage')!;
 const images=[...objectStage.querySelectorAll<HTMLImageElement>('.s3-stage img[data-src]')];
 const load=()=>Promise.all(images.map(img=>{if(img.dataset.src&&!img.getAttribute('src'))img.src=img.dataset.src;return img.decode().catch(()=>{});}));
 const area=objectStage.getBoundingClientRect(),stage=find('.s3-stage').getBoundingClientRect();
 gsap.set(root,{visibility:'visible'});
 root.inert=false;
 gsap.set([find('.s3-stack'),find('.s3-band')],{left:bundle.left-(stage.left-area.left),top:bundle.top-(stage.top-area.top),width:bundle.width});
 const bounds=find('.s3-stack').getBoundingClientRect();
 gsap.set(document.querySelectorAll('.s3-eyebrow,.section-three__copy>p,.s3-stack,.s3-band,.s3-paper,.s3-lens,.s3-decision'),{opacity:0});
 const lines=root.querySelectorAll('.s3-line');
 gsap.set(lines,{yPercent:110,opacity:.2});
 const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
 tl.fromTo(find('.s3-eyebrow'),{x:-12},{opacity:1,x:0,duration:.36},.05)
  .to(lines[0],{yPercent:0,opacity:1,duration:.62},.16)
  .fromTo(lines[1],{x:8},{x:0,yPercent:0,opacity:1,duration:.62},.28)
  .fromTo(find('.section-three__copy>p'),{y:10},{y:0,opacity:1,duration:.48},.38)
  // A short overlap masks the registration difference in the supplied art.
  .to(find('.s3-stack'),{opacity:1,duration:.3},.45)
  .to('.s2-handled img',{opacity:0,duration:.3},.45)
  .to(find('.s3-band'),{opacity:1,duration:.12},.45)
  .to(find('.s3-band'),{y:65,opacity:0,duration:.45,ease:'power2.in'},.57);
 ['timing','content','budget'].forEach((name,i)=>{
  const el=find('.s3-'+name),r=el.getBoundingClientRect();
  tl.fromTo(el,{x:bounds.left+bounds.width*.5-r.left-r.width*.5,y:bounds.top+bounds.height*.35-r.top-r.height*.5,scale:.8,rotation:3-i*3},
   {x:0,y:0,scale:1,rotation:0,opacity:1,duration:.55},.58+i*.14);
 });
 tl.fromTo(find('.s3-lens'),{x:-35,y:20,rotation:-5},{x:30,y:-10,rotation:3,opacity:.42,duration:.65,ease:'power2.inOut'},1.28)
  .to(find('.s3-stack'),{opacity:.32,duration:.6},1.28)
  .to(find('.s3-stack'),{opacity:.08,duration:.45},1.92)
  .to(find('.s3-lens'),{opacity:.08,duration:.45},1.92)
  .fromTo(find('.s3-decision'),{y:25},{opacity:1,y:0,duration:.55},1.92)
  .fromTo(find('.s3-decision strong'),{y:8,opacity:0},{y:0,opacity:1,duration:.4},2.08)
  .fromTo(find('.s3-action'),{y:40},{opacity:1,y:0,duration:.42},2.48)
  .fromTo(find('.s3-action strong'),{y:6,opacity:0},{y:0,opacity:1,duration:.3},2.6);
 const control=cueChapter(chapter,tl,load,'top 40%',[{at:'top 40%',time:1.25},{at:'top 0%',time:1.9},{at:'top -40%',time:tl.duration()}]);
 if(import.meta.env.DEV){
  const states={handoff:.14,signals:.46,focus:.65,decision:.82,final:1};
  const seek=async(p:number)=>{await control.seek(p);scrollTo(0,chapter.offsetTop);};
  (window as any).__sectionThree={seek,info:()=>({time:tl.time(),duration:tl.duration(),state:chapter.dataset.state})};
  const key=new URLSearchParams(location.search).get('s3');if(key&&key in states)void seek(states[key as keyof typeof states]);
 }
 return()=>control.dispose();
}

const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const showStatic=()=>{
 if(!reduced.matches)return;
 const root=document.querySelector<HTMLElement>('.section-three')!;
 root.inert=false;
 document.querySelectorAll<HTMLImageElement>('.s3-stage img[data-src]').forEach(img=>{img.src=img.dataset.src!;img.loading='lazy';});
};
showStatic();
reduced.addEventListener('change',showStatic);
