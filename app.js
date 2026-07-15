const WIN_FILE = "__woohoo-mouse-squirrel-cartoon.wav";
const LOSE_FILES = SOUND_FILES.filter(f => f !== WIN_FILE);

const NUM_CARDS = 10;
let cols = 5;
let rows = 2;

const board = document.getElementById("board");
const difficultySlider = document.getElementById("difficulty-slider");
const difficultyValue = document.getElementById("difficulty-value");

let winProbability = difficultyToProbability(Number(difficultySlider.value));

function difficultyToProbability(difficulty) {
  // avg clicks to win: 5 at difficulty 1, 100 at difficulty 10 (linear interpolation)
  const avgClicks = 5 + ((100 - 5) / 9) * (difficulty - 1);
  return 1 / avgClicks;
}

difficultySlider.addEventListener("input", () => {
  difficultyValue.textContent = difficultySlider.value;
  winProbability = difficultyToProbability(Number(difficultySlider.value));
  cards.filter(card => !card.locked).forEach(reassign);
});

function randomPastelColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 55 + Math.floor(Math.random() * 20);
  const lightness = 78 + Math.floor(Math.random() * 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function randomLoseFile() {
  return LOSE_FILES[Math.floor(Math.random() * LOSE_FILES.length)];
}

function pickAssignment() {
  if (Math.random() < winProbability) {
    return { soundFile: WIN_FILE, isWinner: true };
  }
  return { soundFile: randomLoseFile(), isWinner: false };
}

const cards = [];

function buildBoard() {
  for (let i = 0; i < NUM_CARDS; i++) {
    const cardEl = document.createElement("div");
    cardEl.className = "card";

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const front = document.createElement("div");
    front.className = "card-front";
    const q = document.createElement("span");
    q.className = "q";
    q.textContent = "?";
    front.appendChild(q);

    const back = document.createElement("div");
    back.className = "card-back";
    const img = document.createElement("img");
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    cardEl.appendChild(inner);
    board.appendChild(cardEl);

    const card = {
      el: cardEl,
      frontEl: front,
      imgEl: img,
      soundFile: null,
      isWinner: false,
      locked: false,
    };
    reassign(card);
    cardEl.addEventListener("click", () => onCardClick(card));
    cards.push(card);
  }
}

function reassign(card) {
  const { soundFile, isWinner } = pickAssignment();
  card.soundFile = soundFile;
  card.isWinner = isWinner;
  card.frontEl.style.background = randomPastelColor();
}

function onCardClick(card) {
  if (card.locked) return;
  card.locked = true;
  card.el.classList.add("disabled");

  card.imgEl.src = card.isWinner ? "images/_fireworks.gif" : "images/skunk.gif";
  card.el.classList.toggle("winner", card.isWinner);
  card.el.classList.add("flipped");

  const repeats = card.isWinner ? 8 : 1;
  let playsRemaining = repeats;
  let flippedBack = false;

  const flipBack = () => {
    if (flippedBack) return;
    flippedBack = true;
    card.el.classList.remove("flipped");
    setTimeout(() => {
      reassign(card);
      card.el.classList.remove("disabled");
      card.locked = false;
    }, 350);
  };

  const playNext = () => {
    if (playsRemaining <= 0) {
      flipBack();
      return;
    }
    playsRemaining--;
    const audio = new Audio(`sounds/${encodeURIComponent(card.soundFile)}`);
    audio.addEventListener("ended", playNext);
    audio.addEventListener("error", playNext);
    audio.play().catch(() => setTimeout(playNext, 1500));
  };

  playNext();

  // safety net in case audio events never fire (e.g. file couldn't load)
  setTimeout(flipBack, repeats * 6000);
}

function layoutBoard() {
  const portrait = window.innerHeight >= window.innerWidth;
  cols = portrait ? 2 : 5;
  rows = portrait ? 5 : 2;

  const rect = board.getBoundingClientRect();
  const gap = 18;
  const ratio = 200 / 168; // skunk.gif width / height

  const availW = rect.width - gap * (cols - 1);
  const availH = rect.height - gap * (rows - 1);

  let cardW = availW / cols;
  let cardH = cardW / ratio;

  if (cardH * rows > availH) {
    cardH = availH / rows;
    cardW = cardH * ratio;
  }

  document.documentElement.style.setProperty("--cols", cols);
  document.documentElement.style.setProperty("--rows", rows);
  document.documentElement.style.setProperty("--card-w", `${cardW}px`);
  document.documentElement.style.setProperty("--card-h", `${cardH}px`);
  document.documentElement.style.setProperty("--gap", `${gap}px`);
}

window.addEventListener("resize", layoutBoard);
window.addEventListener("orientationchange", () => setTimeout(layoutBoard, 100));

buildBoard();
layoutBoard();
