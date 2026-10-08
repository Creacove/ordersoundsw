import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, useTexture, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import SleeveContent from './SleeveContent';
import { paperNormalTexture, vinylVertex, vinylFragment, softenPaper } from './recordMaterials';

const BASE_YAW = -.20;
const vinylBack = vinylFragment
  .replace('lobe(a,.55,.19) + lobe(a,-.59,.21)', 'lobe(a,2.59,.19) + lobe(a,-2.55,.21)')
  .replace('lobe(a,.51,.058) + lobe(a,-.66,.065)', 'lobe(a,2.63,.058) + lobe(a,-2.48,.065)')
  .replace('smoothstep(-.06,.10,p.x)', 'smoothstep(-.06,.10,-p.x)');

function Record() {
  const assembly = useRef();
  const disc = useRef();
  const body = useRef();
  const frontVinyl = useRef();
  const backVinyl = useRef();
  const { invalidate, gl } = useThree();
  const [front, back] = useTexture(['/hero/sleeve-front.webp', '/hero/sleeve-back.webp']);
  const normal = useMemo(paperNormalTexture, []);
  useLayoutEffect(() => {
    for (const texture of [front, back]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    }
    invalidate();
  }, [front, back, gl, invalidate]);
  useEffect(() => () => normal.dispose(), [normal]);

  useEffect(() => {
    const hero = document.querySelector('[data-hero]');
    const copy = hero.querySelector('[data-hero-copy]');
    const frontTitle = copy.querySelector('h1');
    const bridge = copy.querySelector('[data-bridge]');
    const support = copy.querySelector('[data-back-support]');
    const contactShadow = hero.querySelector('.object-shadow');
    const studioLight = hero.querySelector('.studio__light');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let timeline;
    let cancelled = false;
    const setup = async () => {
      await document.fonts.ready;
      while (!cancelled && (!hero.querySelector('[data-sleeve-front]') || !hero.querySelector('[data-sleeve-back]'))) {
        invalidate();
        await new Promise(requestAnimationFrame);
      }
      if (cancelled) return;
      const frontFace = hero.querySelector('[data-sleeve-front]');
      const backFace = hero.querySelector('[data-sleeve-back]');
      const before = [...hero.querySelectorAll('[data-before]')];
      const after = [...hero.querySelectorAll('[data-after]')];
      const frontLines = [...frontTitle.querySelectorAll('[data-copy-line]')];
      const backRows = [...backFace.querySelectorAll('.sleeve-heading, .desk-rows li')];
      const largeSize = () => parseFloat(getComputedStyle(frontTitle).fontSize) * (innerWidth > 1000 ? .91 : 1);
      hero.dataset.ready = 'true';
      const update = () => {
        const angle = assembly.current.rotation.y;
        frontFace.style.visibility = angle < Math.PI / 2 ? 'visible' : 'hidden';
        backFace.style.visibility = angle >= Math.PI / 2 ? 'visible' : 'hidden';
        frontFace.inert = angle >= Math.PI / 2;
        backFace.inert = angle < Math.PI / 2;
        hero.dataset.angle = angle.toFixed(5);
        frontVinyl.current.uniforms.uTurn.value = angle;
        backVinyl.current.uniforms.uTurn.value = angle;
        invalidate();
      };
      gsap.set(after, { autoAlpha: 0 });
      gsap.set(support, { autoAlpha: 0, y: 18 });
      gsap.set(backRows, { y: 11, opacity: 0 });
      // Keep the authored seconds under low frame rates and software WebGL.
      gsap.ticker.lagSmoothing(0);
      timeline = gsap.timeline({ paused: true, onUpdate: update, onComplete: () => { hero.dataset.settled = 'true'; } });
      timeline.to(frontLines.slice().reverse(), { yPercent: -105, duration: .54, stagger: .08, ease: 'power3.inOut' }, 2.59)
        .set(frontTitle, { autoAlpha: 0 }, 3.23)
        .to(bridge, {
          top: 0,
          fontSize: () => `${largeSize()}px`,
          lineHeight: () => `${largeSize() * .96}px`,
          letterSpacing: () => `${largeSize() * -.055}px`,
          fontWeight: 560,
          color: '#171519',
          duration: 1.08,
          ease: 'power3.inOut',
        }, 2.60)
        .to(assembly.current.rotation, { y: Math.PI, duration: 1.18, ease: 'power3.inOut' }, 2.55)
        .to(disc.current.position, { z: 1.2, duration: 1.18, ease: 'power3.inOut' }, 2.55)
        .to(disc.current.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 1.18, ease: 'power3.inOut' }, 2.55)
        .to(assembly.current.position, { x: .10, duration: 1.18, ease: 'power3.inOut' }, 2.55)
        .to(contactShadow, { x: 36, duration: 1.18, ease: 'power3.inOut' }, 2.55)
        .fromTo(studioLight, { xPercent: -3, opacity: 1 }, { xPercent: 4, opacity: .72, duration: 1.18, ease: 'power2.inOut' }, 2.55)
        .to(support, { autoAlpha: 1, y: 0, duration: .52, ease: 'power2.out' }, 3.49)
        .to(backRows, { y: 0, opacity: 1, duration: .44, stagger: .085, ease: 'power2.out' }, 3.69)
        .to(before, { opacity: .22, duration: .17 }, 6.55)
        .to(before, { autoAlpha: 0, y: -7, duration: .30 }, 6.72)
        .fromTo(after, { autoAlpha: 0, y: 7 }, { autoAlpha: 1, y: 0, duration: .36 }, 6.72)
        .to({}, { duration: .92 }, 7.08);
      const syncAccessibility = () => {
        const isBack = timeline.time() >= 3.02;
        frontTitle.inert = isBack;
        support.inert = !isBack;
        frontTitle.setAttribute('aria-hidden', String(isBack));
        support.setAttribute('aria-hidden', String(!isBack));
      };
      timeline.eventCallback('onUpdate', () => { update(); syncAccessibility(); });
      update();
      syncAccessibility();
      const button = hero.querySelector('[data-turn]');
      const turn = () => {
        if (timeline.isActive()) return;
        if (motion.matches) {
          timeline.seek(timeline.time() < 3.55 ? 8 : 0);
          update(); syncAccessibility();
        } else if (timeline.time() >= 8) {
          timeline.reverse();
        } else timeline.play();
      };
      button.addEventListener('click', turn);
      const time = import.meta.env.DEV ? new URLSearchParams(location.search).get('heroTime') : null;
      if (time !== null) {
        timeline.seek(Number(time)).pause();
        update();
        syncAccessibility();
      }
      else if (!motion.matches) timeline.play();
      if (import.meta.env.DEV) window.__deskHero = {
        seek: t => { timeline.pause().seek(t); update(); syncAccessibility(); },
        info: () => ({ time: timeline.time(), rotation: assembly.current.rotation.y, running: timeline.isActive() }),
      };
      cleanupButton = () => button.removeEventListener('click', turn);
      invalidate();
    };
    let cleanupButton = () => {};
    setup();
    return () => { cancelled = true; timeline?.kill(); cleanupButton(); delete window.__deskHero; };
  }, [invalidate]);

  return <group ref={assembly} position={[-.12,-.12,0]}>
    <group ref={disc} position={[1.14,-.01,-.10]} rotation={[0,-.08,0]}>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[1.87,1.87,.035,192]} /><meshStandardMaterial color="#0c0b0e" roughness={.3} metalness={.28} /></mesh>
      <mesh position={[0,0,.021]}><circleGeometry args={[1.862,192]} /><shaderMaterial ref={frontVinyl} uniforms={{ uTurn: { value: 0 } }} vertexShader={vinylVertex} fragmentShader={vinylFragment} /></mesh>
      <mesh position={[0,0,.026]}><circleGeometry args={[.62,96]} /><meshStandardMaterial color="#d7cbc0" roughness={.85} normalMap={normal} normalScale={[.15,.15]} /></mesh>
      <mesh position={[0,0,.030]}><circleGeometry args={[.049,32]} /><meshBasicMaterial color="#070609" /></mesh>
      <mesh position={[0,0,-.030]} rotation={[0,Math.PI,0]}><circleGeometry args={[1.862,192]} /><shaderMaterial ref={backVinyl} uniforms={{ uTurn: { value: 0 } }} vertexShader={vinylVertex} fragmentShader={vinylBack} /></mesh>
      <mesh position={[0,0,-.034]} rotation={[0,Math.PI,0]}><circleGeometry args={[.62,96]} /><meshStandardMaterial color="#d7cbc0" roughness={.85} normalMap={normal} normalScale={[.15,.15]} /></mesh>
      <mesh position={[0,0,-.039]} rotation={[0,Math.PI,0]}><circleGeometry args={[.049,32]} /><meshBasicMaterial color="#070609" /></mesh>
    </group>
    <group position={[-.73,0,.14]} rotation={[0,BASE_YAW,0]}>
      <RoundedBox ref={body} args={[3.74,3.74,.068]} radius={.008} smoothness={2}>
        <meshStandardMaterial color="#d3c5b8" roughness={.88} normalMap={normal} normalScale={[.15,.15]} />
      </RoundedBox>
      <mesh position={[0,0,.035]}><planeGeometry args={[3.724,3.724]} />
        <meshStandardMaterial map={front} color="#f5f1f5" roughness={.91} normalMap={normal} normalScale={[.12,.12]} onBeforeCompile={softenPaper} />
      </mesh>
      <mesh position={[0,0,-.035]} rotation={[0,Math.PI,0]}><planeGeometry args={[3.724,3.724]} />
        <meshStandardMaterial map={back} color="#f5f1f5" roughness={.91} normalMap={normal} normalScale={[.12,.12]} onBeforeCompile={softenPaper} />
      </mesh>
      <Html transform position={[0,0,.039]} distanceFactor={2.48} zIndexRange={[10,2]}><SleeveContent face="front" /></Html>
      <Html transform position={[0,0,-.039]} rotation={[0,Math.PI,0]} distanceFactor={2.48} zIndexRange={[10,2]}><SleeveContent face="back" /></Html>
    </group>
  </group>;
}

function ResponsiveCamera() {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    // Stable world-space framing across independently laid out stage containers.
    camera.position.set(0,.025,12);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(2.10 / 12));
    camera.updateProjectionMatrix();
    invalidate();
    const frame = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(frame);
  }, [camera, size, invalidate]);
  return null;
}

export default function HeroScene() {
  return <Canvas className="hero-canvas" frameloop="demand" dpr={[1,1.75]}
    camera={{ position:[0,.025,12], fov:20, near:.1, far:40 }}
    gl={{ antialias:true, alpha:true, powerPreference:'default' }}
    onCreated={({ gl }) => { gl.outputColorSpace=THREE.SRGBColorSpace; gl.toneMapping=THREE.NoToneMapping; }}>
    <ResponsiveCamera />
    <ambientLight intensity={1.50} color="#fff9f2" />
    <directionalLight position={[-3,5,8]} intensity={1.7} color="#fff8ee" />
    <directionalLight position={[4,1,-6]} intensity={1.7} color="#fff8ee" />
    <Suspense fallback={null}><Record /></Suspense>
    <ContactShadows position={[0,-2.005,0]} opacity={.55} scale={10} blur={2.3} far={4} resolution={512} color="#554037" frames={1} />
  </Canvas>;
}
