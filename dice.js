// === Enhanced 3D Dice (d4/d6/d8/d10/d12/d20) ===============================
let scene, camera, renderer, world, dice, isRolling = false;
let currentDiceType = 'd20';

// Per-die config + how many TRIANGLES make up one logical face for each geom
const DICE_CONFIGS = {
  d4:  { sides: 4,  geometry: 'tetrahedron',   scale: 0.8,  trisPerFace: 1 },
  d6:  { sides: 6,  geometry: 'box',           scale: 0.7,  trisPerFace: 2 },
  d8:  { sides: 8,  geometry: 'octahedron',    scale: 0.8,  trisPerFace: 1 },
  // d10 here is a 10-sided prism (2 triangles per rectangular side)
  d10: { sides: 10, geometry: 'prism10',       scale: 0.8,  trisPerFace: 2 },
  // d12 triangulates pentagons into 3 triangles each
  d12: { sides: 12, geometry: 'dodecahedron',  scale: 0.8,  trisPerFace: 3 },
  d20: { sides: 20, geometry: 'icosahedron',   scale: 0.7,  trisPerFace: 1 },
};

// --------- Helpers: rounded-rect tray --------------------------------------
function addRoundedRectPath(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
}

function buildDiceTray({
  width = 8.0,
  height = 5.0,
  cornerR = 0.6,
  wall = 0.35,
  depth = 0.6
} = {}) {
  const tray = new THREE.Group();

  const shape = new THREE.Shape();
  addRoundedRectPath(shape, -width/2, -height/2, width, height, cornerR);
  const hole = new THREE.Path();
  addRoundedRectPath(hole, -width/2 + wall, -height/2 + wall,
    width - wall*2, height - wall*2, Math.max(0.1, cornerR - 0.25));
  shape.holes.push(hole);

  const frameGeo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08,
    bevelSegments: 2, curveSegments: 32
  });

  const wood = new THREE.MeshStandardMaterial({ color: 0x4a1a1a, roughness: 0.75, metalness: 0.1 });
  const frame = new THREE.Mesh(frameGeo, wood);
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = -1.0;
  frame.castShadow = frame.receiveShadow = true;
  tray.add(frame);

  const feltGeo = new THREE.PlaneGeometry(width - wall*2 - 0.08, height - wall*2 - 0.08);
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 1, metalness: 0 });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.rotation.x = -Math.PI / 2;
  felt.position.set(0, frame.position.y + 0.01, 0);
  felt.receiveShadow = true;
  tray.add(felt);

  tray.userData.groundY = felt.position.y + 0.01;
  tray.userData.bounds = {
    x: (width  - wall*2) / 2 - 0.25,
    z: (height - wall*2) / 2 - 0.25
  };
  tray.name = 'diceTray';
  return tray;
}

// --------- Font loader (Cinzel 900) ----------------------------------------
async function loadDiceFont() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@900&display=swap';
  document.head.appendChild(link);
  await document.fonts.load('900 100px Cinzel');
}

// --------- Geometry builders -----------------------------------------------
function createDiceGeometry(type) {
  switch (DICE_CONFIGS[type].geometry) {
    case 'tetrahedron':   return new THREE.TetrahedronGeometry(1.2, 0).toNonIndexed();
    case 'box':           return new THREE.BoxGeometry(1.2, 1.2, 1.2).toNonIndexed();
    case 'octahedron':    return new THREE.OctahedronGeometry(1.2, 0).toNonIndexed();
    case 'dodecahedron':  return new THREE.DodecahedronGeometry(1.2, 0).toNonIndexed();
    case 'icosahedron':   return new THREE.IcosahedronGeometry(1.2, 0).toNonIndexed();

    // 10-sided prism: cylinder with 10 radial segments, no caps (2 tris per side)
    case 'prism10': {
      const g = new THREE.CylinderGeometry(1.0, 1.0, 1.6, 10, 1, /*openEnded=*/true);
      // rotate so faces read more nicely
      g.rotateX(Math.PI / 2);
      return g.toNonIndexed();
    }
    default:              return new THREE.IcosahedronGeometry(1.2, 0).toNonIndexed();
  }
}

