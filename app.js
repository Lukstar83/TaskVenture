// app.js

// Ensure initial visibility is set immediately to prevent flash
document.documentElement.style.setProperty("--initial-load", "true");

const splashEl = document.getElementById("splash-screen");
const wizardEl = document.getElementById("wizard");
const gameEl = document.getElementById("game-interface");

// Immediately hide game interface to prevent flash
if (gameEl) gameEl.style.display = "none";
if (wizardEl) wizardEl.style.display = "none";

// auto-launch wizard on fresh load if no profile

// Import Capacitor plugins for notifications
let LocalNotifications;
let notificationsEnabled = false;

// Initialize notifications
async function initializeNotifications() {
    try {
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            const { LocalNotifications: LN } = await import(
                "@capacitor/local-notifications"
            );
            LocalNotifications = LN;

            // Request permission
            const permission = await LocalNotifications.requestPermissions();
            notificationsEnabled = permission.display === "granted";

            if (notificationsEnabled) {
                console.log("✅ Notifications enabled");
            } else {
                console.log("❌ Notifications permission denied");
            }
        }
    } catch (error) {
        console.warn("Notifications not available:", error);
    }
}

// Wellness system
let wellnessStats = {
    stress: 0,
    energy: 100,
    mood: 75,
    mindfulness: 50,
};

// Notification settings
let notificationSettings = {
    enabled: false,
    frequency: 120, // minutes
    quietHours: {
        start: 22, // 10 PM
        end: 7, // 7 AM
    },
    activities: {
        hydrate: true,
        breathe: true,
        rest: true,
        walk: true,
        meditate: true,
        journal: true,
    },
};

// Load wellness data
function loadWellnessData() {
    const savedWellness = localStorage.getItem("taskventureWellness");
    if (savedWellness) {
        wellnessStats = JSON.parse(savedWellness);
    }

    // Load notification settings
    const savedNotifications = localStorage.getItem("taskventureNotifications");
    if (savedNotifications) {
        notificationSettings = JSON.parse(savedNotifications);
    }
}

// Save notification settings
function saveNotificationSettings() {
    localStorage.setItem(
        "taskventureNotifications",
        JSON.stringify(notificationSettings),
    );
}

// Schedule self-care notifications
async function scheduleSelfCareNotifications() {
    if (!notificationsEnabled || !notificationSettings.enabled) return;

    try {
        // Cancel existing notifications
        await LocalNotifications.cancel({
            notifications: [
                { id: 1 },
                { id: 2 },
                { id: 3 },
                { id: 4 },
                { id: 5 },
                { id: 6 },
            ],
        });

        const activities = [
            {
                id: 1,
                activity: "hydrate",
                title: "💧 Hydration Reminder",
                body: "Time to drink some water! Your body will thank you.",
            },
            {
                id: 2,
                activity: "breathe",
                title: "🌬️ Breathing Break",
                body: "Take a moment for some deep breathing exercises.",
            },
            {
                id: 3,
                activity: "rest",
                title: "😴 Rest Time",
                body: "Consider taking a short break to recharge your energy.",
            },
            {
                id: 4,
                activity: "walk",
                title: "🚶‍♂️ Movement Break",
                body: "Time for a refreshing walk to boost your mood and energy!",
            },
            {
                id: 5,
                activity: "meditate",
                title: "🧘‍♀️ Mindfulness Moment",
                body: "A few minutes of meditation can clear your mind.",
            },
            {
                id: 6,
                activity: "journal",
                title: "📝 Reflection Time",
                body: "Writing in your journal can help process your thoughts.",
            },
        ];

        const notifications = [];
        const now = new Date();

        activities.forEach(({ id, activity, title, body }) => {
            if (!notificationSettings.activities[activity]) return;

            // Schedule notification
            const notificationTime = new Date(
                now.getTime() + notificationSettings.frequency * 60 * 1000,
            );

            // Check if it's during quiet hours
            const hour = notificationTime.getHours();
            if (
                hour >= notificationSettings.quietHours.start ||
                hour < notificationSettings.quietHours.end
            ) {
                // Adjust to after quiet hours
                notificationTime.setHours(
                    notificationSettings.quietHours.end,
                    0,
                    0,
                    0,
                );
                if (notificationTime <= now) {
                    notificationTime.setDate(notificationTime.getDate() + 1);
                }
            }

            notifications.push({
                id: id,
                title: title,
                body: body,
                at: notificationTime,
                sound: "default",
                smallIcon: "ic_launcher",
                iconColor: "#d4af37",
            });
        });

        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications });
            console.log(
                `✅ Scheduled ${notifications.length} self-care notifications`,
            );
        }
    } catch (error) {
        console.error("Failed to schedule notifications:", error);
    }
}

// Toggle notifications
async function toggleNotifications(enabled) {
    notificationSettings.enabled = enabled;
    saveNotificationSettings();

    if (enabled) {
        await scheduleSelfCareNotifications();
        showSelfCareMessage(
            "🔔 Self-care notifications enabled! You'll receive gentle reminders.",
            0,
        );
    } else {
        if (LocalNotifications) {
            await LocalNotifications.cancel({
                notifications: [
                    { id: 1 },
                    { id: 2 },
                    { id: 3 },
                    { id: 4 },
                    { id: 5 },
                    { id: 6 },
                ],
            });
        }
        showSelfCareMessage("🔕 Self-care notifications disabled.", 0);
    }
}

// Save wellness data
function saveWellnessData() {
    localStorage.setItem("taskventureWellness", JSON.stringify(wellnessStats));
}

// Update wellness stats based on activities
function updateWellness(activity) {
    switch (activity) {
        case "complete_task":
            wellnessStats.stress = Math.max(0, wellnessStats.stress - 2);
            wellnessStats.mood = Math.min(100, wellnessStats.mood + 3);
            break;
        case "long_work_session":
            wellnessStats.stress = Math.min(100, wellnessStats.stress + 5);
            wellnessStats.energy = Math.max(0, wellnessStats.energy - 10);
            break;
        case "self_care":
            wellnessStats.stress = Math.max(0, wellnessStats.stress - 10);
            wellnessStats.energy = Math.min(100, wellnessStats.energy + 15);
            wellnessStats.mood = Math.min(100, wellnessStats.mood + 10);
            wellnessStats.mindfulness = Math.min(
                100,
                wellnessStats.mindfulness + 5,
            );
            break;
    }
    saveWellnessData();
    updateWellnessUI();
}

// Update wellness UI
function updateWellnessUI() {
    const stressBar = document.getElementById("stress-bar");
    const energyBar = document.getElementById("energy-bar");
    const moodBar = document.getElementById("mood-bar");
    const mindfulnessBar = document.getElementById("mindfulness-bar");

    const stressValue = document.getElementById("stress-value");
    const energyValue = document.getElementById("energy-value");
    const moodValue = document.getElementById("mood-value");
    const mindfulnessValue = document.getElementById("mindfulness-value");

    if (stressBar) stressBar.style.width = `${wellnessStats.stress}%`;
    if (energyBar) energyBar.style.width = `${wellnessStats.energy}%`;
    if (moodBar) moodBar.style.width = `${wellnessStats.mood}%`;
    if (mindfulnessBar)
        mindfulnessBar.style.width = `${wellnessStats.mindfulness}%`;

    if (stressValue) stressValue.textContent = `${wellnessStats.stress}%`;
    if (energyValue) energyValue.textContent = `${wellnessStats.energy}%`;
    if (moodValue) moodValue.textContent = `${wellnessStats.mood}%`;
    if (mindfulnessValue)
        mindfulnessValue.textContent = `${wellnessStats.mindfulness}%`;
}

// Meditation timer state
let meditationTimer = null;
let meditationTimeRemaining = 0;

// Walking timer state
let walkingTimer = null;
let walkingTimeRemaining = 0;
let walkingSteps = 0;
let walkingStartTime = 0;

// Rest timer state
let restTimer = null;
let restTimeRemaining = 0;

// Breathing timer state
let breathingTimer = null;
let breathingTimeRemaining = 0;

// Self-care activities
function performSelfCare(activity) {
    let message = "";
    let xpGain = 5;

    switch (activity) {
        case "meditate":
            showMeditationTimer();
            return; // Don't continue with regular completion - timer will handle it
            break;
        case "walk":
            showWalkingTimer();
            return; // Don't continue with regular completion - timer will handle it
            break;
        case "journal":
            message =
                "📝 You write in your journal, processing your thoughts and feelings.";
            wellnessStats.mood = Math.min(100, wellnessStats.mood + 15);
            wellnessStats.mindfulness = Math.min(
                100,
                wellnessStats.mindfulness + 10,
            );
            break;
        case "rest":
            showRestTimer();
            return; // Don't continue with regular completion - timer will handle it
            break;
        case "hydrate":
            message =
                "💧 You drink a refreshing glass of water. Your body thanks you.";
            wellnessStats.energy = Math.min(100, wellnessStats.energy + 10);
            break;
        case "breathe":
            showBreathingTimer();
            return; // Don't continue with regular completion - timer will handle it
            break;
    }

    // Award XP for self-care
    user.xp += xpGain;

    // Show self-care completion message
    showSelfCareMessage(message, xpGain);

    updateWellness("self_care");
    updateUI();

    // Reschedule notifications after completing activity
    if (notificationSettings.enabled) {
        setTimeout(() => {
            scheduleSelfCareNotifications();
        }, 1000);
    }
}

