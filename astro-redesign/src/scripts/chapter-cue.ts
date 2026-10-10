import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Scroll starts a performance; it never seeks its playhead. Small reversals
// leave a running/completed chapter alone.
export function cueChapter(chapter:HTMLElement,timeline:gsap.core.Timeline,load:()=>Promise<unknown>,start='top 68%',stops=[{at:start,time:timeline.duration()}]){
 let transition:gsap.core.Tween|undefined;
 let revision=0;
 const advance=(time:number)=>{
  const ticket=++revision;
  void load().then(()=>{
   if(ticket!==revision)return;
   transition?.kill();
   chapter.dataset.state='playing';
   transition=timeline.tweenTo(time,{duration:Math.max(.28,Math.min(1.15,Math.abs(time-timeline.time())*.65)),ease:'power1.inOut',onComplete:()=>{chapter.dataset.state='holding';}});
  });
 };
 const triggers=stops.map((stop,index)=>ScrollTrigger.create({trigger:chapter,start:stop.at,
  onEnter:()=>advance(stop.time),onLeaveBack:()=>advance(index?stops[index-1].time:0)}));
 const initial=()=>{const active=triggers.filter(t=>t.scroll()>=t.start).length;advance(active?stops[active-1].time:0);};
 initial();
 return {seek:async(p:number)=>{revision++;triggers.forEach(t=>t.disable(false));transition?.kill();await load();timeline.pause().progress(p);},
  dispose:()=>{revision++;transition?.kill();triggers.forEach(t=>t.kill());timeline.kill();}};
}
