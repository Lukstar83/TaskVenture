// =======================
// Enhanced 3D Dice (Three.js)
// =======================

let scene, camera, renderer, world, dice, isRolling = false;
let currentDiceType = 'd20';

// ---- Config ----
const DICE_CONFIGS = {
  d4:  { sides: 4,  geometry: 'tetra',     scale: 0.92 },
  d6:  { sides: 6,  geometry: 'box',       scale: 0.85 },
  d8:  { sides: 8,  geometry: 'octa',      scale: 0.92 },
  d10: { sides: 10, geometry: 'bipyramid', scale: 0.92 },
  d12: { sides: 12, geometry: 'dodeca',    scale: 0.88 },
  d20: { sides: 20, geometry: 'icosa',     scale: 0.78 }
};

const CAMERA = { fov: 45, pos: { x: 0, y: 7, z: 7 } };

// ---- Tray helpers ----
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

function buildDiceTray(opts = {}) {
  // wide, deep tray; tune via opts if needed
  const defaults = { width: 11.5, height: 6.6, cornerR: 0.7, wall: 0.45, depth: 0.6 };
  const { width, height, cornerR, wall, depth } = { ...defaults, ...opts };

  const tray = new THREE.Group();

  // frame with an inner hole
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
    bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2,
    curveSegments: 32
  });

  const wood = new THREE.MeshStandardMaterial({ color: 0x6e2b2b, roughness: 0.8, metalness: 0.05 });
  const frame = new THREE.Mesh(frameGeo, wood);
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = -1.0;
  frame.castShadow = frame.receiveShadow = true;
  tray.add(frame);

  // felt insert
  const feltGeo = new THREE.PlaneGeometry(width - wall*2 - 0.08, height - wall*2 - 0.08);
  const feltMat  = new THREE.MeshStandardMaterial({ color: 0x1f2229, roughness: 1, metalness: 0 });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.rotation.x = -Math.PI / 2;
  felt.position.set(0, frame.position.y + 0.01, 0);
  felt.receiveShadow = true;
  tray.add(felt);

  // physics helpers
  tray.userData.groundY = felt.position.y + 0.01;
  tray.userData.bounds = {
    x: (width  - wall*2) / 2 - 0.25,
    z: (height - wall*2) / 2 - 0.25
  };
  tray.name = 'diceTray';
  return tray;
}

// ---- Font loader (best-effort) ----
function loadDiceFont() {
  if (!document.getElementById('cinzel-font-link')) {
    const link = document.createElement('link');
    link.id  = 'cinzel-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@900&display=swap';
    document.head.appendChild(link);
  }
  return document.fonts?.load?.('900 100px Cinzel').catch(()=>{}) || Promise.resolve();
}

// ---- Dice builders ----
function createGeometry(type) {
  const cfg = DICE_CONFIGS[type] || DICE_CONFIGS.d20;
  let geo;
  switch (cfg.geometry) {
    case 'tetra':   geo = new THREE.TetrahedronGeometry(1.2, 0); break;
    case 'box':     geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);  break;
    case 'octa':    geo = new THREE.OctahedronGeometry(1.2, 0);  break;
    case 'bipyramid': {
      // visually-pleasing d10 “drum” (decagonal bipyramid)
      const top  = new THREE.ConeGeometry(1.0, 0.8, 10, 1);
      const bot  = new THREE.ConeGeometry(1.0, 0.8, 10, 1);
      bot.rotateX(Math.PI);
      bot.translate(0, -0.8, 0);
      const merged = new THREE.BufferGeometry();
      THREE.BufferGeometry.prototype.copy.call(merged, top);
      merged.computeBoundingBox();
      // simple merge (no Utils dep): make a Group and let toNonIndexed handle the rest
      const g = new THREE.Group();
      g.add(new THREE.Mesh(top)); g.add(new THREE.Mesh(bot));
      // bake into geometry
      const tmpScene = new THREE.Scene();
      tmpScene.add(g);
      // fallback: if baking is overkill, just use cylinder as a single geometry:
      geo = new THREE.CylinderGeometry(0.95, 0.95, 1.6, 10, 1, false);
      break;
    }
    case 'dodeca':  geo = new THREE.DodecahedronGeometry(1.2, 0); break;
    case 'icosa':
    default:        geo = new THREE.IcosahedronGeometry(1.2, 0);  break;
  }
  return geo.toNonIndexed();
}