// Show meditation timer modal
function showMeditationTimer() {
    const modal = document.createElement("div");
    modal.className = "meditation-timer-modal";
    modal.innerHTML = `
        <div class="meditation-timer-content">
            <h2>🧘‍♀️ Meditation Session</h2>
            <p>Choose your meditation duration:</p>

            <div class="timer-options">
                <button class="timer-btn" onclick="startMeditation(300)">5 Minutes</button>
                <button class="timer-btn" onclick="startMeditation(600)">10 Minutes</button>
                <button class="timer-btn" onclick="startMeditation(900)">15 Minutes</button>
                <button class="timer-btn" onclick="startMeditation(1200)">20 Minutes</button>
            </div>

            <div class="meditation-display" id="meditation-display" style="display: none;">
                <div class="timer-circle">
                    <div class="timer-text" id="timer-text">5:00</div>
                </div>
                <p class="meditation-quote" id="meditation-quote">Find peace in this moment...</p>
                <button class="pause-btn" id="pause-btn" onclick="pauseMeditation()">Pause</button>
                <button class="stop-btn" onclick="stopMeditation()">Stop</button>
            </div>

            <button class="close-timer-btn" onclick="closeMeditationTimer()">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);
}

// Start meditation timer
window.startMeditation = function startMeditation(duration) {
    meditationTimeRemaining = duration;

    // Hide options, show timer
    const options = document.querySelector(".timer-options");
    const display = document.getElementById("meditation-display");
    const closeBtn = document.querySelector(".close-timer-btn");

    if (options) options.style.display = "none";
    if (display) display.style.display = "block";
    if (closeBtn) closeBtn.style.display = "none";

    updateMeditationDisplay();

    // Array of meditation quotes/prompts
    const meditationQuotes = [
        "Find peace in this moment...",
        "Breathe in calm, breathe out tension...",
        "Let your thoughts pass like clouds in the sky...",
        "Feel your body relax with each breath...",
        "You are exactly where you need to be...",
        "Notice the stillness within you...",
        "Each breath brings you deeper into peace...",
        "Release what no longer serves you...",
        "Feel gratitude for this moment of self-care...",
        "Your mind is clear, your heart is open...",
    ];

    let quoteIndex = 0;
    const quoteElement = document.getElementById("meditation-quote");

    meditationTimer = setInterval(() => {
        meditationTimeRemaining--;
        updateMeditationDisplay();

        // Change quote every 30 seconds
        if (meditationTimeRemaining % 30 === 0 && quoteElement) {
            quoteIndex = (quoteIndex + 1) % meditationQuotes.length;
            quoteElement.textContent = meditationQuotes[quoteIndex];
        }

        if (meditationTimeRemaining <= 0) {
            completeMeditation(duration);
        }
    }, 1000);
};

// Update meditation display
function updateMeditationDisplay() {
    const timerText = document.getElementById("timer-text");
    if (timerText) {
        const minutes = Math.floor(meditationTimeRemaining / 60);
        const seconds = meditationTimeRemaining % 60;
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

// Pause meditation
window.pauseMeditation = function pauseMeditation() {
    const pauseBtn = document.getElementById("pause-btn");

    if (meditationTimer) {
        clearInterval(meditationTimer);
        meditationTimer = null;
        if (pauseBtn) pauseBtn.textContent = "Resume";
        pauseBtn.onclick = resumeMeditation;
    }
};

// Resume meditation
function resumeMeditation() {
    const pauseBtn = document.getElementById("pause-btn");

    meditationTimer = setInterval(() => {
        meditationTimeRemaining--;
        updateMeditationDisplay();

        if (meditationTimeRemaining <= 0) {
            completeMeditation();
        }
    }, 1000);

    if (pauseBtn) pauseBtn.textContent = "Pause";
    pauseBtn.onclick = pauseMeditation;
}

// Stop meditation early
window.stopMeditation = function stopMeditation() {
    if (
        confirm("Are you sure you want to end your meditation session early?")
    ) {
        if (meditationTimer) {
            clearInterval(meditationTimer);
            meditationTimer = null;
        }
        closeMeditationTimer();

        // Give partial benefits for incomplete session
        const originalDuration =
            parseInt(
                document
                    .querySelector(".timer-text")
                    ?.textContent?.split(":")[0] || 5,
            ) * 60;
        const timeSpent = originalDuration - meditationTimeRemaining;

        if (timeSpent >= 60) {
            // At least 1 minute
            wellnessStats.mindfulness = Math.min(
                100,
                wellnessStats.mindfulness + Math.floor(timeSpent / 60) * 2,
            );
            wellnessStats.stress = Math.max(
                0,
                wellnessStats.stress - Math.floor(timeSpent / 60),
            );
            user.xp += Math.floor(timeSpent / 60);
            updateWellness("self_care");
            updateUI();
            showSelfCareMessage(
                "🧘‍♀️ Even a brief meditation helps. Your mind feels a bit clearer.",
                Math.floor(timeSpent / 60),
            );
        }
    }
};

// Complete meditation
function completeMeditation(duration) {
    if (meditationTimer) {
        clearInterval(meditationTimer);
        meditationTimer = null;
    }

    closeMeditationTimer();

    // Calculate benefits based on duration
    const minutes = duration / 60;
    const mindfulnessGain = Math.min(20, 5 + minutes * 2);
    const stressReduction = Math.min(25, 5 + minutes * 1.5);
    const xpGain = Math.min(15, 3 + minutes);

    wellnessStats.mindfulness = Math.min(
        100,
        wellnessStats.mindfulness + mindfulnessGain,
    );
    wellnessStats.stress = Math.max(0, wellnessStats.stress - stressReduction);
    user.xp += xpGain;

    updateWellness("self_care");
    updateUI();

    const message = `🧘‍♀️ You completed a ${minutes}-minute meditation session. Your mind feels clear and peaceful.`;
    showSelfCareMessage(message, xpGain);

    // Reschedule notifications after completing activity
    if (notificationSettings.enabled) {
        setTimeout(() => {
            scheduleSelfCareNotifications();
        }, 1000);
    }
}

// Close meditation timer modal
window.closeMeditationTimer = function closeMeditationTimer() {
    if (meditationTimer) {
        clearInterval(meditationTimer);
        meditationTimer = null;
    }

    const modal = document.querySelector(".meditation-timer-modal");
    if (modal) {
        modal.remove();
    }
};

// Show walking timer modal
function showWalkingTimer() {
    const modal = document.createElement("div");
    modal.className = "walking-timer-modal";
    modal.innerHTML = `
        <div class="walking-timer-content">
            <h2>🚶‍♂️ Walking Session</h2>
            <p>Choose your walking duration:</p>

            <div class="timer-options">
                <button class="timer-btn" onclick="startWalking(600)">10 Minutes</button>
                <button class="timer-btn" onclick="startWalking(900)">15 Minutes</button>
                <button class="timer-btn" onclick="startWalking(1200)">20 Minutes</button>
                <button class="timer-btn" onclick="startWalking(1800)">30 Minutes</button>
            </div>

            <div class="walking-display" id="walking-display" style="display: none;">
                <div class="walking-stats">
                    <div class="timer-circle">
                        <div class="timer-text" id="walking-timer-text">10:00</div>
                    </div>
                    <div class="step-counter">
                        <div class="step-icon">👣</div>
                        <div class="step-count" id="step-count">0</div>
                        <div class="step-label">estimated steps</div>
                    </div>
                </div>
                <p class="walking-prompt" id="walking-prompt">Let's start your refreshing walk!</p>
                <div class="walking-controls">
                    <button class="pause-btn" id="walking-pause-btn" onclick="pauseWalking()">Pause</button>
                    <button class="stop-btn" onclick="stopWalking()">Stop</button>
                </div>
            </div>

            <button class="close-timer-btn" onclick="closeWalkingTimer()">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);
}

// Start walking timer
window.startWalking = function startWalking(duration) {
    walkingTimeRemaining = duration;
    walkingStartTime = Date.now();
    walkingSteps = 0;

    // Hide options, show timer
    const options = document.querySelector(
        ".walking-timer-modal .timer-options",
    );
    const display = document.getElementById("walking-display");
    const closeBtn = document.querySelector(
        ".walking-timer-modal .close-timer-btn",
    );

    if (options) options.style.display = "none";
    if (display) display.style.display = "block";
    if (closeBtn) closeBtn.style.display = "none";

    updateWalkingDisplay();

    // Array of walking prompts/motivation
    const walkingPrompts = [
        "Let's start your refreshing walk! 🌟",
        "Feel the fresh air filling your lungs... 🌬️",
        "Notice the world around you as you move... 🌳",
        "Each step is improving your health! 💪",
        "You're doing great! Keep that steady pace... ⚡",
        "Feel your energy building with each step... 🔋",
        "Take in the sights and sounds around you... 👀",
        "Your body thanks you for this movement! ❤️",
        "Almost there! You're crushing this walk! 🎯",
        "Great job! Feel that natural endorphin boost! 🌈",
    ];

    let promptIndex = 0;
    const promptElement = document.getElementById("walking-prompt");

    walkingTimer = setInterval(() => {
        walkingTimeRemaining--;

        // Estimate steps (approximately 2 steps per second for moderate walking)
        const elapsedSeconds = duration - walkingTimeRemaining;
        walkingSteps = Math.floor(elapsedSeconds * 1.8); // Slightly slower pace

        updateWalkingDisplay();

        // Change prompt every 60 seconds
        if (walkingTimeRemaining % 60 === 0 && promptElement) {
            promptIndex = (promptIndex + 1) % walkingPrompts.length;
            promptElement.textContent = walkingPrompts[promptIndex];
        }

        if (walkingTimeRemaining <= 0) {
            completeWalking(duration);
        }
    }, 1000);
};

