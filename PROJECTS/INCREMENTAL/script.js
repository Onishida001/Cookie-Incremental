// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBkU5QEGcTeKMs6-3q4zfltpnMCRHPpzBk",
  authDomain: "cookie-incremental.firebaseapp.com",
  projectId: "cookie-incremental",
  storageBucket: "cookie-incremental.firebasestorage.app",
  messagingSenderId: "379694927395",
  appId: "1:379694927395:web:0c2fb1bd9451e10ce1eb96",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- GAME DATA ---
let cookies = 0;
let totalCookies = 0;
let cps = 0;
let rebirthPoints = 0;
let goldenMultiplier = 1;
let rainbowMultiplier = 1;
let orbitEnabled = true;
let buyAmount = 1;
let userLogged = null;
let userName = "";
let currentLang = "en"; // ← declarado aqui
let modes = {
  fishing: {
    unlocked: false,
    fishCoins: 0,
    rodLevel: 1,
    baitLevel: 0,
    netLevel: 0,
    boatLevel: 0,
    crystalFishLevel: 0,
  },
};

// ← onAuthStateChanged APÓS as variáveis
auth.onAuthStateChanged((user) => {
  if (user) {
    userLogged = user;
    userName = user.displayName || user.email.split("@")[0];
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    loadCloudData();
  } else {
    document.getElementById("auth-screen").style.display = "flex";
    document.getElementById("game-container").style.display = "none";
  }
});

// --- PROTEÇÃO DE ASSETS ---
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("dragstart", (e) => {
  if (e.target.tagName === "IMG") e.preventDefault();
});
document.addEventListener("selectstart", (e) => e.preventDefault());

const suffixes = [
  "",
  "k",
  "m",
  "b",
  "t",
  "Qd",
  "Qn",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "Dc",
  "Ud",
  "Dd",
  "Td",
  "qD",
  "qN",
  "Sxd",
  "Sd",
  "Ocd",
  "Nod",
  "Vg",
  "Uvg",
  "Dvg",
  "Tvg",
  "qVg",
  "Qnvg",
  "Sxvg",
  "Spvg",
  "Ocvg",
  "Novg",
  "Tg",
  "Utg",
  "Dtg",
  "Ttg",
  "qTg",
  "Qntg",
  "Sxtg",
  "Sptg",
  "Octg",
  "Notg",
  "Qg",
  "Uqg",
  "Dqg",
  "Tqg",
  "qQg",
  "Qnqg",
  "Sxqg",
  "Spqg",
  "Ocqg",
  "Noqg",
  "Qng",
  "UQng",
  "DQng",
  "TQng",
  "qQng",
  "QQng",
  "sQng",
  "SQng",
  "OQng",
  "NQng",
  "sQg",
  "UsQg",
  "DsQg",
  "TsQg",
  "qsQg",
  "QsQg",
  "ssQg",
  "SsQg",
  "OsQg",
  "NsQg",
  "SQg",
  "USQg",
  "DSQg",
  "TSQg",
  "qSQg",
  "QSQg",
  "sSQg",
  "SSQg",
  "OsQg",
  "NsQg",
  "OQg",
  "UOQg",
  "DOQg",
  "TOQg",
  "qOQg",
  "QOQg",
  "sOQg",
  "SOQg",
  "OOQg",
  "NOQg",
  "NQg",
  "UNQg",
  "DNQg",
  "TNQg",
  "qNQg",
  "QNQg",
  "sNQg",
  "SNQg",
  "ONQg",
  "NNQg",
  "Dg",
];

// --- MUSIC CONTROL ---
const gameMusic = new Audio("assets/audios/crystal-waves-v2.0.mp3");
gameMusic.loop = true;
gameMusic.volume = 0.2;
let isMuted = false;

function startMusic() {
  gameMusic.play().catch(() => {
    console.log("Music waiting for user interaction...");
  });
  document.removeEventListener("click", startMusic);
}
document.addEventListener("click", startMusic);

function toggleMute() {
  isMuted = !isMuted;
  gameMusic.muted = isMuted;
  const btn = document.getElementById("mute-btn");
  btn.innerText = isMuted ? t("unmuteMusic") : t("muteMusic"); // ← usa t()
}

function toggleOrbit() {
  orbitEnabled = !orbitEnabled;
  const btn = document.getElementById("orbit-btn");
  if (orbitEnabled) {
    btn.innerText = t("disablePickaxes"); // ← usa t()
    updateOrbitingPickaxes();
  } else {
    btn.innerText = t("enablePickaxes"); // ← usa t()
    const orbitContainer = document.getElementById("orbit-container");
    if (orbitContainer) orbitContainer.innerHTML = "";
  }
  localStorage.setItem("orbitEnabled", orbitEnabled);
}

function toggleSettings() {
  const modal = document.getElementById("settings-modal");
  document.getElementById("settings-username").innerText = userName;
  const orbitBtn = document.getElementById("orbit-btn");
  if (orbitBtn) {
    orbitBtn.innerText = orbitEnabled
      ? t("disablePickaxes")
      : t("enablePickaxes"); // ← usa t()
  }
  modal.style.display = modal.style.display === "none" ? "flex" : "none";
}

function formatNumbers(num) {
  if (isNaN(num) || num === undefined) return "0";
  if (num < 1000) return Math.floor(num).toString();
  const exp = Math.floor(Math.log10(num) / 3);
  if (exp >= suffixes.length) {
    return (
      (num / Math.pow(10, (suffixes.length - 1) * 3)).toFixed(1) +
      suffixes[suffixes.length - 1]
    );
  }
  return (
    (num / Math.pow(10, exp * 3)).toFixed(1).replace(/\.0$/, "") + suffixes[exp]
  );
}

// --- BUILDINGS ---
const buildings = [
  {
    id: "pickaxe",
    name: "Pickaxe",
    baseCost: 15,
    cps: 1,
    quantity: 0,
    image: "assets/images/upgrades/pickaxe.png",
  },
  {
    id: "grandpa",
    name: "Grandpa",
    baseCost: 100,
    cps: 5,
    quantity: 0,
    image: "assets/images/upgrades/grandpa.png",
  },
  {
    id: "farm",
    name: "Farm",
    baseCost: 2500,
    cps: 20,
    quantity: 0,
    image: "assets/images/upgrades/farm.png",
  },
  {
    id: "mine",
    name: "Mine",
    baseCost: 15000,
    cps: 50,
    quantity: 0,
    image: "assets/images/upgrades/mine.png",
  },
  {
    id: "factory",
    name: "Factory",
    baseCost: 100000,
    cps: 250,
    quantity: 0,
    image: "assets/images/upgrades/factory.png",
  },
  {
    id: "bank",
    name: "Bank",
    baseCost: 1e6,
    cps: 1000,
    quantity: 0,
    image: "assets/images/upgrades/bank.png",
  },
  {
    id: "wizard-tower",
    name: "Wizard Tower",
    baseCost: 2.5e7,
    cps: 5000,
    quantity: 0,
    image: "assets/images/upgrades/wizard-tower.png",
  },
  {
    id: "hydro-eletric",
    name: "Hydro Electric",
    baseCost: 5e8,
    cps: 25000,
    quantity: 0,
    image: "assets/images/upgrades/hydro-electric.png",
  },
  {
    id: "nuclear-plant",
    name: "Nuclear Plant",
    baseCost: 1e10,
    cps: 100000,
    quantity: 0,
    image: "assets/images/upgrades/nuclear-plant.png",
  },
  {
    id: "data-center",
    name: "Data Center",
    baseCost: 5e11,
    cps: 250000,
    quantity: 0,
    image: "assets/images/upgrades/data-center.png",
  },
  {
    id: "portal",
    name: "Portal",
    baseCost: 2.5e12,
    cps: 5e6,
    quantity: 0,
    image: "assets/images/upgrades/portal.png",
  },
  {
    id: "satellite",
    name: "Satellite",
    baseCost: 1e16,
    cps: 7.5e7,
    quantity: 0,
    image: "assets/images/upgrades/satellite.png",
  },
  {
    id: "moon",
    name: "Moon",
    baseCost: 5e20,
    cps: 2.5e9,
    quantity: 0,
    image: "assets/images/upgrades/moon.png",
  },
  {
    id: "earth",
    name: "Earth",
    baseCost: 7.5e26,
    cps: 1e10,
    quantity: 0,
    image: "assets/images/upgrades/earth.png",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    baseCost: 1e31,
    cps: 7.5e12,
    quantity: 0,
    image: "assets/images/upgrades/jupiter-full.png",
  },
  {
    id: "sun",
    name: "Sun",
    baseCost: 2.5e34,
    cps: 2.5e13,
    quantity: 0,
    image: "assets/images/upgrades/sun.png",
  },
  {
    id: "black-hole",
    name: "Black Hole",
    baseCost: 7.5e40,
    cps: 1e15,
    quantity: 0,
    image: "assets/images/upgrades/black-hole.jpg",
  },
  {
    id: "hell",
    name: "Hell",
    baseCost: 5e42,
    cps: 1e17,
    quantity: 0,
    image: "assets/images/upgrades/hell.png",
  },
  {
    id: "heaven",
    name: "Heaven",
    baseCost: 7.5e43,
    cps: 5e19,
    quantity: 0,
    image: "assets/images/upgrades/heaven.png",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    baseCost: 1e45,
    cps: 2.5e21,
    quantity: 0,
    image: "assets/images/upgrades/galaxy.png",
  },
  {
    id: "universe",
    name: "Universe",
    baseCost: 7.5e51,
    cps: 5e23,
    quantity: 0,
    image: "assets/images/upgrades/universe.png",
  },
  {
    id: "multiverse",
    name: "Multiverse",
    baseCost: 2.5e56,
    cps: 7.5e25,
    quantity: 0,
    image: "assets/images/upgrades/multiverse.png",
  },
  {
    id: "omniverse",
    name: "Omniverse",
    baseCost: 5e62,
    cps: 1e27,
    quantity: 0,
    image: "assets/images/upgrades/omniverse.webp",
  },
  {
    id: "outerverse",
    name: "Outerverse",
    baseCost: 5e69,
    cps: 2.5e29,
    quantity: 0,
    image: "assets/images/upgrades/outerverse.png",
  },
  {
    id: "void",
    name: "The Void",
    baseCost: 5e75,
    cps: 5e31,
    quantity: 0,
    image: "assets/images/upgrades/void.png",
  },
];

