console.clear();

/* SETUP */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* CONTROLS */
const controlsWebGL = new THREE.OrbitControls(camera, renderer.domElement);

/* TEXT */
// Create canvas for text
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 512;
canvas.height = 512;

// Shiny effect variables
let shineOffset = 0;
const shineSpeed = 0.02;
const shineWidth = 0.3;

// Create text texture
const textTexture = new THREE.CanvasTexture(canvas);
textTexture.minFilter = THREE.LinearFilter;
textTexture.magFilter = THREE.LinearFilter;
const textMaterial = new THREE.SpriteMaterial({
  map: textTexture,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending
});

// Create text sprite
const textSprite = new THREE.Sprite(textMaterial);
textSprite.scale.set(250, 150, 1);
textSprite.position.set(0, 0, 50);
scene.add(textSprite);

// Function to create gradient
function createShinyGradient(ctx, width, height, offset) {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  
  // Create a smooth gradient for the shine effect
  gradient.addColorStop(Math.max(0, offset - shineWidth), 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(offset, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(Math.min(1, offset + shineWidth), 'rgba(255, 255, 255, 0)');
  
  return gradient;
}

// Function to update text
function updateText(opacity) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update shine offset
  shineOffset = (shineOffset + shineSpeed) % 1;
  
  // Draw text with base color
  context.fillStyle = '#ee5282';
  context.font = 'bold 80px "Dancing Script", cursive';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.globalAlpha = opacity;
  
  // Enhanced glow effect
  context.shadowColor = '#ff69b4';
  context.shadowBlur = 20;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  
  // Draw base text
  context.fillText('Love you', canvas.width / 2, canvas.height / 2 - 30);
  context.fillText('soo much', canvas.width / 2, canvas.height / 2 + 50);
  
  // Create and apply shiny gradient
  const shinyGradient = createShinyGradient(context, canvas.width, canvas.height, shineOffset);
  context.fillStyle = shinyGradient;
  context.globalCompositeOperation = 'overlay';
  
  // Draw shiny text on top
  context.fillText('Love you', canvas.width / 2, canvas.height / 2 - 30);
  context.fillText('soo much', canvas.width / 2, canvas.height / 2 + 50);
  
  // Reset composite operation and shadow
  context.globalCompositeOperation = 'source-over';
  context.shadowBlur = 0;
  
  textTexture.needsUpdate = true;
  textMaterial.opacity = opacity;
}

/* PARTICLES */
// Create a global gsap timeline that contains all tweens
const tl = gsap.timeline({
  repeat: -1,
  yoyo: true,
  onUpdate: function() {
    // Update text opacity based on heart animation progress
    const progress = this.progress();
    const textOpacity = Math.sin(progress * Math.PI); // Fade in and out with heart
    updateText(textOpacity);
  }
});

const path = document.querySelector("path");
const length = path.getTotalLength();
const vertices = [];
for (let i = 0; i < length; i += 0.1) {
  const point = path.getPointAtLength(i);
  const vector = new THREE.Vector3(point.x, -point.y, 0);
  vector.x += (Math.random() - 0.5) * 30;
  vector.y += (Math.random() - 0.5) * 30;
  vector.z += (Math.random() - 0.5) * 70;
  vertices.push(vector);
  // Create a tween for that vector
  tl.from(vector, {
      x: 600 / 2, // Center X of the heart
      y: -552 / 2, // Center Y of the heart
      z: 0, // Center of the scene
      ease: "power2.inOut",
      duration: "random(2, 5)" // Random duration
    },
    i * 0.002 // Delay calculated from the distance along the path
  );
}
const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
const material = new THREE.PointsMaterial( { color: 0xee5282, blending: THREE.AdditiveBlending, size: 3 } );
const particles = new THREE.Points(geometry, material);
// Offset the particles in the scene based on the viewbox values
particles.position.x -= 600 / 2;
particles.position.y += 552 / 2;
scene.add(particles);

// Add text animation to the timeline
tl.fromTo(textMaterial, {
  opacity: 0
}, {
  opacity: 1,
  duration: 2,
  ease: "power2.inOut"
}, 0);

gsap.fromTo(scene.rotation, {
  y: -0.2
}, {
  y: 0.2,
  repeat: -1,
  yoyo: true,
  ease: 'power2.inOut',
  duration: 3
});

/* CURSOR HEARTS */
const cursorHearts = [];
const maxCursorHearts = 20;
const heartPath = document.querySelector("path").getAttribute("d");

// Function to create a small heart shape
function createHeartShape(size) {
  const shape = new THREE.Shape();
  const path = new THREE.Path();
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(`<svg><path d="${heartPath}"/></svg>`, 'image/svg+xml');
  const pathElement = svgDoc.querySelector('path');
  const pathLength = pathElement.getTotalLength();
  
  for (let i = 0; i < pathLength; i += 2) {
    const point = pathElement.getPointAtLength(i);
    if (i === 0) {
      shape.moveTo(point.x * size / 600, -point.y * size / 552);
    } else {
      shape.lineTo(point.x * size / 600, -point.y * size / 552);
    }
  }
  shape.closePath();
  return shape;
}

// Function to create a cursor heart particle
function createCursorHeart(x, y) {
  const size = 15;
  const heartShape = createHeartShape(size);
  const geometry = new THREE.ShapeGeometry(heartShape);
  const material = new THREE.MeshBasicMaterial({
    color: 0xee5282,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const heart = new THREE.Mesh(geometry, material);
  heart.position.set(x, y, 100);
  heart.scale.set(0.5, 0.5, 0.5);
  heart.userData = {
    age: 0,
    maxAge: 1,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      0
    )
  };
  
  scene.add(heart);
  cursorHearts.push(heart);
  
  // Remove oldest heart if we exceed the maximum
  if (cursorHearts.length > maxCursorHearts) {
    const oldestHeart = cursorHearts.shift();
    scene.remove(oldestHeart);
    oldestHeart.geometry.dispose();
    oldestHeart.material.dispose();
  }
}

// Track mouse position
let mouseX = 0;
let mouseY = 0;
let lastHeartTime = 0;
const heartInterval = 100; // milliseconds between hearts

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Convert mouse position to world coordinates
  const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  
  // Create hearts at intervals
  const currentTime = Date.now();
  if (currentTime - lastHeartTime > heartInterval) {
    createCursorHeart(pos.x, pos.y);
    lastHeartTime = currentTime;
  }
}

window.addEventListener('mousemove', onMouseMove);

/* BACKGROUND PARTICLES */
const particleCount = 200;
const backgroundParticles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

// Create particles with pink color variations
for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  // Random positions in a sphere
  const radius = 800;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  
  positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[i3 + 2] = radius * Math.cos(phi);
  
  // Pink color variations
  const pinkHue = 340 + Math.random() * 20; // Pink hue range
  const saturation = 70 + Math.random() * 30; // 70-100% saturation
  const lightness = 60 + Math.random() * 20; // 60-80% lightness
  
  colors[i3] = pinkHue / 360;
  colors[i3 + 1] = saturation / 100;
  colors[i3 + 2] = lightness / 100;
  
  // Increased random sizes (from 2-5 to 4-8)
  sizes[i] = 4 + Math.random() * 4;
}

backgroundParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
backgroundParticles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
backgroundParticles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

// Create particle material with increased base size
const particleMaterial = new THREE.PointsMaterial({
  size: 2, // Increased from 1 to 2
  vertexColors: true,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true
});

// Create particle system
const particleSystem = new THREE.Points(backgroundParticles, particleMaterial);
scene.add(particleSystem);

// Particle animation
const particlePositions = backgroundParticles.attributes.position.array;
const particleSpeeds = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  particleSpeeds[i] = 0.1 + Math.random() * 0.2;
}

function updateParticles() {
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Rotate particles around Y axis
    const angle = particleSpeeds[i] * 0.01;
    const x = particlePositions[i3];
    const z = particlePositions[i3 + 2];
    
    particlePositions[i3] = x * Math.cos(angle) - z * Math.sin(angle);
    particlePositions[i3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
    
    // Add slight vertical movement
    particlePositions[i3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.1;
  }
  backgroundParticles.attributes.position.needsUpdate = true;
}

/* RENDERING */
function render() {
  requestAnimationFrame(render);
  
  // Update background particles
  updateParticles();
  
  // Update cursor hearts
  for (let i = cursorHearts.length - 1; i >= 0; i--) {
    const heart = cursorHearts[i];
    heart.userData.age += 0.02;
    
    // Update position
    heart.position.x += heart.userData.velocity.x;
    heart.position.y += heart.userData.velocity.y;
    
    // Fade out and scale down
    const progress = heart.userData.age / heart.userData.maxAge;
    heart.material.opacity = 0.8 * (1 - progress);
    heart.scale.setScalar(0.5 * (1 - progress));
    
    // Remove old hearts
    if (heart.userData.age >= heart.userData.maxAge) {
      scene.remove(heart);
      heart.geometry.dispose();
      heart.material.dispose();
      cursorHearts.splice(i, 1);
    }
  }
  
  // Update the geometry from the animated vertices
  geometry.setFromPoints(vertices);
  renderer.render(scene, camera);
}

/* EVENTS */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize, false);

requestAnimationFrame(render);