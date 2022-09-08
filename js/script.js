import * as THREE from "three";
//import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import crosshairIMG from "./resources/R.png";

import * as CANNON from "cannon-es";

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

let intersects;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//const orbit = new OrbitControls(camera, renderer.domElement);
const fpsCamera = new PointerLockControls(camera, renderer.domElement);

camera.position.set(-10, 2, -10);
camera.lookAt(10, 2, 10);

let cameraLookingAt = new THREE.Vector3(0, 0, -1);

const mapLoader = new THREE.TextureLoader();

const crosshair = mapLoader.load(crosshairIMG);

const sprite = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: crosshair,
    color: 0xffffff,
    fog: false,
    depthTest: false,
    depthWrite: false,
  })
);
sprite.scale.set(0.15, 0.15 * camera.aspect, 1);
scene.add(sprite);

let keyboard = [];

addEventListener("click", () => {
  if (fpsCamera.isLocked) {
    if (intersects.length) {
      //console.log(intersects);
      shootBullets();
    }
  } else {
    fpsCamera.lock();
  }
});

addEventListener("keydown", (e) => {
  if (e.keyCode === 32) {
    StartJump();
  } else {
    keyboard[e.keyCode] = true;
  }
});

addEventListener("keyup", (e) => {
  if (e.keyCode === 32) {
    EndJump();
  } else {
    keyboard[e.keyCode] = false;
  }
});

const processKeyboard = () => {
  if (keyboard[87]) {
    fpsCamera.moveForward(0.2);
  }
  if (keyboard[83]) {
    fpsCamera.moveForward(-0.2);
  }
  if (keyboard[65]) {
    fpsCamera.moveRight(-0.2);
  }
  if (keyboard[68]) {
    fpsCamera.moveRight(0.2);
  }
};

const mousePosition = new THREE.Vector2();

addEventListener("mousemove", (e) => {
  mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

const rayCaster = new THREE.Raycaster();

const bullets = [];

const shootBullets = () => {
  const bulletGeo = new THREE.SphereGeometry(0.2);
  const bulletMat = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    //wireframe: true,
  });
  const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
  scene.add(bulletMesh);

  const bulletPhysMat = new CANNON.Material();

  const cameraPosition = camera.position;

  const bulletBody = new CANNON.Body({
    mass: 0.1,
    shape: new CANNON.Sphere(0.2),
    position: new CANNON.Vec3(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    ),
    material: bulletPhysMat,
  });
  world.addBody(bulletBody);
  bullets.push({ mesh: bulletMesh, body: bulletBody });
};

const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const boxMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  //wireframe: true
});
const boxMesh = new THREE.Mesh(boxGeo, boxMat);
scene.add(boxMesh);

const sphereGeo = new THREE.SphereGeometry(2);
const sphereMat = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  //wireframe: true,
});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphereMesh);

const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  wireframe: false,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
scene.add(groundMesh);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});

const groundPhysMat = new CANNON.Material();

const groundBody = new CANNON.Body({
  //shape: new CANNON.Plane(),
  //mass: 10
  shape: new CANNON.Box(new CANNON.Vec3(15, 15, 0.1)),
  type: CANNON.Body.STATIC,
  material: groundPhysMat,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

const boxPhysMat = new CANNON.Material();

const boxBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
  position: new CANNON.Vec3(-10, 20, 0),
  material: boxPhysMat,
});
world.addBody(boxBody);

boxBody.angularVelocity.set(0, 10, 0);
boxBody.angularDamping = 0.5;

const groundBoxContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  boxPhysMat,
  { friction: 0.04 }
);

world.addContactMaterial(groundBoxContactMat);

const spherePhysMat = new CANNON.Material();

const sphereBody = new CANNON.Body({
  mass: 4,
  shape: new CANNON.Sphere(2),
  position: new CANNON.Vec3(0, 10, 0),
  material: spherePhysMat,
});
world.addBody(sphereBody);

sphereBody.linearDamping = 0.21;

const groundSphereContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  spherePhysMat,
  { restitution: 0.9 }
);

world.addContactMaterial(groundSphereContactMat);

const timeStep = 1 / 60;

let positionY = 2;
let velocityY = 0.0;
let gravity = -0.03;
let onGround = false;

const StartJump = () => {
  if (onGround) {
    velocityY = 0.5;
    onGround = false;
  }
};

const EndJump = () => {
  if (velocityY > 0.6) velocityY = 0.6;
};

function animate() {
  world.step(timeStep);

  velocityY += gravity;
  positionY += velocityY;

  if (positionY < 2.0) {
    positionY = 2.0;
    velocityY = 0.0;
    onGround = true;
  }

  camera.position.y = positionY;

  cameraLookingAt.applyQuaternion(camera.quaternion);

  //console.log(cameraLookingAt);

  //sprite.position.set(cameraLookingAt);

  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);

  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);

  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);

  bullets.map((oneBullet) => {
    oneBullet.mesh.position.copy(oneBullet.body.position);
    oneBullet.mesh.quaternion.copy(oneBullet.body.quaternion);
  });

  rayCaster.setFromCamera(mousePosition, camera);
  intersects = rayCaster.intersectObjects(scene.children);

  processKeyboard();

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