// Update walking display
function updateWalkingDisplay() {
    const timerText = document.getElementById("walking-timer-text");
    const stepCount = document.getElementById("step-count");

    if (timerText) {
        const minutes = Math.floor(walkingTimeRemaining / 60);
        const seconds = walkingTimeRemaining % 60;
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    if (stepCount) {
        stepCount.textContent = walkingSteps.toLocaleString();
    }
}

// Pause walking
window.pauseWalking = function pauseWalking() {
    const pauseBtn = document.getElementById("walking-pause-btn");

    if (walkingTimer) {
        clearInterval(walkingTimer);
        walkingTimer = null;
        if (pauseBtn) pauseBtn.textContent = "Resume";
        pauseBtn.onclick = resumeWalking;
    }
};

// Resume walking
function resumeWalking() {
    const pauseBtn = document.getElementById("walking-pause-btn");

    walkingTimer = setInterval(() => {
        walkingTimeRemaining--;

        // Continue estimating steps
        const totalDuration =
            parseInt(
                document
                    .querySelector(".timer-text")
                    ?.textContent?.split(":")[0] || 10,
            ) * 60;
        const elapsedSeconds = totalDuration - walkingTimeRemaining;
        walkingSteps = Math.floor(elapsedSeconds * 1.8);

        updateWalkingDisplay();

        if (walkingTimeRemaining <= 0) {
            completeWalking(totalDuration);
        }
    }, 1000);

    if (pauseBtn) pauseBtn.textContent = "Pause";
    pauseBtn.onclick = pauseWalking;
}

// Stop walking early
window.stopWalking = function stopWalking() {
    if (confirm("Are you sure you want to end your walking session early?")) {
        if (walkingTimer) {
            clearInterval(walkingTimer);
            walkingTimer = null;
        }
        closeWalkingTimer();

        // Give partial benefits for incomplete session
        const originalDuration =
            parseInt(
                document
                    .querySelector("#walking-timer-text")
                    ?.textContent?.split(":")[0] || 10,
            ) * 60;
        const timeSpent = originalDuration - walkingTimeRemaining;

        if (timeSpent >= 60) {
            // At least 1 minute
            const minutes = Math.floor(timeSpent / 60);
            const steps = Math.floor(timeSpent * 1.8);

            wellnessStats.energy = Math.min(
                100,
                wellnessStats.energy + minutes * 2,
            );
            wellnessStats.mood = Math.min(
                100,
                wellnessStats.mood + minutes * 1.5,
            );
            user.xp += Math.floor(minutes * 1.5);

            updateWellness("self_care");
            updateUI();
            showSelfCareMessage(
                `🚶‍♂️ Nice ${minutes}-minute walk! You took approximately ${steps.toLocaleString()} steps.`,
                Math.floor(minutes * 1.5),
            );
        }
    }
};

// Complete walking session
function completeWalking(duration) {
    if (walkingTimer) {
        clearInterval(walkingTimer);
        walkingTimer = null;
    }

    closeWalkingTimer();

    // Calculate benefits based on duration and steps
    const minutes = duration / 60;
    const finalSteps = walkingSteps;

    const energyGain = Math.min(25, 8 + minutes * 1.2);
    const moodGain = Math.min(20, 5 + minutes * 1);
    const xpGain = Math.min(20, 5 + minutes * 0.8);

    wellnessStats.energy = Math.min(100, wellnessStats.energy + energyGain);
    wellnessStats.mood = Math.min(100, wellnessStats.mood + moodGain);
    wellnessStats.stress = Math.max(
        0,
        wellnessStats.stress - Math.floor(minutes * 0.5),
    );
    user.xp += xpGain;

    updateWellness("self_care");
    updateUI();

    const message = `🚶‍♂️ Excellent ${minutes}-minute walk completed! You took approximately ${finalSteps.toLocaleString()} steps. Your body feels refreshed and energized!`;
    showSelfCareMessage(message, xpGain);

    // Reschedule notifications after completing activity
    if (notificationSettings.enabled) {
        setTimeout(() => {
            scheduleSelfCareNotifications();
        }, 1000);
    }
}

// Close walking timer modal
window.closeWalkingTimer = function closeWalkingTimer() {
    if (walkingTimer) {
        clearInterval(walkingTimer);
        walkingTimer = null;
    }

    const modal = document.querySelector(".walking-timer-modal");
    if (modal) {
        modal.remove();
    }
};

// Show rest timer modal
function showRestTimer() {
    const modal = document.createElement("div");
    modal.className = "meditation-timer-modal";
    modal.innerHTML = `
        <div class="meditation-timer-content">
            <h2>😴 Rest Break</h2>
            <p>Choose your rest duration:</p>

            <div class="timer-options">
                <button class="timer-btn" onclick="startRest(300)">5 Minutes</button>
                <button class="timer-btn" onclick="startRest(600)">10 Minutes</button>
                <button class="timer-btn" onclick="startRest(900)">15 Minutes</button>
                <button class="timer-btn" onclick="startRest(1800)">30 Minutes</button>
            </div>

            <div class="meditation-display" id="rest-display" style="display: none;">
                <div class="timer-circle">
                    <div class="timer-text" id="rest-timer-text">5:00</div>
                </div>
                <p class="meditation-quote" id="rest-message">Take a moment to relax and recharge...</p>
                <div class="rest-controls">
                    <button class="pause-btn" id="rest-pause-btn" onclick="pauseRest()">Pause</button>
                    <button class="stop-btn" onclick="stopRest()">Stop</button>
                </div>
            </div>

            <button class="close-timer-btn" onclick="closeRestTimer()">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);
}

// Start rest timer
window.startRest = function startRest(duration) {
    restTimeRemaining = duration;

    // Hide options, show timer
    const options = document.querySelector(".timer-options");
    const display = document.getElementById("rest-display");
    const closeBtn = document.querySelector(".close-timer-btn");

    if (options) options.style.display = "none";
    if (display) display.style.display = "block";
    if (closeBtn) closeBtn.style.display = "none";

    updateRestDisplay();

    // Array of rest messages
    const restMessages = [
        "Take a moment to relax and recharge... 💤",
        "Let your mind wander and be at peace... ☁️",
        "Feel the tension leaving your body... 🌸",
        "You deserve this time to rest... ✨",
        "Breathe slowly and deeply... 🍃",
        "Allow yourself to simply be... 🌅",
        "Rest is productive too... 🛌",
        "Your body is healing and recovering... 💆",
        "Peace and calm surround you... 🕊️",
        "Almost done - you're doing great! 🌟",
    ];

    let messageIndex = 0;
    const messageElement = document.getElementById("rest-message");

    restTimer = setInterval(() => {
        restTimeRemaining--;
        updateRestDisplay();

        // Change message every 45 seconds
        if (restTimeRemaining % 45 === 0 && messageElement) {
            messageIndex = (messageIndex + 1) % restMessages.length;
            messageElement.textContent = restMessages[messageIndex];
        }

        if (restTimeRemaining <= 0) {
            completeRest(duration);
        }
    }, 1000);
};

// Update rest display
function updateRestDisplay() {
    const timerText = document.getElementById("rest-timer-text");

    if (timerText) {
        const minutes = Math.floor(restTimeRemaining / 60);
        const seconds = restTimeRemaining % 60;
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

// Pause rest
window.pauseRest = function pauseRest() {
    const pauseBtn = document.getElementById("rest-pause-btn");

    if (restTimer) {
        clearInterval(restTimer);
        restTimer = null;
        if (pauseBtn) pauseBtn.textContent = "Resume";
        pauseBtn.onclick = resumeRest;
    }
};

// Resume rest
function resumeRest() {
    const pauseBtn = document.getElementById("rest-pause-btn");

    restTimer = setInterval(() => {
        restTimeRemaining--;
        updateRestDisplay();

        if (restTimeRemaining <= 0) {
            completeRest();
        }
    }, 1000);

    if (pauseBtn) pauseBtn.textContent = "Pause";
    pauseBtn.onclick = pauseRest;
}

// Stop rest early
window.stopRest = function stopRest() {
    if (confirm("Are you sure you want to end your rest break early?")) {
        if (restTimer) {
            clearInterval(restTimer);
            restTimer = null;
        }
        closeRestTimer();

        // Give partial benefits for incomplete session
        const originalDuration =
            parseInt(
                document
                    .querySelector("#rest-timer-text")
                    ?.textContent?.split(":")[0] || 5,
            ) * 60;
        const timeSpent = originalDuration - restTimeRemaining;

        if (timeSpent >= 60) {
            // At least 1 minute
            const minutes = Math.floor(timeSpent / 60);

            wellnessStats.energy = Math.min(
                100,
                wellnessStats.energy + minutes * 3,
            );
            wellnessStats.stress = Math.max(
                0,
                wellnessStats.stress - minutes * 2,
            );
            user.xp += Math.floor(minutes * 1.5);

            updateWellness("self_care");
            updateUI();
            showSelfCareMessage(
                `😴 Nice ${minutes}-minute rest! You feel a bit more refreshed.`,
                Math.floor(minutes * 1.5),
            );
        }
    }
};

// Complete rest session
function completeRest(duration) {
    if (restTimer) {
        clearInterval(restTimer);
        restTimer = null;
    }

    closeRestTimer();

    // Calculate benefits based on duration
    const minutes = duration / 60;

    const energyGain = Math.min(30, 10 + minutes * 1.5);
    const stressReduction = Math.min(25, 8 + minutes * 1);
    const xpGain = Math.min(15, 5 + minutes * 0.7);

    wellnessStats.energy = Math.min(100, wellnessStats.energy + energyGain);
    wellnessStats.stress = Math.max(0, wellnessStats.stress - stressReduction);
    user.xp += xpGain;

    updateWellness("self_care");
    updateUI();

    const message = `😴 Excellent ${minutes}-minute rest completed! Your body and mind feel refreshed and recharged.`;
    showSelfCareMessage(message, xpGain);

    // Reschedule notifications after completing activity
    if (notificationSettings.enabled) {
        setTimeout(() => {
            scheduleSelfCareNotifications();
        }, 1000);
    }
}

// Close rest timer modal
window.closeRestTimer = function closeRestTimer() {
    if (restTimer) {
        clearInterval(restTimer);
        restTimer = null;
    }

    const modal = document.querySelector(".meditation-timer-modal");
    if (modal) {
        modal.remove();
    }
};

// Show breathing timer modal
function showBreathingTimer() {
    const modal = document.createElement("div");
    modal.className = "meditation-timer-modal";
    modal.innerHTML = `
        <div class="meditation-timer-content">
            <h2>🌬️ Deep Breathing</h2>
            <p>Choose your breathing session duration:</p>

            <div class="timer-options">
                <button class="timer-btn" onclick="startBreathing(180)">3 Minutes</button>
                <button class="timer-btn" onclick="startBreathing(300)">5 Minutes</button>
                <button class="timer-btn" onclick="startBreathing(600)">10 Minutes</button>
                <button class="timer-btn" onclick="startBreathing(900)">15 Minutes</button>
            </div>

            <div class="meditation-display" id="breathing-display" style="display: none;">
                <div class="timer-circle" id="breathing-circle">
                    <div class="timer-text" id="breathing-timer-text">3:00</div>
                </div>
                <p class="meditation-quote" id="breathing-instruction">Breathe in... hold... breathe out...</p>
                <div class="breathing-controls">
                    <button class="pause-btn" id="breathing-pause-btn" onclick="pauseBreathing()">Pause</button>
                    <button class="stop-btn" onclick="stopBreathing()">Stop</button>
                </div>
            </div>

            <button class="close-timer-btn" onclick="closeBreathingTimer()">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);
}