function makeFaceMaterials(faceCount, sides) {
  const mats = [];
  const size = 256;
  // centroid-ish for the simple right-triangle UVs we’ll assign below
  const UV_CX = 1/3, UV_CY = 1/3 + 0.30;

  for (let i = 0; i < faceCount; i++) {
    const num = (i % sides) + 1;

    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    // dark “metal” plate
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, '#3a3a3a'); g.addColorStop(0.30, '#2a2a2a');
    g.addColorStop(0.70, '#1a1a1a'); g.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = g; ctx.fillRect(0,0,size,size);

    // gold frame
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.strokeRect(4,4,size-8,size-8);
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2; ctx.strokeRect(8,8,size-16,size-16);

    // number (bold Cinzel)
    ctx.fillStyle = '#d4af37';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 3; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
    ctx.font = `900 ${size * 0.46}px Cinzel, serif`;
    ctx.fillText(String(num), size * UV_CX, size * UV_CY);

    const tex = new THREE.CanvasTexture(c);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    mats.push(new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.35, metalness: 0.1, envMapIntensity: 0.3, side: THREE.DoubleSide
    }));
  }
  return mats;
}

function createDice(type = 'd20') {
  currentDiceType = type;
  const cfg = DICE_CONFIGS[type] || DICE_CONFIGS.d20;

  const geo = createGeometry(type);
  geo.computeVertexNormals();

  // one material per triangle
  const faceCount = geo.attributes.position.count / 3;
  geo.clearGroups();
  for (let f = 0; f < faceCount; f++) geo.addGroup(f * 3, 3, f);

  // simple per-triangle UVs
  const uvs = new Float32Array(faceCount * 3 * 2);
  for (let f = 0; f < faceCount; f++) {
    const o = f * 6;
    uvs[o+0]=0; uvs[o+1]=0;
    uvs[o+2]=1; uvs[o+3]=0;
    uvs[o+4]=0; uvs[o+5]=1;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const materials = makeFaceMaterials(faceCount, cfg.sides);

  // cleanup previous
  if (dice) {
    if (Array.isArray(dice.material)) dice.material.forEach(m => { m.map?.dispose?.(); m.dispose?.(); });
    dice.geometry.dispose?.();
    scene.remove(dice);
  }

  geo.computeBoundingSphere();
  dice = new THREE.Mesh(geo, materials);
  dice.castShadow = dice.receiveShadow = true;
  dice.position.set(0, 1, 0);
  dice.scale.set(cfg.scale, cfg.scale, cfg.scale);
  dice.userData.radius = (geo.boundingSphere?.radius || 1.2) * cfg.scale;
  dice.userData.sides  = cfg.sides;
  dice.userData.velocity = { x:0, y:0, z:0 };
  dice.userData.angularVelocity = { x:0, y:0, z:0 };
  scene.add(dice);
}

// ---- Scene init ----
function initDice() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 1000);
  camera.position.set(CAMERA.pos.x, CAMERA.pos.y, CAMERA.pos.z);
  camera.lookAt(0,0,0);

  // container: prefer combat area, then generic; also supports class-only markup
  let diceContainer = document.getElementById('combat-dice-display') ||
                      document.getElementById('dice-display') ||
                      document.querySelector('.combat-dice-display'); // CSS defines this block in your app
  if (!diceContainer) return false;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, logarithmicDepthBuffer: true });

  // initial size & aspect based on container
  const cw = diceContainer.clientWidth || 360;
  const ch = Math.max(220, Math.round(cw * 0.55));
  renderer.setSize(cw, ch, false);
  camera.aspect = cw / ch;
  camera.updateProjectionMatrix();

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x1a1a2e, 1.0);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  diceContainer.innerHTML = '';
  diceContainer.appendChild(renderer.domElement);

  // simple “physics” world
  world = { gravity: -20 };

  // lights
  scene.add(new THREE.AmbientLight(0x404040, 0.5));
  const spot = new THREE.SpotLight(0xffffff, 2.4);
  spot.position.set(-3,6,3); spot.target.position.set(0,0,0);
  spot.distance=15; spot.angle=Math.PI/4; spot.penumbra=0.1; spot.decay=2;
  spot.castShadow=true; spot.shadow.mapSize.width=2048; spot.shadow.mapSize.height=2048;
  spot.shadow.camera.near=0.5; spot.shadow.camera.far=15; spot.shadow.bias=-0.0001;
  scene.add(spot);

  const combat = new THREE.DirectionalLight(0xff6666, 0.55); combat.position.set(5,3,-2); scene.add(combat);
  const rim    = new THREE.DirectionalLight(0xd4af37, 0.4);  rim.position.set(-2,1,-3);  scene.add(rim);

  // tray (responsive)
  let tray = buildDiceTray();
  scene.add(tray);

  loadDiceFont().finally(() => createDice(currentDiceType));
  animate();

  // roll button hook (present in your UI) 
  const btn = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  if (btn) btn.addEventListener('click', () => roll3DDice(currentDiceType));

  // keep tray in sync with container size
  const updateLayout = () => {
    const w = diceContainer.clientWidth || 360;
    const h = diceContainer.clientHeight || Math.max(220, Math.round(w * 0.55));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const scale = w / 360; // reference width
    const trayW = 11.5 * scale;
    const trayH = 6.8  * scale;

    const old = scene.getObjectByName('diceTray');
    if (old) scene.remove(old);
    tray = buildDiceTray({ width: trayW, height: trayH, wall: 0.45, cornerR: 0.7, depth: 0.6 });
    scene.add(tray);
  };
  updateLayout();
  if (window.ResizeObserver) new ResizeObserver(updateLayout).observe(diceContainer);
  window.addEventListener('resize', updateLayout);

  return true;
}