// --- ACHIEVEMENTS ---
const achievements = [
  {
    id: "1k",
    title: "Apprentice",
    hint: "Reach 1,000 total crystals",
    condition: () => totalCookies >= 1000,
    unlocked: false,
  },
  {
    id: "1m",
    title: "Millionaire",
    hint: "Reach 1,000,000 total crystals",
    condition: () => totalCookies >= 1e6,
    unlocked: false,
  },
  {
    id: "1b",
    title: "Billionaire",
    hint: "Reach 1,000,000,000 total crystals",
    condition: () => totalCookies >= 1e9,
    unlocked: false,
  },
  {
    id: "1t",
    title: "Trillionaire",
    hint: "Reach 1,000,000,000,000 total crystals",
    condition: () => totalCookies >= 1e12,
    unlocked: false,
  },
  {
    id: "1Qd",
    title: "Quadrillionaire",
    hint: "Reach 1,000,000,000,000,000 total crystals",
    condition: () => totalCookies >= 1e15,
    unlocked: false,
  },
  {
    id: "1Qn",
    title: "Quintillionaire",
    hint: "Reach 1,000,000,000,000,000,000 total crystals",
    condition: () => totalCookies >= 1e18,
    unlocked: false,
  },
  {
    id: "1Sx",
    title: "Sextillionaire",
    hint: "Reach 1,000,000,000,000,000,000,000 total crystals",
    condition: () => totalCookies >= 1e21,
    unlocked: false,
  },
  {
    id: "50c",
    title: "Pickaxe Hero",
    hint: "Buy 50 Pickaxes",
    condition: () => buildings[0].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50g",
    title: "Grandma Hero",
    hint: "Buy 50 Grandmas",
    condition: () => buildings[1].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50f",
    title: "Farm Hero",
    hint: "Buy 50 Farms",
    condition: () => buildings[2].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50m",
    title: "Mine Hero",
    hint: "Buy 50 Mines",
    condition: () => buildings[3].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50ft",
    title: "Factory Hero",
    hint: "Buy 50 Factory",
    condition: () => buildings[4].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50b",
    title: "Bank Hero",
    hint: "Buy 50 Banks",
    condition: () => buildings[5].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50wt",
    title: "Wizard Tower Hero",
    hint: "Buy 50 Wizard Towers",
    condition: () => buildings[6].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50he",
    title: "Hydro Electric Hero",
    hint: "Buy 50 Hydro Electric Plants",
    condition: () => buildings[7].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50np",
    title: "Nuclear Plant Hero",
    hint: "Buy 50 Nuclear Plants",
    condition: () => buildings[8].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50dc",
    title: "Data Center Hero",
    hint: "Buy 50 Data Centers",
    condition: () => buildings[9].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50pt",
    title: "Portal Hero",
    hint: "Buy 50 Portals",
    condition: () => buildings[10].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50hl",
    title: "Hell Hero",
    hint: "Buy 50 Hell",
    condition: () => buildings[11].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50he",
    title: "Heaven Hero",
    hint: "Buy 50 Heaven",
    condition: () => buildings[12].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50st",
    title: "Satellite Hero",
    hint: "Buy 50 Satellites",
    condition: () => buildings[13].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50mn",
    title: "Moon Hero",
    hint: "Buy 50 Moons",
    condition: () => buildings[14].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50ea",
    title: "Earth Hero",
    hint: "Buy 50 Earths",
    condition: () => buildings[15].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50jp",
    title: "Jupiter Hero",
    hint: "Buy 50 Jupiters",
    condition: () => buildings[16].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50sn",
    title: "Sun Hero",
    hint: "Buy 50 Suns",
    condition: () => buildings[17].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50bl",
    title: "Black-Hole Hero",
    hint: "Buy 50 Black-Holes",
    condition: () => buildings[18].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50gl",
    title: "Galaxy Hero",
    hint: "Buy 50 Galaxies",
    condition: () => buildings[19].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50un",
    title: "Universe Hero",
    hint: "Buy 50 Universes",
    condition: () => buildings[20].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50mt",
    title: "Multiverse Hero",
    hint: "Buy 50 Multiverses",
    condition: () => buildings[21].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50om",
    title: "Omniverse Hero",
    hint: "Buy 50 Omniverses",
    condition: () => buildings[22].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50out",
    title: "Outerverse Hero",
    hint: "Buy 50 Outerverses",
    condition: () => buildings[23].quantity >= 50,
    unlocked: false,
  },
  {
    id: "50vd",
    title: "Void Hero",
    hint: "Buy 50 Voids",
    condition: () => buildings[24].quantity >= 50,
    unlocked: false,
  },
];

const rebirthUpgrades = [
  {
    id: "cp",
    name: "Muscle Memory",
    cost: 10,
    level: 0,
    desc: "2x Crystals.",
  },
  {
    id: "at",
    name: "Auto-Tapper",
    cost: 10,
    level: 0,
    desc: "Auto Clicks = Easy Farm.",
  },
];

// ============================
// FISHING SYSTEM
// ============================
const FISH_TYPES = [
  {
    id: "catfish",
    name: "Catfish",
    image: "assets/images/fish/catfish.png",
    rarity: "Common",
    rarityColor: "#00e676",
    baseCoins: 5,
    chance: 0.5,
  },
  {
    id: "tuna",
    name: "Tuna",
    image: "assets/images/fish/tuna.png",
    rarity: "Rare",
    rarityColor: "#2196F3",
    baseCoins: 15,
    chance: 0.3,
  },
  {
    id: "clownfish",
    name: "Clownfish",
    image: "assets/images/fish/clownfish.png",
    rarity: "Epic",
    rarityColor: "#a855f7",
    baseCoins: 40,
    chance: 0.15,
  },
  {
    id: "barracuda",
    name: "Barracuda",
    image: "assets/images/fish/barracuda.png",
    rarity: "Legendary",
    rarityColor: "#FFD700",
    baseCoins: 120,
    chance: 0.05,
  },
];

const FISHING_UPGRADES = [
  {
    id: "rod",
    name: "Better Rod",
    icon: "🎣",
    desc: "Reduces fishing time",
    maxLevel: 10,
    baseCost: 250,
    effect: (lvl) => `${Math.max(800, 3000 - lvl * 200)}ms cast time`,
  },
  {
    id: "bait",
    name: "Better Bait",
    icon: "🪱",
    desc: "Increases catch chance",
    maxLevel: 10,
    baseCost: 500,
    effect: (lvl) => `+${lvl * 5}% catch chance`,
  },
  {
    id: "net",
    name: "Fishing Net",
    icon: "🕸️",
    desc: "Chance to catch multiple fish",
    maxLevel: 5,
    baseCost: 750,
    effect: (lvl) => `${lvl * 20}% multi-catch chance`,
  },
  {
    id: "boat",
    name: "Boat",
    icon: "⛵",
    desc: "Multiplies fish coins earned",
    maxLevel: 5,
    baseCost: 1000,
    effect: (lvl) => `${lvl > 0 ? lvl * 2 : 1}x coins multiplier`,
  },
  {
    id: "crystalFish",
    name: "Crystal Fish",
    icon: "💎",
    desc: "Multiplies crystal production by 1.25x",
    maxLevel: 5,
    baseCost: 2500,
    effect: (lvl) => `x${Math.pow(1.25, lvl).toFixed(2)} crystal multiplier`,
  },
];

let isFishing = false;

function getCastTime() {
  const rodLvl = modes.fishing.rodLevel || 1;
  return Math.max(800, 3000 - (rodLvl - 1) * 200);
}

function getCatchChance() {
  const baitLvl = modes.fishing.baitLevel || 0;
  return Math.min(0.95, 0.5 + baitLvl * 0.05);
}

function getCoinsMultiplier() {
  const boatLvl = modes.fishing.boatLevel || 0;
  return boatLvl > 0 ? boatLvl * 2 : 1;
}

function rollFish() {
  const rand = Math.random();
  let cumulative = 0;
  for (let fish of FISH_TYPES) {
    cumulative += fish.chance;
    if (rand <= cumulative) return fish;
  }
  return FISH_TYPES[0];
}

function castLine() {
  if (isFishing) return;
  isFishing = true;

  const statusEl = document.getElementById("fishing-status");
  const hookEl = document.getElementById("fishing-hook");

  if (!statusEl) {
    isFishing = false;
    return;
  } // ← reseta se falhar

  statusEl.innerHTML = `<span style="color:#00f2fe">Casting...</span>`;

  if (hookEl) {
    hookEl.style.transition = `top ${getCastTime()}ms ease-in`;
    hookEl.style.top = "80%";
  }

  setTimeout(() => {
    const caught = Math.random() < getCatchChance();

    if (caught) {
      const fish = rollFish();
      const netLvl = modes.fishing.netLevel || 0;
      const multiCatch = Math.random() < netLvl * 0.2;
      const catchCount = multiCatch ? 2 : 1;
      let totalCoins = 0;
      let caughtNames = [];

      for (let i = 0; i < catchCount; i++) {
        const f = i === 0 ? fish : rollFish();
        // ← coins agora está dentro do loop onde f existe
        const coins = Math.floor(
          f.baseCoins * getCoinsMultiplier() * getFishFrenzyMultiplier(),
        );
        totalCoins += coins;
        caughtNames.push(f.name);
        showCaughtFish(f, coins, i);
      }

      modes.fishing.fishCoins += totalCoins;
      const fishDisplay = document.getElementById("fish-coins");
      if (fishDisplay)
        fishDisplay.innerText = formatNumbers(modes.fishing.fishCoins);

      statusEl.innerHTML = `<span style="color:${fish.rarityColor}">🐟 ${caughtNames.join(" + ")}! +${formatNumbers(totalCoins)}🪙</span>`;

      if (hookEl) {
        hookEl.style.transition = "top 0.3s ease-out";
        hookEl.style.top = "0%";
      }
      saveCloudData();
    } else {
      statusEl.innerHTML = `<span style="color:#ff6b6b">💨 Got away...</span>`;
      if (hookEl) {
        hookEl.style.transition = "top 0.3s ease-out";
        hookEl.style.top = "0%";
      }
    }

    setTimeout(() => {
      isFishing = false;
      if (statusEl)
        statusEl.innerHTML = `<span style="color:#aaa">Click the water to fish!</span>`;
    }, 1200);
  }, getCastTime());
}

function showCaughtFish(fish, coins, offset) {
  const area = document.getElementById("water-area");
  if (!area) return;

  const popup = document.createElement("div");
  popup.className = "fish-caught-popup";
  popup.style.left = `${25 + offset * 35}%`;
  popup.innerHTML = `
    <img src="${fish.image}" style="width:45px;height:45px;object-fit:contain;filter:drop-shadow(0 0 5px ${fish.rarityColor});">
    <div style="color:${fish.rarityColor};font-size:0.65rem;font-weight:bold;">${fish.rarity}</div>
    <div style="color:#FFD700;font-size:0.75rem;">+${formatNumbers(coins)}🪙</div>
  `;
  area.appendChild(popup);
  setTimeout(() => popup.remove(), 2000);
}

function renderFishingUpgrades() {
  const container = document.getElementById("fishing-upgrades-container");
  if (!container) return;
  container.innerHTML = "";

  FISHING_UPGRADES.forEach((upg) => {
    const key = upg.id === "rod" ? "rodLevel" : upg.id + "Level";
    const currentLevel =
      upg.id === "rod"
        ? (modes.fishing.rodLevel || 1) - 1
        : modes.fishing[key] || 0;

    const isMaxed = currentLevel >= upg.maxLevel;
    const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
    const canAfford = modes.fishing.fishCoins >= cost;

    container.innerHTML += `
      <div class="fishing-upgrade-item ${isMaxed ? "maxed" : ""} ${!canAfford && !isMaxed ? "cant-afford" : ""}">
        <div class="fishing-upg-icon">${upg.icon}</div>
        <div class="fishing-upg-info">
          <div class="fishing-upg-name">${upg.name} <span class="fishing-upg-level">${currentLevel}/${upg.maxLevel}</span></div>
          <div class="fishing-upg-effect">${upg.effect(currentLevel)}</div>
        </div>
        <button class="fishing-upg-btn ${isMaxed ? "maxed" : ""}"
          onclick="buyFishingUpgrade('${upg.id}')"
          ${isMaxed || !canAfford ? "disabled" : ""}>
          ${isMaxed ? "MAX" : `🪙 ${formatNumbers(cost)}`}
        </button>
      </div>
    `;
  });
}

function buyFishingUpgrade(id) {
  const upg = FISHING_UPGRADES.find((u) => u.id === id);
  if (!upg) return;

  const key = id === "rod" ? "rodLevel" : id + "Level";
  const currentLevel =
    id === "rod" ? (modes.fishing.rodLevel || 1) - 1 : modes.fishing[key] || 0;

  if (currentLevel >= upg.maxLevel) return;

  const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));

  if (modes.fishing.fishCoins >= cost) {
    modes.fishing.fishCoins -= cost;

    if (id === "rod") {
      modes.fishing.rodLevel = (modes.fishing.rodLevel || 1) + 1;
    } else {
      modes.fishing[key] = currentLevel + 1;
    }

    if (id === "crystalFish") recalculate();

    const fishDisplay = document.getElementById("fish-coins");
    if (fishDisplay)
      fishDisplay.innerText = formatNumbers(modes.fishing.fishCoins);

    renderFishingUpgrades();
    saveCloudData();
  }
}

// --- AUTH ---
function handleAuth(type) {
  const userInp = document.getElementById("auth-username").value.trim();
  const pass = document.getElementById("auth-pass").value;
  if (!userInp || !pass) return showAlert("Fill all fields!");
  const fakeEmail = `${userInp.toLowerCase()}@cookie.com`;

  if (type === "register") {
    cookies = 0;
    totalCookies = 0;
    rebirthPoints = 0;
    buildings.forEach((b) => (b.quantity = 0));
    rebirthUpgrades.forEach((u) => (u.level = 0));

    auth
      .createUserWithEmailAndPassword(fakeEmail, pass)
      .then((res) => {
        res.user.updateProfile({ displayName: userInp }).then(() => {
          userName = userInp;
          saveCloudData();
          updateUI();
        });
      })
      .catch((e) => showAlert(e.message));
  } else {
    auth
      .signInWithEmailAndPassword(fakeEmail, pass)
      .catch((e) => showAlert("❌ Wrong username or password!"));
  }
}

