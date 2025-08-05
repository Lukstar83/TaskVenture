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

    // Create the renderer with enhanced settings
    renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      logarithmicDepthBuffer: true 
    });
    renderer.setSize(300, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e, 1.0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear existing content and add renderer
    diceContainer.innerHTML = ''; // Clear the container
    diceContainer.appendChild(renderer.domElement);

    // Initialize physics world (simplified physics simulation)
    world = {
        gravity: -20,
        objects: []
    };

    // Enhanced lighting setup for better visuals
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Main spotlight for dramatic effect
    const spotLight = new THREE.SpotLight(0xffffff, 2.0);
    spotLight.position.set(-3, 6, 3);
    spotLight.target.position.set(0, 0, 0);
    spotLight.distance = 15;
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.1;
    spotLight.decay = 2;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 15;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);

    // Secondary directional light for fill
    const directionalLight = new THREE.DirectionalLight(0x9bb5ff, 0.4);
    directionalLight.position.set(5, 3, -2);
    scene.add(directionalLight);

    // Rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0xffc994, 0.3);
    rimLight.position.set(-2, 1, -3);
    scene.add(rimLight);

    // Create enhanced gaming table with felt surface
    const tableGeometry = new THREE.PlaneGeometry(12, 8);

    // Create felt texture for gaming table
    const tableCanvas = document.createElement('canvas');
    tableCanvas.width = 1024;
    tableCanvas.height = 1024;
    const tableCtx = tableCanvas.getContext('2d');

    // Base felt color
    const feltGradient = tableCtx.createRadialGradient(512, 512, 0, 512, 512, 512);
    feltGradient.addColorStop(0, '#0f4d0f');
    feltGradient.addColorStop(0.7, '#0a3d0a');
    feltGradient.addColorStop(1, '#083008');
    tableCtx.fillStyle = feltGradient;
    tableCtx.fillRect(0, 0, 1024, 1024);

    // Add subtle felt texture
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const brightness = Math.random() * 0.1;
      tableCtx.fillStyle = `rgba(${Math.floor(255 * brightness)}, ${Math.floor(255 * brightness)}, ${Math.floor(255 * brightness)}, 0.15)`;
      tableCtx.fillRect(x, y, 1, 1);
    }

    // Add decorative border pattern
    tableCtx.strokeStyle = '#d4af37';
    tableCtx.lineWidth = 8;
    tableCtx.strokeRect(32, 32, 960, 960);
    
    // Inner decorative line
    tableCtx.strokeStyle = '#b8860b';
    tableCtx.lineWidth = 3;
    tableCtx.strokeRect(48, 48, 928, 928);

    const tableTexture = new THREE.CanvasTexture(tableCanvas);
    tableTexture.wrapS = THREE.RepeatWrapping;
    tableTexture.wrapT = THREE.RepeatWrapping;

    const tableMaterial = new THREE.MeshPhongMaterial({ 
      map: tableTexture,
      shininess: 5,
      specular: 0x004400,
      bumpMap: tableTexture,
      bumpScale: 0.02
    });

    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -3.5;
    table.receiveShadow = true;
    scene.add(table)
    });
    
    const tableEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    tableEdge.rotation.x = -Math.PI / 2;
    tableEdge.position.y = -3.45;
    tableEdge.receiveShadow = true;
    scene.add(tableEdge);

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

    // Helper functions for better dice geometry
    function calc_texture_size(approx) {
        return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
    }

    function create_text_texture(text, color, back_color, size, margin) {
        if (text == undefined) return null;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var ts = calc_texture_size(size + size * 2 * margin) * 2;
        canvas.width = canvas.height = ts;
        context.font = ts / (1 + 2 * margin) + "pt Arial";
        context.fillStyle = back_color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        if (text == '6' || text == '9') {
            context.fillText('  .', canvas.width / 2, canvas.height / 2);
        }
        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function create_dice_materials(face_labels, size, margin) {
        var materials = [];
        var material_options = {
            shininess: 40,
            specular: 0x172022,
            transparent: false,
            side: THREE.DoubleSide
        };
        var label_color = '#aaaaaa';
        var dice_color = '#202020';
        
        for (var i = 0; i < face_labels.length; ++i) {
            var material = new THREE.MeshPhongMaterial({
                ...material_options,
                map: create_text_texture(face_labels[i], label_color, dice_color, size, margin)
            });
            materials.push(material);
        }
        return materials;
    }

    function create_geom(vertices, faces, radius, tab, af, chamfer) {
        var vectors = new Array(vertices.length);
        for (var i = 0; i < vertices.length; ++i) {
            vectors[i] = (new THREE.Vector3).fromArray(vertices[i]).normalize();
        }
        var cg = chamfer_geom(vectors, faces, chamfer);
        var geom = make_geom(cg.vectors, cg.faces, radius, tab, af);
        return geom;
    }

    function chamfer_geom(vectors, faces, chamfer) {
        var chamfer_vectors = [], chamfer_faces = [], corner_faces = new Array(vectors.length);
        for (var i = 0; i < vectors.length; ++i) corner_faces[i] = [];
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var center_point = new THREE.Vector3();
            var face = new Array(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = vectors[ii[j]].clone();
                center_point.add(vv);
                corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
            }
            center_point.divideScalar(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = chamfer_vectors[face[j]];
                vv.subVectors(vv, center_point).multiplyScalar(chamfer).addVectors(vv, center_point);
            }
            face.push(ii[fl]);
            chamfer_faces.push(face);
        }
        for (var i = 0; i < faces.length - 1; ++i) {
            for (var j = i + 1; j < faces.length; ++j) {
                var pairs = [], lastm = -1;
                for (var m = 0; m < faces[i].length - 1; ++m) {
                    var n = faces[j].indexOf(faces[i][m]);
                    if (n >= 0 && n < faces[j].length - 1) {
                        if (lastm >= 0 && m != lastm + 1) pairs.unshift([i, m], [j, n]);
                        else pairs.push([i, m], [j, n]);
                        lastm = m;
                    }
                }
                if (pairs.length != 4) continue;
                chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
                        chamfer_faces[pairs[1][0]][pairs[1][1]],
                        chamfer_faces[pairs[3][0]][pairs[3][1]],
                        chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
            }
        }
        for (var i = 0; i < corner_faces.length; ++i) {
            var cf = corner_faces[i], face = [cf[0]], count = cf.length - 1;
            while (count) {
                for (var m = faces.length; m < chamfer_faces.length; ++m) {
                    var index = chamfer_faces[m].indexOf(face[face.length - 1]);
                    if (index >= 0 && index < 4) {
                        if (--index == -1) index = 3;
                        var next_vertex = chamfer_faces[m][index];
                        if (cf.indexOf(next_vertex) >= 0) {
                            face.push(next_vertex);
                            break;
                        }
                    }
                }
                --count;
            }
            face.push(-1);
            chamfer_faces.push(face);
        }
        return { vectors: chamfer_vectors, faces: chamfer_faces };
    }

    function make_geom(vectors, faces, radius, tab, af) {
        var geom = new THREE.BufferGeometry();
        var vertices = [];
        var normals = [];
        var uvs = [];
        var indices = [];
        
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            for (var j = 0; j < fl - 2; ++j) {
                var v1 = vectors[ii[0]].clone().multiplyScalar(radius);
                var v2 = vectors[ii[j + 1]].clone().multiplyScalar(radius);
                var v3 = vectors[ii[j + 2]].clone().multiplyScalar(radius);
                
                vertices.push(v1.x, v1.y, v1.z);
                vertices.push(v2.x, v2.y, v2.z);
                vertices.push(v3.x, v3.y, v3.z);
                
                var normal = new THREE.Vector3();
                normal.crossVectors(
                    new THREE.Vector3().subVectors(v2, v1),
                    new THREE.Vector3().subVectors(v3, v1)
                ).normalize();
                
                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);
                
                uvs.push(
                    (Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                    (Math.sin(af) + 1 + tab) / 2 / (1 + tab),
                    (Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                    (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                    (Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                    (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab)
                );
            }
        }
        
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        
        geom.computeBoundingSphere();
        return geom;
    }

    function create_d20_geometry(radius) {
        var t = (1 + Math.sqrt(5)) / 2;
        var vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
                [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
                [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
        var faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
                [1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
                [3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
                [4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
        return create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.955);
    }

    function createDice() {
        // Create proper D20 geometry with numbered faces
        const radius = 1.2;
        const geo = create_d20_geometry(radius);
        
        // Create face labels for D20 (1-20)
        const face_labels = [];
        for (let i = 1; i <= 20; i++) {
            face_labels.push(i.toString());
        }
        
        // Create materials with proper textures
        const materials = create_dice_materials(face_labels, 48, 0.2);
        
        // Create the dice mesh
        dice = new THREE.Mesh(geo, materials);
        dice.castShadow = true;
        dice.receiveShadow = true;
        
        // Position dice visibly above the table surface
        dice.position.set(0, 1, 0);
        dice.scale.set(0.7, 0.7, 0.7);
        
        // Initialize physics properties
        dice.userData = {
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };
        
        scene.add(dice);
        
        console.log('✅ D20 with proper geometry and numbered faces created');
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