// Start breathing timer
window.startBreathing = function startBreathing(duration) {
    breathingTimeRemaining = duration;

    // Hide options, show timer
    const options = document.querySelector(".timer-options");
    const display = document.getElementById("breathing-display");
    const closeBtn = document.querySelector(".close-timer-btn");

    if (options) options.style.display = "none";
    if (display) display.style.display = "block";
    if (closeBtn) closeBtn.style.display = "none";

    updateBreathingDisplay();

    // Array of breathing instructions
    const breathingInstructions = [
        "Breathe in slowly through your nose... 🌬️",
        "Hold your breath gently... ⏸️",
        "Breathe out slowly through your mouth... 💨",
        "Feel your body relaxing... 🌸",
        "Focus on the rhythm of your breath... 🎵",
        "Let go of any tension... 🍃",
        "You are calm and centered... ☮️",
        "Each breath brings you peace... ✨",
        "Feel the stress melting away... 💆",
        "You're doing wonderfully! 🌟",
    ];

    let instructionIndex = 0;
    const instructionElement = document.getElementById("breathing-instruction");
    const breathingCircle = document.getElementById("breathing-circle");

    breathingTimer = setInterval(() => {
        breathingTimeRemaining--;
        updateBreathingDisplay();

        // Change instruction every 8 seconds and animate circle
        if (breathingTimeRemaining % 8 === 0 && instructionElement) {
            instructionIndex =
                (instructionIndex + 1) % breathingInstructions.length;
            instructionElement.textContent =
                breathingInstructions[instructionIndex];

            // Add breathing animation
            if (breathingCircle) {
                breathingCircle.classList.toggle("breathing-in");
            }
        }

        if (breathingTimeRemaining <= 0) {
            completeBreathing(duration);
        }
    }, 1000);
};

