
// Enhanced 3D Dice rolling functionality using Three.js
let scene, camera, renderer, world, dice, isRolling = false;
let currentDiceType = 'd20'; // Track current dice type

// Dice configurations
const DICE_CONFIGS = {
  'd4': { sides: 4, geometry: 'tetrahedron', scale: 0.8 },
  'd6': { sides: 6, geometry: 'box', scale: 0.7 },
  'd8': { sides: 8, geometry: 'octahedron', scale: 0.8 },
  'd10': { sides: 10, geometry: 'bipyramid', scale: 0.8 },
  'd12': { sides: 12, geometry: 'dodecahedron', scale: 0.8 },
  'd20': { sides: 20, geometry: 'icosahedron', scale: 0.7 }
};

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
  width = 6.0,  // Reduced from 8.0
  height = 4.0, // Reduced from 5.0
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

  const wood = new THREE.MeshStandardMaterial({ color: 0x4a1a1a, roughness: 0.75, metalness: 0.1 });
  const frame = new THREE.Mesh(frameGeo, wood);
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = -1.0;
  frame.castShadow = frame.receiveShadow = true;
  tray.add(frame);

  // Felt insert with darker color for combat theme
  const feltGeo = new THREE.PlaneGeometry(width - wall*2 - 0.08, height - wall*2 - 0.08);
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 1, metalness: 0 });
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

// ---------- Font loader ----------
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

// ---------- Dice geometry creation ----------
function createDiceGeometry(type) {
  const config = DICE_CONFIGS[type];
  let geometry;

  switch (config.geometry) {
    case 'tetrahedron':
      geometry = new THREE.TetrahedronGeometry(1.2, 0);
      break;
    case 'box':
      geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      break;
    case 'octahedron':
      geometry = new THREE.OctahedronGeometry(1.2, 0);
      break;
    case 'bipyramid':
      // Create a custom D10 geometry
      geometry = new THREE.ConeGeometry(1.0, 2.4, 10, 1);
      break;
    case 'dodecahedron':
      geometry = new THREE.DodecahedronGeometry(1.2, 0);
      break;
    case 'icosahedron':
    default:
      geometry = new THREE.IcosahedronGeometry(1.2, 0);
      break;
  }

  return geometry.toNonIndexed();
}

// ---------- Dice creation ----------
function createDice(diceType = 'd20') {
  // Remove existing dice
  if (dice) {
    scene.remove(dice);
    if (dice.geometry) dice.geometry.dispose();
    if (Array.isArray(dice.material)) {
      dice.material.forEach(mat => mat.dispose());
    } else if (dice.material) {
      dice.material.dispose();
    }
  }

  const geo = createDiceGeometry(diceType);
  const config = DICE_CONFIGS[diceType];
  geo.computeVertexNormals();

  // One material per face
  const faceCount = geo.attributes.position.count / 3;
  geo.clearGroups();
  for (let f = 0; f < faceCount; f++) geo.addGroup(f * 3, 3, f);

  // Per-face UVs
  const uvs = new Float32Array(faceCount * 3 * 2);
  for (let f = 0; f < faceCount; f++) {
    const o = f * 6;
    uvs[o + 0] = 0; uvs[o + 1] = 0;
    uvs[o + 2] = 1; uvs[o + 3] = 0;
    uvs[o + 4] = 0; uvs[o + 5] = 1;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  // Materials with centered numbers
  const materials = [];
  const size = 256;
  const maxSides = config.sides;
  const nums = Array.from({length: maxSides}, (_, i) => i + 1);
  const UV_CX = 1/3, UV_CY = 1/3 + 0.3;

  for (let i = 0; i < faceCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark metallic plate look for combat theme
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, '#3a3a3a'); 
    g.addColorStop(0.3, '#2a2a2a');
    g.addColorStop(0.7, '#1a1a1a'); 
    g.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = g; 
    ctx.fillRect(0,0,size,size);

    // Gold borders for fantasy theme
    ctx.strokeStyle = '#d4af37'; 
    ctx.lineWidth = 4; 
    ctx.strokeRect(4,4,size-8,size-8);
    ctx.strokeStyle = '#b8860b';    
    ctx.lineWidth = 2; 
    ctx.strokeRect(8,8,size-16,size-16);

    // Gold numbers
    ctx.fillStyle = '#d4af37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000'; 
    ctx.shadowBlur = 3; 
    ctx.shadowOffsetX = 1; 
    ctx.shadowOffsetY = 1;
    ctx.font = `900 ${size * 0.46}px Cinzel, serif`;
    
    // Cycle through available numbers for this dice type
    const numberIndex = i % maxSides;
    ctx.fillText(String(nums[numberIndex]), size * UV_CX, size * UV_CY);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 0;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    materials.push(new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.35,
      metalness: 0.3,
      envMapIntensity: 0.3,
      side: THREE.DoubleSide
    }));
  }

  geo.computeBoundingSphere();
  dice = new THREE.Mesh(geo, materials);
  dice.castShadow = dice.receiveShadow = true;
  dice.position.set(0, 1, 0);
  dice.scale.set(config.scale, config.scale, config.scale);

  const r = (geo.boundingSphere?.radius || 1.2) * dice.scale.y;
  dice.userData = {
    radius: r,
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    type: diceType,
    sides: config.sides
  };
  
  scene.add(dice);
  currentDiceType = diceType;
  console.log(`✅ ${diceType.toUpperCase()} created with enhanced combat styling`);
}

