import { TUTORIAL_TASKS } from '../tutorial/tutorialData.js';
import { getEosTutorialMessage } from '../tutorial/eosMessages.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function taskHistory(progress) {
  const completed = new Set([...(progress.archivedTaskIds ?? []), ...progress.completedTaskIds]);
  return TUTORIAL_TASKS.filter((task) => completed.has(task.id)).map((task) =>
    `<article class="tutorial-history-item"><b>${escapeHtml(task.title)}</b><p>${escapeHtml(getEosTutorialMessage(task.id))}</p><small>${escapeHtml(task.instruction)}</small></article>`,
  ).join('');
}

export function createTutorialPanel(root, game, manager) {
  const details = root.querySelector('[data-details]');
  const focus = () => {
    root.querySelectorAll('.tutorial-focus').forEach((element) => element.classList.remove('tutorial-focus'));
    const { progress, task } = manager.getSnapshot();
    if (!task || progress.dismissed) return;
    const isVisible = (element) => element.getClientRects().length > 0;
    const target = task.focus ? [...root.querySelectorAll(task.focus)].find(isVisible) : null;
    if (target) { target.classList.add('tutorial-focus'); return; }
    if (task.focusTab) {
      const tabs = [...root.querySelectorAll(`[data-tab="${task.focusTab}"]`)].filter(isVisible);
      tabs.forEach((element) => element.classList.add('tutorial-focus'));
    }
  };

  function render() {
    if (destroyed) return;
    let host = details.querySelector('[data-tutorial-host]');
    if (!host) {
      host = document.createElement('div');
      host.dataset.tutorialHost = '';
      details.prepend(host);
    }
    const { progress, task, module, contextHint, taskIndex, taskCount } = manager.getSnapshot();
    const hidden = progress.dismissed;
    const done = progress.completed || progress.skipped;
    const completedCount = progress.completedTaskIds.length + progress.skippedTaskIds.length;
    const width = Math.min(100, Math.round((completedCount / taskCount) * 100));
    const body = task ? `<span class="tutorial-task-label">ЗАДАНИЕ ${taskIndex + 1} ИЗ ${taskCount}</span><h3>${escapeHtml(task.title)}</h3><p class="tutorial-message">${escapeHtml(getEosTutorialMessage(task.id))}</p><p class="tutorial-instruction">${escapeHtml(task.instruction)}</p><div class="tutorial-actions">${task.condition === 'acknowledge' ? `<button class="button button-primary" data-tutorial-action="ack">${task.id === 'welcome' ? 'Начать инструктаж' : 'Понятно, дальше'}</button>` : ''}<button class="tutorial-text-button" data-tutorial-action="skip-task">Пропустить задание</button><button class="tutorial-text-button tutorial-skip" data-tutorial-action="skip-all">Пропустить обучение</button></div>` : done ? `<span class="tutorial-task-label">${progress.completed ? 'ПРОГРАММА ЗАВЕРШЕНА' : 'ПРОГРАММА ПРОПУЩЕНА'}</span><h3>${progress.completed ? 'Обучение завершено' : 'Обучение закрыто'}</h3><p class="tutorial-message">${progress.completed ? 'Основные операции освоены. Экспедиция готова к самостоятельной работе.' : 'Обучающие задания пропущены. Все игровые функции остаются доступны.'}</p><div class="tutorial-actions"><button class="button button-secondary" data-tutorial-action="restart">Пройти заново</button></div>` : '<p class="tutorial-message">Поток обучения не запущен.</p>';
    const history = taskHistory(progress);
    host.innerHTML = `<section class="tutorial-card ${hidden ? 'tutorial-hidden' : ''} ${done ? 'tutorial-finished' : ''}" aria-label="Обучение E.O.S." aria-live="polite" aria-atomic="true"><header class="tutorial-header"><div><span class="tutorial-kicker">E.O.S. · ИНСТРУКТАЖ</span>${module && !done ? `<b>${escapeHtml(module.title)}</b>` : ''}</div><button class="tutorial-close" data-tutorial-action="close" aria-label="Свернуть обучение">×</button></header>${!done ? `<div class="tutorial-progress" role="progressbar" aria-label="Прогресс обучения" aria-valuemin="0" aria-valuemax="${taskCount}" aria-valuenow="${completedCount}"><span style="width:${width}%"></span></div>` : ''}${body}${contextHint && !hidden ? `<aside class="tutorial-context" role="status"><span>E.O.S. · КОНТЕКСТНАЯ ПОДСКАЗКА</span><p>${escapeHtml(contextHint.message)}</p><button class="tutorial-text-button" data-tutorial-action="dismiss-hint">Закрыть подсказку</button></aside>` : ''}<footer class="tutorial-footer"><button class="tutorial-text-button" data-tutorial-action="hints">Контекстные подсказки: ${progress.hintsEnabled ? 'вкл.' : 'выкл.'}</button>${history ? `<details class="tutorial-history"><summary>Просмотреть инструкции</summary>${history}</details>` : ''}</footer></section>`;
    const help = root.querySelector('[data-tutorial-help]');
    if (help) help.setAttribute('aria-expanded', String(!hidden));
    focus();
  }

  let destroyed = false;
  const onClick = (event) => {
    const button = event.target.closest('[data-tutorial-action]');
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    switch (button.dataset.tutorialAction) {
      case 'ack': manager.acknowledge(); break;
      case 'skip-task': manager.skipTask(); break;
      case 'skip-all': manager.skipAll(); break;
      case 'close': manager.close(); break;
      case 'restart': manager.restart(); break;
      case 'hints': manager.toggleHints(); break;
      case 'dismiss-hint': manager.dismissHint(); break;
      default: break;
    }
  };
  root.addEventListener('click', onClick);
  const unsubs = [game.on('change', render), game.on('tab:opened', render), game.on('planet:selected', render)];
  render();
  return { render, destroy() { destroyed = true; root.removeEventListener('click', onClick); unsubs.forEach((unsubscribe) => unsubscribe()); root.querySelector('[data-tutorial-host]')?.remove(); root.querySelectorAll('.tutorial-focus').forEach((element) => element.classList.remove('tutorial-focus')); } };
}


