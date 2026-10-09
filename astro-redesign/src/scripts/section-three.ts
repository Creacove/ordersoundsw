import gsap from 'gsap';
export function setupSectionThree(previous:gsap.core.Timeline){
 const root=document.querySelector<HTMLElement>('.section-three')!;
 const find=(s:string)=>root.querySelector<HTMLElement>(s)!;
 const handled=document.querySelector<HTMLElement>('.s2-handled')!;
 const images=[...root.querySelectorAll<HTMLImageElement>('img[data-src]')];
 const load=()=>Promise.all(images.map(img=>{if(!img.src)img.src=img.dataset.src!;return img.decode().catch(()=>{});}));
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){void load();observer.disconnect();}},{rootMargin:'100%'});
 observer.observe(document.querySelector('.s3-preload')!);
 const saved=previous.progress();previous.progress(1);
 const bounds=handled.getBoundingClientRect(),stage=find('.s3-stage').getBoundingClientRect();
 previous.progress(saved);
 gsap.set(root,{visibility:'visible'});
 gsap.set([find('.s3-stack'),find('.s3-band')],{left:bounds.left-stage.left,top:bounds.top-stage.top,width:bounds.width});
 gsap.set(root.querySelectorAll('.section-three__copy,.s3-stack,.s3-band,.s3-paper,.s3-lens,.s3-decision'),{opacity:0});
 const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.hero-journey',start:()=>`top+=${innerHeight*1.85} top`,end:()=>`top+=${innerHeight*3.35} top`,scrub:.65,onUpdate:self=>{root.inert=self.progress<.02;}}});
 tl.to('.section-two__copy',{opacity:0,y:-12,duration:.1},0)
 .fromTo(find('.section-three__copy'),{y:12},{opacity:1,y:0,duration:.13},.02)
 // Retain the exact bound object until the first paper masks the material swap.
 .to(find('.s3-stack'),{opacity:1,duration:.12},.23)
 .to(handled.querySelector('img'),{opacity:0,duration:.12},.23)
 .to(find('.s3-band'),{opacity:1,duration:.035},.23)
 .to(find('.s3-band'),{y:65,opacity:0,duration:.12,ease:'power2.in'},.265);
 ['timing','content','budget'].forEach((name,i)=>{
  const el=find(`.s3-${name}`),r=el.getBoundingClientRect();
  tl.fromTo(el,{x:bounds.left+bounds.width*.5-r.left-r.width*.5,y:bounds.top+bounds.height*.35-r.top-r.height*.5,scale:.8,rotation:3-i*3},{x:0,y:0,scale:1,rotation:0,opacity:1,duration:.14,ease:'power2.out'},.25+i*.035);
 });
 tl.fromTo(find('.s3-lens'),{x:-35,y:20,rotation:-5},{x:30,y:-10,rotation:3,opacity:.42,duration:.18,ease:'power1.inOut'},.46)
 .fromTo(root.querySelectorAll('.s3-paper:not(.s3-action) .s3-paper-copy'),{opacity:.5},{opacity:1,duration:.14},.47)
 .to(find('.s3-stack'),{opacity:.32,duration:.16},.47)
 .to(find('.s3-stack'),{opacity:.08,duration:.13},.67)
 .to(find('.s3-lens'),{opacity:.08,duration:.13},.67)
 .to(root.querySelectorAll('.s3-paper:not(.s3-action) .s3-paper-copy'),{opacity:.5,y:0,duration:.14},.67)
 .fromTo(find('.s3-decision'),{y:25},{opacity:1,y:0,duration:.14,ease:'power2.out'},.67)
 .fromTo(find('.s3-action'),{y:40},{opacity:1,y:0,duration:.12,ease:'power2.out'},.82)
 .to({}, {duration:.06},.94);
 if(import.meta.env.DEV){
  const states={handoff:.14,signals:.46,focus:.65,decision:.82,final:1};
  const seek=async(p:number)=>{await load();previous.scrollTrigger?.disable(false);previous.progress(1);tl.scrollTrigger?.disable(false);tl.progress(p);root.inert=false;};
  (window as any).__sectionThree={seek};
  const key=new URLSearchParams(location.search).get('s3');if(key&&key in states)void seek(states[key as keyof typeof states]);
 }
 return()=>observer.disconnect();
}
// Static reading order without scroll choreography.
if(matchMedia('(prefers-reduced-motion: reduce)').matches){
 const root=document.querySelector<HTMLElement>('.section-three')!;root.inert=false;
 root.querySelectorAll<HTMLImageElement>('img[data-src]').forEach(img=>{img.src=img.dataset.src!;img.loading='lazy';});
}
