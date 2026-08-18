/**
 * O MISTÉRIO DAS PORTAS MÁGICAS - LÓGICA DO JOGO
 */

// 1. Catálogo de Portas Lógicas (Magias)
const GATES = {
  AND: {
    id: 'AND',
    name: 'AND',
    tag: 'E',
    sym: '•',
    desc: 'Ativa quando A e B estão ativos.',
    eval: (a, b) => a && b,
  },
  OR: {
    id: 'OR',
    name: 'OR',
    tag: 'OU',
    sym: '+',
    desc: 'Ativa quando A ou B (ou ambos) está ativo.',
    eval: (a, b) => a || b,
  },
  XOR: {
    id: 'XOR',
    name: 'XOR',
    tag: 'OU EXCLUSIVO',
    sym: '⊕',
    desc: 'Ativa quando exatamente um está ativo.',
    eval: (a, b) => (a || b) && !(a && b),
  },
  XNOR: {
    id: 'XNOR',
    name: 'XNOR',
    tag: 'IGUAL',
    sym: '⊙',
    desc: 'Ativa quando A e B são iguais.',
    eval: (a, b) => a === b,
  },
  NOT: {
    id: 'NOT',
    name: 'NOT',
    tag: 'INVERSOR',
    sym: '¬',
    desc: 'Sempre o oposto do Artefato A.',
    eval: (a, b) => !a,
  },
  NAND: {
    id: 'NAND',
    name: 'NAND',
    tag: 'NÃO E',
    sym: 'bar',
    desc: 'O oposto do AND. Falha só com ambos ativos.',
    eval: (a, b) => !(a && b),
  },
  NOR: {
    id: 'NOR',
    name: 'NOR',
    tag: 'NÃO OU',
    sym: '⊽',
    desc: 'O oposto do OR. Ativa só com ambos inativos.',
    eval: (a, b) => !(a || b),
  },
};

// 2. Estado do Jogo
const state = {
  round: 1,
  wins: 0,
  losses: 0,
  streak: 0,
  doorA: false,
  doorB: false,
  secretGate: null,
  answered: false,
  activeView: 'doors', // 'doors' | 'table'
};

// 3. Referências de Elementos do DOM
const dom = {
  roundNum: document.getElementById('roundNum'),
  statWins: document.getElementById('statWins'),
  statLosses: document.getElementById('statLosses'),
  statStreak: document.getElementById('statStreak'),
  doorA: document.getElementById('doorA'),
  doorB: document.getElementById('doorB'),
  btnDoorA: document.querySelector('[data-door="A"]'),
  btnDoorB: document.querySelector('[data-door="B"]'),
  signalOrb: document.getElementById('signalOrb'),
  signalText: document.getElementById('signalText'),
  truthBody: document.getElementById('truthBody'),
  magicGrid: document.getElementById('magicGrid'),
  nextRoundBtn: document.getElementById('nextRound'),
  feedback: document.getElementById('feedback'),
  feedbackIcon: document.getElementById('feedbackIcon'),
  feedbackText: document.getElementById('feedbackText'),
  viewTabs: document.querySelectorAll('.view-tab'),
  views: document.querySelectorAll('.view'),
};

// 4. Inicialização do Jogo
function init() {
  bindEvents();
  renderMagicGrid();
  startNewRound();
}

// 5. Event Listeners
function bindEvents() {
  // Toggle das Portas
  dom.btnDoorA.addEventListener('click', () => toggleDoor('A'));
  dom.btnDoorB.addEventListener('click', () => toggleDoor('B'));

  // Botão da Próxima Rodada
  dom.nextRoundBtn.addEventListener('click', startNewRound);

  // Alternância de Abas (Portas / Tabela)
  dom.viewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const viewTarget = tab.getAttribute('data-view');
      switchView(viewTarget);
    });
  });
}

