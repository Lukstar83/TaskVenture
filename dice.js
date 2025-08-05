// 3D Dice rolling functionality using Three.js
let scene, camera, renderer, world, dice, isRolling = false;

function initDice() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
    camera.position.set(0, 3, 3);
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
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(300, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e, 1.0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Clear existing content and add renderer
    diceContainer.innerHTML = ''; // Clear the container
    diceContainer.appendChild(renderer.domElement);

    // Initialize physics world (simplified physics simulation)
    world = {
        gravity: -20,
        objects: []
    };

    // Add improved lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Add a fill light for better illumination
    const fillLight = new THREE.DirectionalLight(0x6666ff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Add point light for dramatic effect
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    // Add table surface first - make it look like wood
    const tableGeometry = new THREE.PlaneGeometry(12, 8);

    // Create wood texture
    const tableCanvas = document.createElement('canvas');
    tableCanvas.width = 512;
    tableCanvas.height = 512;
    const tableCtx = tableCanvas.getContext('2d');

    // Wood grain background
    const woodGradient = tableCtx.createLinearGradient(0, 0, 512, 0);
    woodGradient.addColorStop(0, '#8B4513');
    woodGradient.addColorStop(0.3, '#A0522D');
    woodGradient.addColorStop(0.7, '#8B4513');
    woodGradient.addColorStop(1, '#654321');
    tableCtx.fillStyle = woodGradient;
    tableCtx.fillRect(0, 0, 512, 512);

    // Add wood grain lines
    tableCtx.strokeStyle = '#654321';
    tableCtx.lineWidth = 1;
    for (let i = 0; i < 512; i += 20) {
      tableCtx.globalAlpha = 0.3;
      tableCtx.beginPath();
      tableCtx.moveTo(0, i);
      tableCtx.lineTo(512, i + Math.sin(i * 0.1) * 10);
      tableCtx.stroke();
    }

    const tableTexture = new THREE.CanvasTexture(tableCanvas);
    tableTexture.wrapS = THREE.RepeatWrapping;
    tableTexture.wrapT = THREE.RepeatWrapping;
    tableTexture.repeat.set(2, 2);

    const tableMaterial = new THREE.MeshPhongMaterial({ 
      map: tableTexture,
      shininess: 20,
      specular: 0x111111
    });

    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -3.5;
    table.receiveShadow = true;
    scene.add(table);

    // Create dice after table
    createDice();

    // Start render loop
    animate();

    // Set up roll button if it exists
    const rollButton = document.getElementById('roll-dice-btn');
    if (rollButton) {
        rollButton.addEventListener('click', roll3DDice);
        console.log('✅ Roll button event listener added');
    }
}

    function createDice() {
  // Create proper icosahedron geometry for D20 (20 faces)
  const geo = new THREE.IcosahedronGeometry(1.2, 0); // Use 0 subdivisions for clean faces

  // Use a single MeshNormalMaterial for testing visibility
  const material = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide
  });

  // Create the dice mesh with single material
  dice = new THREE.Mesh(geo, material);
  dice.castShadow = true;
  dice.receiveShadow = true;

  // Position dice visibly above the table surface
  dice.position.set(0, 1, 0);

  // Initialize physics properties
  dice.userData = {
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 }
  };

  // Ensure dice is properly scaled
  dice.scale.set(.7, .7, .7);
  
  scene.add(dice);

  console.log('✅ D20 with all 20 numbered faces created');
  console.log('📍 Dice position:', dice.position);
  console.log('📏 Dice scale:', dice.scale);

    // Force an initial render to make sure everything is visible
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
        console.log('✅ Initial scene rendered');
    }
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

    // Make sure dice userData exists
    if (!dice.userData) {
        dice.userData = {
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };
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

        // Position dice on the table surface
        dice.position.y = -0.8;
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

    // Always render the scene, even when not rolling
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

        // Bounce off table surface (adjusted for new table height)
        if (dice.position.y < -0.8) {
            dice.position.y = -0.8;
            dice.userData.velocity.y *= -0.6; // Bounce with energy loss
            dice.userData.velocity.x *= 0.8; // Friction
            dice.userData.velocity.z *= 0.8; // Friction
            dice.userData.angularVelocity.x *= 0.8;
            dice.userData.angularVelocity.y *= 0.8;
            dice.userData.angularVelocity.z *= 0.8;
        }

        // Boundaries (adjusted for table size)
        if (Math.abs(dice.position.x) > 3) {
            dice.userData.velocity.x *= -0.6;
            dice.position.x = Math.sign(dice.position.x) * 3;
        }
        if (Math.abs(dice.position.z) > 2.5) {
            dice.userData.velocity.z *= -0.6;
            dice.position.z = Math.sign(dice.position.z) * 2.5;
        }
    }

    // Always render the scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
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

    // Also try to initialize when the dice page becomes active
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const dicePage = document.getElementById('dice-page');
                if (dicePage && dicePage.classList.contains('active')) {
                    setTimeout(() => {
                        console.log('Dice page is now active, initializing dice');
                        ensureDiceInitialized();
                    }, 500);
                }
            }
        });
    });

    const dicePage = document.getElementById('dice-page');
    if (dicePage) {
        observer.observe(dicePage, { attributes: true });
    }
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