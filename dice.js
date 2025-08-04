
// 3D Dice rolling functionality using Three.js with improved physics
let scene, camera, renderer, world, dice, isRolling = false;
let diceBody, cannonWorld;

function initDice() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    // Find the dice container element
    let diceContainer = document.getElementById('dice-display') || document.getElementById('combat-dice-display');

    if (!diceContainer) {
        console.log('Dice container not found, checking for quest context');

        const combatDiceSection = document.querySelector('.combat-dice-section');
        if (combatDiceSection) {
            diceContainer = combatDiceSection.querySelector('.combat-dice-display');
            if (diceContainer) {
                console.log('Found combat dice container');
            }
        }

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
    renderer.setClearColor(0x1a1a2e, 1);

    // Clear existing content and add renderer
    diceContainer.innerHTML = '';
    diceContainer.appendChild(renderer.domElement);

    // Initialize Cannon.js physics world
    cannonWorld = new CANNON.World();
    cannonWorld.gravity.set(0, -30, 0);
    cannonWorld.broadphase = new CANNON.NaiveBroadphase();

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a4e });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create floor physics body
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({ mass: 0 });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    floorBody.position.set(0, -2, 0);
    cannonWorld.add(floorBody);

    // Create walls to contain the dice
    createWalls();

    // Create dice
    createDice();

    // Start render loop
    animate();

    console.log('✅ Enhanced 3D dice initialized');
    return true;
}

function createWalls() {
    const wallMaterial = new CANNON.Material();
    wallMaterial.restitution = 0.3;
    wallMaterial.friction = 0.4;

    // Create invisible walls
    const wallPositions = [
        { x: 0, y: 0, z: 5 },   // front
        { x: 0, y: 0, z: -5 },  // back
        { x: 5, y: 0, z: 0 },   // right
        { x: -5, y: 0, z: 0 }   // left
    ];

    wallPositions.forEach(pos => {
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.1, 3, 5));
        const wallBody = new CANNON.Body({ mass: 0 });
        wallBody.addShape(wallShape);
        wallBody.position.set(pos.x, pos.y, pos.z);
        wallBody.material = wallMaterial;
        cannonWorld.add(wallBody);
    });
}

function createDice() {
    // Create D20 geometry
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
    dice.position.set(0, 2, 0);
    scene.add(dice);

    // Create physics body for dice
    const diceShape = new CANNON.Sphere(1);
    diceBody = new CANNON.Body({ mass: 1 });
    diceBody.addShape(diceShape);
    diceBody.position.set(0, 2, 0);
    
    // Set physics material properties
    const diceMaterial = new CANNON.Material();
    diceMaterial.restitution = 0.3;
    diceMaterial.friction = 0.4;
    diceBody.material = diceMaterial;
    
    cannonWorld.add(diceBody);

    console.log('✅ D20 with enhanced physics created');
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

    // Disable button during roll
    if (rollButton) {
        rollButton.disabled = true;
    }
    isRolling = true;

    // Clear previous result
    if (resultDiv) {
        resultDiv.innerHTML = '';
    }

    // Reset dice position and rotation
    diceBody.position.set(
        (Math.random() - 0.5) * 2,
        4 + Math.random() * 2,
        (Math.random() - 0.5) * 2
    );
    
    diceBody.quaternion.set(
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random()
    );
    diceBody.quaternion.normalize();

    // Apply random force and torque
    const force = new CANNON.Vec3(
        (Math.random() - 0.5) * 15,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * 15
    );
    diceBody.applyForce(force, diceBody.position);

    const torque = new CANNON.Vec3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
    );
    diceBody.torque.copy(torque);

    // Check for settling after delay
    setTimeout(() => {
        checkDiceSettled();
    }, 3000);
}

function checkDiceSettled() {
    // Check if dice has settled (low velocity)
    const velocity = diceBody.velocity.length();
    const angularVelocity = diceBody.angularVelocity.length();
    
    if (velocity < 0.1 && angularVelocity < 0.1) {
        stopDiceAndShowResult();
    } else {
        // Check again in 100ms
        setTimeout(() => checkDiceSettled(), 100);
    }
}

