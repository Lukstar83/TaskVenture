// 3D Dice rolling functionality using Three.js
let scene, camera, renderer, world, dice, isRolling = false;

function initDice() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    // Find the dice container element (can be regular or combat)
    let diceContainer = document.getElementById('dice-display') || document.getElementById('combat-dice-display');

    if (!diceContainer) {
        console.log('Dice container not found, checking for quest context');

        // Check if we're in a quest with combat dice section
        const combatDiceSection = document.querySelector('.combat-dice-section');
        if (combatDiceSection) {
            diceContainer = combatDiceSection.querySelector('.combat-dice-display');
            if (diceContainer) {
                console.log('Found combat dice container');
            }
        }

        // If still no container, create a fallback
        if (!diceContainer) {
            console.log('No dice container available, skipping initialization');
            return false;
        }
    }

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(300, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear existing content and add renderer
    diceContainer.innerHTML = ''; // Clear the container
    diceContainer.appendChild(renderer.domElement);

    // Initialize physics world (simplified physics simulation)
    world = {
        gravity: -20,
        objects: []
    };

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create dice
    createDice();

    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(18, 18);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a4e });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4;
    floor.receiveShadow = true;
    scene.add(floor);

    // Start render loop
    animate();
}

    function createDice() {
 // 1️⃣ Build a non-indexed icosahedron (20 faces × 3 verts each)
  const geo = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();

  // 2️⃣ Carve out one group per triangular face
  const faceCount = geo.attributes.position.count / 3;
  geo.clearGroups();
  for (let f = 0; f < faceCount; f++) {
    geo.addGroup(f * 3, 3, f);
  }

  // 3️⃣ Bake a little canvas texture for each face, drawing its number
  const materials = [];
  for (let i = 1; i <= faceCount; i++) {
    const size   = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx    = canvas.getContext('2d');

    // ✨ You can tweak these styles for a fancy look ✨
    // background
    ctx.fillStyle = '#f9d976';
    ctx.fillRect(0, 0, size, size);
      
    // border
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth   = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // number
    ctx.fillStyle    = '#1a1a2e';
    ctx.font         = `bold ${size * 0.5}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i.toString(), size/2, size/2);

    // build a Three.js texture + material
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    materials.push(new THREE.MeshNormalMaterial({
      map: texture,
      side: THREE.DoubleSide
    }));
  }

  // 4️⃣ Finally create the mesh & add to scene
  dice = new THREE.Mesh(geo, materials);
  dice.castShadow = true;
  scene.add(dice);

  console.log('✅ D20 with numbers created');
}

function roll3DDice() {
    if (isRolling) return;

    // Ensure dice is initialized
    if (!ensureDiceInitialized()) {
        console.log('Dice not ready, trying to initialize...');
        setTimeout(() => roll3DDice(), 500);
        return;
    }

    const rollButton = document.getElementById('roll-dice-btn');
    const resultDiv = document.getElementById('dice-result');

    // Disable button during roll (with null check)
    if (rollButton) {
        rollButton.disabled = true;
    }
    isRolling = true;

    // Clear previous result (with null check)
    if (resultDiv) {
        resultDiv.innerHTML = '';
    }

    // Set random initial velocity and rotation
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

    // Position dice above the surface
    dice.position.set(
        (Math.random() - 0.5) * 2,
        3,
        (Math.random() - 0.5) * 2
    );

    // Stop the dice after a delay and show result
    setTimeout(() => {
        stopDiceAndShowResult();
    }, 3000);
}

function stopDiceAndShowResult() {
    // Stop the dice movement
    if (dice && dice.userData) {
        dice.userData.velocity = { x: 0, y: 0, z: 0 };
        dice.userData.angularVelocity = { x: 0, y: 0, z: 0 };

        // Position dice on the surface
        dice.position.y = -1.5;
    }

    // Calculate the final roll result based on dice rotation
    const finalRoll = calculateDiceResult();

    // Show result in appropriate location
    const combatResultDiv = document.getElementById('combat-dice-result');
    const regularResultDiv = document.getElementById('dice-result');

    const resultText = getDiceResultText(finalRoll);
    const resultHTML = `
        <div>You rolled: <strong>${finalRoll}</strong></div>
        <div style="font-size: 0.9rem; margin-top: 0.5rem;">${resultText}</div>
    `;

    // Check if this roll is for combat
    if (window.questEngine && window.questEngine.pendingRoll) {
        if (combatResultDiv) {
            combatResultDiv.innerHTML = resultHTML;
        }
        window.questEngine.processDiceRoll(finalRoll);
    } else if (window.skillCheckContext) {
        // Handle skill check rolls
        const context = window.skillCheckContext;
        if (context.callback) {
            context.callback(finalRoll);
        }
        window.skillCheckContext = null;

        if (regularResultDiv) {
            regularResultDiv.innerHTML = resultHTML;
        }
    } else {
        // Regular dice roll
        if (regularResultDiv) {
            regularResultDiv.innerHTML = resultHTML;
        }
        applyDiceEffect(finalRoll);
    }

    // Re-enable buttons with null checks
    const rollButton = document.getElementById('roll-dice-btn');
    const combatRollButton = document.getElementById('combat-roll-btn');

    if (rollButton) rollButton.disabled = false;
    if (combatRollButton) combatRollButton.disabled = false;

    isRolling = false;
}

function calculateDiceResult() {
    // Simple method: generate random result between 1-20
    // In a more sophisticated version, you'd calculate based on which face is up
    return Math.floor(Math.random() * 20) + 1;
}

function animate() {
    requestAnimationFrame(animate);

    if (dice && isRolling) {
        // Update dice physics
        const deltaTime = 0.016; // ~60fps

        // Apply gravity
        dice.userData.velocity.y += world.gravity * deltaTime;

        // Update position
        dice.position.x += dice.userData.velocity.x * deltaTime;
        dice.position.y += dice.userData.velocity.y * deltaTime;
        dice.position.z += dice.userData.velocity.z * deltaTime;

        // Update rotation
        dice.rotation.x += dice.userData.angularVelocity.x * deltaTime;
        dice.rotation.y += dice.userData.angularVelocity.y * deltaTime;
        dice.rotation.z += dice.userData.angularVelocity.z * deltaTime;

        // Bounce off floor
        if (dice.position.y < -1.5) {
            dice.position.y = -1.5;
            dice.userData.velocity.y *= -0.6; // Bounce with energy loss
            dice.userData.velocity.x *= 0.8; // Friction
            dice.userData.velocity.z *= 0.8; // Friction
            dice.userData.angularVelocity.x *= 0.8;
            dice.userData.angularVelocity.y *= 0.8;
            dice.userData.angularVelocity.z *= 0.8;
        }

        // Boundaries
        if (Math.abs(dice.position.x) > 4) {
            dice.userData.velocity.x *= -0.6;
            dice.position.x = Math.sign(dice.position.x) * 4;
        }
        if (Math.abs(dice.position.z) > 4) {
            dice.userData.velocity.z *= -0.6;
            dice.position.z = Math.sign(dice.position.z) * 4;
        }
    }

    renderer.render(scene, camera);
}

function getDiceResultText(roll) {
    if (roll === 20) {
        return "🔥 Critical Success! Bonus XP for your next quest!";
    } else if (roll >= 15) {
        return "⭐ Great roll! Fortune favors you!";
    } else if (roll >= 10) {
        return "👍 Decent roll! The dice are neutral.";
    } else if (roll >= 5) {
        return "😐 Low roll. Better luck next time.";
    } else if (roll === 1) {
        return "💀 Critical Failure! But hey, at least you're learning!";
    } else {
        return "😅 Not your best roll, but adventure continues!";
    }
}

function applyDiceEffect(roll) {
    // Apply special effects based on dice roll
    if (roll === 20) {
        // Critical success - set bonus XP flag
        user.bonusXP = true;
        showFloatingMessage("Bonus XP activated for next quest!", "success");
    } else if (roll === 1) {
        // Critical failure - but make it fun, not punishing
        showFloatingMessage("The dice mock you, but you're undeterred!", "info");
    } else if (roll >= 15) {
        // High roll - small XP bonus
        user.xp += 5;
        showFloatingMessage("+5 XP from lucky roll!", "success");
        updateUI();
    }
}

function showFloatingMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        border: 2px solid ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
    `;

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(messageDiv);

    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Function to check and initialize dice when needed
function ensureDiceInitialized() {
    // Check for various dice container types
    const diceContainer = document.getElementById('dice-display') || 
                         document.getElementById('combat-dice-display') ||
                         document.querySelector('.combat-dice-display');

    if (diceContainer && !renderer) {
        if (typeof THREE !== 'undefined') {
            try {
                initDice();
                return true;
            } catch (error) {
                console.error('Failed to initialize dice:', error);
                return false;
            }
        } else {
            console.log('THREE.js not loaded yet');
            return false;
        }
    }

    // If we have a renderer but no container, we're still considered initialized
    if (renderer) {
        return true;
    }

    return false;
}

// Initialize dice when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the game interface to be ready
    setTimeout(() => {
        ensureDiceInitialized();
    }, 1000);
});

