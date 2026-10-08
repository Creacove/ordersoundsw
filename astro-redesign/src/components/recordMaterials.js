import * as THREE from 'three';

// Subtle paper relief. This contains no lettering or page imagery.
export function paperNormalTexture() {
  const side = 128;
  const data = new Uint8Array(side * side * 4);
  let seed = 71;
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    data[i] = 128 + seed % 17 - 8;
    data[i + 1] = 128 + (seed >> 8) % 17 - 8;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, side, side);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  return texture;
}

// A radial diffraction finish, evaluated per fragment on real disc geometry.
// Radial grooves remain continuous; spectral reflection is angular and soft.
export const vinylVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const vinylFragment = `
  varying vec2 vUv;
  const float PI = 3.14159265359;
  float lobe(float a, float center, float width) {
    float d = atan(sin(a-center), cos(a-center));
    return exp(-pow(d/width, 2.0));
  }
  vec3 spectrum(float t) {
    return .52 + .48 * cos(6.28318 * (t + vec3(0.0, .33, .67)));
  }
  void main() {
    vec2 p = (vUv-.5)*2.;
    float r = length(p);
    float a = atan(p.y,p.x);
    float grooves = sin(r*760.);
    float fine = 0.;
    float specular = lobe(a,.55,.19) + lobe(a,-.59,.21);
    float diffuse = lobe(a,2.2,.9)*.015 + lobe(a,-1.8,.5)*.012;
    vec3 color = vec3(.003,.0025,.0035) + diffuse*.25;
    color += vec3(.004) * pow(.5+.5*grooves, 4.) + fine;
    float radial = smoothstep(.32,.58,r) * (1.-smoothstep(.975,1.,r));
    float bands = a*2.2 + r*.22;
    vec3 rainbow = mix(vec3(.55), spectrum(bands), .82);
    float hot = lobe(a,.51,.058) + lobe(a,-.66,.065);
    float radialLight = .3 + .7*smoothstep(.55,.95,r);
    color += rainbow * specular * radial * .42 * (.69 + .31*grooves);
    color += vec3(.8,.57,.40)*hot*radialLight*radial*.4;
    // The sleeve occludes illumination near the inner exposed rim.
    color *= smoothstep(-.06,.10,p.x);
    color += vec3(.09,.075,.07) * pow(specular*.48, 4.) * radial;
    color *= 1.-.40*smoothstep(.974,1.,r);
    gl_FragColor = vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function softenPaper(shader) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    `#include <map_fragment>
    float paperLuma = dot(diffuseColor.rgb, vec3(.2126,.7152,.0722));
    diffuseColor.rgb = mix(vec3(paperLuma), diffuseColor.rgb, .67);
    `
  );
}
