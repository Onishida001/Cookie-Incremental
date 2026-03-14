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
let buyAmount = 1;
let userLogged = null;
let userName = "";
let modes = { fishing: { unlocked: false, fishCoins: 0, rodLevel: 1 } };

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
const gameMusic = new Audio("assets/audios/diamonds.mp3");
gameMusic.loop = true; // Faz a música repetir para sempre
gameMusic.volume = 0.5; // Volume inicial em 50%
let isMuted = false;

// Função para ligar a música (precisa de um clique inicial do usuário)
function startMusic() {
  gameMusic.play().catch(() => {
    console.log("Music waiting for user interaction...");
  });
  // Remove o evento após a primeira execução
  document.removeEventListener("click", startMusic);
}

// Chamar a música no primeiro clique do jogo
document.addEventListener("click", startMusic);

// Função para o botão de Mute nas Settings
function toggleMute() {
  isMuted = !isMuted;
  gameMusic.muted = isMuted;
  const btn = document.getElementById("mute-btn");
  btn.innerText = isMuted ? "🔈 UNMUTE MUSIC" : "🔊 MUTE MUSIC";
}

// Abrir/Fechar Settings
function toggleSettings() {
  const modal = document.getElementById("settings-modal");
  document.getElementById("settings-username").innerText = userName;
  modal.style.display = modal.style.display === "none" ? "flex" : "none";
}

// Função de Sair (Logout)
function logout() {
  if (confirm("Do you want to logout? Your progress is saved in the cloud.")) {
    auth.signOut().then(() => {
      location.reload(); // Recarrega a página para voltar à tela de login
    });
  }
}

