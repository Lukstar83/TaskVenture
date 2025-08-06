// app.js

// Ensure initial visibility is set immediately to prevent flash
document.documentElement.style.setProperty('--initial-load', 'true');

const splashEl = document.getElementById('splash-screen');
const wizardEl = document.getElementById('wizard');
const gameEl   = document.getElementById('game-interface');

// Immediately hide game interface to prevent flash
if (gameEl) gameEl.style.display = 'none';
if (wizardEl) wizardEl.style.display = 'none';

// auto-launch wizard on fresh load if no profile

// Import Capacitor plugins for notifications
let LocalNotifications;
let notificationsEnabled = false;

// Initialize notifications
async function initializeNotifications() {
    try {
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            const { LocalNotifications: LN } = await import('@capacitor/local-notifications');
            LocalNotifications = LN;

            // Request permission
            const permission = await LocalNotifications.requestPermissions();
            notificationsEnabled = permission.display === 'granted';

            if (notificationsEnabled) {
                console.log('✅ Notifications enabled');
            } else {
                console.log('❌ Notifications permission denied');
            }
        }
    } catch (error) {
        console.warn('Notifications not available:', error);
    }
}

// Wellness system
let wellnessStats = {
    stress: 0,
    energy: 100,
    mood: 75,
    mindfulness: 50
};

// Notification settings
let notificationSettings = {
    enabled: false,
    frequency: 120, // minutes
    quietHours: {
        start: 22, // 10 PM
        end: 7     // 7 AM
    },
    activities: {
        hydrate: true,
        breathe: true,
        rest: true,
        walk: true,
        meditate: true,
        journal: true
    }
};

// Load wellness data
function loadWellnessData() {
    const savedWellness = localStorage.getItem('taskventureWellness');
    if (savedWellness) {
        wellnessStats = JSON.parse(savedWellness);
    }

    // Load notification settings
    const savedNotifications = localStorage.getItem('taskventureNotifications');
    if (savedNotifications) {
        notificationSettings = JSON.parse(savedNotifications);
    }
}

// Save notification settings
function saveNotificationSettings() {
    localStorage.setItem('taskventureNotifications', JSON.stringify(notificationSettings));
}

// Schedule self-care notifications
async function scheduleSelfCareNotifications() {
    if (!notificationsEnabled || !notificationSettings.enabled) return;

    try {
        // Cancel existing notifications
        await LocalNotifications.cancel({
            notifications: [
                { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }
            ]
        });

        const activities = [
            { id: 1, activity: 'hydrate', title: '💧 Hydration Reminder', body: 'Time to drink some water! Your body will thank you.' },
            { id: 2, activity: 'breathe', title: '🌬️ Breathing Break', body: 'Take a moment for some deep breathing exercises.' },
            { id: 3, activity: 'rest', title: '😴 Rest Time', body: 'Consider taking a short break to recharge your energy.' },
            { id: 4, activity: 'walk', title: '🚶‍♂️ Movement Break', body: 'Time for a refreshing walk to boost your mood and energy!' },
            { id: 5, activity: 'meditate', title: '🧘‍♀️ Mindfulness Moment', body: 'A few minutes of meditation can clear your mind.' },
            { id: 6, activity: 'journal', title: '📝 Reflection Time', body: 'Writing in your journal can help process your thoughts.' }
        ];

        const notifications = [];
        const now = new Date();

        activities.forEach(({ id, activity, title, body }) => {
            if (!notificationSettings.activities[activity]) return;

            // Schedule notification
            const notificationTime = new Date(now.getTime() + (notificationSettings.frequency * 60 * 1000));

            // Check if it's during quiet hours
            const hour = notificationTime.getHours();
            if (hour >= notificationSettings.quietHours.start || hour < notificationSettings.quietHours.end) {
                // Adjust to after quiet hours
                notificationTime.setHours(notificationSettings.quietHours.end, 0, 0, 0);
                if (notificationTime <= now) {
                    notificationTime.setDate(notificationTime.getDate() + 1);
                }
            }

            notifications.push({
                id: id,
                title: title,
                body: body,
                at: notificationTime,
                sound: 'default',
                smallIcon: 'ic_launcher',
                iconColor: '#d4af37'
            });
        });

        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications });
            console.log(`✅ Scheduled ${notifications.length} self-care notifications`);
        }

    } catch (error) {
        console.error('Failed to schedule notifications:', error);
    }
}