// --- CLOUD SAVE ---
async function saveCloudData() {
  if (!userLogged) return;

  const dataToSave = {
    name: userName,
    cookies: cookies,
    totalCookies: totalCookies,
    rebirthPoints: rebirthPoints,
    lastSeen: Date.now(),
    modes: {
      fishing: {
        unlocked: modes.fishing.unlocked,
        fishCoins: modes.fishing.fishCoins,
        rodLevel: modes.fishing.rodLevel || 1,
        baitLevel: modes.fishing.baitLevel || 0,
        netLevel: modes.fishing.netLevel || 0,
        boatLevel: modes.fishing.boatLevel || 0,
        crystalFishLevel: modes.fishing.crystalFishLevel || 0,
      },
    },
    buildings: buildings.map((b) => ({ id: b.id, quantity: b.quantity })),
    rebirthUpgrades: rebirthUpgrades.map((u) => ({ id: u.id, level: u.level })),
    achievements: achievements.map((a) => ({ id: a.id, unlocked: a.unlocked })),
  };

  await db
    .collection("users")
    .doc(userLogged.uid)
    .set(dataToSave, { merge: true });
  console.log("Progress synced with cloud.");
}

// --- CLOUD LOAD ---
async function loadCloudData() {
  const savedOrbit = localStorage.getItem("orbitEnabled");
  if (savedOrbit !== null) orbitEnabled = savedOrbit === "true";
  const doc = await db.collection("users").doc(userLogged.uid).get();
  if (doc.exists) {
    const d = doc.data();

    cookies = d.cookies || 0;
    totalCookies = d.totalCookies || 0;
    rebirthPoints = d.rebirthPoints || 0;

    if (d.modes && d.modes.fishing) {
      modes.fishing.unlocked = d.modes.fishing.unlocked || false;
      modes.fishing.fishCoins = d.modes.fishing.fishCoins || 0;
      modes.fishing.rodLevel = d.modes.fishing.rodLevel || 1;
      modes.fishing.baitLevel = d.modes.fishing.baitLevel || 0;
      modes.fishing.netLevel = d.modes.fishing.netLevel || 0;
      modes.fishing.boatLevel = d.modes.fishing.boatLevel || 0;
      modes.fishing.crystalFishLevel = d.modes.fishing.crystalFishLevel || 0;

      const fishDisplay = document.getElementById("fish-coins");
      if (fishDisplay)
        fishDisplay.innerText = formatNumbers(modes.fishing.fishCoins);
    }

    if (d.buildings) {
      d.buildings.forEach((sb) => {
        let b = buildings.find((i) => i.id === sb.id);
        if (b) b.quantity = sb.quantity;
      });
    }

    if (d.rebirthUpgrades) {
      d.rebirthUpgrades.forEach((su, i) => {
        if (rebirthUpgrades[i]) {
          rebirthUpgrades[i].level = su.level;
          rebirthUpgrades[i].cost = Math.floor(10 * Math.pow(4, su.level));
        }
      });
      const multiElement = document.getElementById("multi-val");
      if (multiElement)
        multiElement.innerText = getRebirthMultiplier().toFixed(2) + "x";
    }

    if (d.achievements) {
      d.achievements.forEach((sa) => {
        let a = achievements.find((i) => i.id === sa.id);
        if (a) a.unlocked = sa.unlocked;
      });
    }

    achievements.forEach((ach) => {
      if (!ach.unlocked && ach.condition()) {
        ach.unlocked = true;
        showAchievement(ach.title);
        saveCloudData();
      }
    });

    // Versão mínima — mude MIN_VERSION para forçar atualização
    const CURRENT_VERSION = [0, 9, 0];
    const MIN_VERSION = [0, 9, 0];
    const isOutdated = CURRENT_VERSION.some((v, i) => v < MIN_VERSION[i]);
    if (isOutdated) {
      showAlert(
        "⚠️ Your version is outdated!<br>Please update the game on the Play Store.",
      );
      return;
    }

    recalculate();

    const lastSeen = d.lastSeen || null;
    const offlineEarned = calcOfflineEarnings(lastSeen);
    const hoursAway = lastSeen ? (Date.now() - lastSeen) / 3600000 : 0;

    if (offlineEarned > 0 && hoursAway > 1 / 60) {
      setTimeout(() => showOfflineModal(offlineEarned, hoursAway), 1200);
    }

    updateUI();
    updateModeUI();
    updateOrbitingPickaxes();
    applyTranslations();
    checkFirstLogin();
    listenToEvents();
    startGoldenCookieSystem();
    initCrystalSparkles();
    if (userName === ADMIN_USER) {
      // ← de volta para ADMIN_USER simples
      setTimeout(renderAdminPanel, 500);
    }
    console.log("Data loaded successfully!");
  }
}

// --- RANKING ---
async function updateGlobalRanking() {
  const cList = document.getElementById("ranking-cookies");
  const rList = document.getElementById("ranking-rebirths");
  if (!cList || !rList) return;

  const snapC = await db
    .collection("users")
    .orderBy("totalCookies", "desc")
    .limit(100)
    .get();
  cList.innerHTML = "";
  let indexC = 1;
  snapC.forEach((doc) => {
    const d = doc.data();
    cList.innerHTML += `<div class="ranking-item"><span>${indexC}º - ${d.name || "Anonymous"}</span><span>${formatNumbers(d.totalCookies || 0)}</span></div>`;
    indexC++;
  });

  const snapR = await db
    .collection("users")
    .orderBy("rebirthPoints", "desc")
    .limit(100)
    .get();
  rList.innerHTML = "";
  let indexR = 1;
  snapR.forEach((doc) => {
    const d = doc.data();
    rList.innerHTML += `<div class="ranking-item"><span>${indexR}º - ${d.name || "Anonymous"}</span><span>${formatNumbers(d.rebirthPoints || 0)}</span></div>`;
    indexR++;
  });
}

