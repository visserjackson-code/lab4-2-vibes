/**
 * RPN Calculator — Vanilla JS
 * Flow: input operand1 → ENT → input operand2 → select operator → ENT → result
 * No eval(). Arithmetic handled by explicit switch.
 */

'use strict';

// ── State ────────────────────────────────────────────────────────────────────

const state = {
  phase:    'input1',   // 'input1' | 'input2' | 'result'
  operand1: '',
  operand2: '',
  operator: null        // '+' | '-' | '*' | '/'
};

// ── DOM refs ─────────────────────────────────────────────────────────────────

const dispOp1   = document.getElementById('disp-op1');
const dispOp2   = document.getElementById('disp-op2');
const dispOper  = document.getElementById('disp-oper');
const display   = document.querySelector('.display');
const phaseLabel = document.getElementById('phase-label');

// ── Arithmetic (no eval) ─────────────────────────────────────────────────────

function compute(a, b, op) {
  const n1 = parseFloat(a);
  const n2 = parseFloat(b);
  if (isNaN(n1) || isNaN(n2)) return null;

  switch (op) {
    case '+': return n1 + n2;
    case '-': return n1 - n2;
    case '*': return n1 * n2;
    case '/':
      if (n2 === 0) return 'ERR:DIV0';
      return n1 / n2;
    default:  return null;
  }
}

function formatResult(val) {
  if (typeof val === 'string') return val; // error string
  // Avoid floating-point noise (e.g. 0.1+0.2 = 0.30000000004)
  const rounded = parseFloat(val.toPrecision(10));
  return String(rounded);
}

// ── Display update ────────────────────────────────────────────────────────────

const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' };

const PHASE_MESSAGES = {
  input1:  'ENTER FIRST NUMBER',
  input2:  'ENTER SECOND NUMBER',
  result:  'RESULT — RESET TO CONTINUE'
};

function updateDisplay() {
  // Clear active cursors
  dispOp1.classList.remove('active');
  dispOp2.classList.remove('active');

  dispOp1.textContent  = state.operand1 || '';
  dispOp2.textContent  = (state.phase !== 'input1') ? (state.operand2 || '') : '';
  dispOper.textContent = state.operator ? OP_SYMBOL[state.operator] : '';

  // Active cursor
  if (state.phase === 'input1') dispOp1.classList.add('active');
  if (state.phase === 'input2') dispOp2.classList.add('active');

  phaseLabel.textContent = PHASE_MESSAGES[state.phase] || '';

  display.classList.toggle('error',
    typeof state.operand1 === 'string' && state.operand1.startsWith('ERR')
  );
}

// ── Input handlers ────────────────────────────────────────────────────────────

function handleDigit(val) {
  if (state.phase === 'result') return; // must reset first

  const target = state.phase === 'input1' ? 'operand1' : 'operand2';
  const current = state[target];

  // Guard: only one decimal point
  if (val === '.' && current.includes('.')) return;

  // Guard: leading zero — allow "0." but not "00"
  if (current === '0' && val !== '.') {
    state[target] = val;
  } else {
    // Guard: reasonable length
    if (current.length >= 12) return;
    state[target] += val;
  }

  updateDisplay();
}

function handleEnter() {
  if (state.phase === 'input1') {
    // Must have something in operand1
    if (!state.operand1 || state.operand1 === '.') return;
    state.phase = 'input2';
    updateDisplay();
    return;
  }

  if (state.phase === 'input2') {
    // Need operand2 and operator
    if (!state.operand2 || state.operand2 === '.') return;
    if (!state.operator) return;

    const result = compute(state.operand1, state.operand2, state.operator);
    if (result === null) return;

    const formatted = formatResult(result);
    state.operand1 = formatted;
    state.operand2 = '';
    state.operator = null;
    state.phase = 'result';

    // Clear operator button highlight
    clearOperatorHighlight();

    // Flash display
    display.classList.add('result-flash');
    setTimeout(() => display.classList.remove('result-flash'), 350);

    updateDisplay();
    return;
  }
}

function handleOperator(op) {
  // Operator only valid during input2 phase
  if (state.phase !== 'input2') return;

  state.operator = op;

  // Highlight the locked button
  clearOperatorHighlight();
  const btn = document.querySelector(`.wing-btn[data-op="${op}"]`);
  if (btn) btn.classList.add('locked');

  updateDisplay();
}

function handleReset() {
  state.phase    = 'input1';
  state.operand1 = '';
  state.operand2 = '';
  state.operator = null;

  clearOperatorHighlight();
  display.classList.remove('error');
  updateDisplay();
}

function clearOperatorHighlight() {
  document.querySelectorAll('.wing-btn').forEach(b => b.classList.remove('locked'));
}

// ── Event wiring ──────────────────────────────────────────────────────────────

// Number + decimal buttons
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => handleDigit(btn.dataset.val));
});

// Operator wing buttons
document.querySelectorAll('.op-btn').forEach(btn => {
  btn.addEventListener('click', () => handleOperator(btn.dataset.op));
});

// Enter
document.getElementById('btn-enter').addEventListener('click', handleEnter);

// Reset
document.getElementById('btn-reset').addEventListener('click', handleReset);

// Keyboard support
document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') { handleDigit(e.key); return; }
  if (e.key === '.')                 { handleDigit('.'); return; }
  if (e.key === 'Enter')             { handleEnter(); return; }
  if (e.key === 'Escape')            { handleReset(); return; }
  if (e.key === '+')                 { handleOperator('+'); return; }
  if (e.key === '-')                 { handleOperator('-'); return; }
  if (e.key === '*')                 { handleOperator('*'); return; }
  if (e.key === '/')                 { e.preventDefault(); handleOperator('/'); return; }
});

// ── Init ──────────────────────────────────────────────────────────────────────
updateDisplay();