// ---------- Scene init ----------
function initDice() {
  // Scene with darker background for combat
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // Camera - pulled back and up slightly for better view
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 7, 7); // Moved up from (0, 6, 5.8)
  camera.lookAt(0, 0, 0);

  // Find container - prioritize combat dice display
  let diceContainer = document.getElementById('combat-dice-display') || document.getElementById('dice-display');
  if (!diceContainer) {
    const combatDiceSection = document.querySelector('.combat-dice-section');
    if (combatDiceSection) diceContainer = combatDiceSection.querySelector('.combat-dice-display');
    if (!diceContainer) {
      console.warn('No dice container found');
      return false;
    }
  }

  // Renderer with combat-appropriate settings
  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: false, 
    logarithmicDepthBuffer: true 
  });
  
  // Set size based on container
  const containerWidth = diceContainer.offsetWidth || 300;
  const containerHeight = diceContainer.offsetHeight || 200;
  renderer.setSize(containerWidth, containerHeight);
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x1a1a2e, 1.0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  diceContainer.innerHTML = '';
  diceContainer.appendChild(renderer.domElement);

  // Simple physics world
  world = { gravity: -20, objects: [] };

  // Dramatic lighting for combat
  scene.add(new THREE.AmbientLight(0x404040, 0.4));

  const spot = new THREE.SpotLight(0xffffff, 2.5);
  spot.position.set(-3, 6, 3);
  spot.target.position.set(0, 0, 0);
  spot.distance = 15; 
  spot.angle = Math.PI/4; 
  spot.penumbra = 0.1; 
  spot.decay = 2;
  spot.castShadow = true;
  spot.shadow.mapSize.width = 2048; 
  spot.shadow.mapSize.height = 2048;
  spot.shadow.camera.near = 0.5; 
  spot.shadow.camera.far = 15; 
  spot.shadow.bias = -0.0001;
  scene.add(spot);

  // Red accent light for combat atmosphere
  const combat = new THREE.DirectionalLight(0xff6666, 0.6);
  combat.position.set(5, 3, -2);
  scene.add(combat);

  // Gold rim light
  const rim = new THREE.DirectionalLight(0xd4af37, 0.4);
  rim.position.set(-2, 1, -3);
  scene.add(rim);

  // Tray with adjusted dimensions
  const tray = buildDiceTray({ width: 6.0, height: 4.0 });
  scene.add(tray);

  // Load font and create dice
  loadDiceFont().then(() => createDice('d20')).catch(() => createDice('d20'));

  // Start render loop
  animate();

  // Attach button listeners
  const rollButton = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  if (rollButton) {
    rollButton.addEventListener('click', roll3DDice);
  }

  return true;
}