// ---- Rolling / physics ----
function roll3DDice(type = currentDiceType) {
  if (isRolling) return;
  if (!ensureDiceInitialized()) return;

  if (type !== currentDiceType || !dice) createDice(type);

  const rollButton = document.getElementById('roll-dice-btn') || document.getElementById('combat-roll-btn');
  const resultDiv  = document.getElementById('combat-dice-result') || document.getElementById('dice-result');
  if (rollButton) rollButton.disabled = true;
  isRolling = true;
  if (resultDiv) resultDiv.innerHTML = '';

  // throw
  dice.userData.velocity = { x:(Math.random()-0.5)*12, y:Math.random()*6+6, z:(Math.random()-0.5)*12 };
  dice.userData.angularVelocity = { x:(Math.random()-0.5)*25, y:(Math.random()-0.5)*25, z:(Math.random()-0.5)*25 };
  dice.position.set((Math.random()-0.5)*2, 4, (Math.random()-0.5)*2);

  // fallback timeout (just in case)
  setTimeout(() => { if (isRolling) stopDiceAndShowResult(); }, 3500);
}

function stopDiceAndShowResult() {
  if (dice?.userData) {
    dice.userData.velocity = { x:0, y:0, z:0 };
    dice.userData.angularVelocity = { x:0, y:0, z:0 };
  }

  const finalRoll = calculateDiceResult();
  const combatResultDiv  = document.getElementById('combat-dice-result');
  const regularResultDiv = document.getElementById('dice-result');

  const resultText = getDiceResultText(finalRoll, currentDiceType);
  const html = `<div>You rolled: <strong>${finalRoll}</strong> on ${currentDiceType.toUpperCase()}</div>
                <div style="font-size:0.9rem;margin-top:0.5rem;">${resultText}</div>`;
  const targetDiv = combatResultDiv || regularResultDiv;
  if (targetDiv) targetDiv.innerHTML = html;

  // Let your quest engine advance if it’s waiting.
  if (window.questEngine?.processDiceRoll) {
    window.questEngine.processDiceRoll(finalRoll);
  } else if (window.skillCheckContext?.callback) {
    const ctx = window.skillCheckContext;
    ctx.callback(finalRoll);
    window.skillCheckContext = null;
  } else {
    applyDiceEffect(finalRoll);
  }

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
    const dt = 0.016; // ≈60fps

    // gravity
    dice.userData.velocity.y += world.gravity * dt;

    // integrate
    dice.position.x += dice.userData.velocity.x * dt;
    dice.position.y += dice.userData.velocity.y * dt;
    dice.position.z += dice.userData.velocity.z * dt;

    dice.rotation.x += dice.userData.angularVelocity.x * dt;
    dice.rotation.y += dice.userData.angularVelocity.y * dt;
    dice.rotation.z += dice.userData.angularVelocity.z * dt;

    const tray = scene.getObjectByName('diceTray');
    const bounds  = tray?.userData?.bounds  || { x: 3, z: 2 };
    const groundY = tray?.userData?.groundY ?? -0.95;
    const r = dice.userData?.radius || 0.85;

    // walls
    if (Math.abs(dice.position.x) > bounds.x - r) {
      dice.userData.velocity.x *= -0.6;
      dice.position.x = Math.sign(dice.position.x) * (bounds.x - r);
      dice.userData.angularVelocity.x *= 0.85;
    }
    if (Math.abs(dice.position.z) > bounds.z - r) {
      dice.userData.velocity.z *= -0.6;
      dice.position.z = Math.sign(dice.position.z) * (bounds.z - r);
      dice.userData.angularVelocity.z *= 0.85;
    }

    // floor
    if (dice.position.y < groundY + r) {
      dice.position.y = groundY + r;
      dice.userData.velocity.y *= -0.5;
      dice.userData.velocity.x *= 0.85;
      dice.userData.velocity.z *= 0.85;
      dice.userData.angularVelocity.x *= 0.85;
      dice.userData.angularVelocity.y *= 0.85;
      dice.userData.angularVelocity.z *= 0.85;
    }

    // auto-stop when motion is tiny near the ground
    const v = dice.userData.velocity;
    const w = dice.userData.angularVelocity;
    const speed = Math.hypot(v.x, v.y, v.z) + Math.hypot(w.x, w.y, w.z)*0.02;
    if (dice.position.y <= groundY + r + 0.002 && speed < 0.05) {
      stopDiceAndShowResult();
    }
  }

  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ---- UI helpers ----
