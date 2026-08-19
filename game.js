const OPERATIONS = [
  { key: 'AND', sym: '·', pt: 'AND', tag: 'E', desc: 'Ativa quando A e B estão ativos.' },
  { key: 'OR', sym: '+', pt: 'OR', tag: 'OU', desc: 'Ativa quando A ou B (ou ambos) está ativo.' },
  { key: 'XOR', sym: '⊕', pt: 'XOR', tag: 'OU exclusivo', desc: 'Ativa quando exatamente um está ativo.' },
  { key: 'XNOR', sym: '⊙', pt: 'XNOR', tag: 'Igual', desc: 'Ativa quando A e B estão iguais.' },
  { key: 'NOT', sym: '¬', pt: 'NOT', tag: 'Inversor', desc: 'Sempre o oposto do Artefato A.' },
  { key: 'NAND', sym: '⊼', pt: 'NAND', tag: 'NÃO E', desc: 'O oposto do AND. Falha só com ambos ativos.' },
  { key: 'NOR', sym: '⊽', pt: 'NOR', tag: 'NÃO OU', desc: 'O oposto do OR. Ativa só com ambos inativos.' },
];

const TRUTH = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  XOR: [0, 1, 1, 0],
  XNOR: [1, 0, 0, 1],
  NOT: [1, 1, 0, 0],
  NAND: [1, 1, 1, 0],
  NOR: [1, 0, 0, 0],
};

const COMBOS = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

// Ordem pedagógica: das mais fáceis para as mais desafiadoras
const GATE_ORDER = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR'];

// Liberação progressiva (tutorial): cada portal é desbloqueado na rodada indicada
const UNLOCKS = [
  { round: 3, key: 'NOT' },
  { round: 5, key: 'XOR' },
  { round: 7, key: 'NAND' },
  { round: 9, key: 'NOR' },
  { round: 11, key: 'XNOR' },
];

// Pesos para manter a dificuldade equilibrada (fáceis mais frequentes)
const WEIGHTS = { AND: 3, OR: 3, NOT: 2, XOR: 2, NAND: 1, NOR: 1, XNOR: 1 };

const game = {
  op: null,
  A: 0,
  B: 0,
  answered: false,
  round: 0,
  wins: 0,
  losses: 0,
  streak: 0,
  solved: new Set(),
  fresh: null,
};

const $ = (sel) => document.querySelector(sel);

const TIME_BASE = 10; // segundos por rodada (mais curto: ritmo arcade)
const TIME_FLOOR = 4; // nunca desce disso
const TIME_BLOCK = 5; // -1s a cada bloco de rodadas
const TIME_BONUS_CAP = 3; // +1s por acerto seguido, no maximo +3s
let ticker = null;

function timeForRound(round) {
  const penalty = Math.floor((round - 1) / TIME_BLOCK);
  return Math.max(TIME_FLOOR, TIME_BASE - penalty);
}

function effectiveTime(round, streak) {
  const bonus = Math.min(streak, TIME_BONUS_CAP);
  return Math.min(TIME_BASE + TIME_BONUS_CAP, timeForRound(round) + bonus);
}

function stopTimer() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function startTimer() {
  stopTimer();
  const fill = $('#timerFill');
  const count = $('#timerCount');
  if (!fill) return;
  const start = performance.now();
  const total = effectiveTime(game.round, game.streak) * 1000;
  if (count) count.textContent = effectiveTime(game.round, game.streak);
  fill.style.width = '100%';
  fill.classList.remove('low');

  ticker = setInterval(() => {
    const left = total - (performance.now() - start);
    const pct = Math.max(0, (left / total) * 100);
    fill.style.width = pct + '%';
    fill.classList.toggle('low', pct < 30);
    if (count) {
      const rem = Math.max(0, Math.ceil(left / 1000));
      if (+count.textContent !== rem) count.textContent = rem;
    }
    if (left <= 0) {
      stopTimer();
      if (!game.answered) timeoutRound();
    }
  }, 80);
}

function saveStats() {
  localStorage.setItem(
    'portas-magicas-stats',
    JSON.stringify({
      wins: game.wins,
      losses: game.losses,
      streak: game.streak,
      solved: [...game.solved],
    })
  );
}

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem('portas-magicas-stats'));
    if (saved && typeof saved === 'object') {
      game.wins = +saved.wins || 0;
      game.losses = +saved.losses || 0;
      game.streak = +saved.streak || 0;
      if (Array.isArray(saved.solved)) {
        saved.solved.forEach((k) => {
          if (GATE_ORDER.includes(k)) game.solved.add(k);
        });
      }
    }
  } catch (err) {
    /* ignore dados corrompidos */
  }
}

