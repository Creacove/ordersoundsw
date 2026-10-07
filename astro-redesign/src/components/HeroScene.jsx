import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';

const P = '/hero/materials/';

function RecordObject({ onReady }) {
  const { nodes } = useGLTF('/hero/ordersounds_record_geometry.glb');
  const [front, back, edge, paperNormal, paperRough, vinylNormal, vinylRough, vinylIri, label] = useTexture([
    P+'sleeve_front_basecolor.png', P+'sleeve_back_basecolor.png', P+'sleeve_edge_basecolor.png',
    P+'paper_normal.png', P+'paper_roughness.png', P+'vinyl_normal.png', P+'vinyl_roughness.png',
    P+'vinyl_iridescence_mask.png', P+'vinyl_center_label.png'
  ]);
  const sleeve = useRef();

  useMemo(() => {
    [front, back, edge, label].forEach(t => { t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; });
    [paperNormal, paperRough, vinylNormal, vinylRough, vinylIri].forEach(t => { t.flipY = false; });
  }, [front, back, edge, label, paperNormal, paperRough, vinylNormal, vinylRough, vinylIri]);

  useEffect(() => { onReady?.(); }, [onReady]);

  useLayoutEffect(() => {
    if (!sleeve.current) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.querySelector('[data-hero]');
    const frontCopy = root?.querySelector('[data-front-copy]');
    const backCopy = root?.querySelector('[data-back-copy]');
    const sleeveCopy = root?.querySelector('[data-sleeve-copy]');
    const before = sleeveCopy?.querySelectorAll('.before');
    const after = sleeveCopy?.querySelectorAll('.after');

    gsap.set([backCopy, sleeveCopy, after], { autoAlpha: 0 });
    if (reduced) return;

    const tl = gsap.timeline({ delay: .65 });
    tl.to(frontCopy, { autoAlpha: 0, y: -8, duration: .32, ease: 'power2.out' }, 2.45)
      .to(sleeve.current.rotation, { y: Math.PI, duration: 1.18, ease: 'power3.inOut' }, 2.55)
      .to(backCopy, { autoAlpha: 1, y: 0, duration: .42, ease: 'power2.out' }, 3.55)
      .to(sleeveCopy, { autoAlpha: 1, duration: .3 }, 3.65)
      .to(before, { autoAlpha: 0, y: -7, duration: .28, stagger: .04, ease: 'power2.in' }, 6.55)
      .fromTo(after, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .34, stagger: .04, ease: 'power2.out' }, 6.72);
    return () => tl.kill();
  }, []);

  const paper = useMemo(() => ({ normalMap: paperNormal, roughnessMap: paperRough, roughness: .83 }), [paperNormal, paperRough]);

  return <group position={[0, -0.02, 0]} scale={1.12}>
    <group ref={sleeve}>
      <mesh geometry={nodes.Sleeve_Edge.geometry} castShadow receiveShadow>
        <meshPhysicalMaterial map={edge} {...paper} color="#f4efe9" />
      </mesh>
      <mesh geometry={nodes.Sleeve_Front.geometry} castShadow receiveShadow>
        <meshPhysicalMaterial map={front} {...paper} color="#ffffff" />
      </mesh>
      <mesh geometry={nodes.Sleeve_Back.geometry} castShadow receiveShadow>
        <meshPhysicalMaterial map={back} {...paper} color="#ffffff" />
      </mesh>
    </group>

    <mesh geometry={nodes.Vinyl_Record.geometry} castShadow receiveShadow>
      <meshPhysicalMaterial color="#090909" roughness={.32} metalness={.08} normalMap={vinylNormal} roughnessMap={vinylRough}
        iridescence={1} iridescenceIOR={1.32} iridescenceThicknessRange={[130, 430]} iridescenceMap={vinylIri}
        clearcoat={.16} clearcoatRoughness={.26} />
    </mesh>
    <mesh geometry={nodes.Vinyl_Label.geometry}>
      <meshPhysicalMaterial map={label} color="#f0ebe4" roughness={.78} />
    </mesh>
    <mesh geometry={nodes.Vinyl_Hole.geometry}>
      <meshStandardMaterial color="#080808" roughness={.45} />
    </mesh>
  </group>;
}

function Scene({ onReady }) {
  const light = useRef();
  useFrame(({ clock }) => {
    if (light.current) light.current.position.x = -3.5 + Math.sin(clock.elapsedTime*.17)*.12;
  });
  return <>
    <ambientLight intensity={1.55} color="#fff8f0" />
    <directionalLight ref={light} position={[-3.5,5.8,5]} intensity={4.2} color="#fff6ee" castShadow shadow-mapSize={[1024,1024]} />
    <directionalLight position={[4,2.5,3]} intensity={1.1} color="#d8c6ff" />
    <RecordObject onReady={onReady} />
    <mesh rotation-x={-Math.PI/2} position={[0,-1.08,0]} receiveShadow>
      <planeGeometry args={[8,8]} />
      <shadowMaterial transparent opacity={.115} />
    </mesh>
  </>;
}

export default function HeroScene() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const poster = document.querySelector('[data-poster]');
    if (poster) gsap.to(poster, { autoAlpha: 0, duration: .18, ease: 'none', delay: .08 });
  }, [ready]);

  return <Canvas
    className="hero-canvas"
    dpr={[1, 1.75]}
    shadows
    frameloop="always"
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
    camera={{ position: [0.12, .05, 4.8], fov: 33 }}
    onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; }}
  >
    <Scene onReady={() => setReady(true)} />
  </Canvas>;
}
useGLTF.preload('/hero/ordersounds_record_geometry.glb');