// Toggle notifications
async function toggleNotifications(enabled) {
    notificationSettings.enabled = enabled;
    saveNotificationSettings();

    if (enabled) {
        await scheduleSelfCareNotifications();
        showSelfCareMessage("🔔 Self-care notifications enabled! You'll receive gentle reminders.", 0);
    } else {
        if (LocalNotifications) {
            await LocalNotifications.cancel({
                notifications: [
                    { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }
                ]
            });
        }
        showSelfCareMessage("🔕 Self-care notifications disabled.", 0);
    }
}

// Save wellness data
function saveWellnessData() {
    localStorage.setItem('taskventureWellness', JSON.stringify(wellnessStats));
}

// Update wellness stats based on activities
function updateWellness(activity) {
    switch(activity) {
        case 'complete_task':
            wellnessStats.stress = Math.max(0, wellnessStats.stress - 2);
            wellnessStats.mood = Math.min(100, wellnessStats.mood + 3);
            break;
        case 'long_work_session':
            wellnessStats.stress = Math.min(100, wellnessStats.stress + 5);
            wellnessStats.energy = Math.max(0, wellnessStats.energy - 10);
            break;
        case 'self_care':
            wellnessStats.stress = Math.max(0, wellnessStats.stress - 10);
            wellnessStats.energy = Math.min(100, wellnessStats.energy + 15);
            wellnessStats.mood = Math.min(100, wellnessStats.mood + 10);
            wellnessStats.mindfulness = Math.min(100, wellnessStats.mindfulness + 5);
            break;
    }
    saveWellnessData();
    updateWellnessUI();
}

// Update wellness UI
function updateWellnessUI() {
    const stressBar = document.getElementById('stress-bar');
    const energyBar = document.getElementById('energy-bar');
    const moodBar = document.getElementById('mood-bar');
    const mindfulnessBar = document.getElementById('mindfulness-bar');

    const stressValue = document.getElementById('stress-value');
    const energyValue = document.getElementById('energy-value');
    const moodValue = document.getElementById('mood-value');
    const mindfulnessValue = document.getElementById('mindfulness-value');

    if (stressBar) stressBar.style.width = `${wellnessStats.stress}%`;
    if (energyBar) energyBar.style.width = `${wellnessStats.energy}%`;
    if (moodBar) moodBar.style.width = `${wellnessStats.mood}%`;
    if (mindfulnessBar) mindfulnessBar.style.width = `${wellnessStats.mindfulness}%`;

    if (stressValue) stressValue.textContent = `${wellnessStats.stress}%`;
    if (energyValue) energyValue.textContent = `${wellnessStats.energy}%`;
    if (moodValue) moodValue.textContent = `${wellnessStats.mood}%`;
    if (mindfulnessValue) mindfulnessValue.textContent = `${wellnessStats.mindfulness}%`;
}

