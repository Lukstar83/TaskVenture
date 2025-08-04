// 3D Dice rolling functionality using Three.js (simplified version)
let scene, camera, renderer, dice, isRolling = false;

function initDice() {
    console.log('🎲 Initializing dice...');

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    // Find the dice container element
    let diceContainer = document.getElementById('dice-display') || 
                       document.getElementById('combat-dice-display') ||
                       document.querySelector('.combat-dice-display');

    if (!diceContainer) {
        console.log('❌ No dice container found');
        return false;
    }

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(300, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e, 1);

    // Clear existing content and add renderer
    diceContainer.innerHTML = '';
    diceContainer.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a4e });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create dice
    createDice();

    // Start render loop
    animate();

    // Add click event listener to the roll button
    const rollButton = document.getElementById('roll-dice-btn');
    if (rollButton) {
        rollButton.onclick = roll3DDice;
        console.log('✅ Roll button event listener added');
    }

    console.log('✅ 3D dice initialized successfully');
    return true;
}

function createDice() {
    // Create D20 geometry (icosahedron)
    const geometry = new THREE.IcosahedronGeometry(1, 0);

    // Create materials for each face with numbers
    const materials = [];
    for (let i = 1; i <= 20; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(0, 0, 128, 128);

        // Border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, 122, 122);

        // Number
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        materials.push(new THREE.MeshLambertMaterial({ map: texture }));
    }

    // Create dice mesh
    dice = new THREE.Mesh(geometry, materials);
    dice.castShadow = true;
    dice.receiveShadow = true;
    dice.position.set(0, 0, 0);

    // Initialize animation properties
    dice.userData = {
        velocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        isRolling: false
    };

    scene.add(dice);
    console.log('✅ D20 with numbers created');
}

function roll3DDice() {
    if (isRolling) return;

    // Ensure dice is initialized
    if (!scene || !dice || !renderer) {
        console.log('❌ Dice not ready, initializing...');
        if (initDice()) {
            setTimeout(() => roll3DDice(), 100);
        }
        return;
    }

    console.log('🎲 Rolling dice...');

    const rollButton = document.getElementById('roll-dice-btn');
    const resultDiv = document.getElementById('dice-result');

    // Disable button during roll
    if (rollButton) {
        rollButton.disabled = true;
        rollButton.textContent = 'Rolling...';
    }
    isRolling = true;

    // Clear previous result
    if (resultDiv) {
        resultDiv.innerHTML = '<div>Rolling...</div>';
    }

    // Set random initial velocity and rotation
    dice.userData.velocity = {
        x: (Math.random() - 0.5) * 0.2,
        y: 0.1,
        z: (Math.random() - 0.5) * 0.2
    };

    dice.userData.angularVelocity = {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3
    };

    dice.userData.isRolling = true;

    // Reset dice position
    dice.position.set(
        (Math.random() - 0.5) * 2,
        1,
        (Math.random() - 0.5) * 2
    );

    // Stop the dice after delay and show result
    setTimeout(() => {
        stopDiceAndShowResult();
    }, 2000);
}

function stopDiceAndShowResult() {
    // Stop the dice
    dice.userData.isRolling = false;
    dice.userData.velocity = { x: 0, y: 0, z: 0 };
    dice.userData.angularVelocity = { x: 0, y: 0, z: 0 };

    // Calculate final result
    const finalRoll = Math.floor(Math.random() * 20) + 1;

    // Position dice to show a reasonable face
    dice.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );

    // Show result
    const combatResultDiv = document.getElementById('combat-dice-result');
    const regularResultDiv = document.getElementById('dice-result');

    const resultText = getDiceResultText(finalRoll);
    const resultHTML = `
        <div style="font-size: 1.2rem; font-weight: bold; color: #d4af37;">
            You rolled: ${finalRoll}
        </div>
        <div style="font-size: 0.9rem; margin-top: 0.5rem; color: #ffffff;">
            ${resultText}
        </div>
    `;

    // Handle different roll contexts
    if (window.questEngine && window.questEngine.pendingRoll) {
        if (combatResultDiv) {
            combatResultDiv.innerHTML = resultHTML;
        }
        window.questEngine.processDiceRoll(finalRoll);
    } else if (window.skillCheckContext) {
        const context = window.skillCheckContext;
        if (context.callback) {
            context.callback(finalRoll);
        }
        window.skillCheckContext = null;

        if (regularResultDiv) {
            regularResultDiv.innerHTML = resultHTML;
        }
    } else {
        if (regularResultDiv) {
            regularResultDiv.innerHTML = resultHTML;
        }
        applyDiceEffect(finalRoll);
    }

    // Re-enable buttons
    const rollButton = document.getElementById('roll-dice-btn');
    const combatRollButton = document.getElementById('combat-roll-btn');

    if (rollButton) {
        rollButton.disabled = false;
        rollButton.textContent = 'Roll D20';
    }
    if (combatRollButton) {
        combatRollButton.disabled = false;
    }

    isRolling = false;
    console.log(`🎲 Rolled: ${finalRoll}`);
}