// Initialize dice specifically for combat interface
function initCombatDice() {
    const combatDiceContainer = document.getElementById('combat-dice-display');
    if (!combatDiceContainer || !renderer) return;

    // Check if already initialized
    if (combatDiceContainer.querySelector('canvas')) return;

    // Create a smaller renderer for combat
    const combatRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    combatRenderer.setSize(250, 180);
    combatRenderer.shadowMap.enabled = true;
    combatRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear and add the combat renderer
    combatDiceContainer.innerHTML = '';
    combatDiceContainer.appendChild(combatRenderer.domElement);

    // Use the existing scene and camera for combat
    combatRenderer.render(scene, camera);
}

// Make it globally available
window.initCombatDice = initCombatDice;
window.ensureDiceInitialized = ensureDiceInitialized;

// Fallback function for older rollD20 calls
function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

// Function to roll dice for skill checks (non-combat)
function rollSkillCheck(skillName, dc, callback) {
    if (isRolling) return;

    // Set up skill check context
    window.skillCheckContext = {
        skill: skillName,
        dc: dc,
        callback: callback
    };

    // Use 3D dice if available, otherwise fallback
    if (ensureDiceInitialized()) {
        roll3DDice();
    } else {
        // Fallback to simple roll
        const result = rollD20();
        if (callback) callback(result);
    }
}

// Make it globally available
window.rollSkillCheck = rollSkillCheck;