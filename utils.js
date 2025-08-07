// XP and leveling utilities
function getXPForLevel(level) {
    return 100 + 50 * (level - 1); // Level 1 = 100 XP, Level 2 = 150, Level 3 = 200...
}

function calculateLevel(xp) {
    let level = 1;
    let totalXPNeeded = 0;
    
    while (totalXPNeeded <= xp) {
        totalXPNeeded += getXPForLevel(level);
        if (totalXPNeeded <= xp) {
            level++;
        }
    }
    
    return level;
}

function checkLevelUp(user) {
    const requiredXP = getXPForLevel(user.level);
    if (user.xp >= requiredXP) {
        user.level += 1;
        user.xp -= requiredXP;
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
    },
    // Self-Care themed cards
    {
        "id": "tea_restoration_common",
        "name": "Tea of Restoration",
        "rarity": "Common",
        "type": "Consumable",
        "effect": "Restores mental energy, reduces stress by 1 point"
    },
    {
        "id": "pillow_rest_common",
        "name": "Pillow of Peaceful Rest",
        "rarity": "Common",
        "type": "Artifact",
        "effect": "Grants well-rested bonus, +2 to morning productivity"
    },
    {
        "id": "journal_reflection_common",
        "name": "Journal of Self-Reflection",
        "rarity": "Common",
        "type": "Scroll",
        "effect": "Clarifies thoughts and emotions, +1 to wisdom"
    },
    {
        "id": "candle_serenity_uncommon",
        "name": "Candle of Serenity",
        "rarity": "Uncommon",
        "type": "Artifact",
        "effect": "Creates calming atmosphere, reduces anxiety for 2 hours"
    },
    {
        "id": "bath_rejuvenation_uncommon",
        "name": "Bath Salts of Rejuvenation",
        "rarity": "Uncommon",
        "type": "Consumable",
        "effect": "Cleanses body and spirit, removes 1 stress condition"
    },
    {
        "id": "cloak_boundaries_rare",
        "name": "Cloak of Healthy Boundaries",
        "rarity": "Rare",
        "type": "Armor",
        "effect": "Protects against emotional drain, +3 to saying 'no'"
    },
    {
        "id": "amulet_selfcompassion_rare",
        "name": "Amulet of Self-Compassion",
        "rarity": "Rare",
        "type": "Accessory",
        "effect": "Grants inner kindness, immunity to self-criticism"
    },
    {
        "id": "mirror_acceptance_epic",
        "name": "Mirror of Self-Acceptance",
        "rarity": "Epic",
        "type": "Artifact",
        "effect": "Shows your true worth, +5 confidence, +3 self-esteem"
    },
    {
        "id": "garden_mindfulness_epic",
        "name": "Garden of Mindfulness",
        "rarity": "Epic",
        "type": "Artifact",
        "effect": "Cultivates present moment awareness, +4 to all mental stats"
    },
    {
        "id": "crown_selflove_legendary",
        "name": "Crown of Unconditional Self-Love",
        "rarity": "Legendary",
        "type": "Artifact",
        "effect": "Perfect self-acceptance, immunity to negative self-talk, heals all mental wounds"
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
        user.streak += 1;
    } else if (lastActive !== null) {
        // Streak broken (unless rest token is used)
        if (!user.restToken) {
            user.streak = 1;
        } else {
            user.restToken = false;
        }
    } else {
        // First day
        user.streak = 1;
    }
    
    localStorage.setItem('lastActiveDate', today);
}

// Initialize streak tracking when game starts
function initializeStreakTracking() {
    updateStreak();
}

// Call this when the game starts
if (typeof window !== 'undefined') {
    window.addEventListener('load', initializeStreakTracking);
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

function rollDice(sides=20) {
  return Math.floor(Math.random()*sides) + 1;
}
