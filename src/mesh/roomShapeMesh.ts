/**
 * @author : andy
 * @description : 房间形状网格物体
 */
import * as THREE from 'three';
class RoomShapeMesh extends THREE.Mesh {
  private room: any;
  private isTop: boolean;
  constructor (room: any , isTop: boolean = false) {
    super();
    this.room = room;
    this.isTop = isTop;
    this.init();
  }
  init () {
    const roomShape = new THREE.Shape();
    for (let i = 0 ; i < this.room.areas.length ; i++) {
      const point = this.room.areas[i];
      if (i === 0) {
        // 要先执行moveTo，移动到具体位置,除以100的意思就是，因为这里的数据都是厘米，我们要转成米（three是以米为单位）
        roomShape.moveTo(point.x / 100 , point.y / 100);
      } else {
        roomShape.lineTo(point.x / 100 , point.y / 100);
      }
    }
    // 创建房间形状的几何体
    const roomShapeGeometry = new THREE.ShapeGeometry(roomShape);
    roomShapeGeometry.rotateX(Math.PI / 2);
    this.geometry = roomShapeGeometry;
    this.material = new THREE.MeshBasicMaterial({
      side : this.isTop ? THREE.FrontSide : THREE.DoubleSide,
      color : 0xff0000,
      transparent : true
    });
    // 如果是顶部的房子形状，我们需要设置y的高度
    this.isTop ? this.position.y = 2.8 : this.position.y = 0;
  }
}
export default RoomShapeMesh;