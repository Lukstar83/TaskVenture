// settings.js

// Global audio elements
const bgMusic = new Audio('attached-assets/bg-music.mp3');
bgMusic.loop = true;

const clickSound = new Audio('attached-assets/button-click.aac');

function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.warn('Click sound blocked:', e));
}

document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

function initializeSettings() {
    // Load saved settings
    loadSettings();

    // Load saved volume or default to 0.5
    const savedVolume = parseFloat(localStorage.getItem('volume')) || 0.5;
    bgMusic.volume = savedVolume;
    clickSound.volume = savedVolume;

    // Start music
    window.addEventListener('load', () => {
        bgMusic.play().catch(e => {
            console.warn('Autoplay blocked. Music will start on user interaction.');
        });
    });

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
    if (type === 'music') bgMusic.volume = volume;
    if (type === 'sfx') clickSound.volume = volume;
}

function updateAudioMute(muted) {
    bgMusic.muted = muted;
    clickSound.muted = muted;
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

    localStorage.removeItem('taskventureData');
    localStorage.removeItem('lastActiveDate');

    if (typeof window.user !== 'undefined') {
        window.user = {
            xp: 0,
            level: 1,
            streak: 0,
            cards: [],
            tasks: [],
            inventory: [],
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