// Self-care activities
function performSelfCare(activity) {
    let message = "";
    let xpGain = 5;

    switch(activity) {
        case 'meditate':
            message = "🧘‍♀️ You spend 10 minutes in peaceful meditation. Your mind feels clearer.";
            wellnessStats.mindfulness = Math.min(100, wellnessStats.mindfulness + 15);
            wellnessStats.stress = Math.max(0, wellnessStats.stress - 10);
            break;
        case 'walk':
            message = "🚶‍♂️ You take a refreshing walk in nature. Your body feels energized.";
            wellnessStats.energy = Math.min(100, wellnessStats.energy + 20);
            wellnessStats.mood = Math.min(100, wellnessStats.mood + 10);
            break;
        case 'journal':
            message = "📝 You write in your journal, processing your thoughts and feelings.";
            wellnessStats.mood = Math.min(100, wellnessStats.mood + 15);
            wellnessStats.mindfulness = Math.min(100, wellnessStats.mindfulness + 10);
            break;
        case 'rest':
            message = "😴 You take a proper rest break. Your energy is restored.";
            wellnessStats.energy = Math.min(100, wellnessStats.energy + 25);
            wellnessStats.stress = Math.max(0, wellnessStats.stress - 15);
            xpGain = 10;
            break;
        case 'hydrate':
            message = "💧 You drink a refreshing glass of water. Your body thanks you.";
            wellnessStats.energy = Math.min(100, wellnessStats.energy + 10);
            break;
        case 'breathe':
            message = "🌬️ You practice deep breathing exercises. Calm washes over you.";
            wellnessStats.stress = Math.max(0, wellnessStats.stress - 20);
            wellnessStats.mindfulness = Math.min(100, wellnessStats.mindfulness + 10);
            break;
    }

    // Award XP for self-care
    user.xp += xpGain;

    // Show self-care completion message
    showSelfCareMessage(message, xpGain);

    updateWellness('self_care');
    updateUI();

    // Reschedule notifications after completing activity
    if (notificationSettings.enabled) {
        setTimeout(() => {
            scheduleSelfCareNotifications();
        }, 1000);
    }
}