// ---------- Rolling / physics ----------
function roll3DDice(diceType = currentDiceType) {
  if (isRolling) return;
  if (!ensureDiceInitialized()) return;

  // Switch dice type if different
  if (diceType !== currentDiceType) {
    createDice(diceType);
  }

  const rollButton = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  const resultDiv = document.getElementById('dice-result') || document.getElementById('combat-dice-result');
  
  if (rollButton) rollButton.disabled = true;
  isRolling = true;
  if (resultDiv) resultDiv.innerHTML = '';

  // Reset dice physics
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

  // Random starting position
  dice.position.set((Math.random() - 0.5) * 2, 4, (Math.random() - 0.5) * 2);

  setTimeout(stopDiceAndShowResult, 3500);
}

function stopDiceAndShowResult() {
  if (dice && dice.userData) {
    dice.userData.velocity = { x: 0, y: 0, z: 0 };
    dice.userData.angularVelocity = { x: 0, y: 0, z: 0 };
  }

  const finalRoll = calculateDiceResult();
  const combatResultDiv = document.getElementById('combat-dice-result');
  const regularResultDiv = document.getElementById('dice-result');

  const resultText = getDiceResultText(finalRoll, currentDiceType);
  const resultHTML = `
    <div>You rolled: <strong>${finalRoll}</strong> on ${currentDiceType.toUpperCase()}</div>
    <div style="font-size: 0.9rem; margin-top: 0.5rem;">${resultText}</div>
  `;

  // Priority: combat context, then skill check, then regular
  if (window.questEngine && window.questEngine.pendingRoll) {
    if (combatResultDiv) combatResultDiv.innerHTML = resultHTML;
    window.questEngine.processDiceRoll(finalRoll);
  } else if (window.skillCheckContext) {
    const context = window.skillCheckContext;
    if (context.callback) context.callback(finalRoll);
    window.skillCheckContext = null;
    if (regularResultDiv) regularResultDiv.innerHTML = resultHTML;
  } else {
    const targetDiv = combatResultDiv || regularResultDiv;
    if (targetDiv) targetDiv.innerHTML = resultHTML;
    applyDiceEffect(finalRoll);
  }

  // Re-enable buttons
  const rollButton = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  if (rollButton) rollButton.disabled = false;

  isRolling = false;
}

function calculateDiceResult() {
  const sides = dice?.userData?.sides || 20;
  return Math.floor(Math.random() * sides) + 1;
}

