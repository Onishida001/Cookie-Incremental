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
let totalPlayedSeconds = 0;
let playedSessionStart = Date.now();
let playedTickInterval = null;
let rankingRealtimeInterval = null;
let achievementRewardsClaimed = {}; // { "1k": true, "1m": true, ... }
let equippedSkin = "default";
let diamonds = 0;
let diamondUpgrades = {
  crystalBoost: 0, // max 5 — +50% crystals each
  rebirthBoost: 0, // max 5 — +30% RP each
  fishBoost: 0, // max 5 — +50% fish coins each
  woodBoost: 0, // max 5 — +50% wood each
  fleshBoost: 0, // max 5 — +50% flesh each
  runeBulkBoost: 0, // max 3 — +5 bulk each
  runeLuckBoost: 0, // max 3 — +10% luck each
};
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
  trees: {
    unlocked: false,
    wood: 0,
    axeLevel: 0,
    autoLevel: 0,
    rareLevel: 0,
    sawLevel: 0,
    crystalTreeLevel: 0,
  },
  mobs: {
    unlocked: false,
    flesh: 0,
    kills: 0,
    swordLevel: 0,
    autoSlayerLevel: 0,
    armorLevel: 0,
    mobLootLevel: 0,
    crystalMobLevel: 0,
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
  "Qad",
  "Qnd",
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

const CRYSTAL_SKINS = [
  {
    id: "default",
    name: "Default Crystal",
    nameKey: "skinDefault",
    image: "assets/images/ores/crystal.png",
    price: 0,
    owned: true, // sempre disponível
    comingSoon: false,
    glow: "rgba(168,85,247,0.8)",
    border: "#a855f7",
  },
  {
    id: "golden",
    name: "67 Crystal",
    nameKey: "skinGolden",
    image: "assets/images/ores/67-crystal.png", // trocar quando tiver o asset
    price: 4.99,
    owned: false,
    comingSoon: true,
    glow: "rgba(0, 255, 242, 0.9)",
    border: "#00d9ff",
    emoji: "🤷‍♂️",
  },
  {
    id: "rainbow",
    name: "Valentines Crystal",
    nameKey: "skinRainbow",
    image: "assets/images/ores/valentines-crystal.png",
    price: 6.99,
    owned: false,
    comingSoon: true,
    glow: "rgba(255, 0, 85, 0.8)",
    border: "#ff0080",
    emoji: "❤️",
  },
  {
    id: "halloween",
    name: "Halloween Crystal",
    nameKey: "skinHalloween",
    image: "assets/images/ores/halloween-crystal.png",
    price: 3.99,
    owned: false,
    comingSoon: true,
    glow: "rgba(255,100,0,0.9)",
    border: "#ff6400",
    emoji: "🎃",
  },
  {
    id: "christmas",
    name: "Christmas Crystal",
    nameKey: "skinChristmas",
    image: "assets/images/ores/christmas-crystal.png",
    price: 3.99,
    owned: false,
    comingSoon: true,
    glow: "rgba(0,230,118,0.9)",
    border: "#00e676",
    emoji: "🎄",
  },
  {
    id: "galaxy",
    name: "Galaxy Crystal",
    nameKey: "skinGalaxy",
    image: "assets/images/ores/galaxy-crystal.png",
    price: 7.99,
    owned: false,
    comingSoon: true,
    glow: "rgba(0,242,254,0.8)",
    border: "#00f2fe",
    emoji: "🌌",
  },
];

const DIAMOND_UPGRADES = [
  {
    id: "crystalBoost",
    name: "Crystal Amplifier",
    icon: "assets/images/ores/crystal.png",
    desc: "+50% Crystal production per level",
    maxLevel: 5,
    costPerLevel: [5, 10, 20, 40, 80],
    color: "#a855f7",
    effect: (lvl) => (lvl > 0 ? `+${lvl * 50}% Crystals` : "No bonus"),
  },
  {
    id: "rebirthBoost",
    name: "Rebirth Enhancer",
    icon: "assets/images/upgrades/pickaxe.png",
    desc: "+30% Rebirth multiplier per level",
    maxLevel: 5,
    costPerLevel: [8, 16, 32, 64, 128],
    color: "#c084fc",
    effect: (lvl) => (lvl > 0 ? `+${lvl * 30}% Rebirth mult` : "No bonus"),
  },
  {
    id: "fishBoost",
    name: "Fish Coin Booster",
    icon: "assets/images/modes/fish-coin.png",
    desc: "+50% Fish Coins per level",
    maxLevel: 5,
    costPerLevel: [5, 10, 20, 40, 80],
    color: "#FFD700",
    effect: (lvl) => (lvl > 0 ? `+${lvl * 50}% Fish Coins` : "No bonus"),
  },
  {
    id: "woodBoost",
    name: "Lumberjack Boost",
    icon: "assets/images/modes/log.png",
    desc: "+50% Wood per level",
    maxLevel: 5,
    costPerLevel: [5, 10, 20, 40, 80],
    color: "#8BC34A",
    effect: (lvl) => (lvl > 0 ? `+${lvl * 50}% Wood` : "No bonus"),
  },
  {
    id: "fleshBoost",
    name: "Slayer Boost",
    icon: "assets/images/modes/flesh.png",
    desc: "+50% Flesh per level",
    maxLevel: 5,
    costPerLevel: [5, 10, 20, 40, 80],
    color: "#ff4444",
    effect: (lvl) => (lvl > 0 ? `+${lvl * 50}% Flesh` : "No bonus"),
  },
  {
    id: "runeBulkBoost",
    name: "Rune Bulk Boost",
    icon: "assets/images/ores/crystal.png",
    desc: "+5 Rune Bulk cap per level",
    maxLevel: 3,
    costPerLevel: [15, 30, 60],
    color: "#ff9800",
    effect: (lvl) => (lvl > 0 ? `+${lvl * 5} Bulk cap` : "No bonus"),
  },
  {
    id: "runeLuckBoost",
    name: "Rune Luck Boost",
    icon: "assets/images/ores/crystal.png",
    desc: "+10% Rune Luck per level",
    maxLevel: 3,
    costPerLevel: [15, 30, 60],
    color: "#00e676",
    effect: (lvl) => (lvl > 0 ? `+${lvl * 10}% Rune Luck` : "No bonus"),
  },
];

// --- MUSIC CONTROL ---
const gameMusic = new Audio("assets/audios/music/crystal-waves-v2.0.mp3");
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

function logout() {
  showConfirm(
    `${t("logout")}?<br><small style='color:#aaa'>${t("crystalsCollected")}</small>`,
    () => auth.signOut().then(() => location.reload()),
  );
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
// TRANSLATION SYSTEM
// ============================
const TRANSLATIONS = {
  en: {
    // UI General
    crystals: "Crystals",
    perSecond: "Per second/s:",
    upgrades: "Upgrades",
    rebirth: "Rebirth",
    gameModes: "Game Modes",
    topGlobal: "Top 100 Global",
    achievements: "Achievements",
    settings: "Settings",
    buyMax: "Max",
    timePlayed: "⏱️ Time Played",
    rankingPlaytime: "⏱️ Time Played",

    // Nav (Bottom Menu)
    home: "HOME",
    rebirthNav: "REBIRTH",
    modes: "MODES",
    runes: "RUNES", // Chave corrigida para bater com o Nav
    top: "TOP",
    achievementsNav: "ACHIEVEMENTS",
    misc: "MISC",

    // Rebirth Panel
    globalMultiplier: "Global Multiplier:",
    rebirthBtn: "RP",
    rebirthUpgrades: "Rebirth Upgrades",

    // Runes System
    runesTitle: "💠 Rune Collection",
    runeBonuses: "✨ Active Bonuses",
    rollStarter: "Starter Roll",
    rollAdvanced: "Advanced Roll",
    rollAncient: "Ancient Roll",
    rollCelestial: "Celestial Roll",
    secretRune: "Secret Rune Found!",
    rollBtn: "ROLL",
    runeNameStarter: "Starter Rune",
    runeNameAdvanced: "Advanced Rune",
    runeNameAncient: "Ancient Rune",
    runeNameCelestial: "Celestial Rune",

    // Fishing Mode
    lakeIncremental: "🎣 Lake Incremental",
    fishCoins: "Fish Coins",
    clickToFish: "Click the water to fish!",
    casting: "Casting...",
    gotAway: "💨 Got away...",
    fishEncyclopedia: "🐠 Fish Encyclopedia",
    fishUpgrades: "⚙️ Upgrades",
    fishingMode: "🎣 Fishing Mode",
    fishingDesc: "Catch rare fish and earn Fish Coins!",
    unlockFishing: "Unlock",
    enterLake: "Enter Lake",

    // Trees Mode (Novo)
    treesMode: "🌲 Trees Mode",
    treesDesc: "Chop trees to get Wood and boost production!",
    unlockTrees: "Unlock",
    enterForest: "Enter Forest",
    wood: "Wood",
    woodPerClick: "Wood/Click",
    autoChop: "Auto Chop",

    // Mobs Mode (Novo)
    mobsMode: "⚔️ Mobs Mode",
    mobsDesc: "Slay monsters to get Flesh and rare loots!",
    unlockMobs: "Unlock",
    enterArena: "Enter Arena",
    flesh: "Flesh",
    damage: "Damage",
    autoSlayer: "Auto Slayer",
    kills: "Kills",

    // Settings
    disablePickaxes: "⚙️ DISABLE PICKAXES",
    enablePickaxes: "⚙️ ENABLE PICKAXES",
    muteMusic: "🔊 MUTE MUSIC",
    unmuteMusic: "🔈 UNMUTE MUSIC",
    logout: "🚪 LOGOUT",
    close: "✕ CLOSE",
    language: " LANGUAGE",

    // Modals & Messages
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
    back: "⬅ BACK",

    // Offline Earnings
    welcomeBack: "WELCOME BACK!",
    awayFor: "You were away for",
    crystalsCollected: "Crystals collected while you were gone",
    claimReward: "✨ CLAIM REWARD",

    // Rarity & Ranking
    common: "Common",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
    rankingCrystals: "🔮 Crystals",
    rankingRP: "✨ RP",

    // Tutorial
    tutorialSkip: "Skip",
    tutorialNext: "Next →",
    tutorialPlay: "🎮 Let's Play!",
    tutorialStep1Title: "👆 Click the Crystal!",
    tutorialStep1Text:
      "Click the crystal to earn Crystals! The more you click, the faster you progress.",
    tutorialStep2Title: "🛒 Buy Upgrades!",
    tutorialStep2Text:
      "Use your Crystals to buy upgrades on the right. Each upgrade increases your Crystals per second automatically!",
    tutorialStep3Title: "⛏️ Start with Pickaxe!",
    tutorialStep3Text:
      "The Pickaxe is your first upgrade. Buy as many as you can — they generate 1 Crystal per second each!",
    tutorialStep4Title: "✨ Rebirth System!",
    tutorialStep4Text:
      "When you have enough Crystals, go to REBIRTH to reset and gain RP — which permanently multiplies your production!",
    tutorialStep5Title: "🎣 Fishing Mode!",
    tutorialStep5Text:
      "Unlock Fishing Mode with 100 RP! Catch rare fish to earn Fish Coins and buy powerful upgrades.",
    tutorialStep6Title: "🎮 You're ready!",
    tutorialStep6Text:
      "That's everything! Watch out for Shiny Crystals that appear randomly — click them for big bonuses!",

    // Achievements UI
    achievementUnlocked: "✓ UNLOCKED",
    achievementLocked: "✗ LOCKED",
    achievementStatus: "Status",
    achievementReq: "Requirement",
    tutorialBtn: "❓ TUTORIAL",
    statTotalCrystals: "💎 Total Crystals",
    statRebirthPoints: "✨ Rebirth Points",
    statMultiplier: "⚡ Multiplier",
    statBuildings: "🏗️ Buildings",
    statCrystalsSec: "🔮 Crystals/sec",
    statAchievements: "🏆 Achievements",
    statFishCoins: "🎣 Fish Coins",
    statWood: "🌲 Wood",
    statFlesh: "⚔️ Flesh",
    statMobKills: "💀 Mob Kills",
    statRuneBulk: "💠 Rune Bulk",
    statRuneLuck: "🍀 Rune Luck",
    statTimePlayed: "⏱️ Time Played",
    statLocked: "Locked",
    statTitleStats: "📊 Statistics",
    achievementRewardReady: "Claim Reward",
    achievementRewardClaimed: "Reward Claimed",
    achievementRewardBonus: "× 1.5 Crystal Production",
    achievementRewardStack: "stacks with other achievements",
    achievementRewardConfirm: "Claim this reward?",

    // Login / Register
    loginTitle: "Crystal Clicker",
    loginUsername: "Username",
    loginPassword: "Password",
    loginBtn: "LOGIN",
    registerBtn: "REGISTER",
    errorUserExists: "❌ This username is already taken!",
    errorWeakPassword: "❌ Password must be at least 6 characters!",
    errorInvalidUser: "❌ Invalid username!",
    errorNetwork: "❌ Network error. Check your connection!",
    errorGeneric: "❌ Something went wrong. Try again!",
  },

  pt: {
    // UI Geral
    crystals: "Cristais",
    perSecond: "Por segundo/s:",
    upgrades: "Melhorias",
    rebirth: "Renascimento",
    gameModes: "Modos de Jogo",
    topGlobal: "Top 100 Global",
    achievements: "Conquistas",
    settings: "Configurações",
    buyMax: "Máx",
    timePlayed: "⏱️ Tempo Jogado",
    rankingPlaytime: "⏱️ Tempo Jogado",

    // Nav (Menu Inferior)
    home: "INÍCIO",
    rebirthNav: "RENASCER",
    modes: "MODOS",
    runes: "RUNAS",
    top: "TOP",
    achievementsNav: "CONQUISTAS",
    misc: "MISC",

    // Painel de Renascimento
    globalMultiplier: "Multiplicador Global:",
    rebirthBtn: "RP",
    rebirthUpgrades: "Melhorias de Renascimento",

    // Sistema de Runas
    runesTitle: "💠 Coleção de Runas",
    runeBonuses: "✨ Bônus Ativos",
    rollStarter: "Giro Inicial",
    rollAdvanced: "Giro Avançado",
    rollAncient: "Giro Ancião",
    rollCelestial: "Giro Celestial",
    secretRune: "Runa Secreta Descoberta!",
    rollBtn: "GIRAR",
    runeNameStarter: "Runa Inicial",
    runeNameAdvanced: "Runa Avançada",
    runeNameAncient: "Runa Anciã",
    runeNameCelestial: "Runa Celestial",

    // Modo Pesca
    lakeIncremental: "🎣 Lago Incremental",
    fishCoins: "Moedas de Peixe",
    clickToFish: "Clique na água para pescar!",
    casting: "Lançando...",
    gotAway: "💨 Escapou...",
    fishEncyclopedia: "🐠 Enciclopédia de Peixes",
    fishUpgrades: "⚙️ Melhorias",
    fishingMode: "🎣 Modo Pesca",
    fishingDesc: "Pesque peixes raros e ganhe Moedas de Peixe!",
    unlockFishing: "Desbloquear",
    enterLake: "Entrar no Lago",

    // Modo Árvores (Novo)
    treesMode: "🌲 Modo Árvores",
    treesDesc: "Corte árvores para obter Madeira e aumentar a produção!",
    unlockTrees: "Desbloquear",
    enterForest: "Entrar na Floresta",
    wood: "Madeira",
    woodPerClick: "Madeira/Clique",
    autoChop: "Corte Automático",

    // Modo Mobs (Novo)
    mobsMode: "⚔️ Modo Mobs",
    mobsDesc: "Derrote monstros para obter Carne e saques raros!",
    unlockMobs: "Desbloquear",
    enterArena: "Entrar na Arena",
    flesh: "Carne",
    damage: "Dano",
    autoSlayer: "Matador Auto",
    kills: "Abates",

    // Configurações
    disablePickaxes: "⚙️ DESATIVAR PICARETAS",
    enablePickaxes: "⚙️ ATIVAR PICARETAS",
    muteMusic: "🔊 SILENCIAR MÚSICA",
    unmuteMusic: "🔈 ATIVAR MÚSICA",
    logout: "🚪 SAIR",
    close: "✕ FECHAR",
    language: " IDIOMA",

    // Modais e Mensagens
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
    back: "⬅ VOLTAR",

    // Ganhos Offline
    welcomeBack: "BEM-VINDO DE VOLTA!",
    awayFor: "Você ficou ausente por",
    crystalsCollected: "Cristais coletados enquanto você estava fora",
    claimReward: "✨ RESGATAR RECOMPENSA",

    // Raridade e Ranking
    common: "Comum",
    rare: "Raro",
    epic: "Épico",
    legendary: "Lendário",
    rankingCrystals: "🔮 Cristais",
    rankingRP: "✨ RP",

    // Tutorial
    tutorialSkip: "Pular",
    tutorialNext: "Próximo →",
    tutorialPlay: "🎮 Vamos Jogar!",
    tutorialStep1Title: "👆 Clique no Cristal!",
    tutorialStep1Text:
      "Clique no cristal para ganhar Cristais! Quanto mais você clica, mais rápido você progride.",
    tutorialStep2Title: "🛒 Compre Melhorias!",
    tutorialStep2Text:
      "Use seus Cristais para comprar melhorias à direita para aumentar a produção!",
    tutorialStep3Title: "⛏️ Comece com a Picareta!",
    tutorialStep3Text: "A Picareta gera 1 Cristal por segundo cada!",
    tutorialStep4Title: "✨ Sistema de Renascimento!",
    tutorialStep4Text:
      "Ganhe RP para multiplicar permanentemente sua produção!",
    tutorialStep5Title: "🎣 Modo Pesca!",
    tutorialStep5Text:
      "Desbloqueie o Modo Pesca com 100 RP para bônus especiais.",
    tutorialStep6Title: "🎮 Você está pronto!",
    tutorialStep6Text:
      "Fique atento aos Cristais Brilhantes para grandes bônus!",

    // Interface de Conquistas
    achievementUnlocked: "✓ DESBLOQUEADO",
    achievementLocked: "✗ BLOQUEADO",
    achievementStatus: "Status",
    achievementReq: "Requisito",
    tutorialBtn: "❓ TUTORIAL",
    statTotalCrystals: "💎 Total de Cristais",
    statRebirthPoints: "✨ Pontos de Renascimento",
    statMultiplier: "⚡ Multiplicador",
    statBuildings: "🏗️ Estruturas",
    statCrystalsSec: "🔮 Cristais/seg",
    statAchievements: "🏆 Conquistas",
    statFishCoins: "🎣 Moedas de Peixe",
    statWood: "🌲 Madeira",
    statFlesh: "⚔️ Carne",
    statMobKills: "💀 Abates",
    statRuneBulk: "💠 Rune Bulk",
    statRuneLuck: "🍀 Sorte de Runa",
    statTimePlayed: "⏱️ Tempo Jogado",
    statLocked: "Bloqueado",
    statTitleStats: "📊 Estatísticas",
    achievementRewardReady: "Resgatar Recompensa",
    achievementRewardClaimed: "Recompensa Resgatada",
    achievementRewardBonus: "× 1.5 Produção de Cristais",
    achievementRewardStack: "acumula com outras conquistas",
    achievementRewardConfirm: "Resgatar esta recompensa?",

    // Login / Registro
    loginTitle: "Crystal Clicker",
    loginUsername: "Usuário",
    loginPassword: "Senha",
    loginBtn: "ENTRAR",
    registerBtn: "REGISTRAR",
    errorUserExists: "❌ Este usuário já está em uso!",
    errorWeakPassword: "❌ A senha deve ter pelo menos 6 caracteres!",
    errorInvalidUser: "❌ Usuário inválido!",
    errorNetwork: "❌ Erro de rede. Verifique sua conexão!",
    errorGeneric: "❌ Algo deu errado. Tente novamente!",
  },

  es: {
    // UI General
    crystals: "Cristales",
    perSecond: "Por segundo/s:",
    upgrades: "Mejoras",
    rebirth: "Renacimiento",
    gameModes: "Modos de Juego",
    topGlobal: "Top 100 Global",
    achievements: "Logros",
    settings: "Configuración",
    buyMax: "Máx",
    timePlayed: "⏱️ Tiempo Jugado",
    rankingPlaytime: "⏱️ Tiempo Jugado",

    // Nav (Menú Inferior)
    home: "INICIO",
    rebirthNav: "RENACER",
    modes: "MODOS",
    runes: "RUNAS",
    top: "TOP",
    achievementsNav: "LOGROS",
    misc: "MISC",

    // Panel de Renacimiento
    globalMultiplier: "Multiplicador Global:",
    rebirthBtn: "RP",
    rebirthUpgrades: "Mejoras de Renacimiento",

    // Sistema de Runas
    runesTitle: "💠 Colección de Runas",
    runeBonuses: "✨ Bonos Activos",
    rollStarter: "Giro Inicial",
    rollAdvanced: "Giro Avanzado",
    rollAncient: "Giro Antiguo",
    rollCelestial: "Giro Celestial",
    secretRune: "¡Runa Secreta Descubierta!",
    rollBtn: "GIRAR",
    runeNameStarter: "Runa Inicial",
    runeNameAdvanced: "Runa Avanzada",
    runeNameAncient: "Runa Antigua",
    runeNameCelestial: "Runa Celestial",

    // Modo Pesca
    lakeIncremental: "🎣 Lago Incremental",
    fishCoins: "Monedas de Pez",
    clickToFish: "¡Haz clic en el agua para pescar!",
    casting: "Lanzando...",
    gotAway: "💨 Se escapó...",
    fishEncyclopedia: "🐠 Enciclopedia de Peces",
    fishUpgrades: "⚙️ Mejoras",
    fishingMode: "🎣 Modo Pesca",
    fishingDesc: "¡Pesca peces raros y gana Monedas de Pez!",
    unlockFishing: "Desbloquear",
    enterLake: "Entrar al Lago",

    // Modo Árboles (Nuevo)
    treesMode: "🌲 Modo Árboles",
    treesDesc: "¡Tala árboles para obtener Madera y aumentar la producción!",
    unlockTrees: "Desbloquear",
    enterForest: "Entrar al Bosque",
    wood: "Madera",
    woodPerClick: "Madera/Clic",
    autoChop: "Tala Automática",

    // Modo Mobs (Nuevo)
    mobsMode: "⚔️ Modo Mobs",
    mobsDesc: "¡Derrota monstruos para obtener Carne y botines raros!",
    unlockMobs: "Desbloquear",
    enterArena: "Entrar a la Arena",
    flesh: "Carne",
    damage: "Daño",
    autoSlayer: "Asesino Auto",
    kills: "Eliminaciones",

    // Configuración
    disablePickaxes: "⚙️ DESACTIVAR PICOS",
    enablePickaxes: "⚙️ ACTIVAR PICOS",
    muteMusic: "🔊 SILENCIAR MÚSICA",
    unmuteMusic: "🔈 ACTIVAR MÚSICA",
    logout: "🚪 SALIR",
    close: "✕ CERRAR",
    language: " IDIOMA",

    // Modales y Mensajes
    fillFields: "¡Completa todos los campos!",
    wrongPassword: "❌ ¡Usuario o contraseña incorrectos!",
    rebirthConfirm: "¿Renacer ahora?",
    rebirthReceive: "Recibirás",
    rebirthReset: "¡Todos los cristales y mejoras serán reiniciados!",
    rebirthSuccess: "✨ ¡Renacimiento exitoso! Tu multiplicador ha aumentado.",
    rebirthNeedCrystals: "¡Necesitas al menos",
    rebirthToCrystals: "cristales para Renacer!",
    maxLevel: "⚠️ ¡Esta mejora ha alcanzado su nivel máximo!",
    needMoreRP: "❌ ¡Necesitas más Puntos de Renacimiento!",
    confirm: "✓ CONFIRMAR",
    cancel: "✕ CANCELAR",
    ok: "OK",
    back: "⬅ VOLVER",

    // Ganancias Offline
    welcomeBack: "¡BIENVENIDO DE VUELTA!",
    awayFor: "Estuviste ausente por",
    crystalsCollected: "Cristales recolectados mientras no estabas",
    claimReward: "✨ RECLAMAR RECOMPENSA",

    // Rareza y Ranking
    common: "Común",
    rare: "Raro",
    epic: "Épico",
    legendary: "Legendario",
    rankingCrystals: "🔮 Cristales",
    rankingRP: "✨ RP",

    // Tutorial
    tutorialSkip: "Saltar",
    tutorialNext: "Siguiente →",
    tutorialPlay: "¡A Jugar!",
    tutorialStep1Title: "👆 ¡Haz clic en el Cristal!",
    tutorialStep1Text:
      "¡Haz clic en el cristal para ganar Cristales! Cuanto más rápido hagas clic, más rápido progresas.",
    tutorialStep2Title: "🛒 ¡Compra Mejoras!",
    tutorialStep2Text:
      "Usa tus Cristales para comprar mejoras a la derecha y aumentar la producción.",
    tutorialStep3Title: "⛏️ ¡Empieza con el Pico!",
    tutorialStep3Text: "¡Cada Pico genera 1 cristal por segundo!",
    tutorialStep4Title: "✨ ¡Sistema de Renacimiento!",
    tutorialStep4Text:
      "¡Gana RP para multiplicar tu producción permanentemente!",
    tutorialStep5Title: "🎣 ¡Modo Pesca!",
    tutorialStep5Text:
      "Desbloquea el Modo Pesca con 100 RP para obtener bonos especiales.",
    tutorialStep6Title: "🎮 ¡Ya estás listo!",
    tutorialStep6Text:
      "¡Atento a los Cristales Brillantes para obtener grandes bonos!",

    // Interfaz de Logros
    achievementUnlocked: "✓ DESBLOQUEADO",
    achievementLocked: "✗ BLOQUEADO",
    achievementStatus: "Estado",
    achievementReq: "Requisito",
    tutorialBtn: "❓ TUTORIAL",
    statTotalCrystals: "💎 Total de Cristales",
    statRebirthPoints: "✨ Puntos de Renacimiento",
    statMultiplier: "⚡ Multiplicador",
    statBuildings: "🏗️ Estructuras",
    statCrystalsSec: "🔮 Cristales/seg",
    statAchievements: "🏆 Logros",
    statFishCoins: "🎣 Monedas de Pez",
    statWood: "🌲 Madera",
    statFlesh: "⚔️ Carne",
    statMobKills: "💀 Eliminaciones",
    statRuneBulk: "💠 Rune Bulk",
    statRuneLuck: "🍀 Suerte de Runa",
    statTimePlayed: "⏱️ Tiempo Jugado",
    statLocked: "Bloqueado",
    statTitleStats: "📊 Estadísticas",
    achievementRewardReady: "Reclamar Recompensa",
    achievementRewardClaimed: "Recompensa Reclamada",
    achievementRewardBonus: "× 1.5 Producción de Cristales",
    achievementRewardStack: "se acumula con otros logros",
    achievementRewardConfirm: "¿Reclamar esta recompensa?",

    // Registro / Login
    loginTitle: "Crystal Clicker",
    loginUsername: "Usuario",
    loginPassword: "Contraseña",
    loginBtn: "ENTRAR",
    registerBtn: "REGISTRAR",
    errorUserExists: "❌ ¡Este usuario ya está en uso!",
    errorWeakPassword: "❌ ¡La contraseña debe tener al menos 6 caracteres!",
    errorInvalidUser: "❌ ¡Usuario inválido!",
    errorNetwork: "❌ Error de red. ¡Verifica tu conexión!",
    errorGeneric: "❌ ¡Algo salió mal. Inténtalo de nuevo!",
  },

  fr: {
    // UI General
    crystals: "Cristaux",
    perSecond: "Par seconde/s :",
    upgrades: "Améliorations",
    rebirth: "Renaissance",
    gameModes: "Modes de Jeu",
    topGlobal: "Top 100 Mondial",
    achievements: "Succès",
    settings: "Paramètres",
    buyMax: "Max",
    timePlayed: "⏱️ Temps Joué",
    rankingPlaytime: "⏱️ Temps Joué",

    // Nav (Menu inférieur)
    home: "ACCUEIL",
    rebirthNav: "RENAISSANCE",
    modes: "MODES",
    runes: "RUNES",
    top: "TOP",
    achievementsNav: "SUCCÈS",
    misc: "MISC",

    // Panneau de Renaissance
    globalMultiplier: "Multiplicateur Global :",
    rebirthBtn: "RP",
    rebirthUpgrades: "Améliorations de Renaissance",

    // Système de Runes
    runesTitle: "💠 Collection de Runes",
    runeBonuses: "✨ Bonus Actifs",
    rollStarter: "Tirage Débutant",
    rollAdvanced: "Tirage Avancé",
    rollAncient: "Tirage Ancien",
    rollCelestial: "Tirage Céleste",
    secretRune: "Rune Secrète Découverte !",
    rollBtn: "TOURNER",
    runeNameStarter: "Rune Débutant",
    runeNameAdvanced: "Rune Avancée",
    runeNameAncient: "Rune Ancienne",
    runeNameCelestial: "Rune Céleste",

    // Mode Pêche
    lakeIncremental: "🎣 Lac Incrémental",
    fishCoins: "Pièces de Poisson",
    clickToFish: "Cliquez sur l'eau pour pêcher !",
    casting: "Lancement...",
    gotAway: "💨 S'est échappé...",
    fishEncyclopedia: "🐠 Encyclopédie des Poissons",
    fishUpgrades: "⚙️ Améliorations",
    fishingMode: "🎣 Mode Pêche",
    fishingDesc: "Pêchez des poissons rares et gagnez des Pièces !",
    unlockFishing: "Débloquer",
    enterLake: "Entrer dans le Lac",

    // Mode Arbres (Trees)
    treesMode: "🌲 Mode Arbres",
    treesDesc:
      "Abattez des arbres pour obtenir du Bois et booster la production !",
    unlockTrees: "Débloquer",
    enterForest: "Entrer dans la Forêt",
    wood: "Bois",
    woodPerClick: "Bois/Clic",
    autoChop: "Abattage Auto",

    // Mode Monstres (Mobs)
    mobsMode: "⚔️ Mode Monstres",
    mobsDesc:
      "Terrassez des monstres pour obtenir de la Chair et des butins rares !",
    unlockMobs: "Débloquer",
    enterArena: "Entrer dans l'Arène",
    flesh: "Chair",
    damage: "Dégâts",
    autoSlayer: "Tueur Auto",
    kills: "Éliminations",

    // Paramètres
    disablePickaxes: "⚙️ DÉSACTIVER PIOCHES",
    enablePickaxes: "⚙️ ACTIVER PIOCHES",
    muteMusic: "🔊 COUPER MUSIQUE",
    unmuteMusic: "🔈 ACTIVER MUSIQUE",
    logout: "🚪 DÉCONNEXION",
    close: "✕ FERMER",
    language: " LANGUE",

    // Modals & Messages
    fillFields: "Remplissez tous les champs !",
    wrongPassword: "❌ Nom d'utilisateur ou mot de passe incorrect !",
    rebirthConfirm: "Renaissance maintenant ?",
    rebirthReceive: "Vous recevrez",
    rebirthReset: "Tous les cristaux et bâtiments seront réinitialisés !",
    rebirthSuccess: "✨ Renaissance réussie ! Votre multiplicateur a augmenté.",
    rebirthNeedCrystals: "Vous avez besoin d'au moins",
    rebirthToCrystals: "cristaux pour Renaissance !",
    maxLevel: "⚠️ Cette amélioration a atteint son niveau maximum !",
    needMoreRP: "❌ Vous avez besoin de plus de Points de Renaissance !",
    confirm: "✓ CONFIRMER",
    cancel: "✕ ANNULER",
    ok: "OK",
    back: "⬅ RETOUR",

    // Gains Hors-ligne
    welcomeBack: "BIENVENUE DE RETOUR !",
    awayFor: "Vous étiez absent pendant",
    crystalsCollected: "Cristaux collectés pendant votre absence",
    claimReward: "✨ RÉCLAMER LA RÉCOMPENSE",

    // Rareté et Classement
    common: "Commun",
    rare: "Rare",
    epic: "Épique",
    legendary: "Légendaire",
    rankingCrystals: "🔮 Cristaux",
    rankingRP: "✨ RP",

    // Tutoriel
    tutorialSkip: "Passer",
    tutorialNext: "Suivant →",
    tutorialPlay: "🎮 Jouons !",
    tutorialStep1Title: "👆 Cliquez sur le Cristal !",
    tutorialStep1Text:
      "Cliquez sur le cristal pour gagner des Cristaux ! Plus vous cliquez, plus vite vous progressez.",
    tutorialStep2Title: "🛒 Achetez des Améliorations !",
    tutorialStep2Text:
      "Utilisez vos Cristaux pour acheter des améliorations à droite et augmenter la production !",
    tutorialStep3Title: "⛏️ Commencez avec la Pioche !",
    tutorialStep3Text: "Chaque Pioche génère 1 Cristal par seconde !",
    tutorialStep4Title: "✨ Système de Renaissance !",
    tutorialStep4Text:
      "Gagnez des RP pour multiplier votre production de façon permanente !",
    tutorialStep5Title: "🎣 Mode Pêche !",
    tutorialStep5Text:
      "Débloquez le Mode Pêche avec 100 RP pour obtenir des bonus spéciaux.",
    tutorialStep6Title: "🎮 Vous êtes prêt !",
    tutorialStep6Text:
      "Surveillez les Cristaux Brillants pour obtenir de gros bonus !",

    // Interface des Succès
    achievementUnlocked: "✓ DÉBLOQUÉ",
    achievementLocked: "✗ VERROUILLÉ",
    achievementStatus: "Statut",
    achievementReq: "Condition",
    tutorialBtn: "❓ TUTORIEL",
    statTotalCrystals: "💎 Total Cristaux",
    statRebirthPoints: "✨ Points Renaissance",
    statMultiplier: "⚡ Multiplicateur",
    statBuildings: "🏗️ Bâtiments",
    statCrystalsSec: "🔮 Cristaux/sec",
    statAchievements: "🏆 Succès",
    statFishCoins: "🎣 Pièces de Poisson",
    statFlesh: "⚔️ Chair",
    statMobKills: "💀 Éliminations",
    statRuneBulk: "💠 Rune Bulk",
    statRuneLuck: "🍀 Chance de Rune",
    statTimePlayed: "⏱️ Temps Joué",
    statLocked: "Verrouillé",
    statTitleStats: "📊 Statistiques",
    achievementRewardReady: "Réclamer la Récompense",
    achievementRewardClaimed: "Récompense Réclamée",
    achievementRewardBonus: "× 1.5 Production de Cristaux",
    achievementRewardStack: "s'accumule avec d'autres succès",
    achievementRewardConfirm: "Réclamer cette récompense ?",

    // Connexion / Inscription
    loginTitle: "Crystal Clicker",
    loginUsername: "Nom d'utilisateur",
    loginPassword: "Mot de passe",
    loginBtn: "CONNEXION",
    registerBtn: "S'INSCRIRE",
    errorUserExists: "❌ Ce nom d'utilisateur est déjà pris !",
    errorWeakPassword: "❌ Le mot de passe doit avoir au moins 6 caractères !",
    errorInvalidUser: "❌ Nom d'utilisateur invalide !",
    errorNetwork: "❌ Erreur réseau. Vérifiez votre connexion !",
    errorGeneric: "❌ Quelque chose s'est mal passé. Réessayez !",
  },

  ja: {
    // UI General
    crystals: "クリスタル",
    perSecond: "毎秒/s:",
    upgrades: "アップグレード",
    rebirth: "リバース",
    gameModes: "ゲームモード",
    topGlobal: "グローバルトップ100",
    achievements: "実績",
    settings: "設定",
    buyMax: "最大",
    timePlayed: "⏱️ プレイ時間",
    rankingPlaytime: "⏱️ プレイ時間",

    // Nav (Menu Inferior)
    home: "ホーム",
    rebirthNav: "リバース",
    modes: "モード",
    runes: "ルーン",
    top: "TOP",
    achievementsNav: "実績",
    misc: "その他",

    // Rebirth Panel
    globalMultiplier: "グローバル倍率:",
    rebirthBtn: "RP",
    rebirthUpgrades: "リバースアップグレード",

    // Runes System
    runesTitle: "💠 ルーンコレクション",
    runeBonuses: "✨ 発動中のボーナス",
    rollStarter: "スターターガチャ",
    rollAdvanced: "アドバンスガチャ",
    rollAncient: "エンシェントガチャ",
    rollCelestial: "セレスティアルガチャ",
    secretRune: "隠しルーン発見！",
    rollBtn: "回る",
    runeNameStarter: "スターターRune",
    runeNameAdvanced: "上級Rune",
    runeNameAncient: "古代Rune",
    runeNameCelestial: "天界Rune",

    // Fishing Mode
    lakeIncremental: "🎣 湖インクリメンタル",
    fishCoins: "フィッシュコイン",
    clickToFish: "水をクリックして釣り！",
    casting: "キャスト中...",
    gotAway: "💨 逃げられた...",
    fishEncyclopedia: "🐠 魚図鑑",
    fishUpgrades: "⚙️ アップグレード",
    fishingMode: "🎣 釣りモード",
    fishingDesc: "レアな魚を釣ってフィッシュコインを獲得！",
    unlockFishing: "アンロック",
    enterLake: "湖に入る",

    // Trees Mode (Novo)
    treesMode: "🌲 木こりモード",
    treesDesc: "木を伐採して木材を獲得し、生産を強化！",
    unlockTrees: "アンロック (5M RP)",
    enterForest: "森に入る",
    wood: "木材",
    woodPerClick: "クリックあたりの木材",
    autoChop: "自動伐採",

    // Mobs Mode (Novo)
    mobsMode: "⚔️ モブモード",
    mobsDesc: "モンスターを倒して肉やレアアイテムを獲得！",
    unlockMobs: "アンロック (2.5Qa RP)",
    enterArena: "アリーナに入る",
    flesh: "肉",
    damage: "ダメージ",
    autoSlayer: "自動スレイヤー",
    kills: "討伐数",

    // Settings
    disablePickaxes: "⚙️ ピッケル無効",
    enablePickaxes: "⚙️ ピッケル有効",
    muteMusic: "🔊 ミュート",
    unmuteMusic: "🔈 ミュート解除",
    logout: "🚪 ログアウト",
    close: "✕ 閉じる",
    language: " 言語設定",

    // Modals & Messages
    fillFields: "全てのフィールドを入力してください！",
    wrongPassword: "❌ ユーザー名またはパスワードが違います！",
    rebirthConfirm: "今すぐリバースしますか？",
    rebirthReceive: "獲得予定：",
    rebirthReset: "全てのクリスタルと建物がリセットされます！",
    rebirthSuccess: "✨ リバース成功！倍率が上昇しました。",
    rebirthNeedCrystals: "リバースには最低",
    rebirthToCrystals: "クリスタルが必要です！",
    maxLevel: "⚠️ 最大レベルに達しました！",
    needMoreRP: "❌ リバースポイントが足りません！",
    confirm: "✓ 確認",
    cancel: "✕ キャンセル",
    ok: "OK",
    back: "⬅ 戻る",

    // Offline Earnings
    welcomeBack: "おかえりなさい！",
    awayFor: "不在時間：",
    crystalsCollected: "不在中に獲得したクリスタル",
    claimReward: "✨ 報酬を受け取る",

    // Rarity & Ranking
    common: "コモン",
    rare: "レア",
    epic: "エピック",
    legendary: "レジェンダリー",
    rankingCrystals: "🔮 クリスタル数",
    rankingRP: "✨ リバース数",

    // Tutorial
    tutorialSkip: "スキップ",
    tutorialNext: "次へ →",
    tutorialPlay: "🎮 プレイ開始！",
    tutorialStep1Title: "👆 クリスタルをクリック！",
    tutorialStep1Text:
      "クリスタルをクリックしてクリスタルを獲得！クリックするほど早く進歩します。",
    tutorialStep2Title: "🛒 アップグレードを購入！",
    tutorialStep2Text:
      "クリスタルを使って右側のアップグレードを購入し、生産量を増やしましょう！",
    tutorialStep3Title: "⛏️ ピッケルから始めよう！",
    tutorialStep3Text:
      "ピッケルは最初のアップグレードです。1つにつき毎秒1クリスタルを生成します！",
    tutorialStep4Title: "✨ リバースシステム！",
    tutorialStep4Text: "RPを獲得して、生産量を永続的に倍増させましょう！",
    tutorialStep5Title: "🎣 釣りモード！",
    tutorialStep5Text:
      "100 RPで釣りモードを解放して、特別なボーナスをゲットしましょう。",
    tutorialStep6Title: "🎮 準備完了！",
    tutorialStep6Text: "時々現れるシャイニークリスタルを見逃さないように！",

    // Achievements UI
    achievementUnlocked: "✓ 解除済み",
    achievementLocked: "✗ 未解除",
    achievementStatus: "ステータス",
    achievementReq: "条件",
    tutorialBtn: "❓ チュートリアル",
    statTotalCrystals: "💎 総クリスタル",
    statRebirthPoints: "✨ リバースポイント",
    statMultiplier: "⚡ 倍率",
    statBuildings: "🏗️ 建物",
    statCrystalsSec: "🔮 クリスタル/秒",
    statAchievements: "🏆 実績",
    statFishCoins: "🎣 フィッシュコイン",
    statWood: "🌲 木材",
    statFlesh: "⚔️ 肉",
    statMobKills: "💀 討伐数",
    statRuneBulk: "💠 ルーンバルク",
    statRuneLuck: "🍀 ルーン運",
    statTimePlayed: "⏱️ プレイ時間",
    statLocked: "未解放",
    statTitleStats: "📊 統計",
    achievementRewardReady: "報酬を受け取る",
    achievementRewardClaimed: "報酬受取済み",
    achievementRewardBonus: "× 1.5 クリスタル生産",
    achievementRewardStack: "他の実績と累積します",
    achievementRewardConfirm: "この報酬を受け取りますか？",

    // Login / Register
    loginTitle: "Crystal Clicker",
    loginUsername: "ユーザー名",
    loginPassword: "パスワード",
    loginBtn: "ログイン",
    registerBtn: "アカウント作成",
    errorUserExists: "❌ このユーザー名は既に使用されています！",
    errorWeakPassword: "❌ パスワードは6文字以上必要です！",
    errorInvalidUser: "❌ 無効なユーザー名です！",
    errorNetwork: "❌ ネットワークエラー。接続を確認してください！",
    errorGeneric: "❌ エラーが発生しました。もう一度お試しください！",
  },
};

// ============================
// RUNE SYSTEM
// ============================

const RUNE_CATEGORIES = {
  starter: {
    name: "Starter Rune",
    cost: 1000,
    color: "#a855f7",
    runes: [
      {
        id: "common",
        name: "Common Rune",
        color: "#aaa",
        chance: 0.5,
        crystalMult: 0.004,
        rpMult: 0.0004,
      },
      {
        id: "uncommon",
        name: "Uncommon Rune",
        color: "#00e676",
        chance: 0.25,
        crystalMult: 0.008,
        rpMult: 0.0008,
      },
      {
        id: "rare",
        name: "Rare Rune",
        color: "#2196F3",
        chance: 0.12,
        crystalMult: 0.015,
        rpMult: 0.0015,
      },
      {
        id: "epic",
        name: "Epic Rune",
        color: "#a855f7",
        chance: 0.07,
        crystalMult: 0.025,
        rpMult: 0.0025,
      },
      {
        id: "legendary",
        name: "Legendary Rune",
        color: "#FFD700",
        chance: 0.04,
        crystalMult: 0.04,
        rpMult: 0.004,
      },
      {
        id: "mythic",
        name: "Mythic Rune",
        color: "#ff0080",
        chance: 0.015,
        crystalMult: 0.07,
        rpMult: 0.007,
        runeLuck: 0.01,
      },
      {
        id: "secret",
        name: "Secret Rune",
        color: "#fff",
        chance: 0.005,
        crystalMult: 0.15,
        rpMult: 0.015,
        runeLuck: 0.03,
        secret: true,
      },
    ],
  },
  advanced: {
    name: "Advanced Rune",
    cost: 1e15,
    color: "#00f2fe",
    runes: [
      {
        id: "basic",
        name: "Basic Rune",
        color: "#aaa",
        chance: 0.5,
        crystalMult: 0.02,
        rpMult: 0.002,
        runeLuck: 0.005,
      },
      {
        id: "expert",
        name: "Expert Rune",
        color: "#00e676",
        chance: 0.25,
        crystalMult: 0.04,
        rpMult: 0.004,
        runeLuck: 0.01,
      },
      {
        id: "elite",
        name: "Elite Rune",
        color: "#2196F3",
        chance: 0.12,
        crystalMult: 0.07,
        rpMult: 0.007,
        runeLuck: 0.015,
      },
      {
        id: "fabled",
        name: "Fabled Rune",
        color: "#a855f7",
        chance: 0.07,
        crystalMult: 0.12,
        rpMult: 0.012,
        runeLuck: 0.02,
        runeBulk: 0.01,
      },
      {
        id: "superior",
        name: "Superior Rune",
        color: "#FFD700",
        chance: 0.04,
        crystalMult: 0.2,
        rpMult: 0.02,
        runeLuck: 0.03,
        runeBulk: 0.02,
      },
      {
        id: "transcendant",
        name: "Transcendant Rune",
        color: "#ff0080",
        chance: 0.015,
        crystalMult: 0.35,
        rpMult: 0.035,
        runeLuck: 0.05,
        runeBulk: 0.03,
      },
      {
        id: "omega",
        name: "Omega Rune",
        color: "#fff",
        chance: 0.005,
        crystalMult: 0.7,
        rpMult: 0.07,
        runeLuck: 0.1,
        runeBulk: 0.05,
        secret: true,
      },
    ],
  },
  ancient: {
    name: "Ancient Rune",
    cost: 1e30,
    color: "#ff9800",
    runes: [
      {
        id: "primal",
        name: "Primal Rune",
        color: "#aaa",
        chance: 0.5,
        crystalMult: 0.1,
        rpMult: 0.01,
        runeLuck: 0.02,
        runeBulk: 0.01,
      },
      {
        id: "fossilized",
        name: "Fossilized Rune",
        color: "#00e676",
        chance: 0.25,
        crystalMult: 0.2,
        rpMult: 0.02,
        runeLuck: 0.04,
        runeBulk: 0.02,
      },
      {
        id: "spectral",
        name: "Spectral Rune",
        color: "#2196F3",
        chance: 0.12,
        crystalMult: 0.35,
        rpMult: 0.035,
        runeLuck: 0.06,
        runeBulk: 0.03,
        runeSpeed: 0.01,
      },
      {
        id: "enchanted",
        name: "Enchanted Rune",
        color: "#a855f7",
        chance: 0.07,
        crystalMult: 0.6,
        rpMult: 0.06,
        runeLuck: 0.1,
        runeBulk: 0.05,
        runeSpeed: 0.02,
      },
      {
        id: "curse",
        name: "Curse Rune",
        color: "#FFD700",
        chance: 0.04,
        crystalMult: 1.0,
        rpMult: 0.1,
        runeLuck: 0.15,
        runeBulk: 0.07,
        runeSpeed: 0.03,
      },
      {
        id: "eternal",
        name: "Eternal Rune",
        color: "#ff0080",
        chance: 0.015,
        crystalMult: 1.75,
        rpMult: 0.175,
        runeLuck: 0.2,
        runeBulk: 0.1,
        runeSpeed: 0.05,
      },
      {
        id: "titan",
        name: "Titan Rune",
        color: "#fff",
        chance: 0.005,
        crystalMult: 3.5,
        rpMult: 0.35,
        runeLuck: 0.35,
        runeBulk: 0.15,
        runeSpeed: 0.1,
        secret: true,
      },
    ],
  },
  celestial: {
    name: "Celestial Rune",
    cost: 1e48,
    color: "#FFD700",
    runes: [
      {
        id: "astral",
        name: "Astral Rune",
        color: "#aaa",
        chance: 0.5,
        crystalMult: 0.5,
        rpMult: 0.05,
        fishCoinMult: 0.05,
        runeLuck: 0.05,
        runeBulk: 0.02,
        runeSpeed: 0.01,
      },
      {
        id: "solar",
        name: "Solar Rune",
        color: "#00e676",
        chance: 0.25,
        crystalMult: 1.0,
        rpMult: 0.1,
        fishCoinMult: 0.1,
        runeLuck: 0.1,
        runeBulk: 0.04,
        runeSpeed: 0.02,
      },
      {
        id: "galactic",
        name: "Galactic Rune",
        color: "#2196F3",
        chance: 0.12,
        crystalMult: 1.8,
        rpMult: 0.18,
        fishCoinMult: 0.18,
        runeLuck: 0.15,
        runeBulk: 0.07,
        runeSpeed: 0.04,
      },
      {
        id: "nebula",
        name: "Nebula Rune",
        color: "#a855f7",
        chance: 0.07,
        crystalMult: 3.0,
        rpMult: 0.3,
        fishCoinMult: 0.3,
        runeLuck: 0.2,
        runeBulk: 0.1,
        runeSpeed: 0.07,
      },
      {
        id: "void",
        name: "Void Rune",
        color: "#FFD700",
        chance: 0.04,
        crystalMult: 5.0,
        rpMult: 0.5,
        fishCoinMult: 0.5,
        runeLuck: 0.3,
        runeBulk: 0.15,
        runeSpeed: 0.1,
      },
      {
        id: "cosmic",
        name: "Cosmic Rune",
        color: "#ff0080",
        chance: 0.015,
        crystalMult: 9.0,
        rpMult: 0.9,
        fishCoinMult: 0.9,
        runeLuck: 0.4,
        runeBulk: 0.2,
        runeSpeed: 0.15,
      },
      {
        id: "infinity",
        name: "Infinity Rune",
        color: "#fff",
        chance: 0.005,
        crystalMult: 20.0,
        rpMult: 2.0,
        fishCoinMult: 2.0,
        runeLuck: 0.75,
        runeBulk: 0.35,
        runeSpeed: 0.25,
        secret: true,
      },
    ],
  },
};

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

const FISHING_UPGRADES = [
  {
    id: "rod",
    name: "Better Rod",
    icon: "🎣",
    desc: "Reduces fishing time",
    maxLevel: 10,
    baseCost: 50, // era 250
    effect: (lvl) => `${Math.max(800, 3000 - lvl * 200)}ms cast time`,
  },
  {
    id: "bait",
    name: "Better Bait",
    icon: "🪱",
    desc: "Increases catch chance",
    maxLevel: 10,
    baseCost: 80, // era 500
    effect: (lvl) => `+${lvl * 5}% catch chance`,
  },
  {
    id: "net",
    name: "Fishing Net",
    icon: "🕸️",
    desc: "Chance to catch multiple fish",
    maxLevel: 5,
    baseCost: 150, // era 750
    effect: (lvl) => `${lvl * 20}% multi-catch chance`,
  },
  {
    id: "boat",
    name: "Boat",
    icon: "⛵",
    desc: "Multiplies fish coins earned",
    maxLevel: 5,
    baseCost: 300, // era 1000
    effect: (lvl) => `${lvl > 0 ? lvl * 2 : 1}x coins multiplier`,
  },
  {
    id: "crystalFish",
    name: "Crystal Fish",
    icon: "💎",
    desc: "Multiplies crystal production by 1.25x",
    maxLevel: 5,
    baseCost: 800, // era 2500
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
  new Audio("assets/audios/sound-effects/rod-trow.wav").play().catch(() => {});

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
      updateFishUI();

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

    const coinImg = `<img src="assets/images/modes/fish-coin.png" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;">`;

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
          ${isMaxed ? "MAX" : `${coinImg}${formatNumbers(cost)}`}
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
      new Audio("assets/audios/sound-effects/sucess.mp3")
        .play()
        .catch(() => {});
    }

    if (id === "crystalFish") recalculate();

    updateFishUI();

    renderFishingUpgrades();
    saveCloudData();
  }
}

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
    baseCoins: 15, // era 5
    chance: 0.5,
  },
  {
    id: "tuna",
    name: "Tuna",
    image: "assets/images/fish/tuna.png",
    rarity: "Rare",
    rarityColor: "#2196F3",
    baseCoins: 50, // era 15
    chance: 0.3,
  },
  {
    id: "clownfish",
    name: "Clownfish",
    image: "assets/images/fish/clownfish.png",
    rarity: "Epic",
    rarityColor: "#a855f7",
    baseCoins: 150, // era 40
    chance: 0.15,
  },
  {
    id: "barracuda",
    name: "Barracuda",
    image: "assets/images/fish/barracuda.png",
    rarity: "Legendary",
    rarityColor: "#FFD700",
    baseCoins: 500, // era 120
    chance: 0.05,
  },
];