// Show self-care completion message
function showSelfCareMessage(message, xpGain) {
    const messageDiv = document.createElement('div');
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
            messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
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
    const lastStreakView = localStorage.getItem('lastStreakView');

    if (lastStreakView === today) {
        return; // Already seen today
    }

    // Calculate days since last activity
    const lastActive = localStorage.getItem('lastActiveDate');
    const daysSinceLastActive = getDaysSince(lastActive);

    // Check rest availability
    const restData = getRestData();

    const modal = document.createElement('div');
    modal.className = 'streak-modal';
    modal.innerHTML = `
        <div class="streak-modal-content">
            <h2>⚔️ Daily Streak Report</h2>
            <div class="streak-display">
                <div class="streak-number">${user.streak}</div>
                <div class="streak-label">Day Streak</div>
            </div>

            ${daysSinceLastActive > 0 ? `
                <div class="streak-warning">
                    <p>⚠️ You've been away for ${daysSinceLastActive} day${daysSinceLastActive > 1 ? 's' : ''}!</p>
                    ${getRestOptions(daysSinceLastActive, restData)}
                </div>
            ` : `
                <div class="streak-success">
                    <p>🔥 Keep up the momentum, adventurer!</p>
                </div>
            `}

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
    localStorage.setItem('lastStreakView', today);
}

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
    } else if (daysMissed >= 2 && daysMissed <= 6 && restData.longRestsRemaining > 0) {
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
    let restData = JSON.parse(localStorage.getItem('restData') || '{}');

    // Reset if new month
    if (restData.month !== currentMonth) {
        restData = {
            month: currentMonth,
            shortRestsUsed: 0,
            longRestsUsed: 0
        };
        localStorage.setItem('restData', JSON.stringify(restData));
    }

    return {
        shortRestsRemaining: 1 - restData.shortRestsUsed,
        longRestsRemaining: 1 - restData.longRestsUsed,
        ...restData
    };
}

window.useShortRest = function useShortRest() {
    const restData = getRestData();
    if (restData.shortRestsRemaining > 0) {
        // Preserve streak
        const today = new Date().toDateString();
        localStorage.setItem('lastActiveDate', today);

        // Update rest data
        restData.shortRestsUsed += 1;
        localStorage.setItem('restData', JSON.stringify({
            month: restData.month,
            shortRestsUsed: restData.shortRestsUsed,
            longRestsUsed: restData.longRestsUsed
        }));

        showSelfCareMessage("🛌 Short rest used! Your streak is preserved.", 0);
        closeStreakModal();
        updateUI();
    }
}

window.useLongRest = function useLongRest() {
    const restData = getRestData();
    if (restData.longRestsRemaining > 0) {
        // Restore streak to what it was before the break
        const today = new Date().toDateString();
        localStorage.setItem('lastActiveDate', today);

        // Update rest data
        restData.longRestsUsed += 1;
        localStorage.setItem('restData', JSON.stringify({
            month: restData.month,
            shortRestsUsed: restData.shortRestsUsed,
            longRestsUsed: restData.longRestsUsed
        }));

        showSelfCareMessage("🏕️ Long rest used! Your streak is restored.", 0);
        closeStreakModal();
        updateUI();
    }
}

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
    const modal = document.querySelector('.streak-modal');
    if (modal) {
        modal.remove();
    }
}

// Show wellness check-in modal
window.showWellnessCheckIn = function showWellnessCheckIn() {
    // Check if user has done a check-in today
    const today = new Date().toDateString();
    const lastCheckIn = localStorage.getItem('lastWellnessCheckIn');

    if (lastCheckIn === today) {
        return; // Already checked in today
    }

    const modal = document.createElement('div');
    modal.className = 'wellness-modal';
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
}

// Complete wellness check-in
window.completeWellnessCheckIn = function completeWellnessCheckIn() {
    const modal = document.querySelector('.wellness-modal');
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    const checkedValues = Array.from(checkboxes).map(cb => cb.value);

    // Adjust wellness stats based on check-in
    if (checkedValues.includes('rested')) {
        wellnessStats.energy = Math.min(100, wellnessStats.energy + 10);
    }
    if (checkedValues.includes('energized')) {
        wellnessStats.energy = Math.min(100, wellnessStats.energy + 15);
        wellnessStats.mood = Math.min(100, wellnessStats.mood + 5);
    }
    if (checkedValues.includes('focused')) {
        wellnessStats.mindfulness = Math.min(100, wellnessStats.mindfulness + 10);
    }
    if (checkedValues.includes('stressed')) {
        wellnessStats.stress = Math.min(100, wellnessStats.stress + 15);
    }
    if (checkedValues.includes('overwhelmed')) {
        wellnessStats.stress = Math.min(100, wellnessStats.stress + 20);
        wellnessStats.energy = Math.max(0, wellnessStats.energy - 10);
    }
    if (checkedValues.includes('motivated')) {
        wellnessStats.mood = Math.min(100, wellnessStats.mood + 15);
    }

    // Award XP for checking in
    user.xp += 5;

    // Save check-in date
    localStorage.setItem('lastWellnessCheckIn', new Date().toDateString());

    saveWellnessData();
    updateWellnessUI();
    updateUI();

    // Show completion message
    showSelfCareMessage("Thank you for checking in! Your self-awareness helps your journey.", 5);

    modal.remove();
}

// Skip wellness check-in
window.skipWellnessCheckIn = function skipWellnessCheckIn() {
    const modal = document.querySelector('.wellness-modal');
    localStorage.setItem('lastWellnessCheckIn', new Date().toDateString());
    modal.remove();
}


document.addEventListener('DOMContentLoaded', () => {
  const hasProfile = localStorage.getItem("tv_profile");

  // Ensure proper initial state
  if (splashEl) {
    splashEl.classList.remove("hidden");
    splashEl.style.display = 'flex';
  }
  if (wizardEl) {
    wizardEl.classList.add("hidden");
    wizardEl.style.display = 'none';
  }
  if (gameEl) {
    gameEl.classList.add("hidden");
    gameEl.style.display = 'none';
  }

  // Show Step 0 of wizard, just in case it's triggered later
  if (typeof showStep === "function") {
    showStep(0);
  }

  // Rewire buttons AFTER DOM is ready
  setupButtonHandlers();
});

// Hook up the Reset-Wizard dev button
document.getElementById('reset-wizard').addEventListener('click', () => {
  localStorage.removeItem('tv_profile');
  // reset visibility back to splash
  splashEl.classList.remove('hidden');
  wizardEl.classList.add('hidden');
  gameEl.classList.add('hidden');
});

function setupButtonHandlers() {
  const playBtn = document.getElementById("play-button");
  const resetBtn = document.getElementById("reset-wizard");

  playBtn?.addEventListener("click", () => {
    if (splashEl) {
      splashEl.classList.add("hidden");
      splashEl.style.display = 'none';
    }

    if (!localStorage.getItem("tv_profile")) {
      if (wizardEl) {
        wizardEl.classList.remove("hidden");
        wizardEl.style.display = 'flex';
      }
    } else {
      enterApp();
    }
  });

  resetBtn?.addEventListener("click", () => {
    localStorage.removeItem("tv_profile");
    if (splashEl) {
      splashEl.classList.remove("hidden");
      splashEl.style.display = 'flex';
    }
    if (wizardEl) {
      wizardEl.classList.add("hidden");
      wizardEl.style.display = 'none';
    }
    if (gameEl) {
      gameEl.classList.add("hidden");
      gameEl.style.display = 'none';
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
        cape: ""
    }
};

// Game state
let gameStarted = false;

// Load user data from localStorage
window.loadUserData = function loadUserData() {
    const savedData = localStorage.getItem('taskventureData');
    if (savedData) {
        user = JSON.parse(savedData);
    } else {
        // Add default starter quests for new users
        user.tasks = [
            {
                id: Date.now() + 1,
                text: "Explore the TaskVenture interface",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                text: "Complete your first quest to earn XP",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                text: "Roll the dice for luck and bonus rewards",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 4,
                text: "View your card collection",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 5,
                text: "Add your own custom quest",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 6,
                text: "Customize your adventurer avatar",
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Initialize avatar object if it doesn't exist
    if (!user.avatar) {
        user.avatar = {
            armor: "",
            weapon: "",
            cape: ""
        };
    }

    // Initialize wellness system
    loadWellnessData();
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('taskventureData', JSON.stringify(user));
}

// Update UI elements
function updateUI() {
    // Update character info
    const profile = JSON.parse(localStorage.getItem('tv_profile') || '{}');
    const characterName = document.getElementById('character-name');
    const characterRace = document.getElementById('character-race');
    const characterClass = document.getElementById('character-class');

    if (characterName && profile.name) characterName.textContent = profile.name;
    if (characterRace && profile.race) characterRace.textContent = profile.race;
    if (characterClass && profile.class) characterClass.textContent = profile.class;

    // Update level and XP with null checks
    const userLevel = document.getElementById('user-level');
    const userXP = document.getElementById('user-xp');
    const userStreak = document.getElementById('user-streak');
    const cardCount = document.getElementById('card-count');

    if (userLevel) userLevel.textContent = user.level;
    if (userXP) userXP.textContent = user.xp;
    if (userStreak) userStreak.textContent = user.streak;
    if (cardCount) cardCount.textContent = user.cards.length;

    // Update XP bar
    const xpForCurrentLevel = getXPForLevel(user.level);
    const xpForNextLevel = getXPForLevel(user.level + 1);
    const xpProgress = (user.xp / xpForNextLevel) * 100;

    const xpFill = document.getElementById('xp-fill');
    const xpNextLevel = document.getElementById('xp-next-level');

    if (xpFill) xpFill.style.width = `${Math.min(xpProgress, 100)}%`;
    if (xpNextLevel) xpNextLevel.textContent = xpForNextLevel;

    // Update currency display - convert total coins to different denominations
    const totalCoins = user.coins || 0;
    console.log(`💰 Main app coin display update: ${totalCoins} total coins`);
    const platinum = Math.floor(totalCoins / 1000);
    const gold = Math.floor((totalCoins % 1000) / 100);
    const silver = Math.floor((totalCoins % 100) / 10);
    const copper = totalCoins % 10;

    const platinumElement = document.getElementById('platinum-coins');
    const goldElement = document.getElementById('gold-coins');
    const silverElement = document.getElementById('silver-coins');
    const copperElement = document.getElementById('copper-coins');

    if (platinumElement) platinumElement.
        textContent = platinum;
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
    const taskInput = document.getElementById('task-input');
    if (!taskInput) {
        console.error('Task input element not found');
        return;
    }
    
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        alert('Please enter a quest!');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };

    user.tasks.push(task);
    taskInput.value = '';
    updateUI();
}

// Make addTask globally available
window.addTask = addTask;

// Complete a task
function completeTask(taskId) {
    const taskIndex = user.tasks.findIndex(task => task.id === taskId);
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
    const modal = document.getElementById('reward-modal');
    const rewardDetails = document.getElementById('reward-details');
    const newCardDiv = document.getElementById('new-card');

    rewardDetails.innerHTML = `
        <p><strong>Quest Completed:</strong> "${taskText}"</p>
        <p><strong>XP Gained:</strong> +${xpGained}</p>
        <p><strong>Streak:</strong> ${user.streak} days</p>
    `;

    newCardDiv.innerHTML = `
        <div class="card ${card.rarity.toLowerCase()}">
            ${card.image ? `<img src="${card.image}" alt="${card.name}" class="card-image">` : ''}
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity}</div>
            <div class="card-effect">${card.effect}</div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// Close reward modal
