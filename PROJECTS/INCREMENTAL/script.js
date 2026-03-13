// 1. DATA & VARIABLES
let cookies = 0;
let totalCookies = 0;
let cps = 0;
let rebirthPoints = 0;
let goldenMultiplier = 1;
let buyAmount = 1;

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
  "Sd",
  "Ocd",
  "Nod",
  "Vg",
];

const buildings = [
  {
    id: "cursor",
    name: "Cursor",
    baseCost: 15,
    cost: 15,
    cps: 1,
    quantity: 0,
    image: "assets/images/cursor.png",
  },
  {
    id: "grandma",
    name: "Grandma",
    baseCost: 100,
    cost: 100,
    cps: 5,
    quantity: 0,
    image: "assets/images/vovo.png",
  },
  {
    id: "farm",
    name: "Farm",
    baseCost: 2500,
    cost: 2500,
    cps: 20,
    quantity: 0,
    image: "assets/images/fazenda.png",
  },
  {
    id: "mine",
    name: "Mine",
    baseCost: 15000,
    cost: 15000,
    cps: 50,
    quantity: 0,
    image: "assets/images/mina.png",
  },
];

const achievements = [
  {
    id: "1k",
    title: "Cookie Apprentice",
    desc: "1,000 cookies reached",
    condition: () => totalCookies >= 1000,
    unlocked: false,
  },
  {
    id: "50c",
    title: "Clicker Hero",
    desc: "50 cursors owned",
    condition: () => buildings[0].quantity >= 50,
    unlocked: false,
  },
];

const rebirthUpgrades = [
  {
    id: "cp",
    name: "Muscle Memory",
    cost: 2,
    desc: "2x Click Power",
    level: 0,
  },
  {
    id: "at",
    name: "Auto-Tapper",
    cost: 10,
    desc: "Clicks automatically",
    level: 0,
  },
];

// 2. TABS SYSTEM
const navBtns = document.querySelectorAll(".nav-btn");
const tabs = document.querySelectorAll(".tab-content");

navBtns.forEach((btn) => {
  btn.onclick = () => {
    navBtns.forEach((b) => b.classList.remove("active"));
    tabs.forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
    if (btn.dataset.target === "achievements-tab") renderAchievements();
    if (btn.dataset.target === "rebirth-tab") renderRebirthShop();
  };
});

// 3. FORMATTER
function formatNumbers(num) {
  if (num < 1000) return Math.floor(num).toString();
  const exp = Math.floor(Math.log10(num) / 3);
  const suffix = suffixes[exp];
  const shortNum = num / Math.pow(10, exp * 3);
  return shortNum.toFixed(1).replace(/\.0$/, "") + suffix;
}

// 4. VISUAL EFFECTS
function spawnFX(e, val) {
  for (let i = 0; i < 5; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.setProperty("--x", `${(Math.random() - 0.5) * 200}px`);
    p.style.setProperty("--y", `${(Math.random() - 0.5) * 200}px`);
    p.style.left = `${e.clientX}px`;
    p.style.top = `${e.clientY}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
  const t = document.createElement("div");
  t.className = "floating-text";
  t.innerText = `+${formatNumbers(val)}`;
  t.style.left = `${e.clientX}px`;
  t.style.top = `${e.clientY}px`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 800);

  const c = document.createElement("img");
  c.src = "assets/images/cursor.png";
  c.className = "click-cursor";
  c.style.left = `${e.clientX}px`;
  c.style.top = `${e.clientY}px`;
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 400);
}

// 5. CORE LOGIC
function recalculate() {
  cps = 0;
  let multi = 1 + rebirthPoints * 0.1;
  buildings.forEach((b) => (cps += b.cps * b.quantity * multi));
}

function buyItem(idx) {
  const item = buildings[idx];
  let amountToBuy = 0;
  let totalCost = 0;

  if (buyAmount === "max") {
    let tempCookies = cookies;
    let tempQty = item.quantity;
    while (tempCookies >= item.baseCost * Math.pow(1.15, tempQty)) {
      let nextCost = item.baseCost * Math.pow(1.15, tempQty);
      tempCookies -= nextCost;
      totalCost += nextCost;
      tempQty++;
      amountToBuy++;
    }
  } else {
    amountToBuy = buyAmount;
    for (let i = 0; i < amountToBuy; i++)
      totalCost += item.baseCost * Math.pow(1.15, item.quantity + i);
  }

  if (cookies >= totalCost && amountToBuy > 0) {
    new Audio("assets/audios/compra.mp3").play().catch(() => {});
    cookies -= totalCost;
    item.quantity += amountToBuy;
    item.cost = item.baseCost * Math.pow(1.15, item.quantity);
    recalculate();
    updateUI();
  }
}

function updateUI() {
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

  buildings.forEach((item) => {
    const div = document.getElementById(`item-${item.id}`);
    const costSpan = document.getElementById(`cost-${item.id}`);
    const qtdDisplay = document.getElementById(`qtd-${item.id}`);

    let displayCost = 0;
    if (buyAmount === "max") {
      let tempCookies = cookies;
      let tempQty = item.quantity;
      let canBuy = 0;
      while (tempCookies >= item.baseCost * Math.pow(1.15, tempQty)) {
        let next = item.baseCost * Math.pow(1.15, tempQty);
        tempCookies -= next;
        displayCost += next;
        tempQty++;
        canBuy++;
      }
      if (canBuy === 0)
        displayCost = item.baseCost * Math.pow(1.15, item.quantity);
      costSpan.innerText =
        formatNumbers(displayCost) + (canBuy > 0 ? ` (${canBuy}x)` : "");
    } else {
      for (let i = 0; i < buyAmount; i++)
        displayCost += item.baseCost * Math.pow(1.15, item.quantity + i);
      costSpan.innerText = formatNumbers(displayCost);
    }

    // CORREÇÃO: Atualiza o número de prédios possuídos
    if (qtdDisplay) qtdDisplay.innerText = item.quantity;

    div.classList.toggle(
      "disabled",
      cookies <
        (buyAmount === "max"
          ? item.baseCost * Math.pow(1.15, item.quantity)
          : displayCost),
    );
  });
}

// 6. GOLDEN COOKIE LOGIC
function spawnGolden() {
  const golden = document.getElementById("golden-cookie");
  const x = Math.random() * (window.innerWidth * 0.4);
  const y = Math.random() * (window.innerHeight * 0.6);
  golden.style.left = `${x}px`;
  golden.style.top = `${y}px`;
  golden.style.display = "block";
  setTimeout(() => {
    golden.style.display = "none";
  }, 8000);
}

document.getElementById("golden-cookie").onclick = function () {
  this.style.display = "none";
  new Audio("assets/audios/dourado.mp3").play().catch(() => {});
  goldenMultiplier = 7;
  document.getElementById("cookie-section").style.filter =
    "sepia(1) saturate(2) brightness(1.2)";
  setTimeout(() => {
    goldenMultiplier = 1;
    document.getElementById("cookie-section").style.filter = "none";
  }, 15000);
};

// 7. EVENTS & INITIALIZATION
document.getElementById("big-cookie").onmousedown = (e) => {
  new Audio("assets/audios/clique.mp3").play().catch(() => {});
  let val =
    (1 + rebirthPoints * 0.1) *
    goldenMultiplier *
    Math.pow(2, rebirthUpgrades[0].level);
  spawnFX(e, val);
  cookies += val;
  totalCookies += val;
  updateUI();
};

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
                <p>🍪 <span id="cost-${item.id}">0</span></p>
            </div>
            <div class="item-count" id="qtd-${item.id}">0</div>`;
    container.appendChild(div);
  });
}