// --- VISUAL FX ---
function spawnFX(e, val) {
  const text = document.createElement("div");
  text.className = "floating-text";
  text.innerText = `+${formatNumbers(val)}`;
  text.style.left = `${e.clientX}px`;
  text.style.top = `${e.clientY}px`;
  document.body.appendChild(text);
  setTimeout(() => text.remove(), 800);

  for (let i = 0; i < 6; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.setProperty("--x", `${(Math.random() - 0.5) * 200}px`);
    p.style.setProperty("--y", `${(Math.random() - 0.5) * 200}px`);
    p.style.left = `${e.clientX}px`;
    p.style.top = `${e.clientY}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }

  const pickaxe = document.createElement("img");
  pickaxe.src = "assets/images/upgrades/pickaxe.png";
  pickaxe.className = "pickaxe-hit";
  pickaxe.style.left = e.clientX + 10 + "px";
  pickaxe.style.top = e.clientY - 50 + "px";
  document.body.appendChild(pickaxe);
  setTimeout(() => pickaxe.remove(), 150);
}

function getRebirthMultiplier() {
  const rp = rebirthPoints;
  if (rp <= 100) {
    return 1 + Math.log10(1 + rp) * 1.0;
  } else if (rp <= 1000) {
    const base = 1 + Math.log10(101) * 1.0;
    return base + Math.log10(rp / 100) * 5;
  } else if (rp <= 10000) {
    const base = 1 + Math.log10(101) * 1.0 + Math.log10(10) * 5;
    return base + Math.log10(rp / 1000) * 17;
  } else {
    const base =
      1 + Math.log10(101) * 1.0 + Math.log10(10) * 5 + Math.log10(10) * 17;
    return base + Math.pow(rp / 10000, 0.55) * 35;
  }
}

// --- CORE ---
function recalculate() {
  cps = 0;

  // Fórmula em 3 estágios baseada nos tiers dos upgrades:
  // Early (0-100 RP):    crescimento rápido para motivar os primeiros rebirths
  // Mid (100-1000 RP):   crescimento moderado
  // Late (1000+ RP):     crescimento lento mas nunca para — necessário para o Void
  let multi;
  if (rebirthPoints <= 100) {
    // Estágio 1: 1x → ~3x
    multi = 1 + Math.log10(1 + rebirthPoints) * 1.0;
  } else if (rebirthPoints <= 1000) {
    // Estágio 2: ~3x → ~8x
    const base = 1 + Math.log10(101) * 1.0;
    multi = base + Math.log10(rebirthPoints / 100) * 5;
  } else if (rebirthPoints <= 10000) {
    // Estágio 3: ~8x → ~25x
    const base = 1 + Math.log10(101) * 1.0 + Math.log10(10) * 5;
    multi = base + Math.log10(rebirthPoints / 1000) * 17;
  } else {
    // Estágio 4: 10k+ RP — escala para alcançar o Void
    const base =
      1 + Math.log10(101) * 1.0 + Math.log10(10) * 5 + Math.log10(10) * 17;
    multi = base + Math.pow(rebirthPoints / 10000, 0.4) * 20;
  }

  const crystalFishLvl = modes.fishing.crystalFishLevel || 0;
  const crystalFishBonus = Math.pow(1.25, crystalFishLvl);
  const crystalStormBonus = getCrystalStormMultiplier();
  const specialBonus =
    goldenMultiplier > 1 && rainbowMultiplier > 1
      ? goldenMultiplier * rainbowMultiplier * 2
      : goldenMultiplier * rainbowMultiplier;

  buildings.forEach(
    (b) =>
      (cps +=
        b.cps *
        b.quantity *
        multi *
        crystalFishBonus *
        crystalStormBonus *
        specialBonus),
  );
}

function updateUI() {
  document.getElementById("cookie-count").innerText = formatNumbers(cookies);
  document.getElementById("cps").innerText = formatNumbers(
    cps * goldenMultiplier,
  );

  // ← Math.floor para mostrar inteiro correto
  document.getElementById("pending-points").innerText = formatNumbers(
    Math.floor(cookies / getRebirthCost()),
  );

  document.getElementById("rebirth-points").innerText =
    formatNumbers(rebirthPoints);

  // ← usa getRebirthMultiplier()
  const multiplierValue = getRebirthMultiplier();
  const multiElement = document.getElementById("multi-val");
  if (multiElement) multiElement.innerText = multiplierValue.toFixed(2) + "";

  buildings.forEach((item) => {
    const costSpan = document.getElementById(`cost-${item.id}`);
    const qtdDisplay = document.getElementById(`qtd-${item.id}`);
    const div = document.getElementById(`item-${item.id}`);

    let unitCost = item.baseCost * Math.pow(1.15, item.quantity);
    let displayCost = 0;
    let canBuyCount = 0;

    if (buyAmount === "max") {
      let tempC = cookies,
        tempQ = item.quantity;
      while (tempC >= item.baseCost * Math.pow(1.15, tempQ)) {
        let nextPrice = item.baseCost * Math.pow(1.15, tempQ);
        tempC -= nextPrice;
        displayCost += nextPrice;
        tempQ++;
        canBuyCount++;
      }
      if (canBuyCount === 0) displayCost = unitCost;
    } else {
      for (let i = 0; i < buyAmount; i++)
        displayCost += item.baseCost * Math.pow(1.15, item.quantity + i);
    }

    if (costSpan) {
      let bulkText =
        buyAmount === "max" && canBuyCount > 0 ? ` (${canBuyCount}x)` : "";
      costSpan.innerText = formatNumbers(displayCost) + bulkText;
    }
    if (qtdDisplay) qtdDisplay.innerText = item.quantity;
    if (div) {
      let threshold = buyAmount === "max" ? unitCost : displayCost;
      cookies < threshold
        ? div.classList.add("disabled")
        : div.classList.remove("disabled");
    }
  });
}

function buyItem(idx) {
  const item = buildings[idx];
  let totalCost = 0,
    count = 0;

  if (buyAmount === "max") {
    let tempC = cookies,
      tempQ = item.quantity;
    while (tempC >= item.baseCost * Math.pow(1.15, tempQ)) {
      let cost = item.baseCost * Math.pow(1.15, tempQ);
      tempC -= cost;
      totalCost += cost;
      tempQ++;
      count++;
    }
  } else {
    count = buyAmount;
    for (let i = 0; i < count; i++)
      totalCost += item.baseCost * Math.pow(1.15, item.quantity + i);
  }

  if (cookies >= totalCost && count > 0) {
    cookies -= totalCost;
    item.quantity += count;
    recalculate();
    updateUI();
    if (idx === 0) updateOrbitingPickaxes();
    new Audio("assets/audios/sucess.mp3").play().catch(() => {});
    saveCloudData();
  }
}

// --- MODES ---
function unlockMode(id) {
  if (rebirthPoints < 100) {
    showAlert(
      `❌ You need <span style="color:#a855f7">100 RP</span> to unlock Fishing Mode!`,
    );
    return;
  }
  showConfirm(
    `Unlock <span style="color:#00e676">Fishing Mode</span> for <span style="color:#a855f7">100 RP</span>?`,
    () => {
      rebirthPoints -= 100;
      modes.fishing.unlocked = true;
      updateModeUI();
      updateUI();
      saveCloudData();
    },
  );
}

function updateModeUI() {
  if (modes.fishing.unlocked) {
    document.getElementById("unlock-fishing").style.display = "none";
    document.getElementById("enter-fishing").style.display = "inline-block";
  }
}

function showSubMode(targetId) {
  const modesMenu = document.getElementById("modes-menu");
  const fishingArea = document.getElementById("fishing-area");

  if (targetId === "modes-menu") {
    modesMenu.style.setProperty("display", "flex", "important");
    fishingArea.style.setProperty("display", "none", "important");
  } else if (targetId === "fishing-area") {
    modesMenu.style.setProperty("display", "none", "important");
    fishingArea.style.setProperty("display", "flex", "important");
    renderFishingUpgrades();
  }
}

// --- REBIRTH ---
function renderRebirthShop() {
  const shop = document.getElementById("rebirth-shop-container");
  if (!shop) return;
  shop.innerHTML = "";

  const LIMITS = { 0: 50, 1: 10 };

  rebirthUpgrades.forEach((u, i) => {
    const isMaxed = u.level >= LIMITS[i];
    const price = Math.floor(10 * Math.pow(4, u.level));
    const description = u.desc || "Improve your crystal production!";

    shop.innerHTML += `
      <div class="rebirth-item ${isMaxed ? "maxed" : ""}">
        <h3>${u.name} (Lvl: ${u.level}/${LIMITS[i]})</h3>
        <p>${description}</p>
        <button class="prestige-btn" onclick="buyRebirthUpg(${i})" ${isMaxed ? "disabled" : ""}>
          ${isMaxed ? "MAX LEVEL" : "Upgrade: " + formatNumbers(price) + " Pts"}
        </button>
      </div>
    `;
  });
}

document.getElementById("btn-rebirth").onclick = async () => {
  let pendingPoints = Math.floor(cookies / getRebirthCost());

  if (pendingPoints <= 0) {
    showAlert(
      `You need at least <span style="color:#00f2fe">${formatNumbers(getRebirthCost())}</span> crystals to Rebirth!`,
    );
    return;
  }

  showConfirm(
    `Rebirth now?<br><br>You will receive <span style="color:#a855f7; font-size:1.2rem">${formatNumbers(pendingPoints)} RP</span><br><br><small style="color:#ff6b6b">All crystals and buildings will be reset!</small>`,
    async () => {
      rebirthPoints += pendingPoints;
      cookies = 0;
      buildings.forEach((b) => (b.quantity = 0));
      recalculate();
      await saveCloudData();
      updateUI();
      showAlert("✨ Rebirth successful! Your multiplier has increased.");
      document.querySelectorAll(".nav-btn")[0].click();
    },
  );
};

function getRebirthCost() {
  return Math.floor(5000 * Math.pow(1.5, Math.log10(1 + rebirthPoints)));
}

function buyRebirthUpg(i) {
  const u = rebirthUpgrades[i];
  const LIMITS = { 0: 50, 1: 10 };

  if (u.level >= LIMITS[i]) {
    showAlert("⚠️ This upgrade has reached its maximum level!");
    return;
  }

  let upgradePrice = Math.floor(10 * Math.pow(4, u.level));

  if (rebirthPoints >= upgradePrice) {
    rebirthPoints -= upgradePrice;
    u.level++;
    u.cost = Math.floor(10 * Math.pow(4, u.level));
    recalculate();
    renderRebirthShop();
    updateUI();
    saveCloudData();
  } else {
    showAlert(
      `❌ You need more <span style="color:#a855f7">Rebirth Points!</span>`,
    );
  }
}

// --- CLICK ---
document.getElementById("big-cookie").onmousedown = (e) => {
  const clickSound = new Audio("assets/audios/clicking.mp3");
  clickSound.volume = 0.1;
  clickSound.play().catch(() => {});

  const crystal = document.getElementById("big-cookie");
  crystal.classList.add("clicking");
  setTimeout(() => crystal.classList.remove("clicking"), 150);

  let rebirthBonus = getRebirthMultiplier(); // ← atualizado
  let muscleMemoryBonus = Math.pow(2, rebirthUpgrades[0].level);
  let crystalFishBonus = Math.pow(1.25, modes.fishing.crystalFishLevel || 0);
  let val = rebirthBonus * muscleMemoryBonus * crystalFishBonus;

  cookies += val;
  totalCookies += val;
  spawnFX(e, val);
  updateUI();
};

// --- ADMIN CHEATS ---
const gameAdmins = ["SamucaZZ", "Juninho", "JotaLusca"];
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "p" && gameAdmins.includes(userName)) {
    const cheatAmount = 10000;
    cookies += cheatAmount;
    totalCookies += cheatAmount;
    updateUI();
    console.log(`Cheat activated by Admin ${userName}: +10k`);
  }
});

// --- ACHIEVEMENT TOAST ---
function showAchievement(title) {
  const toast = document.getElementById("achievement-toast");
  const achTitle = document.getElementById("ach-title");
  if (toast && achTitle) {
    achTitle.innerText = title;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

// --- GAME LOOP ---
setInterval(() => {
  recalculate();

  let inc = (cps * goldenMultiplier) / 10;
  if (rebirthUpgrades[1].level > 0)
    inc += (rebirthUpgrades[1].level * getRebirthMultiplier()) / 10; // ← atualizado
  cookies += inc;
  totalCookies += inc;
  updateUI();

  achievements.forEach((ach) => {
    if (!ach.unlocked && ach.condition()) {
      ach.unlocked = true;
      showAchievement(ach.title);
    }
  });
}, 100);

setInterval(saveCloudData, 20000);
setInterval(updateGlobalRanking, 60000);

// --- NAV ---
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
    if (btn.dataset.target === "ranking-tab") updateGlobalRanking();
    if (btn.dataset.target === "rebirth-tab") renderRebirthShop();
    if (btn.dataset.target === "achievements-tab") renderAchievements();
  };
});

// --- STORE ---
function initStore() {
  const container = document.getElementById("store-items");
  container.innerHTML = "";
  buildings.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "store-item";
    div.id = `item-${item.id}`;
    div.onclick = () => buyItem(i);
    div.innerHTML = `
      <img src="${item.image}" class="icone-loja">
      <div class="item-info">
        <h3>${item.name}</h3>
        <p class="price-container">
          <img src="assets/images/ores/crystal.png" class="tiny-crystal">
          <span id="cost-${item.id}">0</span>
        </p>
      </div>
      <div class="item-count" id="qtd-${item.id}">0</div>
    `;
    container.appendChild(div);
  });
}

document.querySelectorAll(".selector-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".selector-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    buyAmount =
      btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
    updateUI();
  };
});

// --- ACHIEVEMENTS ---
function renderAchievements() {
  const list = document.getElementById("achievements-list");
  const progressBar = document.getElementById("achievement-progress-bar");
  const progressText = document.getElementById("progress-text");
  if (!list) return;

  list.innerHTML = "";
  let unlockedCount = 0;

  achievements.forEach((ach) => {
    if (ach.unlocked) unlockedCount++;
    const card = document.createElement("div");
    card.className = `achievement-card ${ach.unlocked ? "unlocked" : ""}`;
    card.onclick = () =>
      showAlert(`
      <div style="text-align:center">
        <div style="font-size:2rem">${ach.unlocked ? "🏆" : "🔒"}</div>
        <b style="color:${ach.unlocked ? "var(--gold)" : "#aaa"}">${ach.title}</b>
        <br><br>
        <span style="color:#aaa;font-size:0.75rem">${ach.hint}</span>
        <br><br>
        <span style="color:${ach.unlocked ? "#00e676" : "#ff6b6b"}">
          ${ach.unlocked ? "✓ UNLOCKED" : "✗ LOCKED"}
        </span>
      </div>
    `);
    card.innerHTML = `
      <div style="font-size: 1.5rem;">${ach.unlocked ? "🏆" : "🔒"}</div>
      <b style="font-size: 0.7rem;">${ach.title}</b>
    `;
    list.appendChild(card);
  });

  let percent = (unlockedCount / achievements.length) * 100;
  progressBar.style.width = `${percent}%`;
  progressText.innerText = `${unlockedCount}/${achievements.length} Unlocked (${Math.floor(percent)}%)`;
}

// --- ORBIT SYSTEM ---
function updateOrbitingPickaxes() {
  const orbitContainer = document.getElementById("orbit-container");
  if (!orbitContainer) return;
  orbitContainer.innerHTML = "";
  if (!orbitEnabled) return;

  let pickaxeCount = buildings[0].quantity;
  if (!pickaxeCount || pickaxeCount <= 0) return;

  const layers = [
    { maxItems: 8, radius: 110, speed: 20, size: 50 },
    { maxItems: 16, radius: 150, speed: 25, size: 42 },
    { maxItems: 24, radius: 192, speed: 30, size: 34 },
    { maxItems: 32, radius: 236, speed: 35, size: 32 },
    { maxItems: 40, radius: 280, speed: 40, size: 28 },
    { maxItems: 50, radius: 326, speed: 45, size: 26 },
  ];

  let remaining = pickaxeCount;
  let layerIndex = 0;

  while (remaining > 0 && layerIndex < layers.length) {
    const layer = layers[layerIndex];
    const countInLayer = Math.min(remaining, layer.maxItems);
    remaining -= countInLayer;

    const ring = document.createElement("div");
    ring.className = "orbit-ring";
    ring.style.animationDuration = layer.speed + "s";
    ring.style.animationDirection = layerIndex % 2 === 0 ? "normal" : "reverse";

    for (let i = 0; i < countInLayer; i++) {
      const img = document.createElement("img");
      img.src = "assets/images/upgrades/pickaxe.png";
      img.className = "orbit-pickaxe";
      img.style.width = layer.size + "px";
      img.style.height = layer.size + "px";
      img.style.marginTop = -(layer.size / 2) + "px";
      img.style.marginLeft = -(layer.size / 2) + "px";
      const angle = (360 / countInLayer) * i;
      img.style.transform = `rotate(${angle}deg) translateY(-${layer.radius}px) rotate(135deg)`;
      ring.appendChild(img);
    }

    orbitContainer.appendChild(ring);
    layerIndex++;
  }
}

// --- OFFLINE EARNINGS ---
const MAX_OFFLINE_HOURS = 8;

function calcOfflineEarnings(lastSeen) {
  if (!lastSeen) return 0;
  const now = Date.now();
  const diffMs = now - lastSeen;
  const diffSeconds = Math.min(diffMs / 1000, MAX_OFFLINE_HOURS * 3600);
  return Math.floor(cps * 0.5 * diffSeconds);
}

function showOfflineModal(earned, hoursAway) {
  const modal = document.createElement("div");
  modal.id = "offline-modal";

  const hoursText =
    hoursAway >= 1
      ? `${Math.floor(hoursAway)}h ${Math.floor((hoursAway % 1) * 60)}min`
      : `${Math.floor(hoursAway * 60)}min`;

  modal.innerHTML = `
    <div id="offline-card">
      <div id="offline-icon">💤</div>
      <h2 id="offline-title">${t("welcomeBack")}</h2>
      <p id="offline-away-text">${t("awayFor")} <span class="offline-highlight">${hoursText}</span></p>
      <div id="offline-reward-box">
        <img src="assets/images/ores/crystal.png" id="offline-crystal-img">
        <span id="offline-amount">+${formatNumbers(earned)}</span>
      </div>
      <p id="offline-subtitle">${t("crystalsCollected")}</p>
      <button id="offline-claim-btn" onclick="claimOffline(${earned})">${t("claimReward")}</button>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("offline-visible"));
}

