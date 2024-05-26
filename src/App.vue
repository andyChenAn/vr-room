<template>
  <div class="container" ref="container"></div>
  <div class="map">
    <div class="tag" ref="tag"></div>
    <img src="./assets/map.gif">
  </div>
  <div class="loading" v-if="progress < 100">
    <div class="loading-inner">
      <span class="loading-text">加载中{{progress}}%</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref , onMounted } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap'

type RoomParams = {
  name: string;
  index: number;
  url: string;
  position?: THREE.Vector3;
  euler?: THREE.Euler;
}
type TextParams = {
  text: string;
  position: THREE.Vector3;
}

const container = ref();
const tag = ref();
const progress = ref(0);

// 定位移动
const moveTag = (name: string) => {
  const position = {
    客厅 : [100 , 110],
    厨房 : [180 , 190],
    阳台 : [50 , 60]
  }
  if (position[name as keyof typeof position]) {
    position[name as keyof typeof position].forEach(item => {
      gsap.to(tag.value , {
        duration : 0.5,
        x: position[name as keyof typeof position][0],
        y: position[name as keyof typeof position][1],
        ease: "power3.inOut",
      })
    })
  }
}

// 初始化three的scnee，camera，renderer，并将domElement添加到容器中
const init = (container: HTMLElement) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75 , window.innerWidth / window.innerHeight , 0.1 , 1000);
  camera.position.set(0 , 0 , 0);
  const renderer = new THREE.WebGLRenderer({
    alpha : true,
    antialias : true,
    logarithmicDepthBuffer : true
  });
  renderer.setSize(window.innerWidth , window.innerHeight);
  container.appendChild(renderer.domElement);
  return { scene , camera , renderer }
}

class Room {
  private name: string = '';
  constructor (scene: THREE.Scene , params: RoomParams) {
    const { name , index , position = new THREE.Vector3(0 , 0 , 0) , euler = new THREE.Euler(0 , 0 , 0) , url } = params;
    this.name = name;
    const boxGeometry = new THREE.BoxGeometry(10 , 10 , 10);
    boxGeometry.scale(1 , 1 , -1);
    const arr: string[] = [
      `${index}_l`,
      `${index}_r`,
      `${index}_u`,
      `${index}_d`,
      `${index}_b`,
      `${index}_f`
    ]
    const boxMaterials: THREE.MeshBasicMaterial[] = [];
    arr.forEach(item => {
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(`${url}${item}.jpg`);
      if (item === `${index}_d` || item === `${index}_u`) {
        texture.rotation = Math.PI;
        texture.center = new THREE.Vector2(0.5 , 0.5);
      }
      boxMaterials.push(new THREE.MeshBasicMaterial({
        map : texture,
        transparent : true,
        depthTest : true,
        depthWrite : true,
        opacity : 1
      }))
    });
    const cube = new THREE.Mesh(boxGeometry , boxMaterials);

    cube.position.copy(position);
    cube.rotation.copy(euler);
    scene.add(cube);
  }
}

// 创建精灵文字
class SpirteText {
  private callbacks: (() => void)[] = [];
  constructor (scene: THREE.Scene , camera: THREE.PerspectiveCamera , params: TextParams) {
    const { text , position = new THREE.Vector3(0 , 0 , 0) } = params;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.fillStyle = 'rgba(100 , 100 , 100 , 0.7)';
    context.fillRect(0 , canvas.width / 4, canvas.width , canvas.height / 2);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = 'bold 200px Arial';
    context.fillStyle = '#fff';
    context.fillText(text , canvas.width / 2 , canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map : texture,
      transparent : true,
      depthWrite : true
    });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 1;
    sprite.scale.set(0.5 , 0.5 , 0.5);
    sprite.position.copy(position);
    scene.add(sprite);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    window.addEventListener('click' , (evt: MouseEvent) => {
      mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse , camera);
      const intersects = raycaster.intersectObject(sprite);
      if (intersects.length > 0) {
        this.callbacks.forEach(callback => callback());
      }
    });
  }
  onClick (callback: () => void) {
    this.callbacks.push(callback);
  }
}

