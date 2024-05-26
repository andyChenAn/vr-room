/**
 * @author : andy
 * @description : 创建全景图材质
 */
import * as THREE from 'three';
/**
 * 创建墙面材质
 * @param panorama 全景图
 */
export default function createWallShaderMaterial (panorama: any) {
  const point = panorama.point[0];
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(point.panoramaUrl);
  texture.flipY = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  // 墙面中心点
  const center = new THREE.Vector3(point.x / 100 , point.z / 100 , point.y / 100);
  return new THREE.ShaderMaterial({
    uniforms : {
      uPanorama : {
        value : texture
      },
      uCenter : {
        value : center
      }
    },
    vertexShader : `
      varying vec2 vUv;
      uniform vec3 uCenter;
      varying vec3 vPosition;
      void main () {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position , 1.0);
        vPosition = modelPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position , 1.0);
      }
    `,
    fragmentShader : `
      varying vec2 vUv;
      uniform vec3 uCenter;
      varying vec3 vPosition;
      uniform sampler2D uPanorama;
      const float PI = 3.145926;
      void main () {
        // 位置
        vec3 nPos = normalize(vPosition - uCenter);
        float theta = acos(nPos.y) / PI;
        float phi = 0.0;
        phi = (atan(nPos.z , nPos.x) + PI) / (2.0 * PI);
        phi += 0.75;
        vec4 pColor = texture2D(uPanorama , vec2(phi , theta));
        gl_FragColor = pColor;
      }
    `
  })
}