function claimOffline(earned) {
  cookies += earned;
  totalCookies += earned;
  updateUI();
  saveCloudData();

  const modal = document.getElementById("offline-modal");
  if (modal) {
    modal.classList.remove("offline-visible");
    modal.classList.add("offline-hiding");
    setTimeout(() => modal.remove(), 500);
  }
}

// ============================
// ADMIN PANEL SYSTEM
// ============================

const ADMIN_USER = "SamucaZZ";

// Eventos globais salvos no Firestore
const EVENTS = {
  crystalStorm: {
    id: "crystalStorm",
    name: "Crystal Storm",
    icon: "💎",
    color: "#a855f7",
    duration: 5 * 60, // 5 minutos em segundos
    description: "2.5x Crystal production for 5 minutes!",
  },
  goldenHour: {
    id: "goldenHour",
    name: "Shiny Hour",
    icon: "✨",
    color: "#FFD700",
    duration: 5 * 60,
    description: "Shiny Crystals appear 10x more often!",
  },
  fishFrenzy: {
    id: "fishFrenzy",
    name: "Fish Frenzy",
    icon: "🐟",
    color: "#00f2fe",
    duration: 5 * 60,
    description: "2x Fish Coins for 5 minutes!",
  },
  rainbowHour: {
    id: "rainbowHour",
    name: "Rainbow Hour",
    icon: "🌈",
    color: "#ff0080",
    duration: 5 * 60,
    description: "Rainbow crystals appear 5x more often!",
  },
};

let activeEvents = {}; // { eventId: { endsAt: timestamp } }
let eventTimerInterval = null;
let adminPanelMinimized = false;

// Escuta eventos em tempo real do Firestore
function listenToEvents() {
  db.collection("global")
    .doc("events")
    .onSnapshot((doc) => {
      if (doc.exists) {
        activeEvents = doc.data().active || {};
      } else {
        activeEvents = {};
      }
      updateEventDisplay();
      updateAdminActiveEvents();
      recalculate();
      scheduleNextGoldenCookie();
      if (isEventActive("crystalStorm")) {
        startCrystalStormFX();
      } else {
        stopCrystalStormFX();
      }
    });
}

// Admin ativa um evento
async function activateEvent(eventId) {
  const event = EVENTS[eventId];
  if (!event) return;

  const now = Date.now();
  const endsAt = now + event.duration * 1000;

  // Salva no Firestore para todos verem
  await db
    .collection("global")
    .doc("events")
    .set(
      {
        active: {
          ...activeEvents,
          [eventId]: {
            endsAt,
            startedBy: userName,
            name: event.name,
            icon: event.icon,
            color: event.color,
          },
        },
      },
      { merge: true },
    );

  showAdminToast(`✅ ${event.name} activated for all players!`);
}

// Remove evento expirado do Firestore
async function removeEvent(eventId) {
  const current = { ...activeEvents };
  delete current[eventId];
  await db.collection("global").doc("events").set({ active: current });
}

// Verifica se um evento está ativo
function isEventActive(eventId) {
  if (!activeEvents[eventId]) return false;
  return Date.now() < activeEvents[eventId].endsAt;
}

// Retorna multiplicador do Crystal Storm
function getCrystalStormMultiplier() {
  return isEventActive("crystalStorm") ? 4 : 1;
}

// Retorna multiplicador do Fish Frenzy
function getFishFrenzyMultiplier() {
  return isEventActive("fishFrenzy") ? 2 : 1;
}

// Retorna se Golden Hour está ativo
function isGoldenHourActive() {
  return isEventActive("goldenHour");
}

// Atualiza display dos eventos na tela
function updateEventDisplay() {
  // ← Remove apenas os badges de eventos, NÃO o golden-badge
  document
    .querySelectorAll(".event-badge:not(#golden-badge)")
    .forEach((el) => el.remove());
  if (eventTimerInterval) clearInterval(eventTimerInterval);

  const now = Date.now();
  let activeCount = 0;

  Object.entries(activeEvents).forEach(([eventId, data]) => {
    if (now >= data.endsAt) {
      removeEvent(eventId);
      return;
    }

    const remaining = Math.ceil((data.endsAt - now) / 1000);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    const badge = document.createElement("div");
    badge.className = "event-badge";
    badge.id = `event-badge-${eventId}`;
    badge.style.bottom = `${85 + activeCount * 80}px`;
    badge.style.right = "15px";
    badge.style.borderColor = data.color;
    badge.style.boxShadow = `0 0 15px ${data.color}60`;
    badge.innerHTML = `
      <div class="event-badge-icon" style="text-shadow: 0 0 10px ${data.color}">${data.icon}</div>
      <div class="event-badge-info">
        <div class="event-badge-name" style="color:${data.color}">${data.name}</div>
        <div class="event-badge-timer" id="timer-${eventId}">${mins}:${secs.toString().padStart(2, "0")}</div>
      </div>
    `;
    document.body.appendChild(badge);
    activeCount++;
  });

  if (activeCount > 0) {
    eventTimerInterval = setInterval(tickEventTimers, 1000);
  }

  if (isEventActive("crystalStorm")) {
    startCrystalStormFX();
  } else {
    stopCrystalStormFX();
  }
}

// Atualiza os timers a cada segundo
function tickEventTimers() {
  const now = Date.now();
  let anyActive = false;

  Object.entries(activeEvents).forEach(([eventId, data]) => {
    const timerEl = document.getElementById(`timer-${eventId}`);
    if (!timerEl) return;

    const remaining = Math.ceil((data.endsAt - now) / 1000);

    if (remaining <= 0) {
      removeEvent(eventId);
      return;
    }

    anyActive = true;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timerEl.innerText = `${mins}:${secs.toString().padStart(2, "0")}`;

    // Pisca vermelho nos últimos 30 segundos
    if (remaining <= 30) {
      timerEl.style.color = "#ff4444";
      timerEl.style.animation = "timerPulse 1s infinite";
    }
  });

  if (!anyActive) clearInterval(eventTimerInterval);
}

// Admin: adiciona crystals
function adminAddCrystals() {
  cookies += 999999;
  totalCookies += 999999;
  updateUI();
  saveCloudData();
  showAdminToast("💎 +999,999 Crystals added!");
}

// Admin: adiciona fish coins
function adminAddFishCoins() {
  modes.fishing.fishCoins += 999999;
  const fishDisplay = document.getElementById("fish-coins");
  if (fishDisplay)
    fishDisplay.innerText = formatNumbers(modes.fishing.fishCoins);
  renderFishingUpgrades();
  saveCloudData();
  showAdminToast("🪙 +999,999 Fish Coins added!");
}

// Admin: cancela evento ativo
async function adminCancelEvent(eventId) {
  await removeEvent(eventId);
  showAdminToast(`❌ ${EVENTS[eventId]?.name} cancelled!`);
}