// Update breathing display
function updateBreathingDisplay() {
    const timerText = document.getElementById("breathing-timer-text");

    if (timerText) {
        const minutes = Math.floor(breathingTimeRemaining / 60);
        const seconds = breathingTimeRemaining % 60;
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

// Pause breathing
window.pauseBreathing = function pauseBreathing() {
    const pauseBtn = document.getElementById("breathing-pause-btn");

    if (breathingTimer) {
        clearInterval(breathingTimer);
        breathingTimer = null;
        if (pauseBtn) pauseBtn.textContent = "Resume";
        pauseBtn.onclick = resumeBreathing;
    }
};

// Resume breathing
function resumeBreathing() {
    const pauseBtn = document.getElementById("breathing-pause-btn");

    breathingTimer = setInterval(() => {
        breathingTimeRemaining--;
        updateBreathingDisplay();

        if (breathingTimeRemaining <= 0) {
            completeBreathing();
        }
    }, 1000);

    if (pauseBtn) pauseBtn.textContent = "Pause";
    pauseBtn.onclick = pauseBreathing;
}

// Stop breathing early
window.stopBreathing = function stopBreathing() {
    if (confirm("Are you sure you want to end your breathing session early?")) {
        if (breathingTimer) {
            clearInterval(breathingTimer);
            breathingTimer = null;
        }
        closeBreathingTimer();

        // Give partial benefits for incomplete session
        const originalDuration =
            parseInt(
                document
                    .querySelector("#breathing-timer-text")
                    ?.textContent?.split(":")[0] || 3,
            ) * 60;
        const timeSpent = originalDuration - breathingTimeRemaining;

        if (timeSpent >= 30) {
            // At least 30 seconds
            const minutes = Math.floor(timeSpent / 60);
            const seconds = timeSpent % 60;

            wellnessStats.stress = Math.max(
                0,
                wellnessStats.stress - Math.floor(timeSpent / 15),
            );
            wellnessStats.mindfulness = Math.min(
                100,
                wellnessStats.mindfulness + Math.floor(timeSpent / 20),
            );
            user.xp += Math.floor(timeSpent / 30);

            updateWellness("self_care");
            updateUI();
            showSelfCareMessage(
                `🌬️ Good ${timeSpent >= 60 ? minutes + "-minute" : seconds + "-second"} breathing session! You feel calmer.`,
                Math.floor(timeSpent / 30),
            );
        }
    }
};

// Complete breathing session
function completeBreathing(duration) {
    if (breathingTimer) {
        clearInterval(breathingTimer);
        breathingTimer = null;
    }

    closeBreathingTimer();

    // Calculate benefits based on duration
    const minutes = duration / 60;

    const stressReduction = Math.min(30, 10 + minutes * 2);
    const mindfulnessGain = Math.min(25, 8 + minutes * 1.5);
    const xpGain = Math.min(12, 3 + minutes);

    wellnessStats.stress = Math.max(0, wellnessStats.stress - stressReduction);
    wellnessStats.mindfulness = Math.min(
        100,
        wellnessStats.mindfulness + mindfulnessGain,
    );
    user.xp += xpGain;

    updateWellness("self_care");
    updateUI();

    const message = `🌬️ Wonderful ${minutes}-minute breathing session completed! Your mind feels calm and centered.`;
    showSelfCareMessage(message, xpGain);

    // Reschedule notifications after completing activity
    if (notificationSettings.enabled) {
        setTimeout(() => {
            scheduleSelfCareNotifications();
        }, 1000);
    }
}

// Close breathing timer modal
window.closeBreathingTimer = function closeBreathingTimer() {
    if (breathingTimer) {
        clearInterval(breathingTimer);
        breathingTimer = null;
    }

    const modal = document.querySelector(".meditation-timer-modal");
    if (modal) {
        modal.remove();
    }
};

// Show self-care completion message
function showSelfCareMessage(message, xpGain) {
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 0.5rem;">Self-Care Complete!</div>
        <div style="margin-bottom: 0.5rem;">${message}</div>
        <div style="color: #22c55e;">+${xpGain} XP for taking care of yourself!</div>
    `;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        border: 2px solid #8b5cf6;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: 300px;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = "slideIn 0.3s ease-out reverse";
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }
    }, 4000);
}

// Show daily streak modal
window.showStreakModal = function showStreakModal() {
    // Check if user has seen streak today
    const today = new Date().toDateString();
    const lastStreakView = localStorage.getItem("lastStreakView");

    if (lastStreakView === today) {
        return; // Already seen today
    }

    // Calculate days since last activity
    const lastActive = localStorage.getItem("lastActiveDate");
    const daysSinceLastActive = getDaysSince(lastActive);

    // Check rest availability
    const restData = getRestData();

    const modal = document.createElement("div");
    modal.className = "streak-modal";
    modal.innerHTML = `
        <div class="streak-modal-content">
            <h2>⚔️ Daily Streak Report</h2>
            <div class="streak-display">
                <div class="streak-number">${user.streak}</div>
                <div class="streak-label">Day Streak</div>
            </div>

            ${
                daysSinceLastActive > 0
                    ? `
                <div class="streak-warning">
                    <p>⚠️ You've been away for ${daysSinceLastActive} day${daysSinceLastActive > 1 ? "s" : ""}!</p>
                    ${getRestOptions(daysSinceLastActive, restData)}
                </div>
            `
                    : `
                <div class="streak-success">
                    <p>🔥 Keep up the momentum, adventurer!</p>
                </div>
            `
            }

            <div class="rest-status">
                <div class="rest-item">
                    <span>Short Rests Available:</span>
                    <span class="rest-count">${restData.shortRestsRemaining}/1</span>
                </div>
                <div class="rest-item">
                    <span>Long Rests Available:</span>
                    <span class="rest-count">${restData.longRestsRemaining}/1</span>
                </div>
                <div class="rest-reset">Next reset: ${getNextMonthDate()}</div>
            </div>

            <div class="streak-buttons">
                <button onclick="closeStreakModal()">Continue Adventure</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    localStorage.setItem("lastStreakView", today);
};

// Get rest options based on days missed
function getRestOptions(daysMissed, restData) {
    if (daysMissed === 1 && restData.shortRestsRemaining > 0) {
        return `
            <div class="rest-option">
                <button onclick="useShortRest()" class="rest-btn short-rest">
                    🛌 Use Short Rest
                </button>
                <p>Preserve your streak! (1 day miss)</p>
            </div>
        `;
    } else if (
        daysMissed >= 2 &&
        daysMissed <= 6 &&
        restData.longRestsRemaining > 0
    ) {
        return `
            <div class="rest-option">
                <button onclick="useLongRest()" class="rest-btn long-rest">
                    🏕️ Use Long Rest
                </button>
                <p>Restore your streak! (${daysMissed} days miss)</p>
            </div>
        `;
    } else if (daysMissed > 6) {
        return `
            <div class="rest-unavailable">
                <p>💔 Your streak has been broken. Start fresh!</p>
            </div>
        `;
    } else {
        return `
            <div class="rest-unavailable">
                <p>No rest available for this situation.</p>
            </div>
        `;
    }
}

// Rest system functions
function getRestData() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    let restData = JSON.parse(localStorage.getItem("restData") || "{}");

    // Reset if new month
    if (restData.month !== currentMonth) {
        restData = {
            month: currentMonth,
            shortRestsUsed: 0,
            longRestsUsed: 0,
        };
        localStorage.setItem("restData", JSON.stringify(restData));
    }

    return {
        shortRestsRemaining: 1 - restData.shortRestsUsed,
        longRestsRemaining: 1 - restData.longRestsUsed,
        ...restData,
    };
}

window.useShortRest = function useShortRest() {
    const restData = getRestData();
    if (restData.shortRestsRemaining > 0) {
        // Preserve streak
        const today = new Date().toDateString();
        localStorage.setItem("lastActiveDate", today);

        // Update rest data
        restData.shortRestsUsed += 1;
        localStorage.setItem(
            "restData",
            JSON.stringify({
                month: restData.month,
                shortRestsUsed: restData.shortRestsUsed,
                longRestsUsed: restData.longRestsUsed,
            }),
        );

        showSelfCareMessage("🛌 Short rest used! Your streak is preserved.", 0);
        closeStreakModal();
        updateUI();
    }
};

window.useLongRest = function useLongRest() {
    const restData = getRestData();
    if (restData.longRestsRemaining > 0) {
        // Restore streak to what it was before the break
        const today = new Date().toDateString();
        localStorage.setItem("lastActiveDate", today);

        // Update rest data
        restData.longRestsUsed += 1;
        localStorage.setItem(
            "restData",
            JSON.stringify({
                month: restData.month,
                shortRestsUsed: restData.shortRestsUsed,
                longRestsUsed: restData.longRestsUsed,
            }),
        );

        showSelfCareMessage("🏕️ Long rest used! Your streak is restored.", 0);
        closeStreakModal();
        updateUI();
    }
};

function getDaysSince(dateString) {
    if (!dateString) return 0;

    const lastDate = new Date(dateString);
    const today = new Date();
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

function getNextMonthDate() {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    return next.toLocaleDateString();
}

window.closeStreakModal = function closeStreakModal() {
    const modal = document.querySelector(".streak-modal");
    if (modal) {
        modal.remove();
    }
};

// Show wellness check-in modal
window.showWellnessCheckIn = function showWellnessCheckIn() {
    // Check if user has done a check-in today
    const today = new Date().toDateString();
    const lastCheckIn = localStorage.getItem("lastWellnessCheckIn");

    if (lastCheckIn === today) {
        return; // Already checked in today
    }

    const modal = document.createElement("div");
    modal.className = "wellness-modal";
    modal.innerHTML = `
        <div class="wellness-modal-content">
            <h2>🌟 Daily Wellness Check-In</h2>
            <p>How are you feeling today, adventurer?</p>

            <div class="wellness-checkboxes">
                <label><input type="checkbox" value="rested"> 😴 Well-rested</label>
                <label><input type="checkbox" value="energized"> ⚡ Energized</label>
                <label><input type="checkbox" value="focused"> 🎯 Focused</label>
                <label><input type="checkbox" value="stressed"> 😰 Stressed</label>
                <label><input type="checkbox" value="overwhelmed"> 🌊 Overwhelmed</label>
                <label><input type="checkbox" value="motivated"> 🔥 Motivated</label>
            </div>

            <div class="wellness-buttons">
                <button onclick="completeWellnessCheckIn()">Complete Check-In</button>
                <button onclick="skipWellnessCheckIn()">Skip for Today</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// Complete wellness check-in
window.completeWellnessCheckIn = function completeWellnessCheckIn() {
    const modal = document.querySelector(".wellness-modal");
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    const checkedValues = Array.from(checkboxes).map((cb) => cb.value);

    // Adjust wellness stats based on check-in
    if (checkedValues.includes("rested")) {
        wellnessStats.energy = Math.min(100, wellnessStats.energy + 10);
    }
    if (checkedValues.includes("energized")) {
        wellnessStats.energy = Math.min(100, wellnessStats.energy + 15);
        wellnessStats.mood = Math.min(100, wellnessStats.mood + 5);
    }
    if (checkedValues.includes("focused")) {
        wellnessStats.mindfulness = Math.min(
            100,
            wellnessStats.mindfulness + 10,
        );
    }
    if (checkedValues.includes("stressed")) {
        wellnessStats.stress = Math.min(100, wellnessStats.stress + 15);
    }
    if (checkedValues.includes("overwhelmed")) {
        wellnessStats.stress = Math.min(100, wellnessStats.stress + 20);
        wellnessStats.energy = Math.max(0, wellnessStats.energy - 10);
    }
    if (checkedValues.includes("motivated")) {
        wellnessStats.mood = Math.min(100, wellnessStats.mood + 15);
    }

    // Award XP for checking in
    user.xp += 5;

    // Save check-in date
    localStorage.setItem("lastWellnessCheckIn", new Date().toDateString());

    saveWellnessData();
    updateWellnessUI();
    updateUI();

    // Show completion message
    showSelfCareMessage(
        "Thank you for checking in! Your self-awareness helps your journey.",
        5,
    );

    modal.remove();
};

// Skip wellness check-in
window.skipWellnessCheckIn = function skipWellnessCheckIn() {
    const modal = document.querySelector(".wellness-modal");
    localStorage.setItem("lastWellnessCheckIn", new Date().toDateString());
    modal.remove();
};

document.addEventListener("DOMContentLoaded", () => {
    const hasProfile = localStorage.getItem("tv_profile");

    // Ensure initial visibility is set immediately to prevent flash
    if (splashEl) {
        splashEl.classList.remove("hidden");
        splashEl.style.display = "flex";
    }
    if (wizardEl) {
        wizardEl.classList.add("hidden");
        wizardEl.style.display = "none";
    }
    if (gameEl) {
        gameEl.classList.add("hidden");
        gameEl.style.display = "none";
    }

    // Show Step 0 of wizard, just in case it's triggered later
    if (typeof showStep === "function") {
        showStep(0);
    }

    // wire up the button click:
    const addBtn = document.getElementById("add-task-btn");
    if (addBtn) {
        addBtn.addEventListener("click", addTask);
        console.log("🖱️ add-task-btn click listener attached");
    } else {
        console.warn("⚠️ #add-task-btn not found");
    }

    // Rewire buttons AFTER DOM is ready
    setupButtonHandlers();

    // Call setupTaskInputHandlers after a short delay to ensure game interface is ready
    // Also add a fallback timeout
    const observer = new MutationObserver((mutationsList, obs) => {
        for (const mutation of mutationsList) {
            if (
                mutation.type === "attributes" &&
                mutation.attributeName === "style"
            ) {
                const gameInterface = document.getElementById("game-interface");
                if (gameInterface && gameInterface.style.display !== "none") {
                    setTimeout(() => {
                        setupTaskInputHandlers();
                    }, 500);
                    obs.disconnect(); // Stop observing once handlers are set up
                    break;
                }
            }
        }
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["style"],
        subtree: true,
    });

    // Fallback timeout to ensure handlers are set up even if observer doesn't catch it
    setTimeout(() => {
        const gameInterface = document.getElementById("game-interface");
        if (gameInterface && gameInterface.style.display !== "none") {
            setupTaskInputHandlers();
        }
    }, 2000);
});

// Hook up the Reset-Wizard dev button
document.getElementById("reset-wizard").addEventListener("click", () => {
    localStorage.removeItem("tv_profile");
    // reset visibility back to splash
    splashEl.classList.remove("hidden");
    wizardEl.classList.add("hidden");
    gameEl.classList.add("hidden");
});

function setupButtonHandlers() {
    const playBtn = document.getElementById("play-button");
    const resetBtn = document.getElementById("reset-wizard");

    playBtn?.addEventListener("click", () => {
        if (splashEl) {
            splashEl.classList.add("hidden");
            splashEl.style.display = "none";
        }

        if (!localStorage.getItem("tv_profile")) {
            if (wizardEl) {
                wizardEl.classList.remove("hidden");
                wizardEl.style.display = "flex";
            }
        } else {
            enterApp();
        }
    });

    resetBtn?.addEventListener("click", () => {
        localStorage.removeItem("tv_profile");
        if (splashEl) {
            splashEl.classList.remove("hidden");
            splashEl.style.display = "flex";
        }
        if (wizardEl) {
            wizardEl.classList.add("hidden");
            wizardEl.style.display = "none";
        }
        if (gameEl) {
            gameEl.classList.add("hidden");
            gameEl.style.display = "none";
        }
        alert("✅ Wizard has been reset. Press PLAY to start over.");
    });
}

// User data
let user = {
    xp: 0,
    level: 1,
    streak: 0,
    cards: [],
    tasks: [],
    inventory: [],
    questItems: [],
    coins: 0,
    restToken: false,
    lastActiveDate: null,
    avatar: {
        armor: "",
        weapon: "",
        cape: "",
    },
};

// Game state
let gameStarted = false;

// Load user data from localStorage
window.loadUserData = function loadUserData() {
    const savedData = localStorage.getItem("taskventureData");
    if (savedData) {
        user = JSON.parse(savedData);
    } else {
        // Add default starter quests for new users
        user.tasks = [
            {
                id: Date.now() + 1,
                text: "Explore the TaskVenture interface",
                completed: false,
                createdAt: new Date().toISOString(),
            },
            {
                id: Date.now() + 2,
                text: "Complete your first quest to earn XP",
                completed: false,
                createdAt: new Date().toISOString(),
            },
            {
                id: Date.now() + 3,
                text: "Roll the dice for luck and bonus rewards",
                completed: false,
                createdAt: new Date().toISOString(),
            },
            {
                id: Date.now() + 4,
                text: "View your card collection",
                completed: false,
                createdAt: new Date().toISOString(),
            },
            {
                id: Date.now() + 5,
                text: "Add your own custom quest",
                completed: false,
                createdAt: new Date().toISOString(),
            },
            {
                id: Date.now() + 6,
                text: "Customize your adventurer avatar",
                completed: false,
                createdAt: new Date().toISOString(),
            },
        ];
    }

    // Initialize avatar object if it doesn't exist
    if (!user.avatar) {
        user.avatar = {
            armor: "",
            weapon: "",
            cape: "",
        };
    }

    // Initialize wellness system
    loadWellnessData();
};

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem("taskventureData", JSON.stringify(user));
}

// Update UI elements
function updateUI() {
    // Update character info
    const profile = JSON.parse(localStorage.getItem("tv_profile") || "{}");
    const characterName = document.getElementById("character-name");
    const characterRace = document.getElementById("character-race");
    const characterClass = document.getElementById("character-class");

    if (characterName && profile.name) characterName.textContent = profile.name;
    if (characterRace && profile.race) characterRace.textContent = profile.race;
    if (characterClass && profile.class)
        characterClass.textContent = profile.class;

    // Update avatar display to reflect any profile changes
    updateAvatarDisplay();

    // Update header avatar (ensures data-race is set for scaling)
    TV_AVATAR.setHeaderAvatar(profile.race, profile.gender);

    // Update level and XP with null checks
    const userLevel = document.getElementById("user-level");
    const userXP = document.getElementById("user-xp");
    const userStreak = document.getElementById("user-streak");
    const cardCount = document.getElementById("card-count");

    if (userLevel) userLevel.textContent = user.level;
    if (userXP) userXP.textContent = user.xp;
    if (userStreak) userStreak.textContent = user.streak;
    if (cardCount) cardCount.textContent = user.cards.length;

    // Update XP bar
    const xpForCurrentLevel = getXPForLevel(user.level);
    const xpForNextLevel = getXPForLevel(user.level + 1);
    const xpProgress = (user.xp / xpForNextLevel) * 100;

    const xpFill = document.getElementById("xp-fill");
    const xpNextLevel = document.getElementById("xp-next-level");

    if (xpFill) xpFill.style.width = `${Math.min(xpProgress, 100)}%`;
    if (xpNextLevel) xpNextLevel.textContent = xpForNextLevel;

    // Update currency display - convert total coins to different denominations
    const totalCoins = user.coins || 0;
    console.log(`💰 Main app coin display update: ${totalCoins} total coins`);
    const platinum = Math.floor(totalCoins / 1000);
    const gold = Math.floor((totalCoins % 1000) / 100);
    const silver = Math.floor((totalCoins % 100) / 10);
    const copper = totalCoins % 10;

    const platinumElement = document.getElementById("platinum-coins");
    const goldElement = document.getElementById("gold-coins");
    const silverElement = document.getElementById("silver-coins");
    const copperElement = document.getElementById("copper-coins");

    if (platinumElement) platinumElement.textContent = platinum;
    if (goldElement) goldElement.textContent = gold;
    if (silverElement) silverElement.textContent = silver;
    if (copperElement) copperElement.textContent = copper;

    // Check for level up with new system
    if (checkLevelUp(user)) {
        showLevelUpMessage();
    }

    renderTasks();
    renderCollection();
    saveUserData();
}

// Add a new task
function addTask() {
    console.log("🎯 addTask function called");

    // First, ensure we're on the tasks page
    const tasksPage = document.getElementById("tasks-page");
    if (!tasksPage || !tasksPage.classList.contains("active")) {
        console.log("📍 Not on tasks page, switching to it first");
        const tasksNavButton = document.querySelector(
            '.nav-item[onclick*="tasks-page"]',
        );
        if (tasksNavButton) {
            tasksNavButton.click();
        }
        // Wait a moment for the page to switch, then try again
        setTimeout(() => {
            addTask();
        }, 100);
        return;
    }

    let taskInput = document.getElementById("task-input");
    console.log("🔍 Looking for task input element...");
    console.log("📍 Task input found:", !!taskInput);
    console.log("📍 Current page:", document.querySelector(".page.active")?.id);

    // If input not found, try multiple fallback methods
    if (!taskInput) {
        console.log("🔄 Trying fallback methods to find input...");

        // Method 1: Look for any text input with quest-related placeholder
        const allInputs = document.querySelectorAll('input[type="text"]');
        taskInput = Array.from(allInputs).find(
            (input) =>
                input.placeholder &&
                (input.placeholder.toLowerCase().includes("quest") ||
                    input.placeholder.toLowerCase().includes("task")),
        );

        if (taskInput) {
            console.log("📍 Found input via placeholder search");
        } else {
            // Method 2: Look within the task section specifically
            const taskSection = document.querySelector(".task-section");
            if (taskSection) {
                taskInput = taskSection.querySelector('input[type="text"]');
                if (taskInput) {
                    console.log("📍 Found input within task section");
                }
            }
        }

        // Method 3: Look for any input in the active page
        if (!taskInput) {
            const activePage = document.querySelector(".page.active");
            if (activePage) {
                taskInput = activePage.querySelector('input[type="text"]');
                if (taskInput) {
                    console.log("📍 Found input in active page");
                }
            }
        }
    }

    if (!taskInput) {
        console.error("❌ Task input element not found after all attempts");
        alert(
            "Error: Task input not found. Please refresh the page and try again.",
        );
        return;
    }

    // Ensure the input element is valid and accessible
    try {
        const taskText = taskInput.value.trim();
        console.log("📝 Task text:", taskText);

        if (taskText === "") {
            alert("Please enter a quest!");
            taskInput.focus(); // Focus the input to help user
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        user.tasks.push(task);
        taskInput.value = "";
        updateUI();

        console.log("✅ Task added successfully:", task);

        // Show success feedback
        taskInput.placeholder = "Quest added! Enter another...";
        setTimeout(() => {
            if (taskInput) {
                taskInput.placeholder = "Enter a new quest…";
            }
        }, 2000);
    } catch (error) {
        console.error("❌ Error processing task input:", error);
        alert("Error adding quest. Please try again.");
    }
}

// Make addTask globally available
window.addTask = addTask;

// Complete a task
function completeTask(taskId) {
    const taskIndex = user.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) return;

    const task = user.tasks[taskIndex];
    const xpGained = calculateXPReward(task);
    const card = drawCard();

    // Update user stats
    user.xp += xpGained;
    user.streak += 1;
    user.cards.push(card);

    // Remove completed task
    user.tasks.splice(taskIndex, 1);

    // 🎉 Reward feedback
    fireConfetti();
    playSuccessChime();

    // Show reward modal
    showRewardModal(task.text, xpGained, card);

    updateUI();
}

// Draw a random card
function drawCard() {
    return drawRandomCard();
}

// Show reward modal
function showRewardModal(taskText, xpGained, card) {
    const modal = document.getElementById("reward-modal");
    const rewardDetails = document.getElementById("reward-details");
    const newCardDiv = document.getElementById("new-card");

    rewardDetails.innerHTML = `
        <p><strong>Quest Completed:</strong> "${taskText}"</p>
        <p><strong>XP Gained:</strong> +${xpGained}</p>
        <p><strong>Streak:</strong> ${user.streak} days</p>
    `;

    newCardDiv.innerHTML = `
        <div class="card ${card.rarity.toLowerCase()}">
            ${card.image ? `<img src="${card.image}" alt="${card.name}" class="card-image">` : ""}
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity}</div>
            <div class="card-effect">${card.effect}</div>
        </div>
    `;

    modal.classList.remove("hidden");
}

// Close reward modal
function closeRewardModal() {
    document.getElementById("reward-modal").classList.add("hidden");
}

// Render tasks
function renderTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    user.tasks.forEach((task) => {
        const taskItem = document.createElement("li");
        taskItem.className = "task-item";
        taskItem.dataset.id = String(task.id);
        taskItem.setAttribute("draggable", "true");
        taskItem.innerHTML = `
            <span class="task-text">${task.text}</span>
            <button class="complete-btn" onclick="completeTask(${task.id})">Complete Quest</button>
        `;
        taskList.appendChild(taskItem);
    });

    // Enable drag and drop reordering
    enableDragReorder(taskList);
}

// Page navigation
function showPage(pageId, navElement) {
    // 1) Hide all pages
    document
        .querySelectorAll(".page")
        .forEach((p) => p.classList.remove("active"));

    // 2) Show selected page
    document.getElementById(pageId).classList.add("active");

    // 3) Update nav buttons
    document
        .querySelectorAll(".nav-item")
        .forEach((n) => n.classList.remove("active"));
    navElement.classList.add("active");

    // 4) If it's the Avatar tab, re-apply saved gear and remove any headers
    if (pageId === "avatar-page") {
        if (typeof updateAvatarDisplay === "function") {
            updateAvatarDisplay();
        }

        // Aggressive header removal - run multiple times to catch dynamic content
        const removeHeaders = () => {
            const avatarPage = document.getElementById('avatar-page');
            const avatarSection = document.querySelector('.avatar-section');
            
            [avatarPage, avatarSection, document.body].forEach(container => {
                if (container) {
                    // Remove any headers with problematic text
                    const allHeaders = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    allHeaders.forEach(header => {
                        const text = header.textContent || '';
                        if (text.includes('Customize') || 
                            text.includes('Adventurer') ||
                            text.includes('Avatar') ||
                            text.includes('Your Avatar') ||
                            text.includes('Character Avatar')) {
                            header.remove();
                            console.log('Removed header:', text);
                        }
                    });
                    
                    // Also remove any divs or spans that might contain the text
                    const allElements = container.querySelectorAll('div, span, p');
                    allElements.forEach(el => {
                        const text = el.textContent || '';
                        if (text.trim() === 'Customize Your Adventurer' || 
                            text.trim() === 'Customize Your Avatar' ||
                            text.trim() === 'Avatar Customization') {
                            el.remove();
                            console.log('Removed element:', text);
                        }
                    });
                }
            });
        };

        // Run immediately and with delays to catch any dynamically added content
        removeHeaders();
        setTimeout(removeHeaders, 50);
        setTimeout(removeHeaders, 150);
        setTimeout(removeHeaders, 300);
    }
}

// Render card collection
function renderCollection() {
    const collectionGrid = document.getElementById("collection-grid");
    collectionGrid.innerHTML = "";

    user.cards.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.className = `card ${card.rarity.toLowerCase()}`;
        cardElement.innerHTML = `
            ${card.image ? `<img src="${card.image}" alt="${card.name}" class="card-image">` : ""}
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity}</div>
            <div class="card-effect">${card.effect}</div>
            <div class="card-actions">
                <button class="card-delete-btn" onclick="deleteCard(${index})" title="Delete Card">🗑️</button>
            </div>
        `;

        // Add click listener for detailed view
        cardElement.addEventListener("click", (e) => {
            // Don't show modal if clicking delete button
            if (!e.target.classList.contains("card-delete-btn")) {
                showCardDetails(card);
            }
        });

        collectionGrid.appendChild(cardElement);
    });
}

// Delete a card from collection
function deleteCard(cardIndex) {
    if (
        confirm(
            "Are you sure you want to discard this card? This action cannot be undone.",
        )
    ) {
        user.cards.splice(cardIndex, 1);
        updateUI();
        showSelfCareMessage("Card discarded successfully.", 0);
    }
}

// Show detailed card view
function showCardDetails(card) {
    const modal = document.createElement("div");
    modal.className = "card-details-modal";
    modal.innerHTML = `
        <div class="card-details-content">
            <div class="card-details-header">
                <h2>${card.name}</h2>
                <button class="close-btn" onclick="closeCardDetails()">&times;</button>
            </div>
            <div class="card-details-body">
                <div class="card-details-image">
                    ${card.image ? `<img src="${card.image}" alt="${card.name}">` : '<div class="no-image">No Image</div>'}
                </div>
                <div class="card-details-info">
                    <div class="detail-item">
                        <strong>Rarity:</strong> 
                        <span class="rarity-badge ${card.rarity.toLowerCase()}">${card.rarity}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Type:</strong> ${card.type || "Unknown"}
                    </div>
                    <div class="detail-item">
                        <strong>Effect:</strong>
                        <p class="card-effect-full">${card.effect}</p>
                    </div>
                    ${
                        card.description
                            ? `
                        <div class="detail-item">
                            <strong>Description:</strong>
                            <p class="card-description">${card.description}</p>
                        </div>
                    `
                            : ""
                    }
                </div>
            </div>
            <div class="card-details-footer">
                <button class="discard-btn" onclick="deleteCardFromModal('${card.id || card.name}')">Discard Card</button>
                <button class="close-modal-btn" onclick="closeCardDetails()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeCardDetails();
        }
    });
}