function closeRewardModal() {
    document.getElementById('reward-modal').classList.add('hidden');
}

// Render tasks
function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    user.tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.innerHTML = `
            <span class="task-text">${task.text}</span>
            <button class="complete-btn" onclick="completeTask(${task.id})">Complete Quest</button>
        `;
        taskList.appendChild(taskItem);
    });
}

// Page navigation
function showPage(pageId, navElement) {
      // 1) Hide all pages
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

      // 2) Show selected page
      document.getElementById(pageId).classList.add('active');

      // 3) Update nav buttons
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      navElement.classList.add('active');

      // 4) If it’s the Avatar tab, re-apply saved gear
      if (pageId === 'avatar-page' && typeof updateAvatarDisplay === 'function') {
        updateAvatarDisplay();
      }
    }

// Render card collection
function renderCollection() {
    const collectionGrid = document.getElementById('collection-grid');
    collectionGrid.innerHTML = '';

    user.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.rarity.toLowerCase()}`;
        cardElement.innerHTML = `
            ${card.image ? `<img src="${card.image}" alt="${card.name}" class="card-image">` : ''}
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity}</div>
            <div class="card-effect">${card.effect}</div>
            <div class="card-actions">
                <button class="card-delete-btn" onclick="deleteCard(${index})" title="Delete Card">🗑️</button>
            </div>
        `;

        // Add click listener for detailed view
        cardElement.addEventListener('click', (e) => {
            // Don't show modal if clicking delete button
            if (!e.target.classList.contains('card-delete-btn')) {
                showCardDetails(card);
            }
        });

        collectionGrid.appendChild(cardElement);
    });
}

// Delete a card from collection
function deleteCard(cardIndex) {
    if (confirm('Are you sure you want to discard this card? This action cannot be undone.')) {
        user.cards.splice(cardIndex, 1);
        updateUI();
        showSelfCareMessage("Card discarded successfully.", 0);
    }
}

// Show detailed card view
function showCardDetails(card) {
    const modal = document.createElement('div');
    modal.className = 'card-details-modal';
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
                        <strong>Type:</strong> ${card.type || 'Unknown'}
                    </div>
                    <div class="detail-item">
                        <strong>Effect:</strong>
                        <p class="card-effect-full">${card.effect}</p>
                    </div>
                    ${card.description ? `
                        <div class="detail-item">
                            <strong>Description:</strong>
                            <p class="card-description">${card.description}</p>
                        </div>
                    ` : ''}
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
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCardDetails();
        }
    });
}

// Close card details modal
function closeCardDetails() {
    const modal = document.querySelector('.card-details-modal');
    if (modal) {
        modal.remove();
    }
}

// Delete card from modal
function deleteCardFromModal(cardId) {
    const cardIndex = user.cards.findIndex(card => (card.id || card.name) === cardId);
    if (cardIndex !== -1) {
        if (confirm('Are you sure you want to discard this card? This action cannot be undone.')) {
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
    // Ensure base avatar is visible
    const baseAvatar = document.getElementById('avatar-base');
    if (baseAvatar) {
        baseAvatar.style.display = 'block';
        baseAvatar.onerror = function() {
            console.error('Base avatar image failed to load');
            this.style.display = 'none';
        };
        baseAvatar.onload = function() {
            console.log('Base avatar image loaded successfully');
        };
    }

    // Load saved avatar state
    document.getElementById('armor-select').value = user.avatar.armor;
    document.getElementById('weapon-select').value = user.avatar.weapon;
    document.getElementById('cape-select').value = user.avatar.cape;

    updateAvatarDisplay();

    // Add event listeners for avatar customization
    document.getElementById("armor-select").addEventListener("change", function () {
        user.avatar.armor = this.value;
        updateAvatarDisplay();
        saveUserData();
    });

    document.getElementById("weapon-select").addEventListener("change", function () {
        user.avatar.weapon = this.value;
        updateAvatarDisplay();
        saveUserData();
    });

    document.getElementById("cape-select").addEventListener("change", function () {
        user.avatar.cape = this.value;
        updateAvatarDisplay();
        saveUserData();
    });
}

// Update avatar display
function updateAvatarDisplay() {
    const armorImg = document.getElementById("avatar-armor");
    const weaponImg = document.getElementById("avatar-weapon");
    const capeImg = document.getElementById("avatar-cape");

    if (user.avatar.armor) {
        armorImg.src = user.avatar.armor;
        armorImg.style.display = "block";
    } else {
        armorImg.style.display = "none";
    }

    if (user.avatar.weapon) {
        weaponImg.src = user.avatar.weapon;
        weaponImg.style.display = "block";
    } else {
        weaponImg.style.display = "none";
    }

    if (user.avatar.cape) {
        capeImg.src = user.avatar.cape;
        capeImg.style.display = "block";
    } else {
        capeImg.style.display = "none";
    }
}

// Allow Enter key to add tasks and set up button handler
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the game interface to be visible before setting up handlers
    setTimeout(function() {
        const taskInput = document.getElementById('task-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        
        if (taskInput) {
            taskInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addTask();
                }
            });
        }
        
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', function() {
                addTask();
            });
        }
    }, 1000);

    // Initialize avatar customization when DOM is loaded
    setTimeout(initializeAvatarCustomization, 100);
});

    function enterApp() {
      const gameEl = document.getElementById("game-interface");
      const splashEl = document.getElementById("splash-screen");
      const wizardEl = document.getElementById("wizard");

      if (splashEl) {
        splashEl.classList.add("hidden");
        splashEl.style.display = 'none';
      }
      if (wizardEl) {
        wizardEl.classList.add("hidden");
        wizardEl.style.display = 'none';
      }
      if (gameEl) {
        gameEl.classList.remove("hidden");
        gameEl.style.display = 'block';
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

window.addEventListener('load', () => {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Ensure splash is visible and properly styled
  splash.style.opacity = 1;
  splash.style.display = 'flex';
  splash.classList.add('visible');
});