// ============================
// TREES SYSTEM
// ============================

// Adicione no objeto modes:
// trees: { unlocked: false, wood: 0, axeLevel: 0, autoLevel: 0, rareLevel: 0, sawLevel: 0, crystalTreeLevel: 0 }

const TREES_UPGRADES = [
  {
    id: "axe",
    name: "Better Axe",
    icon: "🪓",
    desc: "More wood per click",
    maxLevel: 10,
    baseCost: 50,
    effect: (lvl) => `+${lvl + 1} wood/click`,
  },
  {
    id: "auto",
    name: "Auto Lumberjack",
    icon: "🤖",
    desc: "Automatically chops trees",
    maxLevel: 10,
    baseCost: 100,
    effect: (lvl) => `${lvl * 2}/s auto chop`,
  },
  {
    id: "rare",
    name: "Rare Tree",
    icon: "🌳",
    desc: "Chance to get bonus wood",
    maxLevel: 5,
    baseCost: 200,
    effect: (lvl) => `${lvl * 20}% bonus wood chance`,
  },
  {
    id: "saw",
    name: "Electric Saw",
    icon: "⚡",
    desc: "Multiplies all wood earned",
    maxLevel: 5,
    baseCost: 500,
    effect: (lvl) => `x${lvl > 0 ? lvl * 2 : 1} wood multiplier`,
  },
  {
    id: "crystalTree",
    name: "Crystal Tree",
    icon: "💎",
    desc: "Multiplies crystal production",
    maxLevel: 5,
    baseCost: 1000,
    effect: (lvl) => `x${Math.pow(1.3, lvl).toFixed(2)} crystal multiplier`,
  },
];