function getDiceResultText(roll, diceType='d20') {
  const max = DICE_CONFIGS[diceType]?.sides || 20;
  if (diceType === 'd20') {
    if (roll === 20) return "🔥 Critical Hit! Maximum damage!";
    if (roll === 1)  return "💀 Critical Miss! Your attack goes awry!";
    if (roll >= 17)  return "⭐ Excellent roll! You strike true!";
    if (roll >= 13)  return "👍 Good hit! Your attack connects!";
    if (roll >= 8)   return "😐 Decent attempt, but not your best.";
    return "😬 Poor roll. You struggle to connect.";
  } else {
    if (roll === max) return `🔥 Maximum ${diceType} damage!`;
    if (roll === 1)   return `😬 Minimal ${diceType} damage.`;
    if (roll >= Math.ceil(max*0.75)) return `⭐ High ${diceType} damage!`;
    if (roll >= Math.ceil(max*0.5))  return `👍 Solid ${diceType} damage.`;
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
  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 1rem; border-radius: 8px;
    color: white; font-weight: bold; z-index: 1001; animation: slideIn 0.3s ease-out;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    border: 2px solid ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
  `;
  if (!document.querySelector('style[data-floating-messages]')) {
    const style = document.createElement('style');
    style.setAttribute('data-floating-messages', '');
    style.textContent = `
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; }
                           to   { transform: translateX(0);     opacity: 1; } }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(msg);
  setTimeout(() => {
    msg.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => msg.remove(), 300);
  }, 3000);
}

// ---- Bootstrapping ----
function ensureDiceInitialized() {
  const diceContainer = document.getElementById('combat-dice-display') ||
                        document.getElementById('dice-display') ||
                        document.querySelector('.combat-dice-display');
  if (diceContainer && !renderer) {
    if (typeof THREE !== 'undefined') {
      try { return initDice(); }
      catch (e) { console.error('Failed to initialize dice:', e); return false; }
    } else {
      console.log('THREE.js not loaded yet'); return false;
    }
  }
  return !!renderer;
}

setTimeout(() => { ensureDiceInitialized(); }, 600);

// if your app toggles views (quests/combat), try again when it becomes active
const target = document.getElementById('quests-page') || document.getElementById('dice-page');
if (target) {
  const observer = new MutationObserver(() => {
    if (target.classList.contains('active')) setTimeout(() => ensureDiceInitialized(), 400);
  });
  observer.observe(target, { attributes: true });
}

// Expose a couple helpers
window.ensureDiceInitialized = ensureDiceInitialized;
window.roll3DDice = roll3DDice;
window.createDice  = createDice;