// CORREÇÃO DO UNDEFINED (Adicione mais sufixos ou limite o log)
function formatNumbers(num) {
  if (isNaN(num) || num === undefined) return "0";
  if (num < 1000) return Math.floor(num).toString();
  const exp = Math.floor(Math.log10(num) / 3);

  // Se o expoente for maior que a lista de sufixos, ele trava no último
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

const buildings = [
  {
    id: "cursor",
    name: "Cursor",
    baseCost: 15,
    cps: 1,
    quantity: 0,
    image: "assets/images/upgrades/cursor.png",
  },
  {
    id: "grandma",
    name: "Grandma",
    baseCost: 100,
    cps: 5,
    quantity: 0,
    image: "assets/images/upgrades/grandma.png",
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
    baseCost: 1e6, // 1,000,000
    cps: 1000,
    quantity: 0,
    image: "assets/images/upgrades/bank.png",
  },
  {
    id: "wizard-tower",
    name: "Wizard Tower",
    baseCost: 2.5e7, // 25,000,000
    cps: 5000,
    quantity: 0,
    image: "assets/images/upgrades/wizard-tower.png",
  },
  {
    id: "hydro-eletric",
    name: "Hydro Electric",
    baseCost: 5e8, // 500,000,000
    cps: 20000,
    quantity: 0,
    image: "assets/images/upgrades/hydro-electric.png",
  },
  {
    id: "nuclear-plant",
    name: "Nuclear Plant",
    baseCost: 1e10, // 1,000,000,000
    cps: 50000,
    quantity: 0,
    image: "assets/images/upgrades/nuclear-plant.png",
  },
  {
    id: "data-center",
    name: "Data Center",
    baseCost: 5e11, // 50,000,000,000
    cps: 50000,
    quantity: 0,
    image: "assets/images/upgrades/data-center.png",
  },
];

const achievements = [
  {
    id: "1k",
    title: "Apprentice",
    hint: "Reach 1,000 total cookies",
    condition: () => totalCookies >= 1000,
    unlocked: false,
  },
  {
    id: "1m",
    title: "Millionaire",
    hint: "Reach 1,000,000 total cookies",
    condition: () => totalCookies >= 1e6,
    unlocked: false,
  },
  {
    id: "1b",
    title: "Billionaire",
    hint: "Reach 1,000,000,000 total cookies",
    condition: () => totalCookies >= 1e9,
    unlocked: false,
  },
  {
    id: "1t",
    title: "Trillionaire",
    hint: "Reach 1,000,000,000,000 total cookies",
    condition: () => totalCookies >= 1e12,
    unlocked: false,
  },
  {
    id: "1Qd",
    title: "Quadrillionaire",
    hint: "Reach 1,000,000,000,000,000 total cookies",
    condition: () => totalCookies >= 1e15,
    unlocked: false,
  },
  {
    id: "50c",
    title: "Click Hero",
    hint: "Buy 50 Cursors",
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
];

const rebirthUpgrades = [
  { id: "cp", name: "Muscle Memory", cost: 2, level: 0 },
  { id: "at", name: "Auto-Tapper", cost: 10, level: 0 },
];

// --- AUTH ---
function handleAuth(type) {
  const userInp = document.getElementById("auth-username").value.trim();
  const pass = document.getElementById("auth-pass").value;
  if (!userInp || !pass) return alert("Fill all fields!");
  const fakeEmail = `${userInp.toLowerCase()}@cookie.com`;

  if (type === "register") {
    // --- CORREÇÃO AQUI ---
    // Zera tudo no código ANTES de criar a conta
    cookies = 0;
    totalCookies = 0;
    rebirthPoints = 0;
    buildings.forEach((b) => (b.quantity = 0));
    rebirthUpgrades.forEach((u) => (u.level = 0));
    // ---------------------

    auth
      .createUserWithEmailAndPassword(fakeEmail, pass)
      .then((res) => {
        res.user.updateProfile({ displayName: userInp }).then(() => {
          userName = userInp;
          // Agora o saveCloudData vai salvar TUDO ZERADO para o novo player
          saveCloudData();
          updateUI();
        });
      })
      .catch((e) => alert(e.message));
  } else {
    auth
      .signInWithEmailAndPassword(fakeEmail, pass)
      .catch(() => alert("Wrong data!"));
  }
}

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

// --- CLOUD ENGINE ---
// --- CLOUD SAVE (ENVIAR PARA FIREBASE) ---
async function saveCloudData() {
  if (!userLogged) return;

  const dataToSave = {
    name: userName,
    cookies: cookies, // Garante que o número atual de cookies vá para a nuvem
    totalCookies: totalCookies,
    rebirthPoints: rebirthPoints,
    // SALVANDO OS DADOS DE PESCA
    modes: {
      fishing: {
        unlocked: modes.fishing.unlocked,
        fishCoins: modes.fishing.fishCoins, // ESSENCIAL: Salva as moedas de peixe
        rodLevel: modes.fishing.rodLevel,
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

async function loadCloudData() {
  const doc = await db.collection("users").doc(userLogged.uid).get();
  if (doc.exists) {
    const d = doc.data();

    // 1. Carrega os valores numéricos principais
    cookies = d.cookies || 0;
    totalCookies = d.totalCookies || 0;
    rebirthPoints = d.rebirthPoints || 0;

    // 2. Carrega os Modos (Fishing, etc) e atualiza o HTML das moedas
    if (d.modes) {
      modes = d.modes;
      // ESSENCIAL: Atualiza o texto das moedas na tela de pesca
      const fishDisplay = document.getElementById("fish-coins");
      if (fishDisplay && modes.fishing) {
        fishDisplay.innerText = modes.fishing.fishCoins;
      }
    }

    // 3. Carrega os prédios (Buildings)
    if (d.buildings) {
      d.buildings.forEach((sb) => {
        let b = buildings.find((i) => i.id === sb.id);
        if (b) b.quantity = sb.quantity;
      });
    }

    // 4. Carrega os Upgrades de Rebirth
    if (d.rebirthUpgrades) {
      d.rebirthUpgrades.forEach((su, i) => {
        if (rebirthUpgrades[i]) {
          rebirthUpgrades[i].level = su.level;
          rebirthUpgrades[i].cost = Math.floor(2 * Math.pow(2.5, su.level));
        }
      });
    }

    // 5. Carrega as Conquistas (Achievements)
    if (d.achievements) {
      d.achievements.forEach((sa) => {
        let a = achievements.find((i) => i.id === sa.id);
        if (a) a.unlocked = sa.unlocked;
      });
    }

    // 6. Atualiza toda a interface de uma vez
    recalculate();
    updateUI();
    updateModeUI();
    console.log("Data loaded successfully!");
  }
}

function castLine() {
  if (isFishing) return;
  isFishing = true;
  document.getElementById("fishing-status").innerText = "Fishing...";

  setTimeout(() => {
    if (Math.random() < 0.5) {
      modes.fishing.fishCoins += modes.fishing.rodLevel * 5;
      document.getElementById("fishing-status").innerText = "CAUGHT!";
      document.getElementById("fish-coins").innerText = modes.fishing.fishCoins;

      // SALVA AUTOMATICAMENTE APÓS PESCAR
      saveCloudData();
    } else {
      document.getElementById("fishing-status").innerText = "Escaped!";
    }

    setTimeout(() => {
      isFishing = false;
      document.getElementById("fishing-status").innerText = "Cast again?";
    }, 1000);
  }, 1500);
}

// --- RANKING ---
async function updateGlobalRanking() {
  const cList = document.getElementById("ranking-cookies");
  const rList = document.getElementById("ranking-rebirths");
  if (!cList || !rList) return;

  // Puxa Top 100 cookies
  const snapC = await db
    .collection("users")
    .orderBy("totalCookies", "desc")
    .limit(100)
    .get();
  cList.innerHTML = "";
  let indexC = 1; // Usar uma variável separada evita o NaN
  snapC.forEach((doc) => {
    const d = doc.data();
    cList.innerHTML += `
            <div class="ranking-item">
                <span>${indexC}º - ${d.name || "Anonymous"}</span>
                <span>${formatNumbers(d.totalCookies || 0)}</span>
            </div>`;
    indexC++;
  });

  // Puxa Top 100 Rebirths
  const snapR = await db
    .collection("users")
    .orderBy("rebirthPoints", "desc")
    .limit(100)
    .get();
  rList.innerHTML = "";
  let indexR = 1;
  snapR.forEach((doc) => {
    const d = doc.data();
    rList.innerHTML += `
            <div class="ranking-item">
                <span>${indexR}º - ${d.name || "Anonymous"}</span>
                <span>${formatNumbers(d.rebirthPoints || 0)}</span>
            </div>`;
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
}

// --- CORE ---
function formatNumbers(num) {
  if (isNaN(num)) return "0";
  if (num < 1000) return Math.floor(num).toString();
  const exp = Math.floor(Math.log10(num) / 3);
  return (
    (num / Math.pow(10, exp * 3)).toFixed(1).replace(/\.0$/, "") + suffixes[exp]
  );
}

function recalculate() {
  cps = 0;
  let multi = 1 + rebirthPoints * 0.1;
  buildings.forEach((b) => (cps += b.cps * b.quantity * multi));
}

function updateUI() {
  // 1. Update Header Stats
  document.getElementById("cookie-count").innerText = formatNumbers(cookies);
  document.getElementById("cps").innerText = formatNumbers(
    cps * goldenMultiplier,
  );
  document.getElementById("pending-points").innerText = formatNumbers(
    cookies / 5000,
  );
  document.getElementById("rebirth-points").innerText =
    formatNumbers(rebirthPoints);
  document.getElementById("multi-val").innerText = (
    1 +
    rebirthPoints * 0.1
  ).toFixed(1);

  // 2. Loop through buildings to update the Store
  buildings.forEach((item) => {
    const costSpan = document.getElementById(`cost-${item.id}`);
    const qtdDisplay = document.getElementById(`qtd-${item.id}`);
    const div = document.getElementById(`item-${item.id}`);

    // The price of exactly 1 next unit
    let unitCost = item.baseCost * Math.pow(1.15, item.quantity);

    let displayCost = 0;
    let canBuyCount = 0;

    if (buyAmount === "max") {
      let tempC = cookies;
      let tempQ = item.quantity;

      // Geometric series simulation
      while (tempC >= item.baseCost * Math.pow(1.15, tempQ)) {
        let nextPrice = item.baseCost * Math.pow(1.15, tempQ);
        tempC -= nextPrice;
        displayCost += nextPrice;
        tempQ++;
        canBuyCount++;
      }

      // If zero can be bought, display cost of the next 1
      if (canBuyCount === 0) displayCost = unitCost;
    } else {
      // 1x or 10x calculation
      displayCost = 0;
      for (let i = 0; i < buyAmount; i++) {
        displayCost += item.baseCost * Math.pow(1.15, item.quantity + i);
      }
    }

    // Update Text Elements
    if (costSpan) {
      let bulkText =
        buyAmount === "max" && canBuyCount > 0 ? ` (${canBuyCount}x)` : "";
      costSpan.innerText = formatNumbers(displayCost) + bulkText;
    }

    if (qtdDisplay) {
      qtdDisplay.innerText = item.quantity;
    }

    // Disabled Logic (Visual feedback)
    if (div) {
      // If MAX: enabled if you can buy at least ONE. Else: needs full bulk price.
      let threshold = buyAmount === "max" ? unitCost : displayCost;
      if (cookies < threshold) {
        div.classList.add("disabled");
      } else {
        div.classList.remove("disabled");
      }
    }
  });
}

function buyItem(idx) {
  const item = buildings[idx];
  let totalCost = 0;
  let count = 0;
  if (buyAmount === "max") {
    let tempC = cookies;
    let tempQ = item.quantity;
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
    new Audio("assets/audios/buy.mp3").play().catch(() => {});
    saveCloudData();
  }
}

// --- MODES ---
function unlockMode(id) {
  if (rebirthPoints >= 100) {
    rebirthPoints -= 100;
    modes.fishing.unlocked = true;
    updateModeUI();
    updateUI();
    saveCloudData();
  }
}
function updateModeUI() {
  if (modes.fishing.unlocked) {
    document.getElementById("unlock-fishing").style.display = "none";
    document.getElementById("enter-fishing").style.display = "inline-block";
  }
}

// --- FIX: GAME MODES NAVIGATION ---
function showSubMode(targetId) {
  const modesMenu = document.getElementById("modes-menu");
  const fishingArea = document.getElementById("fishing-area");

  console.log("Switching to mode: " + targetId); // Verifique isso no F12

  if (targetId === "modes-menu") {
    // Força a exibição do menu principal de modos
    modesMenu.style.setProperty("display", "block", "important");
    fishingArea.style.setProperty("display", "none", "important");
  } else if (targetId === "fishing-area") {
    // Força a exibição da área de pesca
    modesMenu.style.setProperty("display", "none", "important");
    fishingArea.style.setProperty("display", "flex", "important");
  }
}

let isFishing = false;
function castLine() {
  if (isFishing) return;
  isFishing = true;
  document.getElementById("fishing-status").innerText = "Fishing...";
  setTimeout(() => {
    if (Math.random() < 0.5) {
      modes.fishing.fishCoins += modes.fishing.rodLevel * 5;
      document.getElementById("fishing-status").innerText = "CAUGHT!";
    } else document.getElementById("fishing-status").innerText = "Escaped!";
    document.getElementById("fish-coins").innerText = modes.fishing.fishCoins;
    setTimeout(() => {
      isFishing = false;
      document.getElementById("fishing-status").innerText = "Cast again?";
    }, 1000);
  }, 1500);
}

// --- REBIRTH ---
function renderRebirthShop() {
  const container = document.getElementById("rebirth-upgrades-list");
  if (!container) return; // Segurança caso o elemento não exista

  container.innerHTML = "";
  rebirthUpgrades.forEach((upg, i) => {
    const div = document.createElement("div");
    div.className = "rebirth-card";

    // A mágica acontece aqui: formatNumbers(upg.cost)
    div.innerHTML = `
            <h3>${upg.name} (Lvl ${upg.level})</h3>
            <p>${upg.desc}</p>
            <button onclick="buyRebirthUpg(${i})" class="prestige-btn" ${rebirthPoints < upg.cost ? "disabled" : ""}>
                Buy (${formatNumbers(upg.cost)})
            </button>
        `;
    container.appendChild(div);
  });
}

document.getElementById("btn-rebirth").onclick = async () => {
  let pendingPoints = Math.floor(cookies / 5000);

  if (pendingPoints <= 0) {
    alert("You need at least 5,000 cookies to Rebirth!");
    return;
  }

  if (
    confirm(
      `Do you want to Rebirth now? You will get ${pendingPoints} Heavenly Chips, but all cookies and buildings will be reset!`,
    )
  ) {
    // 1. Adiciona os pontos
    rebirthPoints += pendingPoints;

    // 2. Reseta o progresso local
    cookies = 0;
    buildings.forEach((b) => {
      b.quantity = 0;
    });

    // 3. Recalcula o CPS (vai voltar pra 0 ou o bônus do upgrade auto-tapper)
    recalculate();

    // 4. Salva IMEDIATAMENTE na nuvem para não perder os pontos
    await saveCloudData();

    // 5. Atualiza a tela e volta para a aba principal
    updateUI();
    alert("Rebirth successful! Your multiplier has increased.");

    // Força a volta para a aba do jogo
    document.querySelectorAll(".nav-btn")[0].click();
  }
};

function buyRebirthUpg(i) {
  const u = rebirthUpgrades[i];
  if (rebirthPoints >= u.cost) {
    rebirthPoints -= u.cost;
    u.level++;
    u.cost = Math.floor(u.cost * 2.5);
    recalculate();
    renderRebirthShop();
    updateUI();
    saveCloudData();
  }
}

// --- LOOPS ---
document.getElementById("big-cookie").onmousedown = (e) => {
  new Audio("assets/audios/click.mp3").play().catch(() => {});
  let val = (1 + rebirthPoints * 0.1) * Math.pow(2, rebirthUpgrades[0].level);
  cookies += val;
  totalCookies += val;
  spawnFX(e, val);
  updateUI();
};

const gameAdmins = ["SamucaZZ", "Juninho", "JotaLusca"];

window.addEventListener("keydown", (e) => {
  // Check if the key is 'p'
  if (e.key.toLowerCase() === "p") {
    // Check if the logged-in user is in the admin list
    if (gameAdmins.includes(userName)) {
      const cheatAmount = 10000;
      cookies += cheatAmount;
      totalcookies += cheatAmount;
      updateUI();
      console.log(`Cheat activated by Admin ${userName}: +10k`);
    } else {
      console.warn(`User ${userName} tried to use cheats without permission!`);
      // Optional: You can add a funny message or alert here
      // alert("Nice try! You are not an admin.");
    }
  }
});

setInterval(() => {
  let inc = (cps * goldenMultiplier) / 10;
  if (rebirthUpgrades[1].level > 0)
    inc += (rebirthUpgrades[1].level * (1 + rebirthPoints * 0.1)) / 10;
  cookies += inc;
  totalCookies += inc;
  updateUI();
  achievements.forEach((ach) => {
    if (!ach.unlocked && ach.condition()) {
      ach.unlocked = true;
      document.getElementById("ach-title").innerText = ach.title;
      // Toast logic...
    }
  });
}, 100);

setInterval(saveCloudData, 20000);
setInterval(updateGlobalRanking, 60000);

// NAV
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

function initStore() {
  const container = document.getElementById("store-items");
  container.innerHTML = "";
  buildings.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "store-item";
    div.id = `item-${item.id}`;
    div.onclick = () => buyItem(i);
    div.innerHTML = `<img src="${item.image}" class="icone-loja"><div><h3>${item.name}</h3><p>🍪 <span id="cost-${item.id}">0</span></p></div><div class="item-count" id="qtd-${item.id}">0</div>`;
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

    // When clicking, show the requirement
    card.onclick = () => {
      alert(
        `Achievement: ${ach.title}\nStatus: ${ach.unlocked ? "UNLOCKED" : "LOCKED"}\nRequirement: ${ach.hint}`,
      );
    };

    card.innerHTML = `
            <div style="font-size: 1.5rem;">${ach.unlocked ? "🏆" : "🔒"}</div>
            <b style="font-size: 0.7rem;">${ach.title}</b>
        `;
    list.appendChild(card);
  });

  // Update Progress Bar
  let percent = (unlockedCount / achievements.length) * 100;
  progressBar.style.width = `${percent}%`;
  progressText.innerText = `${unlockedCount}/${achievements.length} Unlocked (${Math.floor(percent)}%)`;
}

initStore();