function setArtifact(which, val) {
  game[which] = val;
  const holder = $(`#door${which}`);
  holder.querySelector('.artifact').classList.toggle('on', !!val);
  holder.querySelector('.door__state').classList.toggle('on', !!val);
  holder.querySelector('.door__state').textContent = val ? 'Ativo' : 'Inativo';
  const doorBtn = holder.querySelector('.door');
  doorBtn.setAttribute('aria-pressed', val ? 'true' : 'false');
}

function currentSignal() {
  return TRUTH[game.op][game.A * 2 + game.B];
}

function updateSignal() {
  const on = !!currentSignal();
  $('#signalOrb').classList.toggle('on', on);
  $('#signalText').classList.toggle('on', on);
  $('#signalText').textContent = on ? 'Ativo' : 'Inativo';
}

function renderTable() {
  const truth = TRUTH[game.op];
  $('#truthBody').querySelectorAll('.truth-row').forEach((row, i) => {
    row.querySelector('.dot--sig').classList.toggle('on--sig', !!truth[i]);
    row.querySelector('.sig-text').textContent = truth[i] ? 'Ativo' : 'Inativo';
  });
  highlightCurrentRow();
}

function highlightCurrentRow() {
  const idx = game.A * 2 + game.B;
  $('#truthBody').querySelectorAll('.truth-row').forEach((row, i) => {
    row.classList.toggle('current', i === idx);
  });
}

function buildTable() {
  const body = $('#truthBody');
  COMBOS.forEach(([a, b], i) => {
    const row = document.createElement('div');
    row.className = 'truth-row';
    row.setAttribute('role', 'row');
    row.innerHTML = `
      <span class="truth-cell" role="cell">
        <span class="dot ${a ? 'on--a' : ''}"></span><span>${a ? 'Ativo' : 'Inativo'}</span>
      </span>
      <span class="truth-cell" role="cell">
        <span class="dot ${b ? 'on--b' : ''}"></span><span>${b ? 'Ativo' : 'Inativo'}</span>
      </span>
      <span class="truth-cell" role="cell">
        <span class="dot dot--sig"></span><span class="sig-text">Inativo</span>
      </span>
    `;
    body.appendChild(row);
  });
}

function buildMagics() {
  const list = $('#magicGrid');
  list.innerHTML = ''; // Limpa antes de renderizar

  GATE_ORDER.forEach((key) => {
    const op = OPERATIONS.find((o) => o.key === key);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'magic-option';
    btn.dataset.op = op.key;

    btn.innerHTML = `
      <img class="magic-icon-img" src="icons/${op.key.toLowerCase()}.png" alt="${op.pt}" draggable="false">
      <div class="magic-info">
        <span class="magic-name">${op.pt}<span class="magic-tag">${op.tag}</span></span>
        <span class="magic-desc">${op.desc}</span>
      </div>
      <span class="magic-arrow" aria-hidden="true">→</span>
    `;

    btn.addEventListener('click', () => guess(op.key));
    list.appendChild(btn);
  });
}

function unlockedPool(round) {
  const pool = ['AND', 'OR'];
  UNLOCKS.forEach((u) => {
    if (round >= u.round) pool.push(u.key);
  });
  return pool;
}

function unlockRoundOf(key) {
  const u = UNLOCKS.find((x) => x.key === key);
  return u ? u.round : 1;
}

