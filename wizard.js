// wizard.js
(() => {
  // 1) Cache DOM
  const splashEl   = document.getElementById("splash-screen");
  const wizardEl   = document.getElementById("wizard");
  const gameEl     = document.getElementById("game-interface");
  const playBtn    = document.getElementById("play-button");
  const resetBtn   = document.getElementById("reset-wizard");
  const backBtn    = document.getElementById("wiz-back");
  const nextBtn    = document.getElementById("wiz-next");
  const steps      = Array.from(wizardEl.querySelectorAll(".wizard-step"));
  const dots       = Array.from(wizardEl.querySelectorAll(".wizard-progress .step"));
  const nameInput  = document.getElementById("name-input");
  const nameGenBtn = document.getElementById("name-generate");
  const raceGrid   = document.getElementById("race-grid");
  const genderGrid = document.getElementById("gender-grid");
  const classGrid  = document.getElementById("class-grid");

  // 2) Wizard fields in order
  const keys = ["name","race","gender","class"];
  let stepIndex = 0;
  let choices   = {};

  // 3) Data Arrays
  const RACES = [
    {name:"Dwarf", bonuses:{STR:0,DEX:0,CON:2,INT:0,WIS:0,CHA:0}, speed:25},
    {name:"Elf", bonuses:{STR:0,DEX:2,CON:0,INT:0,WIS:0,CHA:0}, speed:30},
    {name:"Halfling", bonuses:{STR:0,DEX:2,CON:0,INT:0,WIS:0,CHA:0}, speed:25},
    {name:"Human", bonuses:{STR:1,DEX:1,CON:1,INT:1,WIS:1,CHA:1}, speed:30},
    {name:"Dragonborn", bonuses:{STR:2,DEX:0,CON:0,INT:0,WIS:0,CHA:1}, speed:30},
    {name:"Gnome", bonuses:{STR:0,DEX:0,CON:0,INT:2,WIS:0,CHA:0}, speed:25},
    {name:"Half-Elf", bonuses:{STR:0,DEX:0,CON:0,INT:0,WIS:0,CHA:2}, speed:30},
    {name:"Half-Orc", bonuses:{STR:2,DEX:0,CON:1,INT:0,WIS:0,CHA:0}, speed:30},
    {name:"Tiefling", bonuses:{STR:0,DEX:0,CON:0,INT:1,WIS:0,CHA:2}, speed:30}
  ];
  const CLASSES = [
    {name:"Barbarian",hit_die:12,prim:["STR","CON"],saves:["STR","CON"]},
    {name:"Bard",      hit_die: 8,prim:["CHA"],    saves:["DEX","CHA"]},
    {name:"Cleric",    hit_die: 8,prim:["WIS"],    saves:["WIS","CHA"]},
    {name:"Druid",     hit_die: 8,prim:["WIS"],    saves:["WIS","INT"]},
    {name:"Fighter",   hit_die:10,prim:["STR","CON"],saves:["STR","CON"]},
    {name:"Monk",      hit_die: 8,prim:["DEX","WIS"],saves:["STR","DEX"]},
    {name:"Paladin",   hit_die:10,prim:["STR","CHA"],saves:["WIS","CHA"]},
    {name:"Ranger",    hit_die:10,prim:["DEX","WIS"],saves:["STR","DEX"]},
    {name:"Rogue",     hit_die: 8,prim:["DEX","INT"],saves:["DEX","INT"]},
    {name:"Sorcerer",  hit_die: 6,prim:["CHA"],    saves:["CON","CHA"]},
    {name:"Warlock",   hit_die: 8,prim:["CHA"],    saves:["WIS","CHA"]},
    {name:"Wizard",    hit_die: 6,prim:["INT"],    saves:["INT","WIS"]}
  ];
  const GENDERS = ["Male","Female","Non-binary"];

  // 4) Helpers
  function rollAbility() {
    const rolls = Array.from({length:4}, ()=>Math.ceil(Math.random()*6)).sort((a,b)=>a-b);
    return rolls.slice(1).reduce((s,n)=>s+n,0);
  }
  function mod(score) {
    return Math.floor((score - 10)/2);
  }

  // 5) Random Name Generator
  const prefixes = ["Al","Be","Cor","Da","El","Fa","Gra","Ha","Im","Jo","Ka","Lo","Ma","Ni","O","Pa","Qu","Ri","Sa","Ta"];
  const suffixes = ["dor","len","mir","nor","phon","rian","sil","thas","ur","van","wyn","xas","yor","zan"];
  function generateName() {
    const p = prefixes[Math.floor(Math.random()*prefixes.length)];
    const s = suffixes[Math.floor(Math.random()*suffixes.length)];
    return p + s;
  }
  nameGenBtn.addEventListener("click", () => {
    nameInput.value = generateName();
  });

  // 6) showStep(i)
  function showStep(i) {
    steps.forEach((el, idx)=> el.classList.toggle("active", idx === i));
    dots .forEach((el, idx)=> el.classList.toggle("active", idx <= i));
    backBtn.disabled = (i === 0);
    nextBtn.textContent = (i === steps.length - 1 ? "Start" : "Next");
    stepIndex = i;
  }

  // 7) Build the three option‑grids
  function makeCards(list, container, key) {
    list.forEach(item => {
      const div = document.createElement("div");
      div.className = "option-card";
      div.textContent = item.name || item;
      div.dataset.value = item.name || item;
      div.onclick = () => {
        container.querySelectorAll(".option-card").forEach(c=>c.classList.remove("selected"));
        div.classList.add("selected");
        choices[key] = div.dataset.value;
      };
      container.appendChild(div);
    });
  }
  makeCards(RACES,   raceGrid,   "race");
  makeCards(GENDERS, genderGrid, "gender");
  makeCards(CLASSES, classGrid,  "class");

  // 8) Back button
  backBtn.addEventListener("click", () => {
    if (stepIndex > 0) showStep(stepIndex - 1);
  });

  // 9) Next / Start
  nextBtn.addEventListener("click", () => {
    // name step?
    if (stepIndex === 0) {
      if (!nameInput.value.trim()) {
        alert("Please enter or generate a name!");
        return;
      }
      choices.name = nameInput.value.trim();
    } else {
      const key = keys[stepIndex];
      if (!choices[key]) {
        alert("Select one!");
        return;
      }
    }

    // advance or finish
    if (stepIndex < steps.length - 1) {
      showStep(stepIndex + 1);
    } else {
      // final: roll stats, apply racial bonuses, save + enterApp()
      const raw = {
        STR: rollAbility(), DEX: rollAbility(), CON: rollAbility(),
        INT: rollAbility(), WIS: rollAbility(), CHA: rollAbility()
      };
      const raceObj  = RACES.find(r=>r.name === choices.race);
      const scores   = {}, modifiers = {};
      for (let s in raw) {
        scores[s]    = raw[s] + (raceObj.bonuses[s]||0);
        modifiers[s] = mod(scores[s]);
      }
      const profile = {
        name:      choices.name,
        race:      choices.race,
        gender:    choices.gender,
        class:     choices.class,
        scores,
        modifiers
      };
      localStorage.setItem("tv_profile", JSON.stringify(profile));
      wizardEl.classList.add("hidden");
      enterApp();
    }
  });

  // Called when wizard is finished
  function completeWizard(finalProfile) {
    localStorage.setItem('tv_profile', JSON.stringify(finalProfile));

    // Hide wizard and show main game
    document.getElementById('wizard').classList.add('hidden');
    document.getElementById('game-interface').classList.remove('hidden');

    window.renderSheet?.(); // trigger stat sheet render if loaded
  }
  
  // 10) Play / Reset
  playBtn.addEventListener("click", () => {
    splashEl.classList.add("hidden");
    if (!localStorage.getItem("tv_profile")) {
      wizardEl.classList.remove("hidden");
      showStep(0);
    } else {
      enterApp();
    }
    
  });
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("tv_profile");
    splashEl.classList.remove("hidden");
    wizardEl.classList.add("hidden");
    gameEl.classList.add("hidden");
    showStep(0);
  });

  // 11) kick off at step 0
  showStep(0);
})();