function showAdminToast(msg) {
  const toast = document.createElement("div");
  toast.className = "admin-toast";
  toast.innerText = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function toggleAdminPanel() {
  adminPanelMinimized = !adminPanelMinimized;
  const panel = document.getElementById("admin-panel");
  const body = document.getElementById("admin-panel-body");
  const btn = document.getElementById("admin-minimize-btn");
  if (adminPanelMinimized) {
    body.style.display = "none";
    btn.innerText = "▲";
    panel.style.height = "auto";
  } else {
    body.style.display = "flex";
    btn.innerText = "▼";
  }
}

function renderAdminPanel() {
  if (userName !== ADMIN_USER) return;
  if (document.getElementById("admin-panel")) return;

  const panel = document.createElement("div");
  panel.id = "admin-panel";
  panel.innerHTML = `
    <div id="admin-panel-header">
      <span>⚡ ADMIN PANEL</span>
      <button id="admin-minimize-btn" onclick="toggleAdminPanel()">▼</button>
    </div>
    <div id="admin-panel-body">
      <div class="admin-section-title">💰 Resources</div>
      <div class="admin-btn-row">
        <button class="admin-btn crystal-btn" onclick="adminAddCrystals()">💎 +999k Crystals</button>
        <button class="admin-btn fish-btn" onclick="adminAddFishCoins()">🪙 +999k Fish Coins</button>
      </div>

      <div class="admin-section-title">🎉 Global Events</div>
      <div class="admin-events-grid">
        <div class="admin-event-card" id="card-crystalStorm">
          <div class="admin-event-icon">💎</div>
          <div class="admin-event-name">Crystal Storm</div>
          <div class="admin-event-desc">2.5x crystals • 5min</div>
          <button class="admin-btn event-btn" onclick="activateEvent('crystalStorm')">ACTIVATE</button>
        </div>
        <div class="admin-event-card" id="card-goldenHour">
          <div class="admin-event-icon">✨</div>
          <div class="admin-event-name">Shiny Hour</div>
          <div class="admin-event-desc">10x shiny crystals • 5min</div>
          <button class="admin-btn event-btn" onclick="activateEvent('goldenHour')">ACTIVATE</button>
        </div>
        <div class="admin-event-card" id="card-rainbowHour">
          <div class="admin-event-icon">🌈</div>
           <div class="admin-event-info">
           <div class="admin-event-name">Rainbow Hour</div>
          <div class="admin-event-desc">Rainbow crystals 5x mais frequentes • 5min</div>
         </div>
         <button class="admin-btn event-btn" onclick="activateEvent('rainbowHour')">ACTIVATE</button>
        </div>
        <div class="admin-event-card" id="card-fishFrenzy">
          <div class="admin-event-icon">🐟</div>
          <div class="admin-event-name">Fish Frenzy</div>
          <div class="admin-event-desc">2x fish coins • 5min</div>
          <button class="admin-btn event-btn" onclick="activateEvent('fishFrenzy')">ACTIVATE</button>
        </div>
      </div>

      <div class="admin-section-title">🔴 Active Events</div>
      <div id="admin-active-events">
        <p style="color:#666;font-size:0.7rem;">No active events</p>
      </div>
    </div>
  `;

  document.body.appendChild(panel);
  updateAdminActiveEvents();
}

function updateAdminActiveEvents() {
  const container = document.getElementById("admin-active-events");
  if (!container) return;

  const now = Date.now();
  const active = Object.entries(activeEvents).filter(
    ([_, d]) => now < d.endsAt,
  );

  if (active.length === 0) {
    container.innerHTML = `<p style="color:#666;font-size:0.7rem;">No active events</p>`;
    return;
  }

  container.innerHTML = active
    .map(([id, data]) => {
      const remaining = Math.ceil((data.endsAt - now) / 1000);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return `
      <div class="admin-active-row">
        <span>${data.icon} ${data.name}</span>
        <span style="color:#aaa">${mins}:${secs.toString().padStart(2, "0")}</span>
        <button class="admin-btn cancel-btn" onclick="adminCancelEvent('${id}')">✕</button>
      </div>
    `;
    })
    .join("");
}

// Atualiza painel admin a cada segundo
setInterval(() => {
  if (userName === ADMIN_USER) updateAdminActiveEvents();
}, 1000);

// --- GOLDEN COOKIE / SHINY CRYSTAL SYSTEM ---
let goldenCookieTimeout = null;

function startGoldenCookieSystem() {
  scheduleNextGoldenCookie();
}

function scheduleNextGoldenCookie() {
  if (goldenCookieTimeout) clearTimeout(goldenCookieTimeout);
  const baseMin = isGoldenHourActive() ? 6000 : 60000;
  const baseMax = isGoldenHourActive() ? 18000 : 180000;
  const delay = Math.random() * (baseMax - baseMin) + baseMin;
  goldenCookieTimeout = setTimeout(showGoldenCookie, delay);
}

function showGoldenCookie() {
  const gc = document.getElementById("golden-cookie");
  if (!gc) return;
  const section = document.getElementById("cookie-section");
  if (!section) return;

  const rect = section.getBoundingClientRect();
  const x = rect.left + Math.random() * (rect.width - 80) + 10;
  const y = rect.top + Math.random() * (rect.height - 120) + 60;

  // 10x mais raro que o shiny — chance de 9% rainbow, 91% shiny
  const rainbowChance = isEventActive("rainbowHour") ? 0.45 : 0.09;
  const isRainbow = Math.random() < rainbowChance;
  gc.dataset.type = isRainbow ? "rainbow" : "golden";
  gc.src = isRainbow
    ? "assets/images/ores/rainbow-crystal.png"
    : "assets/images/ores/shiny-crystal.png";

  gc.style.left = x + "px";
  gc.style.top = y + "px";
  gc.style.display = "block";
  gc.style.filter = isRainbow
    ? "drop-shadow(0 0 10px #ff0080) drop-shadow(0 0 20px #00f2fe) drop-shadow(0 0 30px #FFD700)"
    : "drop-shadow(0 0 15px #FFD700) drop-shadow(0 0 30px #FFD700)";
  gc.style.animation =
    "goldenAppear 0.5s ease forwards, " +
    (isRainbow ? "rainbowPulse 1s infinite" : "pulse 1.5s 0.5s infinite");

  const hideTimer = setTimeout(() => hideGoldenCookie(), 15000);
  gc.onclick = (e) => {
    clearTimeout(hideTimer);
    collectGoldenCookie(e);
  };
}

function hideGoldenCookie() {
  const gc = document.getElementById("golden-cookie");
  if (gc) {
    gc.style.animation = "goldenDisappear 0.4s ease forwards";
    setTimeout(() => {
      gc.style.display = "none";
      gc.onclick = null;
    }, 400);
  }
  scheduleNextGoldenCookie();
}

function collectGoldenCookie(e) {
  const gc = document.getElementById("golden-cookie");
  const isRainbow = gc && gc.dataset.type === "rainbow";
  if (gc) {
    gc.style.display = "none";
    gc.onclick = null;
  }

  if (isRainbow) {
    collectRainbowCrystal(e);
  } else {
    collectShinyCrystal(e);
  }
}

function collectShinyCrystal(e) {
  // Remove badge anterior
  const oldBadge = document.getElementById("golden-badge");
  if (oldBadge) oldBadge.remove();
  if (window.goldenTimerInterval) {
    clearInterval(window.goldenTimerInterval);
    window.goldenTimerInterval = null;
  }

  goldenMultiplier = 3.25;
  recalculate();
  updateUI();

  showSpecialToast(
    "✨ Shiny Crystal!",
    "#FFD700",
    "10x Crystals for 15 seconds!",
  );
  spawnBadge(
    "golden-badge",
    "✨",
    "#FFD700",
    "Shiny Crystal",
    15,
    "left",
    () => {
      goldenMultiplier = 1;
      recalculate();
      updateUI();
    },
    "goldenTimerInterval",
  );

  scheduleNextGoldenCookie();
}

function collectRainbowCrystal(e) {
  // Remove badge anterior
  const oldBadge = document.getElementById("rainbow-badge");
  if (oldBadge) oldBadge.remove();
  if (window.rainbowTimerInterval) {
    clearInterval(window.rainbowTimerInterval);
    window.rainbowTimerInterval = null;
  }

  rainbowMultiplier = 1000;
  recalculate();
  updateUI();

  // Efeito visual especial
  document.body.style.animation = "rainbowFlash 0.5s ease";
  setTimeout(() => (document.body.style.animation = ""), 500);

  showSpecialToast(
    "🌈 Rainbow Crystal!",
    "linear-gradient(90deg,#ff0080,#FFD700,#00f2fe)",
    "1000x Crystals for 10 seconds!",
  );
  spawnBadge(
    "rainbow-badge",
    "🌈",
    "#ff0080",
    "Rainbow Crystal",
    10,
    "left",
    () => {
      rainbowMultiplier = 1;
      recalculate();
      updateUI();
    },
    "rainbowTimerInterval",
  );

  scheduleNextGoldenCookie();
}

function showSpecialToast(title, color, desc) {
  const toast = document.createElement("div");
  toast.className = "golden-toast";
  toast.innerHTML = `${title} <span style="color:${color}">${desc}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function spawnBadge(
  id,
  icon,
  color,
  name,
  duration,
  side,
  onExpire,
  intervalKey,
) {
  const offset = id === "rainbow-badge" ? 165 : 85;

  const badge = document.createElement("div");
  badge.id = id;
  badge.className = "event-badge";
  badge.style.cssText = `
    border-color: ${color};
    box-shadow: 0 0 15px ${color}99;
    bottom: ${offset}px;
    left: 15px;
    right: auto;
  `;
  badge.innerHTML = `
    <div class="event-badge-icon" style="text-shadow: 0 0 10px ${color}">${icon}</div>
    <div class="event-badge-info">
      <div class="event-badge-name" style="color:${color}">${name}</div>
      <div class="event-badge-timer" id="timer-${id}">0:${duration.toString().padStart(2, "0")}</div>
    </div>
  `;
  document.body.appendChild(badge);

  let remaining = duration;
  window[intervalKey] = setInterval(() => {
    remaining--;
    const timerEl = document.getElementById(`timer-${id}`);
    if (timerEl) {
      // ← sempre no formato 0:XX independente da duração
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timerEl.innerText = `${mins}:${secs.toString().padStart(2, "0")}`;

      if (remaining <= 5) {
        timerEl.style.color = "#ff4444";
        timerEl.style.animation = "timerPulse 0.5s infinite";
      }
    }

    if (remaining <= 0) {
      clearInterval(window[intervalKey]);
      window[intervalKey] = null;
      onExpire();
      const b = document.getElementById(id);
      if (b) {
        b.style.transition = "opacity 0.4s";
        b.style.opacity = "0";
        setTimeout(() => b.remove(), 400);
      }
    }
  }, 1000);
}

// --- CRYSTAL STORM VISUAL FX ---
let crystalStormInterval = null;

function startCrystalStormFX() {
  if (crystalStormInterval) return; // já está rodando

  crystalStormInterval = setInterval(() => {
    if (!isEventActive("crystalStorm")) {
      stopCrystalStormFX();
      return;
    }
    // Spawna 3 crystals por vez
    for (let i = 0; i < 3; i++) {
      spawnFallingCrystal();
    }
  }, 200);
}

function stopCrystalStormFX() {
  if (crystalStormInterval) {
    clearInterval(crystalStormInterval);
    crystalStormInterval = null;
  }
  // Remove todos os crystals caindo que sobraram
  document.querySelectorAll(".falling-crystal").forEach((el) => el.remove());
}

function spawnFallingCrystal() {
  const crystal = document.createElement("img");
  crystal.src = "assets/images/ores/crystal.png";
  crystal.className = "falling-crystal";

  // Posição horizontal aleatória em toda a tela
  const x = Math.random() * window.innerWidth;
  const size = Math.random() * 20 + 10; // entre 10px e 30px
  const duration = Math.random() * 2 + 1.5; // entre 1.5s e 3.5s
  const rotation = Math.random() * 360;
  const swayX = (Math.random() - 0.5) * 100; // balanço horizontal

  crystal.style.left = x + "px";
  crystal.style.width = size + "px";
  crystal.style.height = size + "px";
  crystal.style.setProperty("--sway", swayX + "px");
  crystal.style.animationDuration = duration + "s";
  crystal.style.animationDelay = "0s";
  crystal.style.transform = `rotate(${rotation}deg)`;
  crystal.style.opacity = Math.random() * 0.5 + 0.5;

  document.body.appendChild(crystal);

  // Remove após a animação terminar
  setTimeout(() => crystal.remove(), duration * 1000 + 100);
}

// --- CRYSTAL SPARKLES ---
function initCrystalSparkles() {
  const container = document.querySelector(".cookie-container");
  if (!container) return;

  const colors = ["#a855f7", "#00f2fe", "#ffffff", "#c084fc"];
  const count = 6;

  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "crystal-sparkle";

    const angle = (360 / count) * i;
    const duration = 4 + Math.random() * 3; // entre 4s e 7s
    const size = Math.random() * 5 + 4; // entre 4px e 9px
    const radius = 100 + Math.random() * 40; // entre 100px e 140px
    const color = colors[Math.floor(Math.random() * colors.length)];

    sparkle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 6px ${color}, 0 0 12px ${color};
      top: 50%;
      left: 50%;
      margin-top: -${size / 2}px;
      margin-left: -${size / 2}px;
      animation: sparkleSpin ${duration}s linear infinite;
      animation-delay: -${(duration / count) * i}s;
      transform-origin: ${radius}px 0;
    `;

    // Algumas partículas na direção contrária
    if (i % 2 === 0) {
      sparkle.style.animationDirection = "reverse";
    }

    container.appendChild(sparkle);
  }
}

// --- CUSTOM MODAL SYSTEM ---
function showAlert(message, onConfirm) {
  const modal = document.createElement("div");
  modal.className = "custom-modal-overlay";
  modal.innerHTML = `
    <div class="custom-modal">
      <p class="custom-modal-text">${message}</p>
      <div class="custom-modal-buttons">
        <button class="custom-modal-btn confirm" onclick="this.closest('.custom-modal-overlay').remove(); ${onConfirm ? "customModalCallback()" : ""}">OK</button>
      </div>
    </div>
  `;
  if (onConfirm) window.customModalCallback = onConfirm;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("show"));
}

