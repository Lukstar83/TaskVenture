// settings.js

// Global audio elements
const bgMusic = new Audio('attached_assets/bg-music.mp3');
bgMusic.loop = true;

const clickSound = new Audio('attached_assets/button-click.aac');

function playClickSound() {
    if (!clickSound.muted) {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.warn('Click sound blocked:', e));
    }
}

// Export for use in other files
window.playClickSound = playClickSound;

document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

function initializeSettings() {
    // Load saved settings first
    loadSettings();

    // Start music on first user interaction
    const startAudio = () => {
        bgMusic.play().catch(e => {
            console.warn('Autoplay blocked. Music will start on user interaction.');
        });
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);

    // Audio controls
    const musicSlider = document.getElementById('music-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    const muteAllCheckbox = document.getElementById('mute-all');
    const musicValue = document.getElementById('music-value');
    const sfxValue = document.getElementById('sfx-value');

    // Settings controls
    const editStatsToggle = document.getElementById('edit-stats-toggle');
    const resetCharacterBtn = document.getElementById('reset-character-btn');
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    const exportDataBtn = document.getElementById('export-data-btn');

    // Audio event listeners
    musicSlider?.addEventListener('input', function () {
        musicValue.textContent = this.value + '%';
        saveSetting('musicVolume', this.value);
        updateAudioVolume('music', this.value / 100);
    });

    sfxSlider?.addEventListener('input', function () {
        sfxValue.textContent = this.value + '%';
        saveSetting('sfxVolume', this.value);
        updateAudioVolume('sfx', this.value / 100);
    });

    muteAllCheckbox?.addEventListener('change', function () {
        saveSetting('muteAll', this.checked);
        updateAudioMute(this.checked);
    });

    // Stat editing toggle
    editStatsToggle?.addEventListener('change', function () {
        saveSetting('editStatsEnabled', this.checked);
        localStorage.setItem('editStatsEnabled', this.checked);
        showFloatingMessage('Settings saved! Refresh the Stats page to see changes.', 'info');

        if (typeof window.renderSheet === 'function') {
            window.renderSheet();
        }
    });

    resetCharacterBtn?.addEventListener('click', function () {
        if (confirm('Are you sure you want to reset your character? This action cannot be undone!')) {
            if (confirm('This will delete your character permanently. Are you absolutely sure?')) {
                resetCharacter();
            }
        }
    });

    resetProgressBtn?.addEventListener('click', function () {
        if (confirm('Are you sure you want to reset ALL progress? This will delete XP, level, streak, tasks, and cards!')) {
            if (confirm('This action cannot be undone. Continue?')) {
                resetProgress();
            }
        }
    });

    exportDataBtn?.addEventListener('click', function () {
        exportSaveData();
    });

    // Wellness check-in button
    const manualCheckinBtn = document.getElementById('manual-checkin-btn');
    manualCheckinBtn?.addEventListener('click', function () {
        // Force check-in to always work by bypassing the daily limit
        localStorage.removeItem('lastWellnessCheckIn');
        
        if (typeof window.showWellnessCheckIn === 'function') {
            window.showWellnessCheckIn();
        } else {
            // Fallback implementation
            showWellnessCheckInFallback();
        }
    });
    
    // Manual streak modal button
    const manualStreakBtn = document.getElementById('manual-streak-btn');
    manualStreakBtn?.addEventListener('click', function () {
        // Force streak modal to always show by bypassing the daily limit
        localStorage.removeItem('lastStreakView');
        
        if (typeof window.showStreakModal === 'function') {
            window.showStreakModal();
        } else {
            // Fallback implementation
            showStreakModalFallback();
        }
    });
}

function loadSettings() {
    const musicVolume = getSetting('musicVolume', 50);
    const sfxVolume = getSetting('sfxVolume', 75);
    const muteAll = getSetting('muteAll', false);
    const editStatsEnabled = getSetting('editStatsEnabled', false);

    document.getElementById('music-volume').value = musicVolume;
    document.getElementById('sfx-volume').value = sfxVolume;
    document.getElementById('mute-all').checked = muteAll;
    document.getElementById('edit-stats-toggle').checked = editStatsEnabled;
    document.getElementById('music-value').textContent = musicVolume + '%';
    document.getElementById('sfx-value').textContent = sfxVolume + '%';

    updateAudioVolume('music', musicVolume / 100);
    updateAudioVolume('sfx', sfxVolume / 100);
    updateAudioMute(muteAll);
}

function saveSetting(key, value) {
    let settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
    settings[key] = value;
    localStorage.setItem('gameSettings', JSON.stringify(settings));
}

function getSetting(key, defaultValue) {
    let settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
    return settings[key] !== undefined ? settings[key] : defaultValue;
}

function updateAudioVolume(type, volume) {
    if (type === 'music') {
        bgMusic.volume = volume;
        console.log('music volume set to:', volume);
    }
    if (type === 'sfx') {
        clickSound.volume = volume;
        console.log('sfx volume set to:', volume);
    }
}

function updateAudioMute(muted) {
    bgMusic.muted = muted;
    clickSound.muted = muted;
    console.log('Audio muted:', muted);
}

function resetCharacter() {
    localStorage.removeItem('tv_profile');
    showFloatingMessage('Character reset successfully!', 'success');

    setTimeout(() => {
        const splashEl = document.getElementById('splash-screen');
        const gameEl = document.getElementById('game-interface');
        if (splashEl && gameEl) {
            splashEl.classList.remove('hidden');
            gameEl.classList.add('hidden');
        }
    }, 1500);
}

function resetProgress() {
    const profile = localStorage.getItem('tv_profile');

    // Remove all game data
    localStorage.removeItem('taskventureData');
    localStorage.removeItem('lastActiveDate');
    
    // Remove quest-related data
    localStorage.removeItem('completedQuests');
    localStorage.removeItem('lastDailyQuest');

    if (typeof window.user !== 'undefined') {
        window.user = {
            xp: 0,
            level: 1,
            streak: 0,
            coins: 0,
            cards: [],
            tasks: [],
            inventory: [],
            questItems: [],
            restToken: false,
            lastActiveDate: null,
            avatar: {
                armor: "",
                weapon: "",
                cape: ""
            }
        };

        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }
    }

    // Reset quest engine if it exists
    if (typeof window.questEngine !== 'undefined') {
        window.questEngine.completedQuests = [];
        window.questEngine.availableQuests = window.questEngine.generateAvailableQuests();
        window.questEngine.activeQuest = null;
        window.questEngine.currentScene = null;
        window.questEngine.playerHP = 100;
        window.questEngine.enemyHP = 0;
        window.questEngine.pendingRoll = null;
        
        // Re-render the quest list if we're on the quest page
        if (document.getElementById('quest-container')) {
            window.questEngine.renderQuestList();
        }
    }

    showFloatingMessage('All progress reset successfully!', 'success');
}

