// XP and leveling utilities - D&D 5e inspired progression
function getXPForLevel(level) {
    // D&D-style XP requirements (cumulative totals)
    const xpTable = [
        0,     // Level 1 (starting)
        300,   // Level 2
        900,   // Level 3
        2700,  // Level 4
        6500,  // Level 5
        14000, // Level 6
        23000, // Level 7
        34000, // Level 8
        48000, // Level 9
        64000, // Level 10
        85000, // Level 11
        100000, // Level 12
        120000, // Level 13
        140000, // Level 14
        165000, // Level 15
        195000, // Level 16
        225000, // Level 17
        265000, // Level 18
        305000, // Level 19
        355000  // Level 20
    ];
    
    // For levels beyond 20, continue the progression
    if (level <= 20) {
        return xpTable[level - 1] || 0;
    } else {
        // Exponential growth for epic levels
        const baseXP = 355000;
        const extraLevels = level - 20;
        return baseXP + (extraLevels * 50000);
    }
}

function calculateLevel(xp) {
    let level = 1;
    
    // Find the highest level where XP requirement is met
    while (level <= 20 && getXPForLevel(level + 1) <= xp) {
        level++;
    }
    
    // Handle epic levels beyond 20
    if (level === 20 && xp > getXPForLevel(20)) {
        const extraXP = xp - getXPForLevel(20);
        const extraLevels = Math.floor(extraXP / 50000);
        level += extraLevels;
    }
    
    return level;
}

function checkLevelUp(user) {
    const currentLevel = user.level || 1;
    const newLevel = calculateLevel(user.xp);
    
    if (newLevel > currentLevel) {
        user.level = newLevel;
        return true;
    }
    return false;
}

function calculateXPReward(task) {
    let baseXP = 10;
    
    // Bonus XP for longer tasks
    if (task.text.length > 50) {
        baseXP += 5;
    }
    
    // Streak bonus
    baseXP += Math.min(user.streak * 2, 20);
    
    // Dice bonus XP
    if (user.bonusXP) {
        baseXP *= 2;
        user.bonusXP = false; // Reset bonus
    }
    
    return baseXP;
}

// Card generation system - Updated starter library
const cardDatabase = [
    {
        "id": "cloak_clarity_common",
        "name": "Cloak of Clarity",
        "type": "Armor",
        "rarity": "Common",
        "effect": "+2 Focus, -1 Distraction",
        "image": "images/cards/cloak_clarity_common.png"
    },
    {
        "id": "cloak_clarity_epic",
        "name": "Cloak of Clarity",
        "type": "Armor",
        "rarity": "Epic",
        "effect": "+3 Focus, use once/day to highlight your top priority task",
        "image": "images/cards/cloak_clarity_epic.png"
    },
    {
        "id": "focus_blade_common",
        "name": "Blade of Focus",
        "type": "Weapon",
        "rarity": "Common",
        "effect": "+1 Focus, adds 5 XP on streak completion"
    },
    {
        "id": "goblin_pet_rare",
        "name": "Goblin of Accountability",
        "type": "Companion",
        "rarity": "Rare",
        "effect": "Reminds you to check tasks after 3 hours of inactivity"
    },
    {
        "id": "task_tonic_uncommon",
        "name": "Task Tonic",
        "type": "Potion",
        "rarity": "Uncommon",
        "effect": "Allows you to skip 1 task without breaking your streak"
    },
    // Additional cards for variety
    {
        "id": "scroll_planning_common",
        "name": "Scroll of Planning",
        "rarity": "Common",
        "type": "Scroll",
        "effect": "Organize thoughts, +1 Productivity"
    },
    {
        "id": "boots_motivation_common",
        "name": "Boots of Motivation",
        "rarity": "Common",
        "type": "Armor",
        "effect": "+1 Speed, Reduces procrastination"
    },
    {
        "id": "potion_energy_common",
        "name": "Potion of Energy",
        "rarity": "Common",
        "type": "Consumable",
        "effect": "Restore stamina, +1 to next task"
    },
    {
        "id": "sword_productivity_rare",
        "name": "Sword of Productivity",
        "rarity": "Rare",
        "type": "Weapon",
        "effect": "+3 Task completion, Cuts through distractions"
    },
    {
        "id": "shield_focus_rare",
        "name": "Shield of Focus",
        "rarity": "Rare",
        "type": "Armor",
        "effect": "Immunity to distractions for 1 hour"
    },
    {
        "id": "ring_time_rare",
        "name": "Ring of Time Management",
        "rarity": "Rare",
        "type": "Accessory",
        "effect": "Doubles efficiency for urgent tasks"
    },
    {
        "id": "crystal_insight_rare",
        "name": "Crystal of Insight",
        "rarity": "Rare",
        "type": "Artifact",
        "effect": "Reveals optimal task order"
    },
    {
        "id": "staff_mastery_epic",
        "name": "Staff of Task Mastery",
        "rarity": "Epic",
        "type": "Weapon",
        "effect": "Complete any task 50% faster, +5 XP bonus"
    },
    {
        "id": "crown_wisdom_epic",
        "name": "Crown of Wisdom",
        "rarity": "Epic",
        "type": "Armor",
        "effect": "All decisions are optimal, +4 to all stats"
    },
    {
        "id": "blade_infinite_legendary",
        "name": "Blade of Infinite Progress",
        "rarity": "Legendary",
        "type": "Weapon",
        "effect": "Every completed task generates another, XP x2"
    },
    {
        "id": "tome_ultimate_legendary",
        "name": "Tome of Ultimate Knowledge",
        "rarity": "Legendary",
        "type": "Artifact",
        "effect": "All tasks become clear, gain perfect focus"
    }
];