// ============================
// MOBS SYSTEM
// ============================

const MOBS_UPGRADES = [
  {
    id: "sword",
    name: "Better Sword",
    icon: "assets/images/modes/sword.png",
    desc: "Increases damage per click",
    maxLevel: 10,
    baseCost: 15, // era 50
    effect: (lvl) => `+${lvl + 1} dmg/click`,
  },
  {
    id: "autoSlayer",
    name: "Auto-Slayer",
    icon: "assets/images/modes/robot.png",
    desc: "Automatically attacks mobs",
    maxLevel: 10,
    baseCost: 60, // era 200
    effect: (lvl) => `${lvl * 3}/s auto damage`,
  },
  {
    id: "armor",
    name: "Armor",
    icon: "assets/images/modes/armor.png",
    desc: "Multiplies all flesh earned",
    maxLevel: 5,
    baseCost: 8, // era 10 (já era baixo mas escala 2.5x era pesada)
    effect: (lvl) => `x${lvl > 0 ? lvl * 2 : 1} flesh multiplier`,
  },
  {
    id: "mobLoot",
    name: "Mob Loot",
    icon: "assets/images/modes/flesh.png",
    desc: "Chance to get double flesh",
    maxLevel: 5,
    baseCost: 80, // era 300
    effect: (lvl) => `${lvl * 20}% double loot chance`,
  },
  {
    id: "crystalMob",
    name: "Crystal Mob",
    icon: "assets/images/ores/crystal.png",
    desc: "Multiplies crystal production",
    maxLevel: 5,
    baseCost: 300, // era 1000
    effect: (lvl) => `x${Math.pow(1.3, lvl).toFixed(2)} crystal multiplier`,
  },
];