function exportSaveData() {
    const data = {
        profile: JSON.parse(localStorage.getItem('tv_profile') || 'null'),
        gameData: JSON.parse(localStorage.getItem('taskventureData') || 'null'),
        settings: JSON.parse(localStorage.getItem('gameSettings') || '{}'),
        lastActiveDate: localStorage.getItem('lastActiveDate'),
        editStatsEnabled: localStorage.getItem('editStatsEnabled'),
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `taskventure-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showFloatingMessage('Save data exported successfully!', 'success');
}

function showFloatingMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `floating-message ${type}`;
    messageEl.textContent = message;

    document.body.appendChild(messageEl);

    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

// Fallback functions for when main app functions aren't available
function showWellnessCheckInFallback() {
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
                <button onclick="completeWellnessCheckInFallback(this)">Complete Check-In</button>
                <button onclick="skipWellnessCheckInFallback(this)">Skip for Today</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showStreakModalFallback() {
    // Get current user data
    const userData = JSON.parse(localStorage.getItem('taskventureData') || '{"streak": 0}');
    
    const modal = document.createElement('div');
    modal.className = 'streak-modal';
    modal.innerHTML = `
        <div class="streak-modal-content">
            <h2>⚔️ Daily Streak Report</h2>
            <div class="streak-display">
                <div class="streak-number">${userData.streak || 0}</div>
                <div class="streak-label">Day Streak</div>
            </div>
            
            <div class="streak-success">
                <p>🔥 Keep up the momentum, adventurer!</p>
            </div>
            
            <div class="streak-buttons">
                <button onclick="closeStreakModalFallback(this)">Continue Adventure</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fallback completion functions
window.completeWellnessCheckInFallback = function(button) {
    const modal = button.closest('.wellness-modal');
    localStorage.setItem('lastWellnessCheckIn', new Date().toDateString());
    showFloatingMessage("Thank you for checking in! Your self-awareness helps your journey.", 'success');
    modal.remove();
}

window.skipWellnessCheckInFallback = function(button) {
    const modal = button.closest('.wellness-modal');
    localStorage.setItem('lastWellnessCheckIn', new Date().toDateString());
    modal.remove();
}

window.closeStreakModalFallback = function(button) {
    const modal = button.closest('.streak-modal');
    modal.remove();
}