function drawRandomCard() {
    // Updated rarity chances: Common 50%, Uncommon 25%, Rare 15%, Epic 8%, Legendary 2%
    const rand = Math.random() * 100;
    let rarity;
    
    if (rand < 2) {
        rarity = "Legendary";
    } else if (rand < 10) {
        rarity = "Epic";
    } else if (rand < 25) {
        rarity = "Rare";
    } else if (rand < 50) {
        rarity = "Uncommon";
    } else {
        rarity = "Common";
    }
    
    // Filter cards by rarity
    const availableCards = cardDatabase.filter(card => card.rarity === rarity);
    
    // Return random card of selected rarity
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return { ...availableCards[randomIndex] };
}

// Streak and rest system
function useRestItem(user) {
    const tonicIndex = user.inventory.findIndex(item => item === "task_tonic_uncommon");
    if (tonicIndex !== -1) {
        user.inventory.splice(tonicIndex, 1);
        user.restToken = true;
        return true;
    }
    return false;
}

function updateStreakSystem(user, didCompleteTaskToday) {
    if (didCompleteTaskToday) {
        user.streak += 1;
        user.lastActiveDate = new Date().toDateString();
    } else {
        if (user.restToken) {
            user.restToken = false; // Used the rest token
            user.lastActiveDate = new Date().toDateString();
        } else {
            user.streak = 0; // No rest, streak resets
        }
    }
}

// Streak tracking utilities (legacy support)
function updateStreak() {
    // Ensure user object exists before using it
    if (typeof window !== 'undefined' && window.user) {
        const today = new Date().toDateString();
        const lastActive = localStorage.getItem('lastActiveDate');
        
        if (lastActive === today) {
            // Already counted today
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive === yesterday.toDateString()) {
            // Continuing streak
            window.user.streak += 1;
        } else if (lastActive !== null) {
            // Streak broken (unless rest token is used)
            if (!window.user.restToken) {
                window.user.streak = 1;
            } else {
                window.user.restToken = false;
            }
        } else {
            // First day
            window.user.streak = 1;
        }
        
        localStorage.setItem('lastActiveDate', today);
    }
}

// Initialize streak tracking when game starts
function initializeStreakTracking() {
    // Only initialize if user object exists
    if (typeof window !== 'undefined' && window.user) {
        updateStreak();
    }
}

// Call this when the game starts - with a delay to ensure user is loaded
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(initializeStreakTracking, 100);
    });
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateLevel,
        calculateXPReward,
        drawRandomCard,
        updateStreak,
        cardDatabase,
        getXPForLevel,
        checkLevelUp,
        useRestItem,
        updateStreakSystem
    };
}

function addTaskSimple() {
  const input = document.getElementById("task-input");
  const list  = document.getElementById("task-list");
  if (!input || !list) return;
  const txt   = input.value.trim();
  if (!txt) return;
  const li = document.createElement("li");
  li.textContent = txt;
  list.appendChild(li);
  input.value = "";
}

function rollDice(sides=20) {
  return Math.floor(Math.random()*sides) + 1;
}