function pickOp(round) {
  const pool = unlockedPool(round);
  // Dá prioridade ao portal recém-liberado, para praticar logo
  if (game.fresh && pool.includes(game.fresh) && Math.random() < 0.55) {
    return game.fresh;
  }
  const weighted = [];
  pool.forEach((k) => {
    const w = WEIGHTS[k] || 1;
    for (let i = 0; i < w; i++) weighted.push(k);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function applyLocks() {
  const round = game.round;
  const pool = unlockedPool(round);
  let unlockedKey = null;

  document.querySelectorAll('.magic-option').forEach((o) => {
    const k = o.dataset.op;
    const isLocked = !pool.includes(k);
    o.classList.toggle('magic-option--locked', isLocked);
    o.classList.remove('just-unlocked');
    o.disabled = isLocked;
    const ur = unlockRoundOf(k);
    o.title = isLocked ? `Desbloqueia na rodada ${ur}` : '';

    if (!isLocked && UNLOCKS.some((u) => u.key === k && u.round === round)) {
      o.classList.add('just-unlocked');
      unlockedKey = k;
    }
  });

  if (unlockedKey) {
    const op = OPERATIONS.find((x) => x.key === unlockedKey);
    showToast(`Novo portal liberado: ${op.pt} — ${op.tag}`);
  }
}

function renderProgress() {
  const box = $('#progressDots');
  box.innerHTML = '';
  const round = game.round;
  const pool = unlockedPool(round);
  GATE_ORDER.forEach((k) => {
    const op = OPERATIONS.find((o) => o.key === k);
    const dot = document.createElement('span');
    dot.className = 'dot-gate';
    dot.classList.toggle('is-unlocked', pool.includes(k) || game.solved.has(k));
    dot.classList.toggle('is-locked', !pool.includes(k));
    dot.classList.toggle('is-solved', game.solved.has(k));
    dot.title = `${op.pt}${game.solved.has(k) ? ' — dominado' : ''}`;
    box.appendChild(dot);
  });
}

let toastTimer = null;
function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function setupViews() {
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.view-tab').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      const name = tab.dataset.view;
      document.querySelectorAll('.view').forEach((v) => {
        v.classList.toggle('is-active', v.classList.contains(`view--${name}`));
      });
    });
  });
}

function toggleDoor(which) {
  if (game.answered) return;
  setArtifact(which, game[which] ? 0 : 1);
  updateSignal();
  highlightCurrentRow();
}

function timeoutRound() {
  if (game.answered) return;
  game.answered = true;
  game.losses++;
  game.streak = 0;

  const stage = $('.stage');
  const card = $('.magic-card');
  card.classList.add('has-result');

  document.querySelectorAll('.door').forEach((d) => (d.disabled = true));
  document.querySelectorAll('.magic-option').forEach((b) => (b.disabled = true));

  const correctBtn = $(`.magic-option[data-op="${game.op}"]`);
  correctBtn.classList.add('reveal');

  document.querySelectorAll('.magic-option').forEach((o, i) => {
    if (o !== correctBtn) {
      o.style.transitionDelay = `${i * 30}ms`;
      o.classList.add('dimmed');
    } else {
      o.style.transitionDelay = '0ms';
    }
  });

  document.querySelectorAll('.door-holder').forEach((h) => h.classList.add('shake'));
  setTimeout(() => {
    document.querySelectorAll('.door-holder').forEach((h) => h.classList.remove('shake'));
  }, 600);

  const fb = $('#feedback');
  const icon = $('#feedbackIcon');
  const text = $('#feedbackText');
  const correctOp = OPERATIONS.find((o) => o.key === game.op);

  stage.classList.add('stage--lose');
  fb.classList.add('show', 'lose');
  icon.textContent = '⏰';
  text.innerHTML = `Tempo esgotado! A magia certa era <strong>${correctOp.pt}</strong> (${correctOp.tag}).`;

  const nb = $('#nextRound');
  nb.disabled = false;
  nb.classList.remove('btn-pop');
  void nb.offsetWidth;
  nb.classList.add('btn-pop');

  $('#statWins').textContent = game.wins;
  $('#statLosses').textContent = game.losses;
  $('#statStreak').textContent = game.streak;
  saveStats();
}