function animate() {
  requestAnimationFrame(animate);

  if (dice && isRolling && dice.userData) {
    const dt = 0.016; // 60fps

    // Apply gravity
    dice.userData.velocity.y += world.gravity * dt;

    // Update position
    dice.position.x += dice.userData.velocity.x * dt;
    dice.position.y += dice.userData.velocity.y * dt;
    dice.position.z += dice.userData.velocity.z * dt;

    // Update rotation
    dice.rotation.x += dice.userData.angularVelocity.x * dt;
    dice.rotation.y += dice.userData.angularVelocity.y * dt;
    dice.rotation.z += dice.userData.angularVelocity.z * dt;

    // Collision detection
    const trayObj = scene.getObjectByName('diceTray');
    const bounds = trayObj?.userData?.bounds || { x: 2.5, z: 1.5 }; // Adjusted for smaller tray
    const groundY = trayObj?.userData?.groundY ?? -0.95;
    const r = dice.userData?.radius || 0.84;

    // Wall collisions
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

    // Floor collision
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

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// ---------- Combat system helpers ----------
function rollAttack() {
  return new Promise((resolve) => {
    window.combatRollCallback = resolve;
    roll3DDice('d20');
  });
}

function rollDamage(weaponType = 'sword') {
  const weaponDice = {
    'dagger': 'd4',
    'shortsword': 'd6',
    'sword': 'd8',
    'longsword': 'd8',
    'greatsword': 'd12',
    'battleaxe': 'd8',
    'greataxe': 'd12',
    'mace': 'd6',
    'warhammer': 'd8',
    'crossbow': 'd8',
    'longbow': 'd8'
  };

  const diceType = weaponDice[weaponType] || 'd6';
  
  return new Promise((resolve) => {
    window.combatRollCallback = resolve;
    roll3DDice(diceType);
  });
}

// ---------- UI helpers ----------
function getDiceResultText(roll, diceType = 'd20') {
  const maxRoll = DICE_CONFIGS[diceType]?.sides || 20;
  
  if (diceType === 'd20') {
    if (roll === 20) return "🔥 Critical Hit! Maximum damage!";
    if (roll === 1) return "💀 Critical Miss! Your attack goes awry!";
    if (roll >= 17) return "⭐ Excellent roll! You strike true!";
    if (roll >= 13) return "👍 Good hit! Your attack connects!";
    if (roll >= 8) return "😐 Decent attempt, but not your best.";
    return "😬 Poor roll. You struggle to connect.";
  } else {
    // Damage dice
    if (roll === maxRoll) return `🔥 Maximum ${diceType} damage!`;
    if (roll === 1) return `😬 Minimal ${diceType} damage.`;
    if (roll >= Math.ceil(maxRoll * 0.75)) return `⭐ High ${diceType} damage!`;
    if (roll >= Math.ceil(maxRoll * 0.5)) return `👍 Solid ${diceType} damage.`;
    return `😐 Low ${diceType} damage.`;
  }
}

function applyDiceEffect(roll) {
  if (roll === 20 && currentDiceType === 'd20') {
    if (window.user) window.user.bonusXP = true;
    showFloatingMessage("Critical Hit! Bonus XP activated!", "success");
  } else if (roll === 1 && currentDiceType === 'd20') {
    showFloatingMessage("Critical Miss! But you learn from failure!", "info");
  } else if (roll >= 15 && currentDiceType === 'd20' && window.user) {
    window.user.xp = (window.user.xp || 0) + 3;
    showFloatingMessage("+3 XP from excellent combat!", "success");
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
  
  if (!document.querySelector('style[data-floating-messages]')) {
    const style = document.createElement('style');
    style.setAttribute('data-floating-messages', '');
    style.textContent = `
      @keyframes slideIn { 
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);     opacity: 1; } 
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(messageDiv);
  setTimeout(() => {
    messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// ---------- Bootstrapping ----------
function ensureDiceInitialized() {
  const diceContainer = document.getElementById('combat-dice-display') ||
                        document.getElementById('dice-display') ||
                        document.querySelector('.combat-dice-display');

  if (diceContainer && !renderer) {
    if (typeof THREE !== 'undefined') {
      try { 
        return initDice(); 
      } catch (e) { 
        console.error('Failed to initialize dice:', e); 
        return false; 
      }
    } else {
      console.log('THREE.js not loaded yet'); 
      return false;
    }
  }
  return !!renderer;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { ensureDiceInitialized(); }, 1000);

  const observer = new MutationObserver(() => {
    const questsPage = document.getElementById('quests-page');
    if (questsPage && questsPage.classList.contains('active')) {
      setTimeout(() => { ensureDiceInitialized(); }, 500);
    }
  });
  
  const questsPage = document.getElementById('quests-page');
  if (questsPage) observer.observe(questsPage, { attributes: true });
});

// Global functions
window.ensureDiceInitialized = ensureDiceInitialized;
window.roll3DDice = roll3DDice;
window.rollAttack = rollAttack;
window.rollDamage = rollDamage;
window.createDice = createDice;

window.rollSkillCheck = function(skillName, dc, callback) {
  if (isRolling) return;
  window.skillCheckContext = { skill: skillName, dc, callback };
  if (ensureDiceInitialized()) {
    roll3DDice('d20');
  } else {
    const result = Math.floor(Math.random() * 20) + 1;
    if (callback) callback(result);
  }
};