function renderAchievements() {
  const list = document.getElementById("achievements-list");
  list.innerHTML = "";
  achievements.forEach((ach) => {
    const card = document.createElement("div");
    card.className = `achievement-card ${ach.unlocked ? "unlocked" : ""}`;
    card.innerHTML = `<div>${ach.unlocked ? "🏆" : "🔒"}</div><div><b>${ach.title}</b><br><small>${ach.desc}</small></div>`;
    list.appendChild(card);
  });
}

function renderRebirthShop() {
  const container = document.getElementById("rebirth-upgrades-list");
  container.innerHTML = "";
  rebirthUpgrades.forEach((upg, i) => {
    const div = document.createElement("div");
    div.className = "rebirth-card";
    div.innerHTML = `<h3>${upg.name} (Lvl ${upg.level})</h3><p>${upg.desc}</p>
                         <button onclick="buyRebirthUpg(${i})" class="prestige-btn" ${rebirthPoints < upg.cost ? "disabled" : ""}>
                         Buy (${upg.cost} Pts)</button>`;
    container.appendChild(div);
  });
}

function buyRebirthUpg(i) {
  const u = rebirthUpgrades[i];
  if (rebirthPoints >= u.cost) {
    rebirthPoints -= u.cost;
    u.level++;
    u.cost = Math.floor(u.cost * 2.5);
    recalculate();
    renderRebirthShop();
    updateUI();
  }
}

document.getElementById("btn-rebirth").onclick = () => {
  let pts = Math.floor(cookies / 5000);
  if (pts > 0 && confirm("Rebirth now? All progress will reset!")) {
    rebirthPoints += pts;
    cookies = 0;
    buildings.forEach((b) => {
      b.quantity = 0;
      b.cost = b.baseCost;
    });
    recalculate();
    updateUI();
    navBtns[0].click();
  }
};

// 8. MAIN LOOP
setInterval(() => {
  let income = (cps * goldenMultiplier) / 10;
  // Auto-Tapper logic
  if (rebirthUpgrades[1].level > 0)
    income += (rebirthUpgrades[1].level * (1 + rebirthPoints * 0.1)) / 10;

  cookies += income;
  totalCookies += income;
  updateUI();

  achievements.forEach((ach) => {
    if (!ach.unlocked && ach.condition()) {
      ach.unlocked = true;
      document.getElementById("ach-title").innerText = ach.title;
      document.getElementById("achievement-toast").classList.add("show");
      setTimeout(
        () =>
          document.getElementById("achievement-toast").classList.remove("show"),
        4000,
      );
    }
  });
}, 100);

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "p") {
    cookies += 10000;
    totalCookies += 10000;
    updateUI();
    console.log("Gay Cheat: +10k cookies");
  }
});

// Spawn Golden Cookie periodically
setInterval(() => {
  if (Math.random() < 0.3) spawnGolden();
}, 40000);

initStore();
updateUI();