function showConfirm(message, onConfirm, onCancel) {
  const modal = document.createElement("div");
  modal.className = "custom-modal-overlay";
  modal.innerHTML = `
    <div class="custom-modal">
      <p class="custom-modal-text">${message}</p>
      <div class="custom-modal-buttons">
        <button class="custom-modal-btn confirm" id="modal-ok">✓ CONFIRM</button>
        <button class="custom-modal-btn cancel" id="modal-cancel">✕ CANCEL</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("show"));

  modal.querySelector("#modal-ok").onclick = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
    if (onConfirm) onConfirm();
  };
  modal.querySelector("#modal-cancel").onclick = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
    if (onCancel) onCancel();
  };
}

// ============================
// TRANSLATION SYSTEM
// ============================
const TRANSLATIONS = {
  en: {
    // UI
    crystals: "Crystals",
    perSecond: "Per second/s:",
    upgrades: "Upgrades",
    rebirth: "Rebirth",
    gameModes: "Game Modes",
    topGlobal: "Top 100 Global",
    achievements: "Achievements",
    settings: "Settings",
    // Nav
    home: "HOME",
    rebirthNav: "REBIRTH",
    modes: "MODES",
    top: "TOP",
    achievementsNav: "ACHIEVEMENTS",
    // Store
    buyMax: "Max",
    // Rebirth
    globalMultiplier: "Global Multiplier:",
    rebirthBtn: "RP",
    rebirthUpgrades: "Rebirth Upgrades",
    // Fishing
    lakeIncremental: "🎣 Lake Incremental",
    fishCoins: "Fish Coins",
    clickToFish: "Click the water to fish!",
    casting: "Casting...",
    gotAway: "💨 Got away...",
    fishEncyclopedia: "🐠 Fish Encyclopedia",
    fishUpgrades: "⚙️ Upgrades",
    // Settings
    disablePickaxes: "⚙️ DISABLE PICKAXES",
    enablePickaxes: "⚙️ ENABLE PICKAXES",
    muteMusic: "🔊 MUTE MUSIC",
    unmuteMusic: "🔈 UNMUTE MUSIC",
    logout: "🚪 LOGOUT",
    close: "✕ CLOSE",
    language: "🌍 LANGUAGE",
    // Fishing Mode
    fishingMode: "🎣 Fishing Mode",
    fishingDesc: "Catch rare fish and earn Fish Coins!",
    unlockFishing: "Unlock (100 RP)",
    enterLake: "Enter Lake",
    back: "⬅ BACK",
    // Modals
    fillFields: "Fill all fields!",
    wrongPassword: "❌ Wrong username or password!",
    rebirthConfirm: "Rebirth now?",
    rebirthReceive: "You will receive",
    rebirthReset: "All crystals and buildings will be reset!",
    rebirthSuccess: "✨ Rebirth successful! Your multiplier has increased.",
    rebirthNeedCrystals: "You need at least",
    rebirthToCrystals: "crystals to Rebirth!",
    maxLevel: "⚠️ This upgrade has reached its maximum level!",
    needMoreRP: "❌ You need more Rebirth Points!",
    confirm: "✓ CONFIRM",
    cancel: "✕ CANCEL",
    ok: "OK",
    // Offline
    welcomeBack: "WELCOME BACK!",
    awayFor: "You were away for",
    crystalsCollected: "Crystals collected while you were gone",
    claimReward: "✨ CLAIM REWARD",
    // Fishing rarity
    common: "Common",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
    // Ranking
    rankingCrystals: "🔮 Crystals",
    rankingRP: "✨ RP",
  },

  pt: {
    crystals: "Cristais",
    perSecond: "Por segundo/s:",
    upgrades: "Melhorias",
    rebirth: "Renascimento",
    gameModes: "Modos de Jogo",
    topGlobal: "Top 100 Global",
    achievements: "Conquistas",
    settings: "Configurações",
    home: "INÍCIO",
    rebirthNav: "RENASCER",
    modes: "MODOS",
    top: "TOP",
    achievementsNav: "CONQUISTAS",
    buyMax: "Máx",
    globalMultiplier: "Multiplicador Global:",
    rebirthBtn: "RP",
    rebirthUpgrades: "Melhorias de Renascimento",
    lakeIncremental: "🎣 Lago Incremental",
    fishCoins: "Moedas de Peixe",
    clickToFish: "Clique na água para pescar!",
    casting: "Lançando...",
    gotAway: "💨 Escapou...",
    fishEncyclopedia: "🐠 Enciclopédia de Peixes",
    fishUpgrades: "⚙️ Melhorias",
    disablePickaxes: "⚙️ DESATIVAR PICARETAS",
    enablePickaxes: "⚙️ ATIVAR PICARETAS",
    muteMusic: "🔊 SILENCIAR MÚSICA",
    unmuteMusic: "🔈 ATIVAR MÚSICA",
    logout: "🚪 SAIR",
    close: "✕ FECHAR",
    language: "🌍 IDIOMA",
    fishingMode: "🎣 Modo Pesca",
    fishingDesc: "Pesque peixes raros e ganhe Moedas de Peixe!",
    unlockFishing: "Desbloquear (100 RP)",
    enterLake: "Entrar no Lago",
    back: "⬅ VOLTAR",
    fillFields: "Preencha todos os campos!",
    wrongPassword: "❌ Usuário ou senha incorretos!",
    rebirthConfirm: "Renascer agora?",
    rebirthReceive: "Você vai receber",
    rebirthReset: "Todos os cristais e melhorias serão resetados!",
    rebirthSuccess: "✨ Renascimento concluído! Seu multiplicador aumentou.",
    rebirthNeedCrystals: "Você precisa de pelo menos",
    rebirthToCrystals: "cristais para Renascer!",
    maxLevel: "⚠️ Este upgrade atingiu o nível máximo!",
    needMoreRP: "❌ Você precisa de mais Pontos de Renascimento!",
    confirm: "✓ CONFIRMAR",
    cancel: "✕ CANCELAR",
    ok: "OK",
    welcomeBack: "BEM-VINDO DE VOLTA!",
    awayFor: "Você ficou ausente por",
    crystalsCollected: "Cristais coletados enquanto você estava fora",
    claimReward: "✨ RESGATAR RECOMPENSA",
    common: "Comum",
    rare: "Raro",
    epic: "Épico",
    legendary: "Lendário",
    rankingCrystals: "🔮 Cristais",
    rankingRP: "✨ RP",
  },

  es: {
    crystals: "Cristales",
    perSecond: "Por segundo/s:",
    upgrades: "Mejoras",
    rebirth: "Renacimiento",
    gameModes: "Modos de Juego",
    topGlobal: "Top 100 Global",
    achievements: "Logros",
    settings: "Configuración",
    home: "INICIO",
    rebirthNav: "RENACER",
    modes: "MODOS",
    top: "TOP",
    achievementsNav: "LOGROS",
    buyMax: "Máx",
    globalMultiplier: "Multiplicador Global:",
    rebirthBtn: "RP",
    rebirthUpgrades: "Mejoras de Renacimiento",
    lakeIncremental: "🎣 Lago Incremental",
    fishCoins: "Monedas de Pez",
    clickToFish: "¡Haz clic en el agua para pescar!",
    casting: "Lanzando...",
    gotAway: "💨 Se escapó...",
    fishEncyclopedia: "🐠 Enciclopedia de Peces",
    fishUpgrades: "⚙️ Mejoras",
    disablePickaxes: "⚙️ DESACTIVAR PICOS",
    enablePickaxes: "⚙️ ACTIVAR PICOS",
    muteMusic: "🔊 SILENCIAR MÚSICA",
    unmuteMusic: "🔈 ACTIVAR MÚSICA",
    logout: "🚪 SALIR",
    close: "✕ CERRAR",
    language: "🌍 IDIOMA",
    fishingMode: "🎣 Modo Pesca",
    fishingDesc: "¡Pesca peces raros y gana Monedas de Pez!",
    unlockFishing: "Desbloquear (100 RP)",
    enterLake: "Entrar al Lago",
    back: "⬅ VOLVER",
    fillFields: "¡Completa todos los campos!",
    wrongPassword: "❌ Usuario o contraseña incorrectos!",
    rebirthConfirm: "¿Renacer ahora?",
    rebirthReceive: "Recibirás",
    rebirthReset: "¡Todos los cristales y mejoras serán reiniciados!",
    rebirthSuccess: "✨ ¡Renacimiento exitoso! Tu multiplicador ha aumentado.",
    rebirthNeedCrystals: "Necesitas al menos",
    rebirthToCrystals: "cristales para Renacer!",
    maxLevel: "⚠️ ¡Esta mejora ha alcanzado su nivel máximo!",
    needMoreRP: "❌ ¡Necesitas más Puntos de Renacimiento!",
    confirm: "✓ CONFIRMAR",
    cancel: "✕ CANCELAR",
    ok: "OK",
    welcomeBack: "¡BIENVENIDO DE VUELTA!",
    awayFor: "Estuviste ausente por",
    crystalsCollected: "Cristales recolectados mientras estabas fuera",
    claimReward: "✨ RECLAMAR RECOMPENSA",
    common: "Común",
    rare: "Raro",
    epic: "Épico",
    legendary: "Legendario",
    rankingCrystals: "🔮 Cristales",
    rankingRP: "✨ RP",
  },

  fr: {
    crystals: "Cristaux",
    perSecond: "Par seconde/s:",
    upgrades: "Améliorations",
    rebirth: "Renaissance",
    gameModes: "Modes de Jeu",
    topGlobal: "Top 100 Mondial",
    achievements: "Succès",
    settings: "Paramètres",
    home: "ACCUEIL",
    rebirthNav: "RENAISSANCE",
    modes: "MODES",
    top: "TOP",
    achievementsNav: "SUCCÈS",
    buyMax: "Max",
    globalMultiplier: "Multiplicateur Global:",
    rebirthBtn: "RP",
    rebirthUpgrades: "Améliorations de Renaissance",
    lakeIncremental: "🎣 Lac Incrémental",
    fishCoins: "Pièces de Poisson",
    clickToFish: "Cliquez sur l'eau pour pêcher!",
    casting: "Lancement...",
    gotAway: "💨 S'est échappé...",
    fishEncyclopedia: "🐠 Encyclopédie des Poissons",
    fishUpgrades: "⚙️ Améliorations",
    disablePickaxes: "⚙️ DÉSACTIVER PIOCHES",
    enablePickaxes: "⚙️ ACTIVER PIOCHES",
    muteMusic: "🔊 COUPER MUSIQUE",
    unmuteMusic: "🔈 ACTIVER MUSIQUE",
    logout: "🚪 DÉCONNEXION",
    close: "✕ FERMER",
    language: "🌍 LANGUE",
    fishingMode: "🎣 Mode Pêche",
    fishingDesc: "Pêchez des poissons rares et gagnez des Pièces!",
    unlockFishing: "Débloquer (100 RP)",
    enterLake: "Entrer dans le Lac",
    back: "⬅ RETOUR",
    fillFields: "Remplissez tous les champs!",
    wrongPassword: "❌ Nom d'utilisateur ou mot de passe incorrect!",
    rebirthConfirm: "Renaissance maintenant?",
    rebirthReceive: "Vous recevrez",
    rebirthReset: "Tous les cristaux et bâtiments seront réinitialisés!",
    rebirthSuccess: "✨ Renaissance réussie! Votre multiplicateur a augmenté.",
    rebirthNeedCrystals: "Vous avez besoin d'au moins",
    rebirthToCrystals: "cristaux pour Renaissance!",
    maxLevel: "⚠️ Cette amélioration a atteint son niveau maximum!",
    needMoreRP: "❌ Vous avez besoin de plus de Points de Renaissance!",
    confirm: "✓ CONFIRMER",
    cancel: "✕ ANNULER",
    ok: "OK",
    welcomeBack: "BIENVENUE DE RETOUR!",
    awayFor: "Vous étiez absent pendant",
    crystalsCollected: "Cristaux collectés pendant votre absence",
    claimReward: "✨ RÉCLAMER LA RÉCOMPENSE",
    common: "Commun",
    rare: "Rare",
    epic: "Épique",
    legendary: "Légendaire",
    rankingCrystals: "🔮 Cristaux",
    rankingRP: "✨ RP",
  },

  ja: {
    crystals: "クリスタル",
    perSecond: "毎秒/s:",
    upgrades: "アップグレード",
    rebirth: "リバース",
    gameModes: "ゲームモード",
    topGlobal: "グローバルトップ100",
    achievements: "実績",
    settings: "設定",
    home: "ホーム",
    rebirthNav: "リバース",
    modes: "モード",
    top: "TOP",
    achievementsNav: "実績",
    buyMax: "最大",
    globalMultiplier: "グローバル倍率:",
    rebirthBtn: "RP",
    rebirthUpgrades: "リバースアップグレード",
    lakeIncremental: "🎣 湖インクリメンタル",
    fishCoins: "フィッシュコイン",
    clickToFish: "水をクリックして釣り!",
    casting: "キャスト中...",
    gotAway: "💨 逃げられた...",
    fishEncyclopedia: "🐠 魚図鑑",
    fishUpgrades: "⚙️ アップグレード",
    disablePickaxes: "⚙️ ピッケル無効",
    enablePickaxes: "⚙️ ピッケル有効",
    muteMusic: "🔊 ミュート",
    unmuteMusic: "🔈 ミュート解除",
    logout: "🚪 ログアウト",
    close: "✕ 閉じる",
    language: "🌍 言語",
    fishingMode: "🎣 釣りモード",
    fishingDesc: "レアな魚を釣ってフィッシュコインを獲得!",
    unlockFishing: "アンロック (100 RP)",
    enterLake: "湖に入る",
    back: "⬅ 戻る",
    fillFields: "全てのフィールドを入力してください!",
    wrongPassword: "❌ ユーザー名またはパスワードが違います!",
    rebirthConfirm: "今すぐリバース?",
    rebirthReceive: "獲得する",
    rebirthReset: "全てのクリスタルと建物がリセットされます!",
    rebirthSuccess: "✨ リバース成功! 倍率が上がりました。",
    rebirthNeedCrystals: "リバースには最低",
    rebirthToCrystals: "クリスタルが必要です!",
    maxLevel: "⚠️ このアップグレードは最大レベルに達しました!",
    needMoreRP: "❌ リバースポイントが足りません!",
    confirm: "✓ 確認",
    cancel: "✕ キャンセル",
    ok: "OK",
    welcomeBack: "おかえりなさい!",
    awayFor: "不在時間:",
    crystalsCollected: "不在中に集めたクリスタル",
    claimReward: "✨ 報酬を受け取る",
    common: "コモン",
    rare: "レア",
    epic: "エピック",
    legendary: "レジェンダリー",
    rankingCrystals: "🔮 クリスタル",
    rankingRP: "✨ RP",
  },
};

function detectLanguage() {
  const saved = localStorage.getItem("gameLanguage");
  if (saved && TRANSLATIONS[saved]) {
    currentLang = saved;
    return;
  }
  const browserLang = navigator.language || navigator.userLanguage || "en";
  if (browserLang.startsWith("pt")) currentLang = "pt";
  else if (browserLang.startsWith("es")) currentLang = "es";
  else if (browserLang.startsWith("fr")) currentLang = "fr";
  else if (browserLang.startsWith("ja")) currentLang = "ja";
  else currentLang = "en";
}

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"][key] || key;
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem("gameLanguage", lang);
  applyTranslations();
  // Fecha o modal de idioma se estiver aberto
  const langModal = document.getElementById("language-modal");
  if (langModal) langModal.remove();
}

function applyTranslations() {
  // Nav buttons
  const navBtns = document.querySelectorAll(".nav-btn");
  const navKeys = ["home", "rebirthNav", "modes", "top", "achievementsNav"];
  const navIcons = ["🔮", "✨", "🕹️", "🌎", "🏆"];
  navBtns.forEach((btn, i) => {
    btn.innerHTML = `<span class="nav-icon">${navIcons[i]}</span>${t(navKeys[i])}`;
  });

  // Títulos das abas
  const titleMap = {
    "title-store": "upgrades",
    "title-rebirth": "rebirth",
    "title-modes": "gameModes",
    "title-ranking": "topGlobal",
    "title-achievements": "achievements",
    "title-settings": "settings",
    "title-fishing": "lakeIncremental",
  };
  Object.entries(titleMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.innerText = t(key);
  });

  // Score board
  const cpsEl = document.querySelector(".cps-text");
  if (cpsEl) {
    cpsEl.innerHTML = `${t("perSecond")} <span id="cps">${document.getElementById("cps")?.innerText || "0"}</span>`;
  }

  const cookieText = document.querySelector(".cookie-text");
  if (cookieText) {
    cookieText.innerHTML = `
      <span id="cookie-count">${document.getElementById("cookie-count")?.innerText || "0"}</span> ${t("crystals")}
      <img src="assets/images/ores/crystal.png" style="width: 40px; vertical-align: middle; margin-left: 10px;">
    `;
  }

  // Rebirth panel
  const multiValEl = document.getElementById("multi-val");
  const rebirthCardEl = document.querySelector(".rebirth-card");
  if (rebirthCardEl && multiValEl) {
    rebirthCardEl.innerHTML = `
      <p>${t("globalMultiplier")} <span id="multi-val" class="highlight">${multiValEl.innerText}</span></p>
      <p>RP: <span id="rebirth-points" class="highlight">${document.getElementById("rebirth-points")?.innerText || "0"}</span></p>
    `;
  }

  // Sub-title rebirth upgrades
  const subTitle = document.querySelector(".sub-title");
  if (subTitle) subTitle.innerText = t("rebirthUpgrades");

  // Fishing mode card
  const fishingTitle = document.querySelector(".mode-card h3");
  const fishingDesc = document.querySelector(".mode-card p");
  if (fishingTitle) fishingTitle.innerText = t("fishingMode");
  if (fishingDesc) fishingDesc.innerText = t("fishingDesc");

  const unlockBtn = document.getElementById("unlock-fishing");
  if (unlockBtn) unlockBtn.innerText = t("unlockFishing");

  const enterBtn = document.getElementById("enter-fishing");
  if (enterBtn) enterBtn.innerText = t("enterLake");

  // Fishing area
  const backBtn = document.querySelector(".fishing-back-btn");
  if (backBtn) backBtn.innerText = t("back");

  const fishCoinsDisplay = document.querySelector(".fish-coins-display");
  if (fishCoinsDisplay) {
    fishCoinsDisplay.innerHTML = `🪙 <span id="fish-coins">${document.getElementById("fish-coins")?.innerText || "0"}</span> ${t("fishCoins")}`;
  }

  const fishStatus = document.getElementById("fishing-status");
  if (fishStatus && !isFishing) {
    fishStatus.innerHTML = `<span style="color:#aaa">${t("clickToFish")}</span>`;
  }

  const galleryTitle = document.querySelector(".fish-gallery-title");
  if (galleryTitle) galleryTitle.innerText = t("fishEncyclopedia");

  const fishUpgradesTitle = document.querySelector(
    ".fishing-upgrades-panel .section-title",
  );
  if (fishUpgradesTitle) fishUpgradesTitle.innerText = t("fishUpgrades");

  // Settings buttons
  const orbitBtn = document.getElementById("orbit-btn");
  if (orbitBtn)
    orbitBtn.innerText = orbitEnabled
      ? t("disablePickaxes")
      : t("enablePickaxes");

  const muteBtn = document.getElementById("mute-btn");
  if (muteBtn) muteBtn.innerText = isMuted ? t("unmuteMusic") : t("muteMusic");

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.innerText = t("logout");

  // Selector buttons
  const selectorBtns = document.querySelectorAll(".selector-btn");
  selectorBtns.forEach((btn) => {
    if (btn.dataset.amount === "max") btn.innerText = t("buyMax");
  });

  // Ranking titles
  const rankCrystals = document.querySelector(
    "#ranking-tab .ranking-box:first-child h3",
  );
  const rankRP = document.querySelector(
    "#ranking-tab .ranking-box:last-child h3",
  );
  if (rankCrystals) rankCrystals.innerText = t("rankingCrystals");
  if (rankRP) rankRP.innerText = t("rankingRP");
}

function showLanguageModal() {
  const existing = document.getElementById("language-modal");
  if (existing) {
    existing.remove();
    return;
  }

  const langs = [
    { code: "en", flag: "🇺🇸", name: "English" },
    { code: "pt", flag: "🇧🇷", name: "Português" },
    { code: "es", flag: "🇪🇸", name: "Español" },
    { code: "fr", flag: "🇫🇷", name: "Français" },
    { code: "ja", flag: "🇯🇵", name: "日本語" },
  ];

  const modal = document.createElement("div");
  modal.id = "language-modal";
  modal.innerHTML = `
    <div class="lang-modal-card">
      <h3 class="lang-modal-title">🌍 ${t("language")}</h3>
      <div class="lang-grid">
        ${langs
          .map(
            (l) => `
          <button class="lang-btn ${currentLang === l.code ? "active" : ""}" onclick="setLanguage('${l.code}')">
            <span class="lang-flag">${l.flag}</span>
            <span class="lang-name">${l.name}</span>
            ${currentLang === l.code ? '<span class="lang-check">✓</span>' : ""}
          </button>
        `,
          )
          .join("")}
      </div>
      <button class="lang-close-btn" onclick="document.getElementById('language-modal').remove()">✕</button>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("show"));
}