// Close card details modal
function closeCardDetails() {
    const modal = document.querySelector(".card-details-modal");
    if (modal) {
        modal.remove();
    }
}

// Delete card from modal
function deleteCardFromModal(cardId) {
    const cardIndex = user.cards.findIndex(
        (card) => (card.id || card.name) === cardId,
    );
    if (cardIndex !== -1) {
        if (
            confirm(
                "Are you sure you want to discard this card? This action cannot be undone.",
            )
        ) {
            user.cards.splice(cardIndex, 1);
            updateUI();
            closeCardDetails();
            showSelfCareMessage("Card discarded successfully.", 0);
        }
    }
}

// Make functions globally available
window.deleteCard = deleteCard;
window.showCardDetails = showCardDetails;
window.closeCardDetails = closeCardDetails;
window.deleteCardFromModal = deleteCardFromModal;

// Show level up message
function showLevelUpMessage() {
    alert(`🎉 Level Up! You are now level ${user.level}!`);
}

// Initialize avatar customization
function initializeAvatarCustomization() {
    // Ensure base avatar is visible and set to correct image
    const baseAvatar = document.getElementById("avatar-base");
    if (baseAvatar) {
        baseAvatar.src = getBaseAvatarImage();
        baseAvatar.style.display = "block";
        baseAvatar.onerror = function () {
            console.error(
                "Base avatar image failed to load, falling back to default",
            );
            this.src = "images/base_avatar.png";
        };
        baseAvatar.onload = function () {
            console.log("Base avatar image loaded successfully");
        };
    }

    // Load saved avatar state
    document.getElementById("armor-select").value = user.avatar.armor;
    document.getElementById("weapon-select").value = user.avatar.weapon;
    document.getElementById("cape-select").value = user.avatar.cape;

    updateAvatarDisplay();

    // Add event listeners for avatar customization
    document
        .getElementById("armor-select")
        .addEventListener("change", function () {
            user.avatar.armor = this.value;
            updateAvatarDisplay();
            saveUserData();
        });

    document
        .getElementById("weapon-select")
        .addEventListener("change", function () {
            user.avatar.weapon = this.value;
            updateAvatarDisplay();
            saveUserData();
        });

    document
        .getElementById("cape-select")
        .addEventListener("change", function () {
            user.avatar.cape = this.value;
            updateAvatarDisplay();
            saveUserData();
        });
}