function stopDiceAndShowResult() {
    // Stop the dice completely
    diceBody.velocity.set(0, 0, 0);
    diceBody.angularVelocity.set(0, 0, 0);

    // Calculate the final roll result based on dice orientation
    const finalRoll = calculateDiceResult();

    // Show result in appropriate location
    const combatResultDiv = document.getElementById('combat-dice-result');
    const regularResultDiv = document.getElementById('dice-result');

    const resultText = getDiceResultText(finalRoll);
    const resultHTML = `
        <div>You rolled: <strong>${finalRoll}</strong></div>
        <div style="font-size: 0.9rem; margin-top: 0.5rem;">${resultText}</div>
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

    if (rollButton) rollButton.disabled = false;
    if (combatRollButton) combatRollButton.disabled = false;

    isRolling = false;
}

function calculateDiceResult() {
    // Get the dice's world rotation matrix
    const matrix = new THREE.Matrix4();
    matrix.makeRotationFromQuaternion(dice.quaternion);

    // D20 face normals (icosahedron faces)
    const faceNormals = [
        new THREE.Vector3(0.356822, 0.934172, 0),
        new THREE.Vector3(-0.356822, 0.934172, 0),
        new THREE.Vector3(0.577350, 0.577350, 0.577350),
        new THREE.Vector3(-0.577350, 0.577350, 0.577350),
        new THREE.Vector3(0.577350, 0.577350, -0.577350),
        new THREE.Vector3(-0.577350, 0.577350, -0.577350),
        new THREE.Vector3(0, 0.356822, 0.934172),
        new THREE.Vector3(0, -0.356822, 0.934172),
        new THREE.Vector3(0.934172, 0, 0.356822),
        new THREE.Vector3(-0.934172, 0, 0.356822),
        new THREE.Vector3(0, 0.356822, -0.934172),
        new THREE.Vector3(0, -0.356822, -0.934172),
        new THREE.Vector3(0.934172, 0, -0.356822),
        new THREE.Vector3(-0.934172, 0, -0.356822),
        new THREE.Vector3(0.577350, -0.577350, 0.577350),
        new THREE.Vector3(-0.577350, -0.577350, 0.577350),
        new THREE.Vector3(0.577350, -0.577350, -0.577350),
        new THREE.Vector3(-0.577350, -0.577350, -0.577350),
        new THREE.Vector3(0.356822, -0.934172, 0),
        new THREE.Vector3(-0.356822, -0.934172, 0)
    ];

    // Find which face is most "up" (closest to positive Y axis)
    const upVector = new THREE.Vector3(0, 1, 0);
    let maxDot = -1;
    let topFaceIndex = 0;

    faceNormals.forEach((normal, index) => {
        const transformedNormal = normal.clone().applyMatrix4(matrix);
        const dot = transformedNormal.dot(upVector);
        if (dot > maxDot) {
            maxDot = dot;
            topFaceIndex = index;
        }
    });

    // Return the face number (1-20)
    return topFaceIndex + 1;
}

function animate() {
    requestAnimationFrame(animate);

    // Step the physics simulation
    cannonWorld.step(1/60);

    // Update dice mesh position and rotation from physics body
    if (dice && diceBody) {
        dice.position.copy(diceBody.position);
        dice.quaternion.copy(diceBody.quaternion);
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
    if (roll === 20) {
        user.bonusXP = true;
        showFloatingMessage("Bonus XP activated for next quest!", "success");
    } else if (roll === 1) {
        showFloatingMessage("The dice mock you, but you're undeterred!", "info");
    } else if (roll >= 15) {
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
        if (typeof THREE !== 'undefined' && typeof CANNON !== 'undefined') {
            try {
                initDice();
                return true;
            } catch (error) {
                console.error('Failed to initialize dice:', error);
                return false;
            }
        } else {
            console.log('THREE.js or Cannon.js not loaded yet');
            return false;
        }
    }

    if (renderer && cannonWorld) {
        return true;
    }

    return false;
}

// Initialize dice when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        ensureDiceInitialized();
    }, 1000);
});

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

// Make functions globally available
window.initCombatDice = initCombatDice;
window.ensureDiceInitialized = ensureDiceInitialized;

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

window.rollSkillCheck = rollSkillCheck;