const render = (scene: THREE.Scene , camera: THREE.PerspectiveCamera , renderer: THREE.WebGLRenderer) => {
  renderer.render(scene , camera);
  requestAnimationFrame(render.bind(null , scene , camera , renderer));
}

onMounted(() => {
  const { scene , camera , renderer } = init(container.value);
  render(scene , camera , renderer);
  // 创建客厅
  new Room(scene , {
    name : '客厅',
    index : 0,
    url : '/img/livingroom/'
  });

  const kitchenPostion = new THREE.Vector3(-5 , 0 , -10);
  const kitchenEuler = new THREE.Euler(0 , -Math.PI / 2 , 0);
  new Room(scene , {
    name : '厨房',
    index : 3,
    url : '/img/kitchen/',
    position : kitchenPostion,
    euler : kitchenEuler
  });

  const kitchenText = new SpirteText(scene , camera , {
    text : '厨房',
    position : new THREE.Vector3(-1 , 0 , -4)
  })
  kitchenText.onClick(() => {
    gsap.to(camera.position , {
      duration : 1,
      x : kitchenPostion.x,
      y : kitchenPostion.y,
      z : kitchenPostion.z
    });
    moveTag('厨房')
  });

  const kitchenBackText = new SpirteText(scene , camera , {
    text : '客厅',
    position : new THREE.Vector3(-4 , 0 , -6)
  });
  kitchenBackText.onClick(() => {
    gsap.to(camera.position , {
      duration : 1,
      x : 0,
      y : 0,
      z : 0
    })
    moveTag('客厅')
  });

  const yangtaiPosition = new THREE.Vector3(0 , 0 , 15);
  new Room(scene , {
    name : '阳台',
    index : 8,
    url : '/img/balcony/',
    position : yangtaiPosition
  });

  const yangtaiText = new SpirteText(scene , camera , {
    text : '阳台',
    position : new THREE.Vector3(0 , 0 , 4)
  });
  yangtaiText.onClick(() => {
    gsap.to(camera.position , {
      duration : 1,
      x : yangtaiPosition.x,
      y : yangtaiPosition.y,
      z : yangtaiPosition.z
    })
    moveTag('阳台')
  })
  const yangtaiBackTextPosition = new THREE.Vector3(-1 , 0 , 11);
  const yangtaiBackText = new SpirteText(scene , camera , {
    text : '客厅',
    position : yangtaiBackTextPosition
  });
  yangtaiBackText.onClick(() => {
    gsap.to(camera.position , {
      duration : 1,
      x : 0,
      y : 0,
      z : 0
    })
    moveTag('客厅')
  })
  

  // 是否按下，用于控制three旋转
  let isMouseDown = false;
  const clock = new THREE.Clock();
  clock.start();
  container.value.addEventListener('mousedown' , () => {
    isMouseDown = true;
  })
  container.value.addEventListener('mouseup' , () => {
    isMouseDown = false;
  })
  container.value.addEventListener('mouseout' , () => {
    isMouseDown = false;
  })
  container.value.addEventListener('mousemove' , (evt: MouseEvent) => {
    const delta = clock.getDelta();
    camera.rotation.order = 'YXZ';
    if (isMouseDown) {
      gsap.to(camera.rotation , {
        duration : delta,
        y : camera.rotation.y + evt.movementX * 0.001,
        x : camera.rotation.x + evt.movementY * 0.001
      })
      camera.rotation.order = 'YXZ';
    }
  })
  tag.value.style.transform = 'translate(100px , 110px)';

  // 添加loading效果
  THREE.DefaultLoadingManager.onProgress = (url: string,  loaded: number , total: number) => {
    progress.value = Number(((loaded / total) * 100).toFixed(2));
  }

})
</script>
<style lang="less" scoped>
.container {
  width: 100%;
  height: 100%;
}
.map {
  width: 300px;
  height: 260px;
  position: fixed;
  left: 0;
  bottom: 0;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  img {
    width: 100%;
    height: 100%;
  }
  .tag {
    position: absolute;
    top: 0;
    left: 0;
    width: 30px;
    height: 30px;
    background: url(./assets/location.png);
    background-size: cover;
    z-index: 1;
  }
}
.loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  background-color: #000;
  .loading-inner {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    .loading-text {
      color: #fff;
      font-size: 16px;
    }
  }
}
</style>