const TV_AVATAR = (() => {
    const BASE_DIR = "images/Avatar bases";
    const FALLBACK = "images/base_avatar.png";

    const RACE_DISPLAY = {
        dragonborn: "Dragonborn",
        dwarf: "Dwarf",
        elf: "Elf",
        gnome: "Gnome",
        "half-elf": "Half-Elf",
        "half orc": "Half-Orc", // tolerate a space variant
        "half-orc": "Half-Orc",
        halfling: "Halfling",
        human: "Human",
        tiefling: "Tiefling",
    };
    const GENDER_TITLE = {
        male: "Male",
        female: "Female",
        "non-binary": "Enby",
        enby: "Enby",
    };

    function readProfile() {
        try {
            return JSON.parse(localStorage.getItem("tv_profile") || "{}");
        } catch {
            return {};
        }
    }
    function saveProfile(next) {
        const current = readProfile();
        const merged = { ...current, ...next };
        localStorage.setItem("tv_profile", JSON.stringify(merged));
        return merged;
    }
    function buildAvatarSrc(race, gender) {
        const rk = String(race || "")
            .trim()
            .toLowerCase();
        const gk = String(gender || "")
            .trim()
            .toLowerCase();
        const rd = RACE_DISPLAY[rk],
            gt = GENDER_TITLE[gk];
        if (!rd || !gt) return FALLBACK;
        const fileName = `${rd} ${gt}.png`;
        const encodedDir = BASE_DIR.replace(/ /g, "%20");
        const encodedFile = encodeURIComponent(fileName);
        return `${encodedDir}/${encodedFile}`;
    }
    function getBaseAvatarImage() {
        const p = readProfile();
        return buildAvatarSrc(p.race, p.gender);
    }
    function setHeaderAvatar(race, gender) {
        const wrap = document.getElementById("header-avatar-container");
        const img = document.getElementById("header-avatar");
        if (!wrap || !img)
            return console.warn("[Avatar] Header elements missing.");

        const src = buildAvatarSrc(race, gender);
        const rk = String(race || "")
            .trim()
            .toLowerCase();
        const gk = String(gender || "")
            .trim()
            .toLowerCase();

        wrap.dataset.race = RACE_DISPLAY[rk] ? rk : "";
        wrap.dataset.gender = GENDER_TITLE[gk] ? gk : "";

        const raceText = RACE_DISPLAY[rk] || "Adventurer";
        const genderText = GENDER_TITLE[gk] || "";
        img.alt = genderText
            ? `${raceText} ${genderText} avatar`
            : `${raceText} avatar`;

        const test = new Image();
        test.onload = () => {
            img.src = src;
        };
        test.onerror = () => {
            img.src = FALLBACK;
        };
        test.src = src;
    }
    function applyHeaderFromProfile() {
        const p = readProfile();
        if (p.race && p.gender) setHeaderAvatar(p.race, p.gender);
        else {
            const wrap = document.getElementById("header-avatar-container");
            const img = document.getElementById("header-avatar");
            if (wrap) {
                wrap.dataset.race = "";
                wrap.dataset.gender = "";
            }
            if (img) {
                img.src = FALLBACK;
                img.alt = "Default avatar";
            }
        }
    }
    function setProfileAndHeader(race, gender) {
        const rk = String(race || "")
            .trim()
            .toLowerCase();
        const gk = String(gender || "")
            .trim()
            .toLowerCase();
        const next = {};
        if (RACE_DISPLAY[rk]) next.race = rk;
        if (GENDER_TITLE[gk]) next.gender = gk;
        const saved = saveProfile(next);
        setHeaderAvatar(saved.race, saved.gender);
    }

    return {
        buildAvatarSrc,
        getBaseAvatarImage,
        setHeaderAvatar,
        applyHeaderFromProfile,
        setProfileAndHeader,
    };
})();

// Expose avatar helpers globally
window.setHeaderAvatar = TV_AVATAR.setHeaderAvatar;
window.applyHeaderFromProfile = TV_AVATAR.applyHeaderFromProfile;
window.setProfileAndHeader = TV_AVATAR.setProfileAndHeader;
window.getBaseAvatarImage = TV_AVATAR.getBaseAvatarImage;

/* ---------- Avatar Customization (Avatar page layered assets) ---------- */
function initializeAvatarCustomization() {
    const baseAvatar = document.getElementById("avatar-base");
    if (baseAvatar) {
        baseAvatar.src = getBaseAvatarImage();
        baseAvatar.style.display = "block";
        baseAvatar.onerror = function () {
            this.src = "images/base_avatar.png";
        };
    }

    const armorSel = document.getElementById("armor-select");
    const weaponSel = document.getElementById("weapon-select");
    const capeSel = document.getElementById("cape-select");

    if (armorSel) armorSel.value = user.avatar.armor;
    if (weaponSel) weaponSel.value = user.avatar.weapon;
    if (capeSel) capeSel.value = user.avatar.cape;

    updateAvatarDisplay();

    armorSel?.addEventListener("change", function () {
        user.avatar.armor = this.value;
        updateAvatarDisplay();
        saveUserData();
    });
    weaponSel?.addEventListener("change", function () {
        user.avatar.weapon = this.value;
        updateAvatarDisplay();
        saveUserData();
    });
    capeSel?.addEventListener("change", function () {
        user.avatar.cape = this.value;
        updateAvatarDisplay();
        saveUserData();
    });
}

function updateAvatarDisplay() {
    const baseImg = document.getElementById("avatar-base");
    const armorImg = document.getElementById("avatar-armor");
    const weaponImg = document.getElementById("avatar-weapon");
    const capeImg = document.getElementById("avatar-cape");

    if (baseImg) baseImg.src = getBaseAvatarImage();

    if (armorImg) {
        if (user.avatar.armor) {
            armorImg.src = user.avatar.armor;
            armorImg.style.display = "block";
        } else {
            armorImg.style.display = "none";
        }
    }
    if (weaponImg) {
        if (user.avatar.weapon) {
            weaponImg.src = user.avatar.weapon;
            weaponImg.style.display = "block";
        } else {
            weaponImg.style.display = "none";
        }
    }
    if (capeImg) {
        if (user.avatar.cape) {
            capeImg.src = user.avatar.cape;
            capeImg.style.display = "block";
        } else {
            capeImg.style.display = "none";
        }
    }
}

function setupHeaderAvatarLayout() {
    const header = document.querySelector("header.header");
    const stats = document.querySelector(".stats-container");
    // the big panel on the Tasks page
    const panel = document.querySelector("#tasks-page .task-section");

    if (!header) return;

    const apply = () => {
        const h = header.getBoundingClientRect();
        const s = stats?.getBoundingClientRect();
        const p = panel?.getBoundingClientRect();

        const safeTop = s ? Math.max(0, s.bottom - h.top + 6) : 6;
        const safeBottom = p ? Math.max(0, h.bottom - p.top + 6) : 6;

        header.style.setProperty("--safe-top", safeTop + "px");
        header.style.setProperty("--safe-bottom", safeBottom + "px");
    };

    apply();
    window.addEventListener("resize", apply);
    if (window.ResizeObserver && stats)
        new ResizeObserver(apply).observe(stats);
    if (window.ResizeObserver && panel)
        new ResizeObserver(apply).observe(panel);
}

// Call it when the app shows the game UI
document.addEventListener("DOMContentLoaded", () => {
    // If you already call enterApp(), also call this after you show the game interface:
    setupHeaderAvatarLayout();
});

// Also call after page switches (so it picks the active panel’s top)
// If you have a showPage function, add:
const _origShowPage = window.showPage;
window.showPage = function (pageId, nav) {
    _origShowPage?.call(this, pageId, nav);
    // Wait a tick for layout to settle
    setTimeout(setupHeaderAvatarLayout, 0);
};

// And after updateUI (stats bar can change size)
const _origUpdateUI = window.updateUI;
window.updateUI = function () {
    _origUpdateUI?.call(this);
    setTimeout(setupHeaderAvatarLayout, 0);
};

// Allow Enter key to add tasks and set up button handler
document.addEventListener("DOMContentLoaded", function () {
    // Initialize avatar customization when DOM is loaded
    setTimeout(initializeAvatarCustomization, 100);
});