let autoMobInterval = null;
let mobCurrentHp = 100;
let mobIsDying = false;
let mobMaxHp = 100;
let mobKills = 0;

function getMobDamage() {
  const swordLvl = modes.mobs?.swordLevel || 0;
  return 1 + swordLvl;
}

function getAutoMobDamage() {
  const autoLvl = modes.mobs?.autoSlayerLevel || 0;
  return autoLvl * 3;
}

function getFleshMultiplier() {
  const armorLvl = modes.mobs?.armorLevel || 0;
  return armorLvl > 0 ? armorLvl * 2 : 1;
}

function getMobMaxHp() {
  // era Math.pow(1.5, kills) — crescia rápido demais
  return Math.floor(100 * Math.pow(1.25, mobKills));
}

function getFleshReward() {
  // era base 10 * Math.pow(1.2) — agora base maior e cresce junto com o HP
  const base = Math.floor(4 * Math.pow(1.25, mobKills));
  return base * getFleshMultiplier();
}

function attackMob(e) {
  if (!modes.mobs?.unlocked || mobIsDying) return; // ← bloqueia se está morrendo
  const dmg = getMobDamage();
  dealDamage(dmg, e);
  new Audio("assets/audios/sound-effects/sword-slash.mp3")
    .play()
    .catch(() => {});
}

function dealDamage(dmg, e) {
  if (mobIsDying) return; // ← bloqueia dano durante morte
  mobCurrentHp -= dmg;

  if (e) spawnMobFX(e, dmg);

  const mobImg = document.getElementById("mob-img");
  if (mobImg) {
    mobImg.classList.add("mob-hit");
    setTimeout(() => mobImg.classList.remove("mob-hit"), 200);
  }

  if (mobCurrentHp <= 0) {
    mobCurrentHp = 0;
    killMob(e);
  } else {
    updateMobUI();
  }
}

function killMob(e) {
  mobIsDying = true; // ← bloqueia novos ataques

  const mobImg = document.getElementById("mob-img");
  if (mobImg) mobImg.classList.add("mob-dying");
  if (e) spawnDeathFX(e);

  let flesh = getFleshReward();
  const lootLvl = modes.mobs?.mobLootLevel || 0;
  if (lootLvl > 0 && Math.random() < lootLvl * 0.2) {
    flesh *= 2;
    showMobToast("💀 DOUBLE LOOT!", "#FFD700");
  }

  modes.mobs.flesh += flesh;
  mobKills++;
  modes.mobs.kills = mobKills;

  setTimeout(() => {
    if (mobImg) {
      mobImg.classList.remove("mob-dying");
      mobImg.style.opacity = "0";
    }

    mobMaxHp = getMobMaxHp();
    mobCurrentHp = mobMaxHp;

    setTimeout(() => {
      if (mobImg) {
        mobImg.style.transition = "opacity 0.3s";
        mobImg.style.opacity = "1";
      }
      mobIsDying = false; // ← libera ataques novamente
      updateMobUI();
    }, 300);
  }, 500);

  updateMobUI();
  saveCloudData();
}

function spawnMobFX(e, dmg) {
  const text = document.createElement("div");
  text.className = "floating-text";
  text.style.color = "#ff4444";
  text.style.fontSize = "1.5rem";
  text.innerHTML = `-${formatNumbers(dmg)} ❤️`;
  text.style.left = `${e.clientX}px`;
  text.style.top = `${e.clientY}px`;
  document.body.appendChild(text);
  setTimeout(() => text.remove(), 800);
}

function spawnDeathFX(e) {
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("img");
    particle.src = "assets/images/modes/flesh.png";
    particle.className = "flesh-particle";
    particle.style.cssText = `width:18px;height:18px;object-fit:contain;position:fixed;pointer-events:none;z-index:99;`;
    particle.style.left = `${e ? e.clientX : window.innerWidth / 2}px`;
    particle.style.top = `${e ? e.clientY : window.innerHeight / 2}px`;
    particle.style.setProperty("--x", `${(Math.random() - 0.5) * 200}px`);
    particle.style.setProperty("--y", `${(Math.random() - 0.5) * 200}px`);
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

function showMobToast(msg, color) {
  const toast = document.createElement("div");
  toast.className = "golden-toast";
  toast.innerHTML = `<span style="color:${color}">${msg}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

function updateMobUI() {
  if (!modes.mobs) return;

  const fleshEl = document.getElementById("flesh-count");
  const dmgEl = document.getElementById("mob-dmg");
  const autoEl = document.getElementById("mob-auto-dmg");
  const killsEl = document.getElementById("mob-kills");
  const hpBar = document.getElementById("mob-hp-bar");
  const hpText = document.getElementById("mob-hp-text");

  if (fleshEl) fleshEl.innerText = formatNumbers(modes.mobs.flesh);
  if (dmgEl) dmgEl.innerText = formatNumbers(getMobDamage());
  if (autoEl) autoEl.innerText = formatNumbers(getAutoMobDamage());
  if (killsEl) killsEl.innerText = formatNumbers(mobKills);

  const hpPercent = Math.max(0, (mobCurrentHp / mobMaxHp) * 100);
  if (hpBar) {
    hpBar.style.width = `${hpPercent}%`;
    // Cor da barra baseada no HP
    if (hpPercent > 60)
      hpBar.style.background = "linear-gradient(90deg, #00e676, #4caf50)";
    else if (hpPercent > 30)
      hpBar.style.background = "linear-gradient(90deg, #FFD700, #ff9800)";
    else hpBar.style.background = "linear-gradient(90deg, #ff4444, #d32f2f)";
  }
  if (hpText)
    hpText.innerText = `${formatNumbers(Math.max(0, mobCurrentHp))} / ${formatNumbers(mobMaxHp)}`;

  updateMobUpgradeButtons();
}

function startAutoMob() {
  if (autoMobInterval) clearInterval(autoMobInterval);
  autoMobInterval = setInterval(() => {
    if (!modes.mobs?.unlocked) return;
    const auto = getAutoMobDamage();
    if (auto > 0) dealDamage(auto / 10, null);
  }, 100);
}

function renderMobsUpgrades() {
  const container = document.getElementById("mobs-upgrades-container");
  if (!container) return;
  container.innerHTML = "";

  MOBS_UPGRADES.forEach((upg) => {
    const key = upg.id + "Level";
    const currentLevel = modes.mobs?.[key] || 0;
    const isMaxed = currentLevel >= upg.maxLevel;
    const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
    const canAfford = (modes.mobs?.flesh || 0) >= cost;

    container.innerHTML += `
      <div class="fishing-upgrade-item ${isMaxed ? "maxed" : ""} ${!canAfford && !isMaxed ? "cant-afford" : ""}">
        <div class="fishing-upg-icon">
          <img src="${upg.icon}" style="width:30px;height:30px;object-fit:contain;">
        </div>
        <div class="fishing-upg-info">
          <div class="fishing-upg-name">${upg.name} <span class="fishing-upg-level">${currentLevel}/${upg.maxLevel}</span></div>
          <div class="fishing-upg-effect">${upg.effect(currentLevel)}</div>
        </div>
        <button class="mobs-upg-btn ${isMaxed ? "maxed" : ""}"
          onclick="buyMobUpgrade('${upg.id}')"
          ${isMaxed || !canAfford ? "disabled" : ""}>
          ${isMaxed ? "MAX" : `<img src="assets/images/modes/flesh.png" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;">${formatNumbers(cost)}`}
        </button>
      </div>
    `;
  });
}

function updateMobUpgradeButtons() {
  MOBS_UPGRADES.forEach((upg) => {
    const key = upg.id + "Level";
    const currentLevel = modes.mobs?.[key] || 0;
    const isMaxed = currentLevel >= upg.maxLevel;
    const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
    const canAfford = (modes.mobs?.flesh || 0) >= cost;

    const btn = document.querySelector(
      `[onclick="buyMobUpgrade('${upg.id}')"]`,
    );
    if (!btn) return;

    if (isMaxed) {
      btn.disabled = true;
      btn.innerHTML = "MAX";
    } else {
      btn.disabled = !canAfford;
      btn.innerHTML = `<img src="assets/images/modes/flesh.png" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;">${formatNumbers(cost)}`;
    }

    const item = btn.closest(".fishing-upgrade-item");
    if (item) item.classList.toggle("cant-afford", !canAfford && !isMaxed);
  });
}

function buyMobUpgrade(id) {
  const upg = MOBS_UPGRADES.find((u) => u.id === id);
  if (!upg || !modes.mobs) return;

  const key = id + "Level";
  const currentLevel = modes.mobs[key] || 0;
  if (currentLevel >= upg.maxLevel) return;

  const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
  if (modes.mobs.flesh >= cost) {
    modes.mobs.flesh -= cost;
    modes.mobs[key] = currentLevel + 1;

    if (id === "crystalMob") recalculate();
    if (id === "autoSlayer") startAutoMob();

    new Audio("assets/audios/sound-effects/sucess.mp3").play().catch(() => {});
    updateMobUI();
    renderMobsUpgrades();
    saveCloudData();
  }
}

