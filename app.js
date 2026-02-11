const startInput = document.getElementById("startNumber");
const endInput = document.getElementById("endNumber");
const drawDisplay = document.getElementById("drawDisplay");
const feedback = document.getElementById("feedback");
const remainingCount = document.getElementById("remainingCount");
const drawButton = document.getElementById("drawButton");
const resetButton = document.getElementById("resetButton");
const themeToggle = document.getElementById("themeToggle");
const drawnList = document.getElementById("drawnList");
const mainTitle = document.getElementById("mainTitle");
const subtitle = document.getElementById("subtitle");
const historyTitle = document.getElementById("historyTitle");

let drawnNumbers = [];
let isDrawing = false;
let currentTheme = "lunar";

const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

const themeConfig = {
  lunar: {
    title: "🧧 新春好運抽獎機 🧧",
    subtitle: "紅色喜氣主題、金色點綴、開春抽出好彩頭！",
    drawText: "🧨 開始抽獎",
    resetText: "🏮 重置",
    historyText: "🧮 已抽出號碼",
    toggleText: "🌌 切換銀河版",
    particles: ["🧧", "🎊", "🏮", "✨", "🐉", "🪙"],
  },
  galaxy: {
    title: "✨ 星空幸運抽獎機 ✨",
    subtitle: "銀河星空主題、流暢動畫、閃耀抽出幸運號碼！",
    drawText: "🎰 開始抽獎",
    resetText: "♻️ 重置",
    historyText: "📋 已抽出號碼",
    toggleText: "🧧 切換新春版",
    particles: ["🎉", "✨", "🎊", "🌟", "💫", "🍀"],
  },
};

function applyTheme(theme) {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  const config = themeConfig[theme];

  mainTitle.textContent = config.title;
  subtitle.textContent = config.subtitle;
  drawButton.textContent = config.drawText;
  resetButton.textContent = config.resetText;
  historyTitle.textContent = config.historyText;
  themeToggle.textContent = config.toggleText;
}

function toggleTheme() {
  const nextTheme = currentTheme === "lunar" ? "galaxy" : "lunar";
  applyTheme(nextTheme);
  if (!feedback.textContent) return;
  setFeedback(`已切換為${nextTheme === "lunar" ? "新春" : "銀河"}主題。`, false);
}

function getNumberPool() {
  const start = Number(startInput.value);
  const end = Number(endInput.value);

  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { error: "請輸入有效整數。" };
  }
  if (start >= end) {
    return { error: "起始號碼必須小於結束號碼。" };
  }

  const all = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const available = all.filter((n) => !drawnNumbers.includes(n));

  if (all.length > 2000) {
    return { error: "範圍過大，請設定在 2000 個號碼以內。" };
  }

  return { all, available };
}

function setFeedback(message = "", isError = false) {
  feedback.textContent = message;
  feedback.className = `h-7 text-sm font-semibold ${isError ? "text-amber-300" : "text-emerald-300"}`;
}

function updateRemainingCount() {
  const pool = getNumberPool();
  if (pool.error) {
    remainingCount.textContent = "--";
    return;
  }
  remainingCount.textContent = String(pool.available.length);
}

function renderDrawnNumbers() {
  drawnList.innerHTML = "";
  drawnNumbers.forEach((number) => {
    const item = document.createElement("li");
    item.textContent = number;
    item.className = "drawn-item draw-chip px-3 py-1 rounded-full font-semibold";
    drawnList.appendChild(item);
  });
}

function launchParticles() {
  const emojis = themeConfig[currentTheme].particles;
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.42;

  for (let i = 0; i < 18; i += 1) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const angle = (Math.PI * 2 * i) / 18;
    const distance = 90 + Math.random() * 130;
    p.style.left = `${originX}px`;
    p.style.top = `${originY}px`;
    p.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    p.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    p.style.setProperty("--r", `${-90 + Math.random() * 180}deg`);
    p.style.setProperty("--duration", `${0.8 + Math.random() * 0.8}s`);

    document.body.appendChild(p);
    p.addEventListener("animationend", () => p.remove(), { once: true });
  }
}

function pickRandom(available) {
  return available[Math.floor(Math.random() * available.length)];
}

function animateDraw(finalNumber) {
  const duration = 1900;
  const minInterval = 28;
  const maxInterval = 220;
  let lastSwitch = 0;

  return new Promise((resolve) => {
    const startTime = performance.now();

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const slowed = easeOutQuart(progress);
      const interval = minInterval + (maxInterval - minInterval) * slowed;

      if (now - lastSwitch >= interval) {
        const pool = getNumberPool();
        if (!pool.error && pool.available.length > 0) {
          drawDisplay.textContent = pickRandom(pool.available);
        }
        lastSwitch = now;
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        drawDisplay.textContent = finalNumber;
        drawDisplay.classList.remove("stop");
        void drawDisplay.offsetWidth;
        drawDisplay.classList.add("stop");
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

async function drawNumber() {
  if (isDrawing) return;

  const pool = getNumberPool();
  if (pool.error) {
    setFeedback(pool.error, true);
    return;
  }

  if (pool.available.length === 0) {
    setFeedback("所有號碼都已抽出，請按重置重新開始。", true);
    return;
  }

  isDrawing = true;
  drawButton.disabled = true;
  drawButton.classList.add("opacity-60", "cursor-not-allowed");
  setFeedback("抽獎進行中...", false);

  const winningNumber = pickRandom(pool.available);
  await animateDraw(winningNumber);

  drawnNumbers.push(winningNumber);
  renderDrawnNumbers();
  updateRemainingCount();
  launchParticles();
  setFeedback(`恭喜抽中 ${winningNumber} 號！`, false);

  isDrawing = false;
  drawButton.disabled = false;
  drawButton.classList.remove("opacity-60", "cursor-not-allowed");
}

function resetDraw() {
  if (isDrawing) return;
  drawnNumbers = [];
  drawDisplay.textContent = "--";
  setFeedback("已清除抽獎紀錄。", false);
  renderDrawnNumbers();
  updateRemainingCount();
}

[startInput, endInput].forEach((input) => {
  input.addEventListener("input", () => {
    const pool = getNumberPool();
    if (pool.error) {
      setFeedback(pool.error, true);
    } else {
      setFeedback("");
    }
    updateRemainingCount();
  });
});

drawButton.addEventListener("click", drawNumber);
resetButton.addEventListener("click", resetDraw);
themeToggle.addEventListener("click", toggleTheme);

applyTheme(currentTheme);
updateRemainingCount();