// --------- Dice creation (any type) ----------------------------------------
async function createDice(type = 'd20') {
  currentDiceType = type;
  await loadDiceFont();

  if (dice) { scene.remove(dice); dice.geometry.dispose(); }

  const cfg = DICE_CONFIGS[type];
  const geo = createDiceGeometry(type);
  geo.computeVertexNormals();

  // Group triangles so the SAME material is used by all triangles of one face
  const triCount = geo.attributes.position.count / 3;
  const trisPerFace = cfg.trisPerFace;
  const logicalFaceCount = Math.floor(triCount / trisPerFace);

  geo.clearGroups();
  for (let tri = 0; tri < triCount; tri++) {
    const faceId = Math.floor(tri / trisPerFace);
    geo.addGroup(tri * 3, 3, faceId);
  }

  // UVs: map each triangle to full [0..1] (simple + robust)
  // (For quads/pentagons this means the number is duplicated across the triangles of a face,
  //  but both triangles share the same material/number so it still reads clearly.)
  const uvs = new Float32Array(triCount * 3 * 2);
  for (let t = 0; t < triCount; t++) {
    const o = t * 6;
    uvs[o+0]=0; uvs[o+1]=0;  // v0
    uvs[o+2]=1; uvs[o+3]=0;  // v1
    uvs[o+4]=0; uvs[o+5]=1;  // v2
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  // Build one material per logical face
  const size = 256;
  const UV_CX = 1/3, UV_CY = 1/3 + 0.02;
  const mats = [];

  for (let faceId = 0; faceId < logicalFaceCount; faceId++) {
    const num = (faceId % cfg.sides) + 1; // wrap just in case

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark metallic plate
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, '#3a3a3a'); g.addColorStop(0.3, '#2a2a2a');
    g.addColorStop(0.7, '#1a1a1a'); g.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = g; ctx.fillRect(0,0,size,size);

    // Gold frame
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.strokeRect(4,4,size-8,size-8);
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2; ctx.strokeRect(8,8,size-16,size-16);

    // Number (gold with white outline for pop)
    const cx = size * UV_CX, cy = size * UV_CY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${size * 0.46}px Cinzel, serif`;
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = size * 0.06; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeText(String(num), cx, cy);
    ctx.fillStyle = '#d4af37';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 3; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
    ctx.fillText(String(num), cx, cy);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    mats.push(new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.35, metalness: 0.1, envMapIntensity: 0.3, side: THREE.DoubleSide
    }));
  }

  // Mesh + physics props
  dice = new THREE.Mesh(geo, mats);
  dice.castShadow = dice.receiveShadow = true;
  dice.position.set(0, 1, 0);
  dice.scale.set(cfg.scale, cfg.scale, cfg.scale);
  geo.computeBoundingSphere();
  dice.userData.radius = (geo.boundingSphere?.radius || 1) * cfg.scale;
  dice.userData.sides  = cfg.sides;

  scene.add(dice);
}

// --------- Scene init -------------------------------------------------------
function initDice() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // build camera after we know container size (set later)
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 7, 7);
  camera.lookAt(0, 0, 0);

  let diceContainer = document.getElementById('combat-dice-display') ||
                      document.getElementById('dice-display') ||
                      document.querySelector('.combat-dice-display');
  if (!diceContainer) { console.warn('No dice container found'); return false; }

  // Renderer size = container size
  const w = diceContainer.offsetWidth  || 300;
  const h = diceContainer.offsetHeight || 200;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, logarithmicDepthBuffer: true });
  renderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x1a1a2e, 1.0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  diceContainer.innerHTML = '';
  diceContainer.appendChild(renderer.domElement);

  world = { gravity: -20 };

  // Lights
  scene.add(new THREE.AmbientLight(0x404040, 0.4));
  const spot = new THREE.SpotLight(0xffffff, 2.5);
  spot.position.set(-3, 6, 3); spot.target.position.set(0, 0, 0);
  spot.distance = 15; spot.angle = Math.PI/4; spot.penumbra = 0.1; spot.decay = 2;
  spot.castShadow = true;
  spot.shadow.mapSize.width = 2048; spot.shadow.mapSize.height = 2048;
  spot.shadow.camera.near = 0.5; spot.shadow.camera.far = 15; spot.shadow.bias = -0.0001;
  scene.add(spot);

  const combat = new THREE.DirectionalLight(0xff6666, 0.6); combat.position.set(5, 3, -2); scene.add(combat);
  const rim = new THREE.DirectionalLight(0xd4af37, 0.4);    rim.position.set(-2, 1, -3);  scene.add(rim);

  // Tray
  const tray = buildDiceTray({ width: 6.0, height: 4.0 });
  scene.add(tray);

  // Build starting die
  createDice('d20');

  // Resize handler
  window.addEventListener('resize', () => {
    const w2 = diceContainer.offsetWidth  || 300;
    const h2 = diceContainer.offsetHeight || 200;
    renderer.setSize(w2, h2);
    camera.aspect = w2 / h2; camera.updateProjectionMatrix();
  });

  // Render loop
  animate();

  // Button
  const rollButton = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  if (rollButton) rollButton.addEventListener('click', () => roll3DDice(currentDiceType));

  return true;
}

// --------- Rolling / physics ------------------------------------------------
function roll3DDice(diceType = currentDiceType) {
  if (isRolling) return;
  if (!ensureDiceInitialized()) return;

  // Switch type on the fly
  if (diceType !== currentDiceType) {
    createDice(diceType);
  }

  const btn = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  const resultDiv = document.getElementById('combat-dice-result') || document.getElementById('dice-result');
  if (btn) btn.disabled = true;
  isRolling = true;
  if (resultDiv) resultDiv.innerHTML = '';

  dice.userData.velocity = {
    x: (Math.random() - 0.5) * 12,
    y: Math.random() * 6 + 6,
    z: (Math.random() - 0.5) * 12
  };
  dice.userData.angularVelocity = {
    x: (Math.random() - 0.5) * 25,
    y: (Math.random() - 0.5) * 25,
    z: (Math.random() - 0.5) * 25
  };

  dice.position.set((Math.random() - 0.5) * 2, 4, (Math.random() - 0.5) * 2);

  setTimeout(stopDiceAndShowResult, 3500);
}

function stopDiceAndShowResult() {
  if (dice && dice.userData) {
    dice.userData.velocity = { x: 0, y: 0, z: 0 };
    dice.userData.angularVelocity = { x: 0, y: 0, z: 0 };
  }

  const finalRoll = calculateDiceResult();
  const combatResultDiv  = document.getElementById('combat-dice-result');
  const regularResultDiv = document.getElementById('dice-result');

  const resultText = getDiceResultText(finalRoll, currentDiceType);
  const html = `
    <div>You rolled: <strong>${finalRoll}</strong> on ${currentDiceType.toUpperCase()}</div>
    <div style="font-size:0.9rem;margin-top:0.5rem;">${resultText}</div>
  `;

  // write to whichever result box exists
  const target = combatResultDiv || regularResultDiv;
  if (target) target.innerHTML = html;

  // re-enable button
  const btn = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  if (btn) btn.disabled = false;

  isRolling = false;
}

function calculateDiceResult() {
  const sides = dice?.userData?.sides || 20;
  return Math.floor(Math.random() * sides) + 1;
}

function animate() {
  requestAnimationFrame(animate);

  if (dice && isRolling && dice.userData) {
    const dt = 0.016;
    dice.userData.velocity.y += world.gravity * dt;

    dice.position.x += dice.userData.velocity.x * dt;
    dice.position.y += dice.userData.velocity.y * dt;
    dice.position.z += dice.userData.velocity.z * dt;

    dice.rotation.x += dice.userData.angularVelocity.x * dt;
    dice.rotation.y += dice.userData.angularVelocity.y * dt;
    dice.rotation.z += dice.userData.angularVelocity.z * dt;

    const tray = scene.getObjectByName('diceTray');
    const bounds = tray?.userData?.bounds || { x: 2.5, z: 1.5 };
    const groundY = tray?.userData?.groundY ?? -0.95;
    const r = dice.userData?.radius || 0.8;

    if (Math.abs(dice.position.x) > bounds.x - r) {
      dice.userData.velocity.x *= -0.6;
      dice.position.x = Math.sign(dice.position.x) * (bounds.x - r);
      dice.userData.angularVelocity.x *= 0.8;
    }
    if (Math.abs(dice.position.z) > bounds.z - r) {
      dice.userData.velocity.z *= -0.6;
      dice.position.z = Math.sign(dice.position.z) * (bounds.z - r);
      dice.userData.angularVelocity.z *= 0.8;
    }
    if (dice.position.y < groundY + r) {
      dice.position.y = groundY + r;
      dice.userData.velocity.y *= -0.5;
      dice.userData.velocity.x *= 0.85;
      dice.userData.velocity.z *= 0.85;
      dice.userData.angularVelocity.x *= 0.8;
      dice.userData.angularVelocity.y *= 0.8;
      dice.userData.angularVelocity.z *= 0.8;
    }
  }

  if (renderer && scene && camera) renderer.render(scene, camera);
}

// --------- UI helpers -------------------------------------------------------
function getDiceResultText(roll, type='d20') {
  const max = DICE_CONFIGS[type]?.sides || 20;
  if (type === 'd20') {
    if (roll === 20) return "🔥 Critical Hit! Maximum damage!";
    if (roll === 1)  return "💀 Critical Miss! Your attack goes awry!";
    if (roll >= 17)  return "⭐ Excellent roll! You strike true!";
    if (roll >= 13)  return "👍 Good hit! Your attack connects!";
    if (roll >= 8)   return "😐 Decent attempt, but not your best.";
    return "😬 Poor roll. You struggle to connect.";
  }
  if (roll === max) return `🔥 Maximum ${type} damage!`;
  if (roll === 1)   return `😬 Minimal ${type} damage.`;
  if (roll >= Math.ceil(max*0.75)) return `⭐ High ${type} damage!`;
  if (roll >= Math.ceil(max*0.5))  return `👍 Solid ${type} damage.`;
  return `😐 Low ${type} damage.`;
}

// --------- Bootstrapping ----------------------------------------------------
function ensureDiceInitialized() {
  const diceContainer = document.getElementById('combat-dice-display') ||
                        document.getElementById('dice-display') ||
                        document.querySelector('.combat-dice-display');
  if (diceContainer && !renderer) {
    if (typeof THREE !== 'undefined') return initDice();
    console.log('THREE.js not loaded yet'); return false;
  }
  return !!renderer;
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { ensureDiceInitialized(); }, 800);

  const questsPage = document.getElementById('quests-page');
  if (questsPage) {
    const observer = new MutationObserver(() => {
      if (questsPage.classList.contains('active')) {
        setTimeout(() => { ensureDiceInitialized(); }, 500);
      }
    });
    observer.observe(questsPage, { attributes: true });
  }
});

// Expose a couple helpers
window.ensureDiceInitialized = ensureDiceInitialized;
window.roll3DDice = roll3DDice;
window.createDice = createDice;
