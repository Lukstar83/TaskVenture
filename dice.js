// 3D Dice rolling functionality using Three.js
let scene, camera, renderer, world, dice, isRolling = false;

// ---------- Helpers: tray geometry ----------
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
  width = 11.0,    // ← make wider/narrower here
  height = 6.0,
  cornerR = 0.6,
  wall = 0.35,
  depth = 0.6
} = {}) {
  const tray = new THREE.Group();

  // Outer frame with inner hole
  const shape = new THREE.Shape();
  addRoundedRectPath(shape, -width/2, -height/2, width, height, cornerR);

  const hole = new THREE.Path();
  addRoundedRectPath(
    hole,
    -width/2 + wall, -height/2 + wall,
    width - wall*2, height - wall*2,
    Math.max(0.1, cornerR - 0.25)
  );
  shape.holes.push(hole);

  const frameGeo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    bevelSegments: 2,
    curveSegments: 32
  });

  const wood = new THREE.MeshStandardMaterial({ color: 0x7b4a21, roughness: 0.75, metalness: 0.1 });
  const frame = new THREE.Mesh(frameGeo, wood);
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = -1.0;
  frame.castShadow = frame.receiveShadow = true;
  tray.add(frame);

  // Felt insert
  const feltGeo = new THREE.PlaneGeometry(width - wall*2 - 0.08, height - wall*2 - 0.08);
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x0b5d1e, roughness: 1, metalness: 0 });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.rotation.x = -Math.PI / 2;
  felt.position.set(0, frame.position.y + 0.01, 0);
  felt.receiveShadow = true;
  tray.add(felt);

  // Expose physics bounds & ground
  tray.userData.groundY = felt.position.y + 0.01;
  tray.userData.bounds = {
    x: (width  - wall*2) / 2 - 0.25,
    z: (height - wall*2) / 2 - 0.25
  };
  tray.name = 'diceTray';
  return tray;
}

// ---------- Font loader (Canvas needs actual font file) ----------
async function loadDiceFont() {
  try {
    const face = new FontFace(
      'Cinzel',
      'url(https://fonts.gstatic.com/s/cinzel/v24/8vIJ7ww63mVu7gt79mT8.woff2) format("woff2")'
    );
    await face.load();
    document.fonts.add(face);
    await document.fonts.load('700 100px Cinzel');
  } catch (e) {
    console.warn('Font load failed, using fallback serif.', e);
  }
}

// ---------- Dice creation ----------
function createDice() {
  // 1) Geometry (non-indexed so each face gets its own vertices/UVs)
  const geo = new THREE.IcosahedronGeometry(1.2, 0).toNonIndexed();
  geo.computeVertexNormals();

  // 2) One material per triangle
  const faceCount = geo.attributes.position.count / 3;
  geo.clearGroups();
  for (let f = 0; f < faceCount; f++) geo.addGroup(f * 3, 3, f);

  // 3) Per-face UVs (full texture → triangle). Right triangle mapping.
  const uvs = new Float32Array(faceCount * 3 * 2);
  for (let f = 0; f < faceCount; f++) {
    const o = f * 6;
    uvs[o + 0] = 0; uvs[o + 1] = 0;   // v0
    uvs[o + 2] = 1; uvs[o + 3] = 0;   // v1
    uvs[o + 4] = 0; uvs[o + 5] = 1;   // v2
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  // 4) Materials with centered numbers (triangle centroid ~ (1/3, 1/3))
  const materials = [];
  const size = 256;
  const nums = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  const UV_CX = 1/3, UV_CY = 1/3 + 0.3; // tiny optical nudge down

  for (let i = 0; i < faceCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Metallic plate look
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, '#f5f5f5'); g.addColorStop(0.3, '#e8e8e8');
    g.addColorStop(0.7, '#d0d0d0'); g.addColorStop(1, '#b8b8b8');
    ctx.fillStyle = g; ctx.fillRect(0,0,size,size);

    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(4,4,size-8,size-8);
    ctx.strokeStyle = '#999';    ctx.lineWidth = 2; ctx.strokeRect(8,8,size-16,size-16);

    // Number
    ctx.fillStyle = '#2c2c2c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 2; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
      ctx.font = `900 ${size * 0.46}px Cinzel, serif`;
      ctx.fillText(String(nums[i] ?? (i+1)), size * UV_CX, size * UV_CY);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 0;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // Standard material gives nicer lighting
    materials.push(new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.35,
      metalness: 0.1,
      envMapIntensity: 0.3,
      side: THREE.DoubleSide
    }));
  }

    // after geo is built
    geo.computeBoundingSphere();
    // ...
    dice = new THREE.Mesh(geo, materials);
    dice.castShadow = dice.receiveShadow = true;
    dice.position.set(0, 1, 0);
    dice.scale.set(0.7, 0.7, 0.7);

    // effective radius (accounts for scale)
    const r = (geo.boundingSphere?.radius || 1.2) * dice.scale.y;
    dice.userData.radius = r;
  scene.add(dice);

  console.log('✅ D20 created with per-face UVs and centered numbers');
}

