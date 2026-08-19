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

const game = {
  op: null,
  A: 0,
  B: 0,
  answered: false,
  round: 0,
  wins: 0,
  losses: 0,
  streak: 0,
};

const $ = (sel) => document.querySelector(sel);

function saveStats() {
  localStorage.setItem(
    'portas-magicas-stats',
    JSON.stringify({
      wins: game.wins,
      losses: game.losses,
      streak: game.streak,
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

  OPERATIONS.forEach((op) => {
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

function guess(opKey) {
  if (game.answered) return;
  game.answered = true;

  document.querySelectorAll('.door').forEach((d) => (d.disabled = true));
  document.querySelectorAll('.magic-option').forEach((b) => (b.disabled = true));
  $('#nextRound').disabled = false;

  const fb = $('#feedback');
  const icon = $('#feedbackIcon');
  const text = $('#feedbackText');
  const opName = OPERATIONS.find((o) => o.key === opKey).pt;

  if (opKey === game.op) {
    game.wins++;
    game.streak++;

    document.querySelectorAll('.treasure').forEach((t) => {
      t.textContent = OPERATIONS.find((o) => o.key === game.op).sym;
    });
    document.querySelectorAll('.door-holder').forEach((h) => h.classList.add('open', 'win'));
    $(`.magic-option[data-op="${opKey}"]`).classList.add('correct');

    fb.classList.add('show', 'win');
    icon.textContent = '✨';
    text.innerHTML = `Parabéns! Você desvendou a magia — o portal é controlado por <strong>${opName}</strong>.`;
  } else {
    game.losses++;
    game.streak = 0;

    $(`.magic-option[data-op="${opKey}"]`).classList.add('wrong');
    $(`.magic-option[data-op="${game.op}"]`).classList.add('reveal');
    document.querySelectorAll('.door-holder').forEach((h) => h.classList.add('shake'));
    setTimeout(() => {
      document.querySelectorAll('.door-holder').forEach((h) => h.classList.remove('shake'));
    }, 600);

    fb.classList.add('show', 'lose');
    icon.textContent = '🚫';
    text.innerHTML = `Errou! O selo mágico te repeliu. A magia correta era <strong>${OPERATIONS.find((o) => o.key === game.op).pt}</strong>.`;
  }

  $('#statWins').textContent = game.wins;
  $('#statLosses').textContent = game.losses;
  $('#statStreak').textContent = game.streak;
  saveStats();
}

function newRound() {
  game.round++;
  game.answered = false;

  const ops = OPERATIONS.map((o) => o.key);
  game.op = ops[Math.floor(Math.random() * ops.length)];
  game.A = Math.random() < 0.5 ? 0 : 1;
  game.B = Math.random() < 0.5 ? 0 : 1;

  $('#roundNum').textContent = game.round;
  $('#nextRound').disabled = true;

  $('#feedback').classList.remove('show', 'win', 'lose');
  document.querySelectorAll('.magic-option').forEach((c) => {
    c.classList.remove('correct', 'wrong', 'reveal');
    c.disabled = false;
  });
  document.querySelectorAll('.door-holder').forEach((h) => {
    h.classList.remove('open', 'win', 'shake');
    h.querySelector('.door').disabled = false;
  });
  document.querySelectorAll('.treasure').forEach((t) => (t.textContent = ''));

  setArtifact('A', game.A);
  setArtifact('B', game.B);
  updateSignal();
  renderTable();
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