// ============================
// TUTORIAL SYSTEM
// ============================
const TUTORIAL_STEPS = [
  {
    id: "click-crystal",
    target: "#big-cookie",
    title: () => t("tutorialStep1Title"),
    text: () => t("tutorialStep1Text"),
    arrow: "bottom",
    position: "top",
  },
  {
    id: "store",
    target: "#store-section",
    title: () => t("tutorialStep2Title"),
    text: () => t("tutorialStep2Text"),
    arrow: "right",
    position: "left",
  },
  {
    id: "pickaxe",
    target: "#item-pickaxe",
    title: () => t("tutorialStep3Title"),
    text: () => t("tutorialStep3Text"),
    arrow: "right",
    position: "left",
  },
  {
    id: "rebirth",
    target: "[data-target='rebirth-tab']",
    title: () => t("tutorialStep4Title"),
    text: () => t("tutorialStep4Text"),
    arrow: "bottom",
    position: "top",
    offsetY: -20,
  },
  {
    id: "fishing",
    target: "[data-target='modes-tab']",
    title: () => t("tutorialStep5Title"),
    text: () => t("tutorialStep5Text"),
    arrow: "bottom",
    position: "top",
    offsetY: -20,
  },
  {
    id: "finish",
    target: null,
    title: () => t("tutorialStep6Title"),
    text: () => t("tutorialStep6Text"),
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
  const old = document.getElementById("tutorial-overlay");
  if (old) old.remove();

  if (index >= TUTORIAL_STEPS.length) {
    endTutorial();
    return;
  }

  const step = TUTORIAL_STEPS[index];
  const overlay = document.createElement("div");
  overlay.id = "tutorial-overlay";

  let highlightHTML = "";
  let tooltipStyle = "";
  let arrowHTML = "";

  if (step.target) {
    const targetEl = document.querySelector(step.target);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const padding = 8;

      highlightHTML = `
        <div class="tutorial-highlight" style="
          left: ${rect.left - padding}px;
          top: ${rect.top - padding}px;
          width: ${rect.width + padding * 2}px;
          height: ${rect.height + padding * 2}px;
        "></div>
      `;

      let tipLeft, tipTop;
      const tipWidth = 280;
      const tipHeight = 180; // ← aumentado

      if (step.position === "top") {
        tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
        tipTop = rect.top - tipHeight - 30 + (step.offsetY || 0); // ← offsetY
        arrowHTML = `<div class="tutorial-arrow arrow-down"></div>`;
      } else if (step.position === "bottom") {
        tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
        tipTop = rect.bottom + 20 + (step.offsetY || 0);
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

      tipLeft = Math.max(
        10,
        Math.min(tipLeft, window.innerWidth - tipWidth - 10),
      );
      tipTop = Math.max(
        10,
        Math.min(tipTop, window.innerHeight - tipHeight - 80),
      ); // ← margem do menu

      tooltipStyle = `left: ${tipLeft}px; top: ${tipTop}px;`;
    }
  } else {
    tooltipStyle = `left: 50%; top: 50%; transform: translate(-50%, -50%);`;
  }

  const isLast = index === TUTORIAL_STEPS.length - 1;
  const progress = `${index + 1}/${TUTORIAL_STEPS.length}`;

  // ← chama title/text como função se for função
  const titleText =
    typeof step.title === "function" ? step.title() : step.title;
  const bodyText = typeof step.text === "function" ? step.text() : step.text;

  overlay.innerHTML = `
    <div class="tutorial-backdrop"></div>
    ${highlightHTML}
    <div class="tutorial-tooltip" style="${tooltipStyle}">
      ${arrowHTML}
      <div class="tutorial-progress">${progress}</div>
      <h3 class="tutorial-title">${titleText}</h3>
      <p class="tutorial-text">${bodyText}</p>
      <div class="tutorial-buttons">
        <button class="tutorial-skip-btn" onclick="endTutorial()">${t("tutorialSkip")}</button>
        <button class="tutorial-next-btn" onclick="nextTutorialStep()">
          ${isLast ? t("tutorialPlay") : t("tutorialNext")}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
}

let autoTreeInterval = null;

// --- AUTH ---
function handleAuth(type) {
  const userInp = document.getElementById("auth-username").value.trim();
  const pass = document.getElementById("auth-pass").value;
  if (!userInp || !pass) return showAlert(t("fillFields"));
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
      .catch((e) => {
        const firebaseErrors = {
          "auth/email-already-in-use": t("errorUserExists"),
          "auth/weak-password": t("errorWeakPassword"),
          "auth/invalid-email": t("errorInvalidUser"),
          "auth/network-request-failed": t("errorNetwork"),
        };
        showAlert(firebaseErrors[e.code] || t("errorGeneric"));
      });
  } else {
    auth.signInWithEmailAndPassword(fakeEmail, pass).catch((e) => {
      const firebaseErrors = {
        "auth/user-not-found": t("wrongPassword"),
        "auth/wrong-password": t("wrongPassword"),
        "auth/invalid-credential": t("wrongPassword"),
        "auth/network-request-failed": t("errorNetwork"),
      };
      showAlert(firebaseErrors[e.code] || t("wrongPassword"));
    });
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
    runeCollection: runeCollection,
    runeSecretDiscovered: runeSecretDiscovered,
    lastSeen: Date.now(),
    totalPlayedSeconds: totalPlayedSeconds,
    achievementRewardsClaimed: achievementRewardsClaimed,
    diamonds: diamonds,
    diamondUpgrades: diamondUpgrades,
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
      trees: {
        unlocked: modes.trees?.unlocked || false,
        wood: modes.trees?.wood || 0,
        axeLevel: modes.trees?.axeLevel || 0,
        autoLevel: modes.trees?.autoLevel || 0,
        rareLevel: modes.trees?.rareLevel || 0,
        sawLevel: modes.trees?.sawLevel || 0,
        crystalTreeLevel: modes.trees?.crystalTreeLevel || 0,
      },
      mobs: {
        unlocked: modes.mobs?.unlocked || false,
        flesh: modes.mobs?.flesh || 0,
        kills: modes.mobs?.kills || 0,
        swordLevel: modes.mobs?.swordLevel || 0,
        autoSlayerLevel: modes.mobs?.autoSlayerLevel || 0,
        armorLevel: modes.mobs?.armorLevel || 0,
        mobLootLevel: modes.mobs?.mobLootLevel || 0,
        crystalMobLevel: modes.mobs?.crystalMobLevel || 0,
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
    totalPlayedSeconds = d.totalPlayedSeconds || 0;
    diamonds = d.diamonds || 0;
    if (d.diamondUpgrades)
      diamondUpgrades = { ...diamondUpgrades, ...d.diamondUpgrades };
    startPlayedTimer();

    if (d.modes && d.modes.fishing) {
      modes.fishing.unlocked = d.modes.fishing.unlocked || false;
      modes.fishing.fishCoins = d.modes.fishing.fishCoins || 0;
      modes.fishing.rodLevel = d.modes.fishing.rodLevel || 1;
      modes.fishing.baitLevel = d.modes.fishing.baitLevel || 0;
      modes.fishing.netLevel = d.modes.fishing.netLevel || 0;
      modes.fishing.boatLevel = d.modes.fishing.boatLevel || 0;
      modes.fishing.crystalFishLevel = d.modes.fishing.crystalFishLevel || 0;

      updateFishUI();
    }
    if (d.modes?.trees) {
      modes.trees = {
        unlocked: d.modes.trees.unlocked || false,
        wood: d.modes.trees.wood || 0,
        axeLevel: d.modes.trees.axeLevel || 0,
        autoLevel: d.modes.trees.autoLevel || 0,
        rareLevel: d.modes.trees.rareLevel || 0,
        sawLevel: d.modes.trees.sawLevel || 0,
        crystalTreeLevel: d.modes.trees.crystalTreeLevel || 0,
      };
      if (modes.trees.unlocked) startAutoTree();
    }
    const mobsData = d.modes?.mobs;
    if (mobsData && typeof mobsData === "object") {
      modes.mobs.unlocked = mobsData.unlocked || false;
      modes.mobs.flesh = mobsData.flesh || 0;
      modes.mobs.kills = mobsData.kills || 0;
      modes.mobs.swordLevel = mobsData.swordLevel || 0;
      modes.mobs.autoSlayerLevel = mobsData.autoSlayerLevel || 0;
      modes.mobs.armorLevel = mobsData.armorLevel || 0;
      modes.mobs.mobLootLevel = mobsData.mobLootLevel || 0;
      modes.mobs.crystalMobLevel = mobsData.crystalMobLevel || 0;
      mobKills = modes.mobs.kills;
      mobMaxHp = getMobMaxHp();
      mobCurrentHp = mobMaxHp;
      if (modes.mobs.unlocked) startAutoMob();
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
        multiElement.innerText = formatNumbers(getRebirthMultiplier()) + "x";
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
      if (d.runeCollection) {
        runeCollection = d.runeCollection;
      }
      if (d.runeSecretDiscovered) {
        runeSecretDiscovered = d.runeSecretDiscovered;
      }
    });

    if (d.achievementRewardsClaimed) {
      achievementRewardsClaimed = d.achievementRewardsClaimed;
    }

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
    renderRuneCollection();
    updateRuneBonuses();
    checkFirstLogin();
    listenToEvents();
    startGoldenCookieSystem();
    initCrystalSparkles();
    loadEquippedSkin();
    if (userName === ADMIN_USER) {
      // ← de volta para ADMIN_USER simples
      setTimeout(renderAdminPanel, 500);
    }
    console.log("Data loaded successfully!");
  }
}

// --- RANKING
async function updateGlobalRanking() {
  const cList = document.getElementById("ranking-cookies");
  const tList = document.getElementById("ranking-playtime");

  if (!cList) return;

  try {
    // 1. Ranking de Cristais
    const snapC = await db
      .collection("users")
      .orderBy("totalCookies", "desc")
      .limit(100)
      .get();
    cList.innerHTML = "";
    let indexC = 1;
    snapC.forEach((doc) => {
      const data = doc.data();
      cList.innerHTML += `
        <div class="ranking-item">
          <span>${indexC}º - ${data.name || "Anonymous"}</span>
          <span style="color:#b700ff;text-shadow:0 0 5px #b866b1;">${formatNumbers(data.totalCookies || 0)}</span>
        </div>`;
      indexC++;
    });

    // 2. Ranking de Time Played
    if (tList) {
      const snapT = await db
        .collection("users")
        .orderBy("totalPlayedSeconds", "desc")
        .limit(100)
        .get();
      tList.innerHTML = "";
      let indexT = 1;
      snapT.forEach((doc) => {
        const data = doc.data();

        // Se for o usuário atual, usa o valor em memória (mais preciso)
        const isMe = doc.id === userLogged?.uid;
        const secs = isMe ? totalPlayedSeconds : data.totalPlayedSeconds || 0;

        tList.innerHTML += `
          <div class="ranking-item" data-seconds="${secs}">
            <span>${indexT}º - ${data.name || "Anonymous"}</span>
            <span style="color:#ff9800;text-shadow:0 0 5px #ff6500;">${formatPlayTime(secs)}</span>
          </div>`;
        indexT++;
      });

      // Inicia o tick em tempo real depois de montar a lista
      startRankingRealtimeTick();
    }
  } catch (error) {
    console.error("Erro ao carregar rankings:", error);
  }
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

  // Multiplicador de Rebirth corrigido
  let multi = getRebirthMultiplier();

  // Bônus Extras (Verifica se as funções existem para não dar erro)
  const crystalFishLvl = modes.fishing.crystalFishLevel || 0;
  const crystalFishBonus = Math.pow(1.25, crystalFishLvl);
  const achRewardBonus = getAchievementRewardMultiplier();
  const diamondBonus =
    typeof getDiamondCrystalBonus === "function" ? getDiamondCrystalBonus() : 1;
  const crystalStormBonus =
    typeof getCrystalStormMultiplier === "function"
      ? getCrystalStormMultiplier()
      : 1;
  const runeBonus =
    typeof getRuneCrystalMultiplier === "function"
      ? getRuneCrystalMultiplier()
      : 1;

  const specialBonus =
    goldenMultiplier > 1 && rainbowMultiplier > 1
      ? goldenMultiplier * rainbowMultiplier * 2
      : goldenMultiplier * rainbowMultiplier;

  buildings.forEach((b) => {
    cps +=
      b.cps *
      b.quantity *
      multi *
      crystalFishBonus *
      achRewardBonus *
      diamondBonus *
      crystalStormBonus *
      runeBonus *
      specialBonus;
  });
}

function getAchievementRewardMultiplier() {
  const claimed = Object.keys(achievementRewardsClaimed).filter(
    (id) => achievementRewardsClaimed[id],
  ).length;
  return Math.pow(1.5, claimed);
}

function updateUI() {
  // 1. Atualiza o contador principal
  const cookieCountEl = document.getElementById("cookie-count");
  if (cookieCountEl) cookieCountEl.innerText = formatNumbers(cookies);

  // 2. Atualiza o CPS
  const cpsEl = document.getElementById("cps");
  if (cpsEl) cpsEl.innerText = formatNumbers(cps * goldenMultiplier);

  // 3. Atualiza o Rebirth
  const pendingEl = document.getElementById("pending-points");
  if (pendingEl)
    pendingEl.innerText = formatNumbers(Math.floor(cookies / getRebirthCost()));

  const rbPointsEl = document.getElementById("rebirth-points");
  if (rbPointsEl) rbPointsEl.innerText = formatNumbers(rebirthPoints);

  const multiValEl = document.getElementById("multi-val");
  if (multiValEl) multiValEl.innerText = getRebirthMultiplier().toFixed(2);

  // 4. Atualiza a Loja
  buildings.forEach((item) => {
    const costSpan = document.getElementById(`cost-${item.id}`);
    const qtdDisplay = document.getElementById(`qtd-${item.id}`);
    const div = document.getElementById(`item-${item.id}`);

    if (!costSpan || !qtdDisplay) return;

    let unitCost = item.baseCost * Math.pow(1.15, item.quantity);
    let displayCost = unitCost;

    if (buyAmount === "max") {
      let tempC = cookies;
      let tempQ = item.quantity;
      let count = 0;
      let total = 0;
      while (tempC >= item.baseCost * Math.pow(1.15, tempQ)) {
        let nextPrice = item.baseCost * Math.pow(1.15, tempQ);
        tempC -= nextPrice;
        total += nextPrice;
        tempQ++;
        count++;
      }
      displayCost = count > 0 ? total : unitCost;
      costSpan.innerText =
        formatNumbers(displayCost) + (count > 0 ? ` (${count}x)` : "");
    } else {
      displayCost = 0;
      for (let i = 0; i < buyAmount; i++) {
        displayCost += item.baseCost * Math.pow(1.15, item.quantity + i);
      }
      costSpan.innerText = formatNumbers(displayCost);
    }

    qtdDisplay.innerText = item.quantity;
    if (div) {
      cookies < displayCost
        ? div.classList.add("disabled")
        : div.classList.remove("disabled");
    }
  });
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
  if (multiElement)
    multiElement.innerText = formatNumbers(multiplierValue) + "";

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
    new Audio("assets/audios/sound-effects/sucess.mp3").play().catch(() => {});
    saveCloudData();
  }
}

// --- MODES ---
function unlockMode(id) {
  const costs = { fishing: 100, trees: 5e6, mobs: 2.5e15 };
  const cost = costs[id];

  if (rebirthPoints < cost) {
    showAlert(
      `❌ You need <span style="color:#a855f7">${formatNumbers(cost)} RP</span> to unlock this mode!`,
    );
    return;
  }

  const names = { fishing: "Fishing", trees: "Trees", mobs: "Mobs" };
  showConfirm(
    `Unlock <span style="color:#00e676">${names[id]} Mode</span> for <span style="color:#a855f7">${formatNumbers(cost)} RP</span>?`,
    () => {
      rebirthPoints -= cost;

      if (id === "fishing") {
        modes.fishing.unlocked = true;
      }
      if (id === "trees") {
        modes.trees.unlocked = true;
        startAutoTree();
      }
      if (id === "mobs") {
        modes.mobs.unlocked = true;
        mobMaxHp = getMobMaxHp();
        mobCurrentHp = mobMaxHp;
        startAutoMob();
      }

      updateModeUI();
      updateUI();
      saveCloudData();
    },
  );
}

function updateModeUI() {
  // --- FISHING ---
  if (modes.fishing?.unlocked) {
    const u = document.getElementById("unlock-fishing");
    const e = document.getElementById("enter-fishing");
    if (u) u.style.display = "none";
    if (e) e.style.display = "inline-block";
  }

  // --- TREES ---
  if (modes.trees?.unlocked) {
    const u = document.getElementById("unlock-trees-btn");
    const e = document.getElementById("enter-trees-btn");
    if (u) u.style.display = "none";
    if (e) e.style.display = "inline-block";
  }

  // --- MOBS ---
  if (modes.mobs?.unlocked) {
    const u = document.getElementById("unlock-mobs-btn");
    const e = document.getElementById("enter-mobs-btn");
    if (u) u.style.display = "none";
    if (e) e.style.display = "inline-block";
  }
}

function showSubMode(targetId) {
  const modesMenu = document.getElementById("modes-menu");
  const fishingArea = document.getElementById("fishing-area");
  const treesArea = document.getElementById("trees-area");
  const mobsArea = document.getElementById("mobs-area");

  modesMenu.style.setProperty("display", "none", "important");
  if (fishingArea)
    fishingArea.style.setProperty("display", "none", "important");
  if (treesArea) treesArea.style.setProperty("display", "none", "important");
  if (mobsArea) mobsArea.style.setProperty("display", "none", "important");

  if (targetId === "modes-menu") {
    modesMenu.style.setProperty("display", "flex", "important");
  } else if (targetId === "fishing-area") {
    fishingArea.style.setProperty("display", "flex", "important");
    renderFishingUpgrades();
  } else if (targetId === "trees-area") {
    treesArea.style.setProperty("display", "flex", "important");
    renderTreesUpgrades();
    updateTreeUI();
    startAutoTree();
  } else if (targetId === "mobs-area") {
    mobsArea.style.setProperty("display", "flex", "important");
    renderMobsUpgrades();
    updateMobUI();
    startAutoMob();
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
      `${t("rebirthNeedCrystals")} <span style="color:#00f2fe">${formatNumbers(getRebirthCost())}</span> ${t("rebirthToCrystals")}`,
    );
    return;
  }

  showConfirm(
    `${t("rebirthConfirm")}<br><br>${t("rebirthReceive")} <span style="color:#a855f7; font-size:1.2rem">${formatNumbers(pendingPoints)} RP</span><br><br><small style="color:#ff6b6b">${t("rebirthReset")}</small>`,
    async () => {
      rebirthPoints += pendingPoints;
      new Audio("assets/audios/sound-effects/rebirth.mp3")
        .play()
        .catch(() => {});
      cookies = 0;
      buildings.forEach((b) => (b.quantity = 0));
      recalculate();
      await saveCloudData();
      updateUI();
      showAlert(t("rebirthSuccess"));
      document.querySelectorAll(".nav-btn")[0].click();
    },
  );
};

function getRebirthCost() {
  const runeRPMult = getRuneRPMultiplier(); // runas reduzem custo
  return Math.floor((5000 + Math.sqrt(rebirthPoints) * 1000) / runeRPMult);
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
    new Audio("assets/audios/sound-effects/sucess.mp3").play().catch(() => {});
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
  const clickSound = new Audio("assets/audios/sound-effects/clicking.mp3");
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
    const cheatAmount = 1e80;
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
    const targetId = btn.dataset.target;
    if (targetId === "ranking-tab" || targetId === "achievements-tab") return;
    if (targetId === "skins-tab") renderSkinsGrid();
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((t) => t.classList.remove("active"));

    ["ranking-tab", "achievements-tab", "skins-tab"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.setProperty("display", "none", "important");
    });

    btn.classList.add("active");
    const targetTab = document.getElementById(targetId);
    if (targetTab) {
      targetTab.classList.add("active");
      targetTab.style.removeProperty("display");
    }

    if (targetId === "rebirth-tab") renderRebirthShop();
    if (targetId === "runes-tab") {
      renderRuneCollection();
      updateRuneBonuses();
    }
    if (targetId === "misc-tab") updateMiscStats();
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

/*document.querySelectorAll(".selector-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".selector-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    buyAmount =
      btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
    updateUI();
  };
}); */

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

    const claimed = achievementRewardsClaimed[ach.id];
    const canClaim = ach.unlocked && !claimed;

    const card = document.createElement("div");
    card.className = `achievement-card ${ach.unlocked ? "unlocked" : ""} ${claimed ? "reward-claimed" : ""}`;

    const rewardBadge = ach.unlocked
      ? claimed
        ? `<div class="ach-reward-badge claimed">✓ 1.5x</div>`
        : `<div class="ach-reward-badge ready">! 1.5x</div>`
      : "";

    card.innerHTML = `
      ${rewardBadge}
      <div style="font-size:1.5rem;">${ach.unlocked ? "🏆" : "🔒"}</div>
      <b style="font-size:0.7rem;">${ach.title}</b>
    `;

    card.onclick = () => {
      if (!ach.unlocked) {
        showAlert(`
          <div style="text-align:center">
            <div style="font-size:2rem">🔒</div>
            <b style="color:#aaa">${ach.title}</b>
            <br><br>
            <span style="color:#aaa;font-size:0.75rem">${ach.hint}</span>
            <br><br>
            <span style="color:#ff6b6b">${t("achievementLocked")}</span>
          </div>
        `);
        return;
      }

      if (claimed) {
        showAlert(`
          <div style="text-align:center">
            <div style="font-size:2rem">🏆</div>
            <b style="color:var(--gold)">${ach.title}</b>
            <br><br>
            <span style="color:#aaa;font-size:0.75rem">${ach.hint}</span>
            <br><br>
            <span style="color:#00e676;font-size:0.8rem">✓ ${t("achievementRewardClaimed")}</span>
            <br>
            <span style="color:#a855f7;font-size:0.7rem">${t("achievementRewardBonus")}</span>
          </div>
        `);
        return;
      }

      showConfirm(
        `
        <div style="text-align:center">
          <div style="font-size:2rem">🏆</div>
          <b style="color:var(--gold)">${ach.title}</b>
          <br><br>
          <span style="color:#aaa;font-size:0.7rem">${ach.hint}</span>
          <br><br>
          <div style="background:rgba(168,85,247,0.15);border:1px solid #a855f7;border-radius:8px;padding:10px;margin:10px 0;">
            <span style="color:#fff;font-size:0.8rem">🎁 ${t("achievementRewardReady")}</span>
            <br>
            <span style="color:#a855f7;font-size:1rem;font-weight:bold;">${t("achievementRewardBonus")}</span>
            <br>
            <span style="color:rgba(255,255,255,0.4);font-size:0.6rem;">${t("achievementRewardStack")}</span>
          </div>
          <span style="color:#FFD700;font-size:0.7rem">${t("achievementRewardConfirm")}</span>
        </div>
      `,
        () => {
          achievementRewardsClaimed[ach.id] = true;
          recalculate();
          saveCloudData();
          renderAchievements();

          const toast = document.createElement("div");
          toast.className = "golden-toast";
          toast.innerHTML = `🏆 <span style="color:#a855f7">${ach.title}</span> — <span style="color:#FFD700">${t("achievementRewardBonus")}</span>`;
          document.body.appendChild(toast);
          requestAnimationFrame(() => toast.classList.add("show"));
          setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 500);
          }, 3000);
        },
      );
    };

    list.appendChild(card);
  });

  const percent = (unlockedCount / achievements.length) * 100;
  progressBar.style.width = `${percent}%`;

  const totalClaimed = Object.keys(achievementRewardsClaimed).filter(
    (id) => achievementRewardsClaimed[id],
  ).length;
  const totalMultiplier = Math.pow(1.5, totalClaimed).toFixed(2);

  progressText.innerText = `${unlockedCount}/${achievements.length} ${t("achievementUnlocked").replace("✓ ", "")} — ${totalClaimed} ${t("achievementRewardClaimed").toLowerCase()} (${totalMultiplier}x bonus)`;
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
  cookies += 9e70;
  totalCookies += 9e70;
  updateUI();
  saveCloudData();
  showAdminToast("💎 +999,999 Crystals added!");
}

// Admin: adiciona fish coins
function adminAddFishCoins() {
  modes.fishing.fishCoins += 999999;
  updateFishUI(); // ← substitui as três linhas antigas
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
  new Audio("assets/audios/sound-effects/shiny-collect.wav")

    .play()
    .catch(() => {});
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
  new Audio("assets/audios/sound-effects/rainbow-collect.wav")
    .play()
    .catch(() => {});

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
        <button class="custom-modal-btn confirm" onclick="this.closest('.custom-modal-overlay').remove(); ${onConfirm ? "customModalCallback()" : ""}">${t("ok")}</button>
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
        <button class="custom-modal-btn confirm" id="modal-ok">${t("confirm")}</button>
        <button class="custom-modal-btn cancel" id="modal-cancel">${t("cancel")}</button>
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
  // 1. Navegação — 5 botões com imagens + label traduzido
  const navKeys = ["home", "rebirthNav", "modes", "runes", "misc"];
  const navImgs = [
    "assets/images/ui/home.png",
    "assets/images/ui/rebirth.png",
    "assets/images/ui/modes.png",
    "assets/images/ui/runes.png",
    "assets/images/ui/misc.png",
  ];
  document.querySelectorAll(".nav-btn").forEach((btn, i) => {
    if (navKeys[i]) {
      btn.innerHTML = `
        <img src="${navImgs[i]}" class="nav-icon-img" />
        <span class="nav-label">${t(navKeys[i])}</span>
      `;
    }
  });

  // 2. Títulos das Seções Principais (IDs do HTML)
  const titleMap = {
    "title-store": "upgrades",
    "title-rebirth": "rebirth",
    "title-modes": "gameModes",
    "title-ranking": "topGlobal",
    "title-achievements": "achievements",
    "title-settings": "settings",
    "title-runes": "runes",
    "title-fishing": "lakeIncremental",
    "title-ranking-playtime": "rankingPlaytime",
  };
  Object.entries(titleMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.innerText = t(key);
  });

  // 3. Modos (Trees, Mobs e Fishing) - Títulos, Descrições e Botões
  const modeElements = [
    { id: "title-trees-mode", key: "treesMode" },
    { id: "desc-trees-mode", key: "treesDesc" },
    { id: "title-mobs-mode", key: "mobsMode" },
    { id: "desc-mobs-mode", key: "mobsDesc" },
    { id: "fishing-name", key: "fishingMode" },
    { id: "fishing-desc", key: "fishingDesc" },
  ];
  modeElements.forEach((el) => {
    const target = document.getElementById(el.id);
    if (target) target.innerText = t(el.key);
  });

  // 4. Botões de Ação dos Modos (Unlock/Enter)
  const modeButtons = [
    { id: "unlock-fishing", key: "unlockFishing", cost: "100 RP" },
    { id: "enter-fishing", key: "enterLake" },
    { id: "unlock-trees-btn", key: "unlockTrees", cost: "5M RP" },
    { id: "enter-trees-btn", key: "enterForest" },
    { id: "unlock-mobs-btn", key: "unlockMobs", cost: "2.5Qa RP" },
    { id: "enter-mobs-btn", key: "enterArena" },
  ];
  modeButtons.forEach((btnInfo) => {
    const btn = document.getElementById(btnInfo.id);
    if (btn) {
      btn.innerText = btnInfo.cost
        ? `${t(btnInfo.key)} (${btnInfo.cost})`
        : t(btnInfo.key);
    }
  });

  // 5. Runas — botão ROLL traduzido
  const runeBonusesTitle = document.querySelector(".rune-bonuses-title");
  if (runeBonusesTitle) runeBonusesTitle.innerText = t("runeBonuses");

  document.querySelectorAll(".rune-roll-btn").forEach((btn) => {
    // Só atualiza se não estiver em cooldown (mostrando timer)
    if (!btn.disabled) btn.innerText = t("rollBtn");
  });

  // 6. Score Board (Cristais e CPS)
  const cpsTextEl = document.querySelector(".cps-text");
  if (cpsTextEl) {
    cpsTextEl.innerHTML = `${t("perSecond")} <span id="cps">${document.getElementById("cps")?.innerText || "0"}</span>`;
  }
  const cookieText = document.querySelector(".cookie-text");
  if (cookieText) {
    cookieText.innerHTML = `
      <span id="cookie-count">${document.getElementById("cookie-count")?.innerText || "0"}</span> ${t("crystals")}
      <img src="assets/images/ores/crystal.png" style="width: 40px; vertical-align: middle; margin-left: 10px;">
    `;
  }

  // 7. Ranking (Crystals | RP)
  const rankCrystalsTitle = document.querySelector(
    "#ranking-tab .ranking-box:first-child h3",
  );
  const rankPlaytimeTitle = document.getElementById("title-ranking-playtime");

  if (rankCrystalsTitle) rankCrystalsTitle.innerText = t("rankingCrystals");
  if (rankPlaytimeTitle) rankPlaytimeTitle.innerText = t("rankingPlaytime");

  // 8. Seletores de Compra (1x, 10x, Max)
  document.querySelectorAll(".selector-btn").forEach((btn) => {
    if (btn.dataset.amount === "max") {
      btn.innerText = t("buyMax");
    }
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

  // 9. Ganhos Offline & Settings
  const offlineTitle = document.getElementById("offline-title");
  if (offlineTitle) offlineTitle.innerText = t("welcomeBack");

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.innerText = t("logout");

  const orbitBtn = document.getElementById("orbit-btn");
  if (orbitBtn)
    orbitBtn.innerText = orbitEnabled
      ? t("disablePickaxes")
      : t("enablePickaxes");

  const muteBtn = document.getElementById("mute-btn");
  if (muteBtn) muteBtn.innerText = isMuted ? t("unmuteMusic") : t("muteMusic");

  // 10. Fish Coins display
  const fishCoinsDisplay = document.querySelector(".fish-coins-display");
  if (fishCoinsDisplay) {
    fishCoinsDisplay.innerHTML = `
      <img src="assets/images/modes/fish-coin.png" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;margin-right:6px;" />
      <span id="fish-coins">${document.getElementById("fish-coins")?.innerText || "0"}</span> ${t("fishCoins")}
    `;
  }

  // 11. Fishing status
  const fishStatus = document.getElementById("fishing-status");
  if (fishStatus && !isFishing) {
    fishStatus.innerHTML = `<span style="color:#aaa">${t("clickToFish")}</span>`;
  }

  // 12. Fish gallery title
  const galleryTitle = document.querySelector(".fish-gallery-title");
  if (galleryTitle) galleryTitle.innerText = t("fishEncyclopedia");

  // 13. Fishing upgrades title
  const fishUpgradesTitle = document.querySelector(
    ".fishing-upgrades-panel .section-title",
  );
  if (fishUpgradesTitle) fishUpgradesTitle.innerText = t("fishUpgrades");

  // 14. Back buttons
  document.querySelectorAll(".fishing-back-btn").forEach((btn) => {
    // Só atualiza se for o botão de voltar dos modos (não o de ranking/achievements)
    if (btn.getAttribute("onclick")?.includes("showSubMode")) {
      btn.innerText = t("back");
    }
  });

  // 15. Rebirth panel card
  const rebirthCardEl = document.querySelector(".rebirth-card");
  if (rebirthCardEl) {
    rebirthCardEl.innerHTML = `
      <p>${t("globalMultiplier")} <span id="multi-val" class="highlight">${getRebirthMultiplier().toFixed(2)}</span>x</p>
      <p>RP: <span id="rebirth-points" class="highlight">${rebirthPoints}</span></p>
    `;
  }

  // 16. Sub-title rebirth upgrades
  const subTitle = document.querySelector(".sub-title");
  if (subTitle) subTitle.innerText = t("rebirthUpgrades");

  const runeNames = {
    starter: "runeNameStarter",
    advanced: "runeNameAdvanced",
    ancient: "runeNameAncient",
    celestial: "runeNameCelestial",
  };
  Object.entries(runeNames).forEach(([key, transKey]) => {
    const el = document.getElementById(`rune-name-${key}`);
    if (el) el.innerText = t(transKey);
  });

  updateUI();

  // IMPORTANTE: rebind nav listeners pois o innerHTML dos botões foi recriado
  rebindNavListeners();
}

function rebindNavListeners() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.onclick = () => {
      const targetId = btn.dataset.target;

      // ranking e achievements são sub-páginas do misc, não nav direto
      if (targetId === "ranking-tab" || targetId === "achievements-tab") return;

      document
        .querySelectorAll(".nav-btn")
        .forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((t) => {
        t.classList.remove("active");
      });

      // Garante que ranking e achievements fiquem escondidos
      ["ranking-tab", "achievements-tab", "skins-tab"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.setProperty("display", "none", "important");
      });

      btn.classList.add("active");
      const targetTab = document.getElementById(targetId);
      if (targetTab) {
        targetTab.classList.add("active");
        targetTab.style.removeProperty("display");
      }

      // Gatilhos
      if (targetId === "rebirth-tab") renderRebirthShop();
      if (targetId === "runes-tab") {
        renderRuneCollection();
        updateRuneBonuses();
      }
      if (targetId === "misc-tab") updateMiscStats();
    };
  });
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
  showAlert(t("tutorialSkip")); // ← usa t()
}

function getWoodPerClick() {
  const axeLvl = modes.trees?.axeLevel || 0;
  const sawLvl = modes.trees?.sawLevel || 0;
  const base = 1 + axeLvl;
  const multiplier = sawLvl > 0 ? sawLvl * 2 : 1;
  return base * multiplier;
}

function getAutoWood() {
  const autoLvl = modes.trees?.autoLevel || 0;
  const sawLvl = modes.trees?.sawLevel || 0;
  const base = autoLvl * 2;
  const multiplier = sawLvl > 0 ? sawLvl * 2 : 1;
  return base * multiplier;
}

function chopTree(e) {
  if (!modes.trees) return;
  new Audio("assets/audios/sound-effects/axe-slash.mp3").play().catch(() => {});

  let wood = getWoodPerClick();

  // Rare Tree bonus
  const rareLvl = modes.trees.rareLevel || 0;
  if (rareLvl > 0 && Math.random() < rareLvl * 0.2) {
    wood *= 3;
    spawnTreeFX(e, wood, true);
  } else {
    spawnTreeFX(e, wood, false);
  }

  modes.trees.wood += wood;
  updateTreeUI();

  // Animação da árvore ao clicar
  const treeImg = document.getElementById("tree-img");
  if (treeImg) {
    treeImg.classList.add("tree-chopping");
    setTimeout(() => treeImg.classList.remove("tree-chopping"), 150);
  }
}

function spawnTreeFX(e, amount, isBonus) {
  const text = document.createElement("div");
  text.className = "floating-text";
  text.style.color = isBonus ? "#FFD700" : "#8BC34A";
  text.style.display = "flex";
  text.style.alignItems = "center";
  text.style.gap = "4px";
  text.innerHTML = `+${formatNumbers(amount)} <img src="assets/images/modes/log.png" style="width:56px;height:56px;object-fit:contain;">${isBonus ? " BONUS!" : ""}`;
  text.style.left = `${e.clientX}px`;
  text.style.top = `${e.clientY}px`;
  document.body.appendChild(text);
  setTimeout(() => text.remove(), 800);

  // Partículas de folhas
  for (let i = 0; i < 4; i++) {
    const leaf = document.createElement("div");
    leaf.className = "leaf-particle";
    leaf.innerText = ["🍃", "🍂", "🌿"][Math.floor(Math.random() * 3)];
    leaf.style.left = `${e.clientX}px`;
    leaf.style.top = `${e.clientY}px`;
    leaf.style.setProperty("--x", `${(Math.random() - 0.5) * 150}px`);
    leaf.style.setProperty("--y", `${(Math.random() - 0.5) * 150}px`);
    document.body.appendChild(leaf);
    setTimeout(() => leaf.remove(), 800);
  }
}

function updateTreeUI() {
  if (!modes.trees) return;
  const woodEl = document.getElementById("wood-count");
  const wpcEl = document.getElementById("wood-per-click");
  const autoEl = document.getElementById("wood-auto");
  if (woodEl) woodEl.innerText = formatNumbers(modes.trees.wood);
  if (wpcEl) wpcEl.innerText = formatNumbers(getWoodPerClick());
  if (autoEl) autoEl.innerText = formatNumbers(getAutoWood());

  // ← Atualiza apenas os botões sem recriar tudo
  updateTreeUpgradeButtons();
}

function updateTreeUpgradeButtons() {
  TREES_UPGRADES.forEach((upg) => {
    const key = upg.id + "Level";
    const currentLevel = modes.trees?.[key] || 0;
    const isMaxed = currentLevel >= upg.maxLevel;
    const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
    const canAfford = (modes.trees?.wood || 0) >= cost;

    const btn = document.querySelector(
      `[onclick="buyTreeUpgrade('${upg.id}')"]`,
    );
    if (!btn) return;

    if (isMaxed) {
      btn.disabled = true;
      btn.innerHTML = "MAX";
    } else {
      btn.disabled = !canAfford;
      btn.innerHTML = `<img src="assets/images/modes/log.png" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;">${formatNumbers(cost)}`;
    }

    // Atualiza classe cant-afford no item pai
    const item = btn.closest(".fishing-upgrade-item");
    if (item) {
      item.classList.toggle("cant-afford", !canAfford && !isMaxed);
    }
  });
}