// ---------- Scene init ----------
function initDice() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // Camera
  camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
  camera.position.set(0, 6, 5.8);
  camera.lookAt(0, 0, 0);
    camera.fov = 45;
    camera.updateProjectionMatrix();

  // Container
  let diceContainer = document.getElementById('dice-display') || document.getElementById('combat-dice-display');
  if (!diceContainer) {
    const combatDiceSection = document.querySelector('.combat-dice-section');
    if (combatDiceSection) diceContainer = combatDiceSection.querySelector('.combat-dice-display');
    if (!diceContainer) return false;
  }

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, logarithmicDepthBuffer: true });
  renderer.setSize(365, auto);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x1a1a2e, 1.0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  diceContainer.innerHTML = '';
  diceContainer.appendChild(renderer.domElement);

  // Simple “world”
  world = { gravity: -20, objects: [] };

  // Lights
  scene.add(new THREE.AmbientLight(0x404040, 0.6));

  const spot = new THREE.SpotLight(0xffffff, 2.0);
  spot.position.set(-3, 6, 3);
  spot.target.position.set(0, 0, 0);
  spot.distance = 15; spot.angle = Math.PI/4; spot.penumbra = 0.1; spot.decay = 2;
  spot.castShadow = true;
  spot.shadow.mapSize.width = 2048; spot.shadow.mapSize.height = 2048;
  spot.shadow.camera.near = 0.5; spot.shadow.camera.far = 15; spot.shadow.bias = -0.0001;
  scene.add(spot);

  const fill = new THREE.DirectionalLight(0x9bb5ff, 0.4);
  fill.position.set(5, 3, -2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffc994, 0.3);
  rim.position.set(-2, 1, -3);
  scene.add(rim);

  // Tray
  const tray = buildDiceTray({ width: 11.0, height: 6.0 });
  scene.add(tray);

  // Dice (load font first so Canvas uses it)
  loadDiceFont().then(createDice).catch(createDice);

  // Render loop
  animate();

  // Button
  const rollButton = document.getElementById('roll-dice-btn');
  if (rollButton) rollButton.addEventListener('click', roll3DDice);
}

