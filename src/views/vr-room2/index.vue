<template>
  <div class="box">
    <button @click="onClick" class="btn">目前位置是：{{roomName}}，点击切换房间</button>
  </div>
</template>
<script lang="ts" setup>
  import * as THREE from 'three';
  import gsap from 'gsap';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { onMounted , ref } from 'vue';
  import RoomShapeMesh from '@/mesh/roomShapeMesh';
  import createWallShaderMaterial from '@/mesh/wallShaderMaterial';
  import Wall from '@/mesh/wall';

  const roomName = ref('客厅')

  // 初始化场景
  const initScene = (container: HTMLElement) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75 , window.innerWidth / window.innerHeight , 0.1 , 1000);
    camera.position.set(0 , 2 , 5.5);
    const renderer = new THREE.WebGLRenderer({
      antialias : true
    });
    renderer.setSize(window.innerWidth , window.innerHeight);
    container.appendChild(renderer.domElement);

    const orbitControl = new OrbitControls(camera , renderer.domElement);
    orbitControl.enableDamping = true;

    // 添加辅助线
    const axesHelper = new THREE.AxesHelper();
    scene.add(axesHelper);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/assets/HdrSkyCloudy004_JPG_8K.jpg');
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
    const render = () => {
      requestAnimationFrame(render);
      renderer.render(scene , camera);
      orbitControl.update();
    }
    return { scene , camera , renderer , render , orbitControl }
  }
  let panoramaLocation: any;
  let camera1: any;
  let controls: any;
  onMounted(() => {
    const container = document.getElementById('app');
    const { scene , camera , renderer , render , orbitControl } = initScene(container as HTMLElement);
    camera1 = camera;
    controls = orbitControl;
    render();
    
    let idToPanorama: any = {};
    // 请求数据
    fetch('https://test-1251830808.cos.ap-guangzhou.myqcloud.com/three_course/demo720.json').then(res => res.json())
    .then(res => {
      console.log(res)
      // 创建房间
      for (let i = 0 ; i < res.objData.roomList.length ; i++) {
        // 获取房间数据
        const room = res.objData.roomList[i];
        // 创建房间形状网格
        const roomMesh = new RoomShapeMesh(room);
        // 创建房顶形状网格，和房间的形状网格一样
        const topRoomMesh = new RoomShapeMesh(room , true);
        scene.add(roomMesh)
        scene.add(topRoomMesh)

        panoramaLocation = res.panoramaLocation;
        // 房屋到全景图的映射
        for (let j = 0 ; j < res.panoramaLocation.length ; j++) {
          const panorama = res.panoramaLocation[j];
          
          if (panorama.roomId === room.roomId) {
            // 创建墙面材质
            const wallMaterial = createWallShaderMaterial(panorama);
            panorama.material = wallMaterial;
            idToPanorama[room.roomId] = panorama;
          }
        }
        roomMesh.material = idToPanorama[room.roomId].material as THREE.Material;
        roomMesh.material.side = THREE.DoubleSide;
        topRoomMesh.material = idToPanorama[room.roomId].material.clone() as THREE.Material;
        topRoomMesh.material.side = THREE.FrontSide;
      }

      // 创建墙面
      for (let i = 0 ; i < res.wallRelation.length; i++) {
        const wallPoints = res.wallRelation[i].wallPoints as any[];
        const faceRelation = res.wallRelation[i].faceRelation as any[];
        faceRelation.forEach(item => {
          item.panorama = idToPanorama[item.roomId];
        })
        const wallMesh = new Wall(wallPoints , faceRelation);
        scene.add(wallMesh);
      }
    })
  })

  let roomIndex = 0;
  let timeline = gsap.timeline();
  let dir = new THREE.Vector3();
  const onClick = () => {
    const room = panoramaLocation[roomIndex];
    dir = camera1.position.clone().sub(new THREE.Vector3(
      room.point[0].x / 100,
      room.point[0].z / 100,
      room.point[0].y / 100
    )).normalize()
    timeline.to(camera1.position , {
      duration : 1,
      x : room.point[0].x / 100 + dir.x * 0.01,
      y : room.point[0].z / 100,
      z : room.point[0].y / 100 + dir.z * 0.01
    });
    controls.target.set(
      room.point[0].x / 100,
      room.point[0].z / 100,
      room.point[0].y / 100
    )
    camera1.lookAt(
      room.point[0].x / 100,
      room.point[0].z / 100,
      room.point[0].y / 100
    )
    roomName.value = room.roomName;
    roomIndex++;
    if (roomIndex >= panoramaLocation.length) {
      roomIndex = 0;
    }
  }
</script>
<style lang="less" scoped>
.box {
  position: fixed;
  top: 50px;
  left: 50px;
  z-index: 100;
  cursor: pointer;
}
</style>