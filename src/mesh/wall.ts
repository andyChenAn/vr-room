/**
 * @author : andy
 * @description : 创建墙面
 */
import * as THREE from 'three';
export default class Wall extends THREE.Mesh {
  private wallPoints: any[] = [];
  private faceRelation: any[] = [];
  constructor (wallPoints: any[] , faceRelation: any[]) {
    super();
    this.wallPoints = wallPoints;
    this.faceRelation = faceRelation;
    this.init();
  }
  init () {
    this.wallPoints.forEach(item => {
      item.x = item.x / 100;
      item.y = item.y / 100;
      item.z = item.z / 100;
    })
    const faceIndexs: number[][] = [
      // 底面
      [0 , 1 , 2 , 3],
      // 顶面
      [4 , 5 , 6 , 7],
      // 左面
      [0 , 3 , 6 , 5],
      // 右面
      [2 , 1 , 4 , 7],
      // 前面
      [0 , 1 , 4 , 5],
      // 后面
      [2 , 3 , 6 , 7]
    ];
    const mIndex: any[] = [];
    faceIndexs.forEach(item => {
      let faceItem: any;
      const isFace = this.faceRelation.some(face => {
        faceItem = face;
        return (
          item.includes(face.index[0]) &&
          item.includes(face.index[1]) &&
          item.includes(face.index[2]) && 
          item.includes(face.index[3])
        )
      })
      if (isFace) {
        mIndex.push(faceItem.panorama);
      } else {
        mIndex.push(0);
      }
    });
    // 6个面的顶点位置坐标
    const faces = faceIndexs.map(item => {
      return [
        [this.wallPoints[item[0]].x , this.wallPoints[item[0]].z , this.wallPoints[item[0]].y],
        [this.wallPoints[item[1]].x , this.wallPoints[item[1]].z , this.wallPoints[item[1]].y],
        [this.wallPoints[item[2]].x , this.wallPoints[item[2]].z , this.wallPoints[item[2]].y],
        [this.wallPoints[item[3]].x , this.wallPoints[item[3]].z , this.wallPoints[item[3]].y],
      ]
    });
    
    const positions: any[] = [];
    const uvs: any[] = [];
    const indices: any[] = [];
    const normals: any[] = [];
    // 法向量
    const faceNormals: number[][]= [
      // 底面
      [0 , -1 , 0],
      // 顶面
      [0 , 1 , 0],
      // 左面
      [-1 , 0 , 0],
      // 右面
      [1 , 0 , 0],
      // 前面
      [0 , 0 , 1],
      // 后面
      [0 , 0 , -1]
    ];
    const materialGroups: any[] = [];
    // 遍历这6个面的顶点坐标
    for (let i = 0 ; i < faces.length ; i++) {
      const point = faces[i];
      const facePositions: any[] = [];
      const faceUvs: any[] = [];
      const faceIndices: any[] = [];
      // 每个面的顶点位置数据，都是Float32Array类型
      facePositions.push(...point[0] , ...point[1] , ...point[2] , ...point[3]);
      // uv有四个点，0,0 , 1,0  1,1   0,1
      faceUvs.push(0 , 0 , 1 , 0 , 1 , 1 , 0 , 1);
      // 每个面由两个三角形(一个三角形就有3个顶点)组成，而且一个面有4个顶点
      faceIndices.push(
        0 + i * 4,
        2 + i * 4,
        1 + i * 4,

        0 + i * 4,
        3 + i * 4,
        2 + i * 4
      )
      positions.push(...facePositions);
      uvs.push(...faceUvs);
      indices.push(...faceIndices);
      normals.push(
        ...faceNormals[i],
        ...faceNormals[i],
        ...faceNormals[i],
        ...faceNormals[i]
      )
      // 设置材质组
      materialGroups.push({
        start : i * 6,
        count : 6,
        materialIndex : i
      });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position' , new THREE.Float32BufferAttribute(positions , 3));
    geometry.setAttribute('uv' , new THREE.Float32BufferAttribute(uvs , 2));
    geometry.setAttribute('normal' , new THREE.Float32BufferAttribute(normals , 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices) , 1));
    geometry.groups = materialGroups;
    this.geometry = geometry;
    this.material = mIndex.map(item => {
      if (item === 0) {
        return new THREE.MeshBasicMaterial({
          color : 0xff0000
        })
      } else {
        return item.material;
      }
    })
  }
}