function updateFishingUpgradeButtons() {
  FISHING_UPGRADES.forEach((upg) => {
    const key = upg.id === "rod" ? "rodLevel" : upg.id + "Level";
    const currentLevel =
      upg.id === "rod"
        ? (modes.fishing.rodLevel || 1) - 1
        : modes.fishing[key] || 0;

    const isMaxed = currentLevel >= upg.maxLevel;
    const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
    const canAfford = modes.fishing.fishCoins >= cost;

    const btn = document.querySelector(
      `[onclick="buyFishingUpgrade('${upg.id}')"]`,
    );
    if (!btn) return;

    const coinImg = `<img src="assets/images/modes/fish-coin.png" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;">`;

    if (isMaxed) {
      btn.disabled = true;
      btn.innerHTML = "MAX";
    } else {
      btn.disabled = !canAfford;
      btn.innerHTML = `${coinImg}${formatNumbers(cost)}`;
    }

    const item = btn.closest(".fishing-upgrade-item");
    if (item) {
      item.classList.toggle("cant-afford", !canAfford && !isMaxed);
    }
  });
}

function updateFishUI() {
  const fishDisplay = document.getElementById("fish-coins");
  if (fishDisplay)
    fishDisplay.innerText = formatNumbers(modes.fishing.fishCoins);
  updateFishingUpgradeButtons();
}