// ============================
// TUTORIAL SYSTEM
// ============================
const TUTORIAL_STEPS = [
  {
    id: "click-crystal",
    target: "#big-cookie",
    title: "👆 Click the Crystal!",
    text: "Click the crystal to earn Crystals! The more you click, the faster you progress.",
    arrow: "bottom",
    position: "top",
  },
  {
    id: "store",
    target: "#store-section",
    title: "🛒 Buy Upgrades!",
    text: "Use your Crystals to buy upgrades on the right. Each upgrade increases your Crystals per second automatically!",
    arrow: "right",
    position: "left",
  },
  {
    id: "pickaxe",
    target: "#item-pickaxe",
    title: "⛏️ Start with Pickaxe!",
    text: "The Pickaxe is your first upgrade. Buy as many as you can — they generate 1 Crystal per second each!",
    arrow: "right",
    position: "left",
  },
  {
    id: "rebirth",
    target: "[data-target='rebirth-tab']",
    title: "✨ Rebirth System!",
    text: "When you have enough Crystals, go to REBIRTH to reset and gain RP — which permanently multiplies your production!",
    arrow: "top",
    position: "bottom",
  },
  {
    id: "fishing",
    target: "[data-target='modes-tab']",
    title: "🎣 Fishing Mode!",
    text: "Unlock Fishing Mode with 100 RP! Catch rare fish to earn Fish Coins and buy powerful upgrades.",
    arrow: "top",
    position: "bottom",
  },
  {
    id: "finish",
    target: null,
    title: "🎮 You're ready!",
    text: "That's everything you need to know! Watch out for Shiny Crystals that appear randomly — click them for big bonuses!",
    arrow: null,
    position: "center",
  },
];

let tutorialStep = 0;
let tutorialActive = false;

function checkFirstLogin() {
  const hasSeenTutorial = localStorage.getItem("tutorialDone");
  if (!hasSeenTutorial) {
    setTimeout(() => startTutorial(), 1500);
  }
}

function startTutorial() {
  tutorialActive = true;
  tutorialStep = 0;
  showTutorialStep(0);
}

function showTutorialStep(index) {
  // Remove step anterior
  const old = document.getElementById("tutorial-overlay");
  if (old) old.remove();

  if (index >= TUTORIAL_STEPS.length) {
    endTutorial();
    return;
  }

  const step = TUTORIAL_STEPS[index];
  const overlay = document.createElement("div");
  overlay.id = "tutorial-overlay";

  // Escurece tudo exceto o target
  let highlightHTML = "";
  let tooltipStyle = "";
  let arrowHTML = "";

  if (step.target) {
    const targetEl = document.querySelector(step.target);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const padding = 8;

      // Highlight box ao redor do elemento
      highlightHTML = `
        <div class="tutorial-highlight" style="
          left: ${rect.left - padding}px;
          top: ${rect.top - padding}px;
          width: ${rect.width + padding * 2}px;
          height: ${rect.height + padding * 2}px;
        "></div>
      `;

      // Posiciona o tooltip
      let tipLeft, tipTop;
      const tipWidth = 280;
      const tipHeight = 160;

      if (step.position === "top") {
        tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
        tipTop = rect.top - tipHeight - 20;
        arrowHTML = `<div class="tutorial-arrow arrow-down"></div>`;
      } else if (step.position === "bottom") {
        tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
        tipTop = rect.bottom + 20;
        arrowHTML = `<div class="tutorial-arrow arrow-up"></div>`;
      } else if (step.position === "left") {
        tipLeft = rect.left - tipWidth - 20;
        tipTop = rect.top + rect.height / 2 - tipHeight / 2;
        arrowHTML = `<div class="tutorial-arrow arrow-right"></div>`;
      } else if (step.position === "right") {
        tipLeft = rect.right + 20;
        tipTop = rect.top + rect.height / 2 - tipHeight / 2;
        arrowHTML = `<div class="tutorial-arrow arrow-left"></div>`;
      }

      // Garante que o tooltip não saia da tela
      tipLeft = Math.max(
        10,
        Math.min(tipLeft, window.innerWidth - tipWidth - 10),
      );
      tipTop = Math.max(
        10,
        Math.min(tipTop, window.innerHeight - tipHeight - 10),
      );

      tooltipStyle = `left: ${tipLeft}px; top: ${tipTop}px;`;
    }
  } else {
    // Centro da tela (último step)
    tooltipStyle = `
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    `;
  }

  const isLast = index === TUTORIAL_STEPS.length - 1;
  const progress = `${index + 1}/${TUTORIAL_STEPS.length}`;

  overlay.innerHTML = `
    <div class="tutorial-backdrop"></div>
    ${highlightHTML}
    <div class="tutorial-tooltip" style="${tooltipStyle}">
      ${arrowHTML}
      <div class="tutorial-progress">${progress}</div>
      <h3 class="tutorial-title">${step.title}</h3>
      <p class="tutorial-text">${step.text}</p>
      <div class="tutorial-buttons">
        <button class="tutorial-skip-btn" onclick="endTutorial()">Skip</button>
        <button class="tutorial-next-btn" onclick="nextTutorialStep()">
          ${isLast ? "🎮 Let's Play!" : "Next →"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
}

function nextTutorialStep() {
  tutorialStep++;
  showTutorialStep(tutorialStep);
}

function endTutorial() {
  tutorialActive = false;
  localStorage.setItem("tutorialDone", "true");
  const overlay = document.getElementById("tutorial-overlay");
  if (overlay) {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 400);
  }
}

function resetTutorial() {
  localStorage.removeItem("tutorialDone");
  tutorialStep = 0;
  showAlert("Tutorial reset! It will appear on next login.");
}

// --- INIT ---
initStore();
detectLanguage();