// ---------- Rolling / physics ----------
function roll3DDice() {
  if (isRolling) return;
  if (!ensureDiceInitialized()) return;

  const rollButton = document.getElementById('roll-dice-btn');
  const resultDiv = document.getElementById('dice-result');
  if (rollButton) rollButton.disabled = true;
  isRolling = true;
  if (resultDiv) resultDiv.innerHTML = '';

  if (!dice.userData) {
    dice.userData = { velocity: { x: 0, y: 0, z: 0 }, angularVelocity: { x: 0, y: 0, z: 0 } };
  }

  dice.userData.velocity = {
    x: (Math.random() - 0.5) * 10,
    y: Math.random() * 5 + 5,
    z: (Math.random() - 0.5) * 10
  };
  dice.userData.angularVelocity = {
    x: (Math.random() - 0.5) * 20,
    y: (Math.random() - 0.5) * 20,
    z: (Math.random() - 0.5) * 20
  };

  dice.position.set((Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2);

  setTimeout(stopDiceAndShowResult, 3000);
}

function stopDiceAndShowResult() {
  if (dice && dice.userData) {
    dice.userData.velocity = { x: 0, y: 0, z: 0 };
    dice.userData.angularVelocity = { x: 0, y: 0, z: 0 };
  }

  const finalRoll = calculateDiceResult();
  const combatResultDiv = document.getElementById('combat-dice-result');
  const regularResultDiv = document.getElementById('dice-result');

  const resultText = getDiceResultText(finalRoll);
  const resultHTML = `
    <div>You rolled: <strong>${finalRoll}</strong></div>
    <div style="font-size: 0.9rem; margin-top: 0.5rem;">${resultText}</div>
  `;

  if (window.questEngine && window.questEngine.pendingRoll) {
    if (combatResultDiv) combatResultDiv.innerHTML = resultHTML;
    window.questEngine.processDiceRoll(finalRoll);
  } else if (window.skillCheckContext) {
    const context = window.skillCheckContext;
    if (context.callback) context.callback(finalRoll);
    window.skillCheckContext = null;
    if (regularResultDiv) regularResultDiv.innerHTML = resultHTML;
  } else {
    if (regularResultDiv) regularResultDiv.innerHTML = resultHTML;
    applyDiceEffect(finalRoll);
  }

  const rollButton = document.getElementById('roll-dice-btn');
  const combatRollButton = document.getElementById('combat-roll-btn');
  if (rollButton) rollButton.disabled = false;
  if (combatRollButton) combatRollButton.disabled = false;

  isRolling = false;
}

function calculateDiceResult() {
  return Math.floor(Math.random() * 20) + 1;
}

function animate() {
  requestAnimationFrame(animate);

  if (dice && isRolling) {
    const dt = 0.016;

    dice.userData.velocity.y += world.gravity * dt;

    dice.position.x += dice.userData.velocity.x * dt;
    dice.position.y += dice.userData.velocity.y * dt;
    dice.position.z += dice.userData.velocity.z * dt;

    dice.rotation.x += dice.userData.angularVelocity.x * dt;
    dice.rotation.y += dice.userData.angularVelocity.y * dt;
    dice.rotation.z += dice.userData.angularVelocity.z * dt;

    const trayObj = scene.getObjectByName('diceTray');
    const bounds = trayObj?.userData?.bounds || { x: 4, z: 3.5 };
    const groundY = trayObj?.userData?.groundY ?? -0.95;

    if (Math.abs(dice.position.x) > bounds.x) {
      dice.userData.velocity.x *= -0.6;
      dice.position.x = Math.sign(dice.position.x) * bounds.x;
    }
    if (Math.abs(dice.position.z) > bounds.z) {
      dice.userData.velocity.z *= -0.6;
      dice.position.z = Math.sign(dice.position.z) * bounds.z;
    }
      
      const trayObj  = scene.getObjectByName('diceTray');
      const bounds   = trayObj?.userData?.bounds || { x: 4, z: 3.5 };
      const groundY  = trayObj?.userData?.groundY ?? -0.95;
      const r        = dice.userData?.radius || 0.84; // 1.2 * 0.7 fallback

      // walls (keep center r away from the wall)
      if (Math.abs(dice.position.x) > bounds.x - r) {
        dice.userData.velocity.x *= -0.6;
        dice.position.x = Math.sign(dice.position.x) * (bounds.x - r);
      }
      if (Math.abs(dice.position.z) > bounds.z - r) {
        dice.userData.velocity.z *= -0.6;
        dice.position.z = Math.sign(dice.position.z) * (bounds.z - r);
      }

      // floor (rest at ground + radius)
        if (dice.position.y < groundY + r) {
          dice.position.y = groundY + r;
          dice.userData.velocity.y *= -0.6;
          dice.userData.velocity.x *= 0.8;
          dice.userData.velocity.z *= 0.8;
          dice.userData.angularVelocity.x *= 0.8;
          dice.userData.angularVelocity.y *= 0.8;
          dice.userData.angularVelocity.z *= 0.8;
    }
  }

  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ---------- UI helpers ----------
function getDiceResultText(roll) {
  if (roll === 20) return "🔥 Critical Success! Bonus XP for your next quest!";
  if (roll >= 15) return "⭐ Great roll! Fortune favors you!";
  if (roll >= 10) return "👍 Decent roll! The dice are neutral.";
  if (roll >= 5)  return "😐 Low roll. Better luck next time.";
  if (roll === 1) return "💀 Critical Failure! But hey, at least you're learning!";
  return "😅 Not your best roll, but adventure continues!";
}

function applyDiceEffect(roll) {
  if (roll === 20) {
    if (window.user) window.user.bonusXP = true;
    showFloatingMessage("Bonus XP activated for next quest!", "success");
  } else if (roll === 1) {
    showFloatingMessage("The dice mock you, but you're undeterred!", "info");
  } else if (roll >= 15 && window.user) {
    window.user.xp = (window.user.xp || 0) + 5;
    showFloatingMessage("+5 XP from lucky roll!", "success");
    if (window.updateUI) window.updateUI();
  }
}

function showFloatingMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 1rem; border-radius: 8px;
    color: white; font-weight: bold; z-index: 1001; animation: slideIn 0.3s ease-out;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    border: 2px solid ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
  `;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; }
                         to   { transform: translateX(0);     opacity: 1; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(messageDiv);
  setTimeout(() => {
    messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// ---------- Bootstrapping ----------
function ensureDiceInitialized() {
  const diceContainer = document.getElementById('dice-display') ||
                        document.getElementById('combat-dice-display') ||
                        document.querySelector('.combat-dice-display');

  if (diceContainer && !renderer) {
    if (typeof THREE !== 'undefined') {
      try { initDice(); return true; }
      catch (e) { console.error('Failed to initialize dice:', e); return false; }
    } else {
      console.log('THREE.js not loaded yet'); return false;
    }
  }
  return !!renderer;
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { ensureDiceInitialized(); }, 1000);

  const observer = new MutationObserver(() => {
    const dicePage = document.getElementById('dice-page');
    if (dicePage && dicePage.classList.contains('active')) {
      setTimeout(() => { ensureDiceInitialized(); }, 500);
    }
  });
  const dicePage = document.getElementById('dice-page');
  if (dicePage) observer.observe(dicePage, { attributes: true });
});

// Combat init + skill checks
function initCombatDice() {
  const combatDiceContainer = document.getElementById('combat-dice-display');
  if (!combatDiceContainer || !renderer) return;
  if (combatDiceContainer.querySelector('canvas')) return;
  const combatRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  combatRenderer.setSize(250, 180);
  combatRenderer.shadowMap.enabled = true;
  combatRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  combatDiceContainer.innerHTML = '';
  combatDiceContainer.appendChild(combatRenderer.domElement);
  combatRenderer.render(scene, camera);
}
window.initCombatDice = initCombatDice;
window.ensureDiceInitialized = ensureDiceInitialized;

function rollD20() { return Math.floor(Math.random() * 20) + 1; }

function rollSkillCheck(skillName, dc, callback) {
  if (isRolling) return;
  window.skillCheckContext = { skill: skillName, dc, callback };
  if (ensureDiceInitialized()) roll3DDice();
  else {
    const result = rollD20();
    if (callback) callback(result);
  }
}
window.rollSkillCheck = rollSkillCheck;