function startAutoTree() {
  if (autoTreeInterval) clearInterval(autoTreeInterval);
  autoTreeInterval = setInterval(() => {
    if (!modes.trees?.unlocked) return;
    const auto = getAutoWood();
    if (auto > 0) {
      modes.trees.wood += auto / 10;
      updateTreeUI();
    }
  }, 100);
}

function renderTreesUpgrades() {
  const container = document.getElementById("trees-upgrades-container");
  if (!container) return;
  container.innerHTML = "";

  TREES_UPGRADES.forEach((upg) => {
    const key = upg.id + "Level";
    const currentLevel = modes.trees?.[key] || 0;
    const isMaxed = currentLevel >= upg.maxLevel;
    const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
    const canAfford = (modes.trees?.wood || 0) >= cost;

    container.innerHTML += `
      <div class="fishing-upgrade-item ${isMaxed ? "maxed" : ""} ${!canAfford && !isMaxed ? "cant-afford" : ""}">
        <div class="fishing-upg-icon">${upg.icon}</div>
        <div class="fishing-upg-info">
          <div class="fishing-upg-name">${upg.name} <span class="fishing-upg-level">${currentLevel}/${upg.maxLevel}</span></div>
          <div class="fishing-upg-effect">${upg.effect(currentLevel)}</div>
        </div>
        <button class="trees-upg-btn ${isMaxed ? "maxed" : ""}"
          onclick="buyTreeUpgrade('${upg.id}')"
          ${isMaxed || !canAfford ? "disabled" : ""}>
          ${isMaxed ? "MAX" : `<img src="assets/images/modes/log.png" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;">${formatNumbers(cost)}`}
        </button>
      </div>
    `;
  });
}

function buyTreeUpgrade(id) {
  const upg = TREES_UPGRADES.find((u) => u.id === id);
  if (!upg || !modes.trees) return;

  const key = id + "Level";
  const currentLevel = modes.trees[key] || 0;
  if (currentLevel >= upg.maxLevel) return;

  const cost = Math.floor(upg.baseCost * Math.pow(2.5, currentLevel));
  if (modes.trees.wood >= cost) {
    modes.trees.wood -= cost;
    modes.trees[key] = currentLevel + 1;
    new Audio("assets/audios/sound-effects/sucess.mp3").play().catch(() => {});

    if (id === "crystalTree") recalculate();
    if (id === "auto") startAutoTree();

    updateTreeUI();
    renderTreesUpgrades();
    saveCloudData();
  }
}

window.addEventListener("beforeunload", () => {
  saveCloudData();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveCloudData();
  }
});

// Saves: { starter: { common: 3, rare: 1, ... }, advanced: {}, ... }
let runeCollection = { starter: {}, advanced: {}, ancient: {}, celestial: {} };
// Guarda quais secretas foram descobertas
let runeSecretDiscovered = {
  starter: false,
  advanced: false,
  ancient: false,
  celestial: false,
};

function getRuneLuckBonus() {
  let luck = 0;
  Object.keys(RUNE_CATEGORIES).forEach((catKey) => {
    const cat = RUNE_CATEGORIES[catKey];
    cat.runes.forEach((rune) => {
      const count = runeCollection[catKey]?.[rune.id] || 0;
      if (count > 0 && rune.runeLuck) luck += rune.runeLuck * count;
    });
  });
  return Math.min(luck, 0.95); // max 95% luck boost
}

function getTotalRuneBonus(stat) {
  let total = 0;
  Object.keys(RUNE_CATEGORIES).forEach((catKey) => {
    const cat = RUNE_CATEGORIES[catKey];
    cat.runes.forEach((rune) => {
      const count = runeCollection[catKey]?.[rune.id] || 0;
      if (count > 0 && rune[stat] !== undefined) {
        if (stat === "runeBulk") {
          if (rune.chance === 0.005) total += count;
        } else {
          total += rune[stat] * count;
        }
      }
    });
  });
  return total;
}

function getRuneCrystalMultiplier() {
  return 1 + getTotalRuneBonus("crystalMult");
}

function getRuneRPMultiplier() {
  return 1 + getTotalRuneBonus("rpMult");
}

function getRuneFishCoinMultiplier() {
  return 1 + getTotalRuneBonus("fishCoinMult");
}

let runeRolling = {}; // cooldown independente por categoria

function getRollCooldown() {
  const speedBonus = getTotalRuneBonus("runeSpeed");
  const reduction = Math.min(speedBonus * 190, 1900);
  return 2000 - reduction; // 2000ms → 100ms
}

function getRollCount() {
  const bulk = Math.min(getTotalRuneBonus("runeBulk"), 50); // cap 50
  return Math.max(1, 1 + bulk);
}

function rollRune(catKey) {
  const cat = RUNE_CATEGORIES[catKey];
  if (!cat) return;

  if (runeRolling[catKey]) return; // cooldown só desta categoria

  const rollCount = getRollCount();
  const totalCost = cat.cost * rollCount;

  if (cookies < totalCost) {
    showAlert(
      `❌ You need <span style="color:#a855f7">${formatNumbers(totalCost)}</span> Crystals to roll!`,
    );
    return;
  }

  cookies -= totalCost;
  runeRolling[catKey] = true;

  // Desabilita apenas o botão desta categoria
  const btn = document.querySelector(`[onclick="rollRune('${catKey}')"]`);
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  }

  const luckBonus = getRuneLuckBonus();
  const runes = cat.runes;
  const results = [];

  for (let r = 0; r < rollCount; r++) {
    let adjustedChances = runes.map((rune, i) => {
      let chance = rune.chance;
      if (i >= 3) chance *= 1 + luckBonus;
      return { rune, chance };
    });

    const total = adjustedChances.reduce((s, r) => s + r.chance, 0);
    adjustedChances = adjustedChances.map((r) => ({
      ...r,
      chance: r.chance / total,
    }));

    const rand = Math.random();
    let cumulative = 0;
    let rolled = runes[0];
    for (let item of adjustedChances) {
      cumulative += item.chance;
      if (rand <= cumulative) {
        rolled = item.rune;
        break;
      }
    }

    if (!runeCollection[catKey]) runeCollection[catKey] = {};
    runeCollection[catKey][rolled.id] =
      (runeCollection[catKey][rolled.id] || 0) + 1;

    if (rolled.secret) runeSecretDiscovered[catKey] = true;
    results.push(rolled);
  }

  recalculate();
  updateUI();
  renderRuneCollection();
  updateRuneBonuses();
  saveCloudData();

  showRuneToast(results, catKey);
  startRollCooldown(catKey, getRollCooldown());
}

function startRollCooldown(catKey, cooldown) {
  const btn = document.querySelector(`[onclick="rollRune('${catKey}')"]`);
  if (!btn) return;

  let remaining = cooldown;
  const interval = setInterval(() => {
    remaining -= 50;
    const secs = (Math.max(0, remaining) / 1000).toFixed(1);
    btn.innerText = `${secs}s`;

    if (remaining <= 0) {
      clearInterval(interval);
      runeRolling[catKey] = false;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
      btn.innerText = t("rollBtn");
    }
  }, 50);
}

function updateRollButtons(disabled) {
  document.querySelectorAll(".rune-roll-btn").forEach((btn) => {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? "0.5" : "1";
    btn.style.cursor = disabled ? "not-allowed" : "pointer";
    if (!disabled) btn.innerText = t("rollBtn");
  });
}

function showRuneToast(runesArr, catKey) {
  const old = document.getElementById("rune-toast");
  if (old) old.remove();

  if (!Array.isArray(runesArr)) runesArr = [runesArr];

  const toMult = (val) => val.toFixed(3).replace(/\.?0+$/, "") + "x";

  // Deduplica: agrupa por id e conta quantas vezes saiu nesse giro
  const grouped = {};
  runesArr.forEach((rune) => {
    if (!grouped[rune.id]) grouped[rune.id] = { rune, thisRoll: 0 };
    grouped[rune.id].thisRoll++;
  });

  const unique = Object.values(grouped);

  // Cor do toast = runa mais rara do giro
  const highlight = unique.reduce(
    (best, g) => (g.rune.chance < best.rune.chance ? g : best),
    unique[0],
  ).rune;

  const runesHTML = unique
    .map(({ rune, thisRoll }) => {
      const totalCount = runeCollection[catKey][rune.id];
      let bonusLines = [];
      if (rune.crystalMult)
        bonusLines.push(
          `<span style="color:#a855f7">Crystal +${toMult(rune.crystalMult)}</span>`,
        );
      if (rune.rpMult)
        bonusLines.push(
          `<span style="color:#00f2fe">RP +${toMult(rune.rpMult)}</span>`,
        );
      if (rune.fishCoinMult)
        bonusLines.push(
          `<span style="color:#FFD700">Fish +${toMult(rune.fishCoinMult)}</span>`,
        );
      if (rune.runeLuck)
        bonusLines.push(
          `<span style="color:#00e676">Luck +${toMult(rune.runeLuck)}</span>`,
        );
      if (rune.runeSpeed)
        bonusLines.push(
          `<span style="color:#ff0080">Speed +${toMult(rune.runeSpeed)}</span>`,
        );
      if (rune.runeBulk && rune.chance === 0.005)
        bonusLines.push(`<span style="color:#ff9800">Bulk +1</span>`);

      return `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="color:${rune.color};font-size:1rem;text-shadow:0 0 8px ${rune.color}">✦</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:${rune.color};font-size:0.7rem;font-weight:bold;">${rune.name}${rune.secret ? " 🌟" : ""}</span>
            ${thisRoll > 1 ? `<span style="color:#fff;background:rgba(255,255,255,0.15);border-radius:4px;padding:1px 5px;font-size:0.55rem;">×${thisRoll}</span>` : ""}
          </div>
          <div style="color:rgba(255,255,255,0.35);font-size:0.55rem;">total: x${totalCount}</div>
          <div style="font-size:0.6rem;line-height:1.6;">${bonusLines.join(" ")}</div>
        </div>
      </div>
    `;
    })
    .join("");

  const toast = document.createElement("div");
  toast.id = "rune-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 85px;
    left: 15px;
    background: rgba(5, 0, 20, 0.97);
    border: 2px solid ${highlight.color};
    border-radius: 12px;
    padding: 12px 14px;
    z-index: 999999;
    min-width: 210px;
    max-width: 270px;
    box-shadow: 0 0 25px ${highlight.color}80;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    font-family: 'Monocraft', monospace;
  `;

  const bulkCount = getRollCount();
  toast.innerHTML = `
    <div style="color:rgba(255,255,255,0.5);font-size:0.6rem;margin-bottom:8px;letter-spacing:1px;">
      ${bulkCount > 1 ? `✦ ${bulkCount}x ROLL` : "✦ ROLL"}
    </div>
    ${runesHTML}
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function renderRuneCollection() {
  Object.keys(RUNE_CATEGORIES).forEach((catKey) => {
    const container = document.getElementById("runes-" + catKey);
    if (!container) return;

    const cat = RUNE_CATEGORIES[catKey];
    container.innerHTML = "";

    cat.runes.forEach((rune) => {
      const count = runeCollection[catKey]?.[rune.id] || 0;
      const isSecretHidden = rune.secret && !runeSecretDiscovered[catKey];

      const card = document.createElement("div");
      card.className =
        "rune-card " +
        (count > 0 ? "owned" : "unowned") +
        (isSecretHidden ? " secret" : "");
      card.style.setProperty("--rune-color", rune.color);

      if (isSecretHidden) {
        card.innerHTML = `
          <div class="rune-card-icon">?</div>
          <div class="rune-card-name" style="color:#555">???</div>
          <div class="rune-card-count" style="color:#333">0</div>
        `;
      } else {
        card.innerHTML = `
          <div class="rune-card-icon" style="color:${rune.color};text-shadow:0 0 8px ${rune.color}">*</div>
          <div class="rune-card-name" style="color:${count > 0 ? rune.color : "#444"}">${rune.name.replace(" Rune", "")}</div>
          <div class="rune-card-count" style="color:${count > 0 ? "#fff" : "#333"}">x${count}</div>
        `;
        if (count > 0) {
          const lines = [rune.name + ": x" + count];
          if (rune.crystalMult)
            lines.push(
              "+" + (rune.crystalMult * count * 100).toFixed(1) + "% Crystal",
            );
          if (rune.rpMult)
            lines.push("+" + (rune.rpMult * count * 100).toFixed(2) + "% RP");
          if (rune.runeLuck)
            lines.push(
              "+" + (rune.runeLuck * count * 100).toFixed(1) + "% Luck",
            );
          card.title = lines.join("\n");
        }
      }

      container.appendChild(card);
    }); // ← fecha forEach runes
  }); // ← fecha forEach categories
} // ← fecha renderRuneCollection

function updateRuneBonuses() {
  const display = document.getElementById("rune-bonuses-display");
  if (!display) return;

  const crystalBonus = getTotalRuneBonus("crystalMult");
  const rpBonus = getTotalRuneBonus("rpMult");
  const fishBonus = getTotalRuneBonus("fishCoinMult");
  const luckBonus = getRuneLuckBonus();
  const bulkBonus = Math.min(getTotalRuneBonus("runeBulk"), 50);
  const speedBonus = getTotalRuneBonus("runeSpeed");

  const toMult = (val) => val.toFixed(3).replace(/\.?0+$/, "") + "x";

  let html = "";
  html += `<div class="bonus-row"><span>Crystal</span><span style="color:#a855f7">${toMult(crystalBonus)}</span></div>`;
  html += `<div class="bonus-row"><span>RP Multiplier</span><span style="color:#00f2fe">${toMult(rpBonus)}</span></div>`;
  if (fishBonus > 0)
    html += `<div class="bonus-row"><span>Fish Coins</span><span style="color:#FFD700">${toMult(fishBonus)}</span></div>`;
  if (luckBonus > 0)
    html += `<div class="bonus-row"><span>Rune Luck</span><span style="color:#00e676">${toMult(luckBonus)}</span></div>`;
  if (bulkBonus > 0)
    html += `<div class="bonus-row"><span>Rune Bulk</span><span style="color:#ff9800">+${bulkBonus} / 50</span></div>`;
  if (speedBonus > 0)
    html += `<div class="bonus-row"><span>Rune Speed</span><span style="color:#ff0080">${toMult(speedBonus)}</span></div>`;

  display.innerHTML = html;
}

// Funções de suporte para o cálculo de Rebirth
function getRuneRPMultiplier() {
  if (typeof getTotalRuneBonus === "function") {
    return 1 + getTotalRuneBonus("rpMult");
  }
  return 1;
}

function getRebirthCost() {
  const runeRPMult = getRuneRPMultiplier();
  // Custo base de 5.000 que aumenta conforme você ganha RP
  return Math.floor((5000 + Math.sqrt(rebirthPoints) * 1) / runeRPMult);
}

function openMiscTab(targetId) {
  // Esconde ranking e achievements (são sub-páginas do misc)
  ["ranking-tab", "achievements-tab", "skins-tab", "diamonds-tab"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.style.setProperty("display", "none", "important");
    },
  );

  const target = document.getElementById(targetId);
  if (!target) return;

  if (targetId === "misc-tab") {
    target.classList.add("active");
    target.style.removeProperty("display");
    updateMiscStats();
  } else {
    // Esconde misc, mostra sub-página
    const misc = document.getElementById("misc-tab");
    if (misc) misc.classList.remove("active");

    target.style.removeProperty("display");
    target.classList.add("active");

    if (targetId === "ranking-tab") {
      updateGlobalRanking().then(() => startRankingRealtimeTick());
    }
    if (targetId === "achievements-tab") renderAchievements();
    if (targetId === "diamonds-tab") renderDiamondUpgrades();
  }
}

// ============================================================
// 2. NOVA função updateMiscStats — preenche os stats do jogador
// ============================================================

function updateMiscStats() {
  const grid = document.getElementById("misc-stats-grid");
  if (!grid) return;

  // Atualiza o título também
  const titleEl = document.getElementById("title-misc-stats");
  if (titleEl) titleEl.innerText = t("statTitleStats");

  const unlockedAch = achievements.filter((a) => a.unlocked).length;
  const totalBuildings = buildings.reduce((s, b) => s + b.quantity, 0);
  const fishUnlocked = modes.fishing?.unlocked;
  const treesUnlocked = modes.trees?.unlocked;
  const mobsUnlocked = modes.mobs?.unlocked;
  const locked = t("statLocked");

  const stats = [
    { label: t("statTotalCrystals"), value: formatNumbers(totalCookies) },
    { label: t("statRebirthPoints"), value: formatNumbers(rebirthPoints) },
    {
      label: t("statMultiplier"),
      value: getRebirthMultiplier().toFixed(2) + "x",
    },
    { label: t("statBuildings"), value: formatNumbers(totalBuildings) },
    { label: t("statCrystalsSec"), value: formatNumbers(cps) },
    {
      label: t("statAchievements"),
      value: `${unlockedAch} / ${achievements.length}`,
    },
    {
      label: t("statFishCoins"),
      value: fishUnlocked ? formatNumbers(modes.fishing.fishCoins) : locked,
    },
    {
      label: t("statWood"),
      value: treesUnlocked ? formatNumbers(modes.trees.wood) : locked,
    },
    {
      label: t("statFlesh"),
      value: mobsUnlocked ? formatNumbers(modes.mobs.flesh) : locked,
    },
    {
      label: t("statMobKills"),
      value: mobsUnlocked ? formatNumbers(modes.mobs.kills || 0) : locked,
    },
    {
      label: t("statRuneBulk"),
      value: `${Math.min(getTotalRuneBonus("runeBulk"), 50)} / 50`,
    },
    {
      label: t("statRuneLuck"),
      value: (getRuneLuckBonus() * 100).toFixed(1) + "%",
    },
    { label: t("statTimePlayed"), value: formatPlayTime(totalPlayedSeconds) },
  ];

  grid.innerHTML = stats
    .map(
      (s) => `
    <div style="
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      padding: 8px 12px;
      font-family: 'Monocraft', monospace;
      font-size: 0.65rem;
      gap: 8px;
    ">
      <span style="color:rgba(255,255,255,0.5); white-space:nowrap;">${s.label}</span>
      <span style="color:#fff; font-weight:bold; text-shadow:0 0 6px rgba(168,85,247,0.5); white-space:nowrap;">${s.value}</span>
    </div>
  `,
    )
    .join("");
}

function formatPlayTime(seconds) {
  const s = Math.floor(seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function startPlayedTimer() {
  if (playedTickInterval) clearInterval(playedTickInterval);
  playedSessionStart = Date.now();
  playedTickInterval = setInterval(() => {
    totalPlayedSeconds += 0.1; // tick a cada 100ms
  }, 100);
}

function startRankingRealtimeTick() {
  if (rankingRealtimeInterval) clearInterval(rankingRealtimeInterval);

  rankingRealtimeInterval = setInterval(() => {
    // Só atualiza se o ranking-tab estiver visível
    const rankingTab = document.getElementById("ranking-tab");
    if (!rankingTab || !rankingTab.classList.contains("active")) {
      clearInterval(rankingRealtimeInterval);
      rankingRealtimeInterval = null;
      return;
    }

    // Atualiza cada item do ranking de playtime
    const container = document.getElementById("ranking-playtime");
    if (!container) return;

    const items = container.querySelectorAll(".ranking-item");
    items.forEach((item) => {
      const valueSpan = item.querySelector("span:last-child");
      if (!valueSpan) return;

      // Pega os segundos guardados no dataset
      const secs = parseFloat(item.dataset.seconds || 0);
      // Incrementa 1 segundo por tick
      item.dataset.seconds = secs + 1;
      valueSpan.innerText = formatPlayTime(secs + 1);
    });
  }, 1000);
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

function renderSkinsGrid() {
  const grid = document.getElementById("skins-grid");
  if (!grid) return;

  grid.innerHTML = CRYSTAL_SKINS.map((skin) => {
    const isEquipped = equippedSkin === skin.id;
    const isOwned = skin.owned || skin.id === "default";

    return `
      <div onclick="selectSkin('${skin.id}')" style="
        background: rgba(5,0,20,0.85);
        border: 2px solid ${isEquipped ? skin.border : "rgba(255,255,255,0.1)"};
        border-radius: 12px;
        padding: 14px 10px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        box-shadow: ${isEquipped ? `0 0 15px ${skin.glow}` : "none"};
      ">
        ${isEquipped ? `<div style="position:absolute;top:5px;right:5px;font-size:0.45rem;font-family:'Monocraft',monospace;background:rgba(0,230,118,0.2);border:1px solid #00e676;border-radius:4px;padding:2px 5px;color:#00e676;">✓ ON</div>` : ""}
        ${skin.comingSoon ? `<div style="position:absolute;top:5px;left:5px;font-size:0.4rem;font-family:'Monocraft',monospace;background:rgba(255,215,0,0.2);border:1px solid #FFD700;border-radius:4px;padding:2px 5px;color:#FFD700;">SOON</div>` : ""}
 
        <div style="font-size:2rem;margin-bottom:4px;">${skin.emoji || "💎"}</div>
        <img src="${skin.image}" style="width:50px;height:50px;object-fit:contain;filter:drop-shadow(0 0 8px ${skin.glow});margin-bottom:8px;">
 
        <div style="font-family:'Monocraft',monospace;font-size:0.6rem;color:${isEquipped ? skin.border : "#fff"};margin-bottom:6px;font-weight:bold;">
          ${skin.name}
        </div>
 
        <div style="font-family:'Monocraft',monospace;font-size:0.55rem;color:${isOwned ? "#00e676" : "rgba(255,255,255,0.4)"};">
          ${
            isOwned
              ? isEquipped
                ? "✓ Equipped"
                : "✓ Owned"
              : `$${skin.price.toFixed(2)}`
          }
        </div>
      </div>
    `;
  }).join("");

  // Atualiza preview
  const current =
    CRYSTAL_SKINS.find((s) => s.id === equippedSkin) || CRYSTAL_SKINS[0];
  const previewImg = document.getElementById("skin-preview-img");
  const previewName = document.getElementById("skin-preview-name");
  if (previewImg) {
    previewImg.src = current.image;
    previewImg.style.filter = `drop-shadow(0 0 12px ${current.glow})`;
  }
  if (previewName) previewName.innerText = current.name;
}

function selectSkin(id) {
  const skin = CRYSTAL_SKINS.find((s) => s.id === id);
  if (!skin) return;

  if (skin.comingSoon) {
    showAlert(`
      <div style="text-align:center">
        <div style="font-size:2.5rem">${skin.emoji || "💎"}</div>
        <b style="color:#FFD700;font-size:1rem;">${skin.name}</b>
        <br><br>
        <div style="background:rgba(255,215,0,0.1);border:1px solid #FFD700;border-radius:8px;padding:12px;margin:10px 0;">
          <span style="color:#FFD700;font-size:0.8rem;">🚀 Coming Soon!</span>
          <br>
          <span style="color:rgba(255,255,255,0.5);font-size:0.65rem;">Available on the Play Store launch</span>
          <br><br>
          <span style="color:#fff;font-size:0.9rem;font-weight:bold;">$${skin.price.toFixed(2)}</span>
        </div>
      </div>
    `);
    return;
  }

  // Só equipa se for owned
  if (!skin.owned && skin.id !== "default") return;

  equippedSkin = id;

  // Aplica no crystal principal
  const bigCookie = document.getElementById("big-cookie");
  if (bigCookie) {
    bigCookie.src = skin.image;
    bigCookie.style.filter = `drop-shadow(0 0 15px ${skin.glow}) drop-shadow(0 0 30px ${skin.glow.replace("0.8", "0.3")})`;
  }

  localStorage.setItem("equippedSkin", id);
  renderSkinsGrid();
}

function loadEquippedSkin() {
  const saved = localStorage.getItem("equippedSkin");
  if (saved) {
    equippedSkin = saved;
    const skin = CRYSTAL_SKINS.find((s) => s.id === saved);
    if (skin && !skin.comingSoon) {
      const bigCookie = document.getElementById("big-cookie");
      if (bigCookie) {
        bigCookie.src = skin.image;
        bigCookie.style.filter = `drop-shadow(0 0 15px ${skin.glow}) drop-shadow(0 0 30px ${skin.glow.replace("0.8", "0.3")})`;
      }
    }
  }
}

function getDiamondCrystalBonus() {
  return 1 + diamondUpgrades.crystalBoost * 0.5;
}
function getDiamondRebirthBonus() {
  return 1 + diamondUpgrades.rebirthBoost * 0.3;
}
function getDiamondFishBonus() {
  return 1 + diamondUpgrades.fishBoost * 0.5;
}
function getDiamondWoodBonus() {
  return 1 + diamondUpgrades.woodBoost * 0.5;
}
function getDiamondFleshBonus() {
  return 1 + diamondUpgrades.fleshBoost * 0.5;
}
function getDiamondBulkBonus() {
  return diamondUpgrades.runeBulkBoost * 5;
}
function getDiamondLuckBonus() {
  return diamondUpgrades.runeLuckBoost * 0.1;
}

function renderDiamondUpgrades() {
  const grid = document.getElementById("diamond-upgrades-grid");
  const balanceEl = document.getElementById("diamond-balance");
  if (!grid) return;
  if (balanceEl) balanceEl.innerText = diamonds;

  grid.innerHTML = DIAMOND_UPGRADES.map((upg) => {
    const currentLevel = diamondUpgrades[upg.id] || 0;
    const isMaxed = currentLevel >= upg.maxLevel;
    const cost = isMaxed ? 0 : upg.costPerLevel[currentLevel];
    const canAfford = diamonds >= cost;

    return `
      <div style="
        display:flex;
        align-items:center;
        gap:12px;
        background:rgba(0,242,254,0.04);
        border:1px solid ${isMaxed ? upg.color : "rgba(0,242,254,0.15)"};
        border-radius:10px;
        padding:12px;
        transition:all 0.2s;
      ">
        <img src="${upg.icon}" style="width:36px;height:36px;object-fit:contain;filter:drop-shadow(0 0 6px ${upg.color});flex-shrink:0;">
        <div style="flex:1;">
          <div style="font-family:'Monocraft',monospace;font-size:0.75rem;color:#fff;margin-bottom:3px;">
            ${upg.name}
            <span style="color:${upg.color};font-size:0.6rem;margin-left:6px;">${currentLevel}/${upg.maxLevel}</span>
          </div>
          <div style="font-family:'Monocraft',monospace;font-size:0.6rem;color:rgba(255,255,255,0.4);">${upg.desc}</div>
          <div style="font-family:'Monocraft',monospace;font-size:0.6rem;color:${upg.color};margin-top:3px;">${upg.effect(currentLevel)}</div>
        </div>
        <button
          onclick="buyDiamondUpgrade('${upg.id}')"
          ${isMaxed || !canAfford ? "disabled" : ""}
          style="
            background:${isMaxed ? "rgba(0,230,118,0.15)" : canAfford ? "rgba(0,242,254,0.2)" : "rgba(255,255,255,0.05)"};
            border:1px solid ${isMaxed ? "#00e676" : canAfford ? "#00f2fe" : "rgba(255,255,255,0.1)"};
            color:${isMaxed ? "#00e676" : canAfford ? "#00f2fe" : "rgba(255,255,255,0.3)"};
            border-radius:8px;
            padding:8px 12px;
            font-family:'Monocraft',monospace;
            font-size:0.6rem;
            cursor:${isMaxed || !canAfford ? "not-allowed" : "pointer"};
            white-space:nowrap;
            flex-shrink:0;
          ">
          ${isMaxed ? "✓ MAX" : `💎 ${cost}`}
        </button>
      </div>
    `;
  }).join("");
}

function buyDiamondUpgrade(id) {
  const upg = DIAMOND_UPGRADES.find((u) => u.id === id);
  if (!upg) return;

  const currentLevel = diamondUpgrades[id] || 0;
  if (currentLevel >= upg.maxLevel) return;

  const cost = upg.costPerLevel[currentLevel];
  if (diamonds < cost) return;

  diamonds -= cost;
  diamondUpgrades[id] = currentLevel + 1;

  new Audio("assets/audios/sound-effects/sucess.mp3").play().catch(() => {});
  recalculate();
  saveCloudData();
  renderDiamondUpgrades();

  // Toast
  const toast = document.createElement("div");
  toast.className = "golden-toast";
  toast.innerHTML = `💎 <span style="color:#00f2fe">${upg.name}</span> — <span style="color:#FFD700">${upg.effect(currentLevel + 1)}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function showDiamondShop() {
  showAlert(`
    <div style="text-align:center">
      <div style="font-size:2.5rem">💎</div>
      <b style="color:#00f2fe;font-size:1rem;">Diamond Shop</b>
      <br><br>
      <div style="background:rgba(0,242,254,0.1);border:1px solid #00f2fe;border-radius:8px;padding:12px;margin:10px 0;">
        <span style="color:#fff;font-size:0.8rem;">🚀 Coming Soon on Play Store!</span>
        <br><br>
        <span style="color:rgba(255,255,255,0.5);font-size:0.65rem;">Purchase Diamond packs to unlock<br>powerful permanent upgrades.</span>
      </div>
    </div>
  `);
}

// --- INIT ---
initStore();
detectLanguage();
applyTranslations();