// Set up task input handlers when the game interface becomes visible
function setupTaskInputHandlers() {
    console.log("Setting up task input handlers...");

    // Wait for elements to be available with retry mechanism
    let retryCount = 0;
    const maxRetries = 10;

    function trySetupHandlers() {
        let taskInput = document.getElementById("task-input");
        let addTaskBtn = document.getElementById("add-task-btn");

        console.log(
            `Attempt ${retryCount + 1}: Task input found:`,
            !!taskInput,
            "Button found:",
            !!addTaskBtn,
        );

        // If not found by ID, try alternative methods
        if (!taskInput) {
            const allInputs = document.querySelectorAll('input[type="text"]');
            taskInput = Array.from(allInputs).find(
                (input) =>
                    input.placeholder &&
                    input.placeholder.toLowerCase().includes("quest"),
            );
            if (taskInput) {
                console.log("📍 Found task input via placeholder search");
            }
        }

        if (!addTaskBtn) {
            const allButtons = document.querySelectorAll("button");
            addTaskBtn = Array.from(allButtons).find(
                (btn) =>
                    btn.textContent &&
                    btn.textContent.toLowerCase().includes("add quest"),
            );
            if (addTaskBtn) {
                console.log("📍 Found add button via text search");
            }
        }

        if (taskInput && addTaskBtn) {
            try {
                // Remove any existing event listeners to prevent duplicates
                taskInput.removeEventListener(
                    "keypress",
                    handleTaskInputKeypress,
                );
                taskInput.addEventListener("keypress", handleTaskInputKeypress);
                console.log("✅ Task input keypress listener added");

                addTaskBtn.removeEventListener("click", addTask);
                addTaskBtn.addEventListener("click", addTask);
                console.log("✅ Add task button click listener added");

                // Test the elements work
                if (typeof taskInput.value === "string" && addTaskBtn.click) {
                    console.log("✅ Elements are functional");
                    window.taskHandlersReady = true;
                    return true;
                } else {
                    console.warn("⚠️ Elements found but not functional");
                }
            } catch (error) {
                console.error("❌ Error setting up handlers:", error);
            }
        }

        retryCount++;
        if (retryCount < maxRetries) {
            console.log(
                `⏳ Retrying handler setup (${retryCount}/${maxRetries})...`,
            );
            setTimeout(trySetupHandlers, 300);
        } else {
            console.error(
                "❌ Failed to set up task handlers after maximum retries",
            );

            // Final attempt: Set up a global click listener as fallback
            document.addEventListener("click", function (e) {
                if (
                    e.target &&
                    e.target.textContent &&
                    e.target.textContent.includes("Add Quest")
                ) {
                    console.log(
                        "🎯 Fallback: Global click detected on Add Quest button",
                    );
                    e.preventDefault();
                    addTask();
                }
            });
            console.log("🔄 Set up fallback global click listener");
        }
    }

    trySetupHandlers();
}

// Separate function for keypress handling
function handleTaskInputKeypress(e) {
    if (e.key === "Enter") {
        addTask();
    }
}

// Debug function to check current state
window.debugTaskInput = function () {
    console.log("=== TASK INPUT DEBUG ===");
    console.log("Current page:", document.querySelector(".page.active")?.id);
    console.log("Task input by ID:", !!document.getElementById("task-input"));
    console.log("Add button by ID:", !!document.getElementById("add-task-btn"));
    console.log(
        "All text inputs:",
        document.querySelectorAll('input[type="text"]').length,
    );
    console.log(
        'All buttons with "Add":',
        Array.from(document.querySelectorAll("button")).filter((b) =>
            b.textContent.includes("Add"),
        ).length,
    );
    console.log("Task handlers ready:", window.taskHandlersReady);
    console.log("User object exists:", !!window.user);
    console.log("Current tasks count:", window.user?.tasks?.length || 0);

    const taskInput = document.getElementById("task-input");
    if (taskInput) {
        console.log("Task input value access test:", typeof taskInput.value);
        try {
            console.log("Current input value:", taskInput.value);
        } catch (e) {
            console.error("Error accessing input value:", e);
        }
    }
    console.log("=== END DEBUG ===");
};

function enterApp() {
    const gameEl = document.getElementById("game-interface");
    const splashEl = document.getElementById("splash-screen");
    const wizardEl = document.getElementById("wizard");

    if (splashEl) {
        splashEl.classList.add("hidden");
        splashEl.style.display = "none";
    }
    if (wizardEl) {
        wizardEl.classList.add("hidden");
        wizardEl.style.display = "none";
    }
    if (gameEl) {
        gameEl.classList.remove("hidden");
        gameEl.style.display = "block";
    }

    const profile = JSON.parse(localStorage.getItem("tv_profile"));
    if (profile) {
        console.log("🗡️ Loaded profile into app:", profile);
        if (typeof renderSheet === "function") {
            renderSheet(profile);
        }
    } else {
        console.warn("⚠️ No profile found!");
    }

    // Compute avatar safe area once the UI is visible
    setupHeaderAvatarLayout();

    // Load full game state
    loadUserData();
    updateUI();

    // Initialize notifications
    initializeNotifications();

    // Show streak modal first, then wellness check-in
    setTimeout(() => {
        showStreakModal();
    }, 500);

    setTimeout(() => {
        showWellnessCheckIn();
    }, 2000);
}

// ---- Drag & Drop Reorder ----
function persistTaskOrderFromDOM(listEl) {
    const ids = Array.from(listEl.children).map((li) => li.dataset.id);
    // Reorder user.tasks to match the DOM order
    const reorderedTasks = [];
    ids.forEach((id) => {
        const task = user.tasks.find((t) => String(t.id) === id);
        if (task) reorderedTasks.push(task);
    });
    user.tasks = reorderedTasks;
    saveUserData();
}

function enableDragReorder(listEl) {
    if (!listEl) return;

    let draggingEl = null;
    let dropMarker = document.createElement("li");
    dropMarker.className = "task-item drop-marker";
    dropMarker.style.height = "0";

    listEl.addEventListener("dragstart", (e) => {
        const li = e.target.closest(".task-item");
        if (!li) return;
        draggingEl = li;
        li.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", li.dataset.id || "");
    });

    listEl.addEventListener("dragend", () => {
        if (draggingEl) draggingEl.classList.remove("dragging");
        draggingEl = null;
        dropMarker.remove();
        persistTaskOrderFromDOM(listEl);
    });

    listEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        const after = getDragAfterElement(listEl, e.clientY);
        if (!after) {
            listEl.appendChild(dropMarker);
        } else {
            listEl.insertBefore(dropMarker, after);
        }
    });

    listEl.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!draggingEl) return;
        const after = getDragAfterElement(listEl, e.clientY);
        if (!after) {
            listEl.appendChild(draggingEl);
        } else {
            listEl.insertBefore(draggingEl, after);
        }
        persistTaskOrderFromDOM(listEl);
    });
}

function getDragAfterElement(container, y) {
    const items = [
        ...container.querySelectorAll(
            ".task-item:not(.dragging):not(.drop-marker)",
        ),
    ];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    for (const child of items) {
        const box = child.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);
        if (offset < 0 && offset > closest.offset) {
            closest = { offset, element: child };
        }
    }
    return closest.element;
}

// ---- Confetti ----
let _confettiCanvas, _confettiCtx, _confettiRAF;

function fireConfetti(bursts = 180) {
    if (!_confettiCanvas) {
        _confettiCanvas = document.getElementById("confetti-canvas");
        if (!_confettiCanvas) return;
        _confettiCtx = _confettiCanvas.getContext("2d");
        const resize = () => {
            _confettiCanvas.width = window.innerWidth;
            _confettiCanvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();
    }

    const particles = [];
    const colors = [
        "#ffd166",
        "#06d6a0",
        "#118ab2",
        "#ef476f",
        "#8338ec",
        "#d4af37",
    ];
    const cx = _confettiCanvas.width / 2;
    const cy = _confettiCanvas.height / 3;

    for (let i = 0; i < bursts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 6;
        particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 6,
            g: 0.25 + Math.random() * 0.2,
            size: 2 + Math.random() * 3,
            life: 60 + Math.random() * 40,
            color: colors[(Math.random() * colors.length) | 0],
            spin: (Math.random() - 0.5) * 0.2,
            angle: Math.random() * Math.PI,
        });
    }

    cancelAnimationFrame(_confettiRAF);
    const draw = () => {
        _confettiCtx.clearRect(
            0,
            0,
            _confettiCanvas.width,
            _confettiCanvas.height,
        );
        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.g;
            p.angle += p.spin;
            p.life--;
            _confettiCtx.save();
            _confettiCtx.translate(p.x, p.y);
            _confettiCtx.rotate(p.angle);
            _confettiCtx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
            _confettiCtx.restore();
        });
        for (let i = particles.length - 1; i >= 0; i--) {
            if (
                particles[i].life <= 0 ||
                particles[i].y > _confettiCanvas.height + 20
            ) {
                particles.splice(i, 1);
            }
        }
        if (particles.length) {
            _confettiRAF = requestAnimationFrame(draw);
        } else {
            _confettiCtx.clearRect(
                0,
                0,
                _confettiCanvas.width,
                _confettiCanvas.height,
            );
        }
    };
    draw();
}

// ---- Success Chime (Web Audio) ----
function playSuccessChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        function beep(freq, start, dur = 0.12, type = "sine") {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, now + start);
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.0001, now + start);
            g.gain.exponentialRampToValueAtTime(0.15, now + start + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
            o.start(now + start);
            o.stop(now + start + dur + 0.05);
        }

        // Simple ascending triad
        beep(523.25, 0.0, 0.12, "triangle"); // C5
        beep(659.25, 0.12, 0.12, "triangle"); // E5
        beep(783.99, 0.24, 0.16, "triangle"); // G5
    } catch (error) {
        console.log("Audio context not available for success chime");
    }
}

// ---- PWA: register service worker ----
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => console.log("TaskVenture SW registered:", reg))
        .catch(console.error);
}

// ---- PWA: Add to Home Screen prompt ----
let _deferredPrompt = null;
const installBtn = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
});

if (installBtn) {
    installBtn.addEventListener("click", async () => {
        if (!_deferredPrompt) return;
        installBtn.disabled = true;
        _deferredPrompt.prompt();
        const { outcome } = await _deferredPrompt.userChoice;
        _deferredPrompt = null;
        installBtn.hidden = true;
        installBtn.disabled = false;
        if (outcome === "accepted") {
            showSelfCareMessage(
                "📱 TaskVenture installed! You can now access it from your home screen.",
                0,
            );
        }
    });
}

window.addEventListener("load", () => {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;

    // Ensure splash is visible and properly styled
    splash.style.opacity = 1;
    splash.style.display = "flex";
    splash.classList.add("visible");
});