function animate() {
    if (!renderer || !scene || !camera) return;

    requestAnimationFrame(animate);

    // Update dice physics if rolling
    if (dice && dice.userData.isRolling) {
        // Apply velocity
        dice.position.x += dice.userData.velocity.x;
        dice.position.y += dice.userData.velocity.y;
        dice.position.z += dice.userData.velocity.z;

        // Apply angular velocity
        dice.rotation.x += dice.userData.angularVelocity.x;
        dice.rotation.y += dice.userData.angularVelocity.y;
        dice.rotation.z += dice.userData.angularVelocity.z;

        // Apply damping
        dice.userData.velocity.x *= 0.98;
        dice.userData.velocity.y *= 0.98;
        dice.userData.velocity.z *= 0.98;
        dice.userData.angularVelocity.x *= 0.98;
        dice.userData.angularVelocity.y *= 0.98;
        dice.userData.angularVelocity.z *= 0.98;

        // Bounce off floor
        if (dice.position.y < 0) {
            dice.position.y = 0;
            dice.userData.velocity.y = Math.abs(dice.userData.velocity.y) * 0.7;
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
    if (typeof user === 'undefined') return;

    if (roll === 20) {
        user.bonusXP = true;
        showFloatingMessage("Bonus XP activated for next quest!", "success");
    } else if (roll === 1) {
        showFloatingMessage("The dice mock you, but you're undeterred!", "info");
    } else if (roll >= 15) {
        user.xp += 5;
        showFloatingMessage("+5 XP from lucky roll!", "success");
        if (typeof updateUI === 'function') updateUI();
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

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

function ensureDiceInitialized() {
    const diceContainer = document.getElementById('dice-display') || 
                         document.getElementById('combat-dice-display') ||
                         document.querySelector('.combat-dice-display');

    if (diceContainer && !renderer) {
        if (typeof THREE !== 'undefined') {
            try {
                return initDice();
            } catch (error) {
                console.error('❌ Failed to initialize dice:', error);
                return false;
            }
        } else {
            console.log('❌ THREE.js not loaded yet');
            return false;
        }
    }

    return renderer && scene && dice;
}

// Initialize dice when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        ensureDiceInitialized();
    }, 1000);
});

function initCombatDice() {
    const combatDiceContainer = document.getElementById('combat-dice-display');
    if (!combatDiceContainer) return false;

    if (combatDiceContainer.querySelector('canvas')) return true;

    if (!renderer || !scene) {
        return initDice();
    }

    const combatRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    combatRenderer.setSize(250, 180);
    combatRenderer.shadowMap.enabled = true;
    combatRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    combatDiceContainer.innerHTML = '';
    combatDiceContainer.appendChild(combatRenderer.domElement);

    combatRenderer.render(scene, camera);

    console.log('✅ Combat dice initialized successfully');
    console.log('✅ Combat dice ready for rolling');
    return true;
}

// Utility functions for compatibility
function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

function rollSkillCheck(skillName, dc, callback) {
    if (isRolling) return;

    window.skillCheckContext = {
        skill: skillName,
        dc: dc,
        callback: callback
    };

    if (ensureDiceInitialized()) {
        roll3DDice();
    } else {
        const result = rollD20();
        if (callback) callback(result);
    }
}

// Make functions globally available
window.initCombatDice = initCombatDice;
window.ensureDiceInitialized = ensureDiceInitialized;
window.rollSkillCheck = rollSkillCheck;
window.roll3DDice = roll3DDice;