function guess(opKey) {
  if (game.answered) return;
  game.answered = true;
  stopTimer();

  const stage = $('.stage');
  const card = $('.magic-card');
  card.classList.add('has-result');

  document.querySelectorAll('.door').forEach((d) => (d.disabled = true));
  document.querySelectorAll('.magic-option').forEach((b) => (b.disabled = true));

  const btn = $(`.magic-option[data-op="${opKey}"]`);
  const correctBtn = $(`.magic-option[data-op="${game.op}"]`);

  document.querySelectorAll('.magic-option').forEach((o, i) => {
    if (o !== btn && o !== correctBtn) {
      o.style.transitionDelay = `${i * 30}ms`;
      o.classList.add('dimmed');
    } else {
      o.style.transitionDelay = '0ms';
    }
  });

  const fb = $('#feedback');
  const icon = $('#feedbackIcon');
  const text = $('#feedbackText');
  const op = OPERATIONS.find((o) => o.key === opKey);
  const correctOp = OPERATIONS.find((o) => o.key === game.op);

  if (opKey === game.op) {
    game.wins++;
    game.streak++;
    stage.classList.add('stage--win');
    btn.classList.add('correct');

    const mastered = !game.solved.has(game.op);
    fb.classList.add('show', 'win');
    if (mastered) {
      game.solved.add(game.op);
      renderProgress();
      icon.textContent = '🏆';
      showToast(`Portal dominado: ${correctOp.pt}!`);
      text.innerHTML = `Portal dominado! <strong>${correctOp.pt}</strong> — ${correctOp.desc}`;
    } else {
      icon.textContent = '✨';
      text.innerHTML = `Acertou! O portal é controlado por <strong>${correctOp.pt}</strong>.`;
    }
    if (game.streak >= 2 && mastered === false) {
      showToast(`Sequência x${game.streak} · +1s na próxima rodada`);
    }
  } else {
    game.losses++;
    game.streak = 0;
    stage.classList.add('stage--lose');
    btn.classList.add('wrong');
    correctBtn.classList.add('reveal');

    document.querySelectorAll('.door-holder').forEach((h) => h.classList.add('shake'));
    setTimeout(() => {
      document.querySelectorAll('.door-holder').forEach((h) => h.classList.remove('shake'));
    }, 600);

    fb.classList.add('show', 'lose');
    icon.textContent = '🚫';
    text.innerHTML = `Errou! A magia certa era <strong>${correctOp.pt}</strong> (${correctOp.tag}).`;
  }

  const nb = $('#nextRound');
  nb.disabled = false;
  nb.classList.remove('btn-pop');
  void nb.offsetWidth;
  nb.classList.add('btn-pop');

  $('#statWins').textContent = game.wins;
  $('#statLosses').textContent = game.losses;
  $('#statStreak').textContent = game.streak;
  saveStats();
}

function newRound() {
  game.round++;
  game.answered = false;

  const fresh = UNLOCKS.filter((u) => u.round === game.round).map((u) => u.key);
  if (fresh.length) game.fresh = fresh[0];
  game.op = pickOp(game.round);
  if (game.fresh === game.op) game.fresh = null;
  game.A = Math.random() < 0.5 ? 0 : 1;
  game.B = Math.random() < 0.5 ? 0 : 1;

  $('#roundNum').textContent = game.round;
  $('#timerCount').textContent = effectiveTime(game.round, game.streak);
  const nb = $('#nextRound');
  nb.disabled = true;
  nb.classList.remove('btn-pop');

  $('.stage').classList.remove('stage--win', 'stage--lose');
  $('.magic-card').classList.remove('has-result');

  $('#feedback').classList.remove('show', 'win', 'lose');
  document.querySelectorAll('.magic-option').forEach((c) => {
    c.classList.remove('correct', 'wrong', 'reveal', 'dimmed', 'rebloom');
    c.style.animationDelay = '';
    c.style.transitionDelay = '';
    c.disabled = false;
  });
  applyLocks();
  renderProgress();
  document.querySelectorAll('.door-holder').forEach((h) => {
    h.classList.remove('open', 'win', 'shake');
    h.querySelector('.door').disabled = false;
  });
  document.querySelectorAll('.treasure').forEach((t) => (t.textContent = ''));

  setArtifact('A', game.A);
  setArtifact('B', game.B);
  updateSignal();
  renderTable();

  const stage = $('.stage');
  stage.classList.remove('rounding');
  void stage.offsetWidth;
  stage.classList.add('rounding');
  setTimeout(() => stage.classList.remove('rounding'), 700);

  const chip = $('.chip--round');
  chip.classList.remove('flash');
  void chip.offsetWidth;
  chip.classList.add('flash');
  setTimeout(() => chip.classList.remove('flash'), 650);

  rebloomOptions();
  startTimer();
}

function rebloomOptions() {
  document.querySelectorAll('.magic-option').forEach((o, i) => {
    o.style.animationDelay = `${i * 45}ms`;
    o.classList.add('rebloom');
  });
  setTimeout(() => {
    document.querySelectorAll('.magic-option').forEach((o) => o.classList.remove('rebloom'));
  }, 600);
}

function init() {
  loadStats();
  buildTable();
  buildMagics();
  setupViews();
  newRound();

  document.querySelectorAll('.door').forEach((door) => {
    door.addEventListener('click', () => toggleDoor(door.dataset.door));
  });
  $('#nextRound').addEventListener('click', newRound);
}

init();