// 6. Troca de Abas
function switchView(targetView) {
  state.activeView = targetView;

  dom.viewTabs.forEach((tab) => {
    const isActive = tab.getAttribute('data-view') === targetView;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  dom.views.forEach((view) => {
    const isTarget = view.classList.contains(`view--${targetView}`);
    view.classList.toggle('is-active', isTarget);
  });
}

// 7. Lógica das Rodadas
function startNewRound() {
  state.answered = false;
  state.doorA = false;
  state.doorB = false;

  // Seleciona uma magia aleatória
  const gateKeys = Object.keys(GATES);
  const randomIndex = Math.floor(Math.random() * gateKeys.length);
  state.secretGate = GATES[gateKeys[randomIndex]];

  // Reset visual das portas e botões
  closeDoors();
  updateDoorStates();
  renderTruthTable();
  resetMagicGridUI();
  hideFeedback();

  dom.nextRoundBtn.disabled = true;
  dom.roundNum.textContent = state.round;
}

function toggleDoor(doorLetter) {
  if (state.answered) return;

  if (doorLetter === 'A') {
    state.doorA = !state.doorA;
  } else if (doorLetter === 'B') {
    state.doorB = !state.doorB;
  }

  updateDoorStates();
}

function updateDoorStates() {
  const isA = state.doorA;
  const isB = state.doorB;

  // Atualizar Estado A
  dom.btnDoorA.setAttribute('aria-pressed', isA);
  const stateAEl = dom.doorA.querySelector('.door__state');
  const artifactAEl = dom.doorA.querySelector('.artifact');
  stateAEl.textContent = isA ? 'Ativo' : 'Inativo';
  stateAEl.classList.toggle('on', isA);
  artifactAEl.classList.toggle('on', isA);

  // Atualizar Estado B
  dom.btnDoorB.setAttribute('aria-pressed', isB);
  const stateBEl = dom.doorB.querySelector('.door__state');
  const artifactBEl = dom.doorB.querySelector('.artifact');
  stateBEl.textContent = isB ? 'Ativo' : 'Inativo';
  stateBEl.classList.toggle('on', isB);
  artifactBEl.classList.toggle('on', isB);

  // Calcular Sinal do Portal usando a Magia Secreta
  const signalOn = state.secretGate.eval(isA, isB);

  dom.signalOrb.classList.toggle('on', signalOn);
  dom.signalText.classList.toggle('on', signalOn);
  dom.signalText.textContent = signalOn ? 'Ativo' : 'Inativo';

  highlightTruthTableRow(isA, isB);
}

// 8. Tabela de Verdade
function renderTruthTable() {
  const combinations = [
    { a: false, b: false },
    { a: false, b: true },
    { a: true, b: false },
    { a: true, b: true },
  ];

  dom.truthBody.innerHTML = combinations
    .map((combo) => {
      const sig = state.secretGate.eval(combo.a, combo.b);
      return `
        <div class="truth-row" data-a="${combo.a}" data-b="${combo.b}" role="row">
          <span class="truth-cell">
            <span class="dot ${combo.a ? 'on--a' : ''}"></span>
            ${combo.a ? 'Ativo' : 'Inativo'}
          </span>
          <span class="truth-cell">
            <span class="dot ${combo.b ? 'on--b' : ''}"></span>
            ${combo.b ? 'Ativo' : 'Inativo'}
          </span>
          <span class="truth-cell">
            <span class="dot ${sig ? 'on--sig' : ''}"></span>
            ${sig ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      `;
    })
    .join('');
}

function highlightTruthTableRow(isA, isB) {
  const rows = dom.truthBody.querySelectorAll('.truth-row');
  rows.forEach((row) => {
    const rowA = row.getAttribute('data-a') === 'true';
    const rowB = row.getAttribute('data-b') === 'true';
    const isCurrent = rowA === isA && rowB === isB;
    row.classList.toggle('current', isCurrent);
  });
}

// 9. Opções de Magia (Grid de Escolha)
function renderMagicGrid() {
  dom.magicGrid.innerHTML = Object.values(GATES)
    .map((gate) => {
      return `
        <button type="button" class="magic-option" data-gate="${gate.id}">
          <span class="magic-sym" aria-hidden="true">${gate.sym}</span>
          <span class="magic-info">
            <span class="magic-name">
              ${gate.name}
              <span class="magic-tag">${gate.tag}</span>
            </span>
            <span class="magic-desc">${gate.desc}</span>
          </span>
          <span class="magic-arrow" aria-hidden="true">→</span>
        </button>
      `;
    })
    .join('');

  // Event Listeners dos cards de magia
  const options = dom.magicGrid.querySelectorAll('.magic-option');
  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      const gateId = opt.getAttribute('data-gate');
      handleAnswer(gateId, opt);
    });
  });
}

function resetMagicGridUI() {
  const options = dom.magicGrid.querySelectorAll('.magic-option');
  options.forEach((opt) => {
    opt.disabled = false;
    opt.classList.remove('correct', 'wrong', 'reveal');
  });
}

// 10. Processar Resposta do Jogador
function handleAnswer(selectedGateId, clickedBtn) {
  if (state.answered) return;
  state.answered = true;

  const isCorrect = selectedGateId === state.secretGate.id;
  const options = dom.magicGrid.querySelectorAll('.magic-option');

  // Desabilita todas as opções
  options.forEach((opt) => (opt.disabled = true));

  if (isCorrect) {
    state.wins++;
    state.streak++;
    clickedBtn.classList.add('correct');
    openDoors();
    showFeedback(
      true,
      `<strong>Impressionante!</strong> A magia correta era realmente <strong>${state.secretGate.name}</strong>.`
    );
  } else {
    state.losses++;
    state.streak = 0;
    clickedBtn.classList.add('wrong');
    shakeDoors();

    // Revela a opção correta
    const correctBtn = dom.magicGrid.querySelector(
      `[data-gate="${state.secretGate.id}"]`
    );
    if (correctBtn) correctBtn.classList.add('reveal');

    showFeedback(
      false,
      `<strong>Que pena!</strong> A magia correta era <strong>${state.secretGate.name}</strong> (${state.secretGate.tag}).`
    );
  }

  // Atualiza Placar e habilita o botão de próxima rodada
  updateStats();
  state.round++;
  dom.nextRoundBtn.disabled = false;
}

// 11. Animações e Feedbacks
function openDoors() {
  dom.doorA.classList.add('open');
  dom.doorB.classList.add('open');
}

function closeDoors() {
  dom.doorA.classList.remove('open', 'shake');
  dom.doorB.classList.remove('open', 'shake');
}

function shakeDoors() {
  dom.doorA.classList.add('shake');
  dom.doorB.classList.add('shake');
}

function showFeedback(isWin, messageHTML) {
  dom.feedback.className = `feedback show ${isWin ? 'win' : 'lose'}`;
  dom.feedbackIcon.textContent = isWin ? '✨' : '💥';
  dom.feedbackText.innerHTML = messageHTML;
}

function hideFeedback() {
  dom.feedback.className = 'feedback';
  dom.feedbackIcon.textContent = '';
  dom.feedbackText.innerHTML = '';
}

function updateStats() {
  dom.statWins.textContent = state.wins;
  dom.statLosses.textContent = state.losses;
  dom.statStreak.textContent = state.streak;
}

// Iniciar ao carregar a página
document.addEventListener('DOMContentLoaded', init);
