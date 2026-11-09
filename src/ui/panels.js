import { scanEnergyCost } from '../simulation/exploration.js';
import { travelEnergyCost } from '../simulation/travel.js';
import { energyRecoveryRate } from '../simulation/energy.js';
import { INTERSYSTEM_TRAVEL_COST, INTERSYSTEM_TRAVEL_DAYS, SYSTEM_DISCOVERY_COST, SYSTEM_DISCOVERY_DAYS } from '../world/systemGenerator.js';

export const navSections = [
  { id: 'overview', label: 'Обзор', icon: '◉' }, { id: 'system', label: 'Система', icon: '⌖' }, { id: 'research', label: 'Исследования', icon: '⌬' }, { id: 'log', label: 'Журнал', icon: '≡' },
];

function systemCatalogMarkup(state, systems, visibleCount) {
  const discovered = systems.filter((system) => system.discovered);
  const current = discovered.find((system) => system.id === state.currentSystemId);
  const ordered = current ? [current, ...discovered.filter((system) => system.id !== current.id).reverse()] : discovered.slice().reverse();
  const visible = ordered.slice(0, visibleCount);
  const rows = visible.map((system) => `<div class="system-row"><div><strong>${system.name}</strong><small>${system.visited ? 'ПОСЕЩЕНА' : `СИГНАЛ · ${system.planets.length} ПЛАНЕТ`}</small></div>${system.id === state.currentSystemId ? '<b class="system-current">ЗДЕСЬ</b>' : `<button class="button button-small" data-travel-system="${system.id}" ${state.resources.energy < INTERSYSTEM_TRAVEL_COST ? 'disabled' : ''}>Перейти · −${INTERSYSTEM_TRAVEL_COST} ЭН · ${INTERSYSTEM_TRAVEL_DAYS} дн.</button>`}</div>`).join('');
  const more = ordered.length > visible.length ? `<button class="button button-secondary system-list-more" data-action="show-systems">Показать ещё ${Math.min(visibleCount, ordered.length - visible.length)} из ${ordered.length - visible.length}</button>` : '';
  return `<div class="overview-card system-list"><span>КАТАЛОГ ОБНАРУЖЕННЫХ СИСТЕМ · ${discovered.length}</span><div class="system-list-rows">${rows}</div>${more}</div>`;
}

export function panelMarkup(state, activeTab, { visibleSystemCount = 12 } = {}) {
  const planet = state.system.planets.find((item) => item.id === state.selectedPlanetId);
  const value = (field, label) => planet.revealed.includes(field) ? label : 'Неизвестно';
  const scanCost = scanEnergyCost(state);
  const travelCost = travelEnergyCost(state, planet.id);
  const returnToStarCost = travelEnergyCost(state, 'star');
  const star = state.system.star;
  const starRevealed = star.revealed ?? ['type'];
  const starField = (field, label, value, suffix = '') => `<div><span>${label}</span><b>${starRevealed.includes(field) ? `${value}${suffix}` : 'Неизвестно'}</b></div>`;
  const starFieldsComplete = ['luminosity', 'radius', 'temperature'].every((field) => starRevealed.includes(field));
  const recoveryRate = energyRecoveryRate(state);
  const systems = state.systems ?? [state.system];
  const technologies = state.technologies.map((tech) => `<article class="tech-card ${tech.status === 'studied' ? 'is-studied' : ''}"><div class="tech-top"><span class="tech-category">${tech.category}</span><span class="status status-${tech.status}">${{ available: 'ДОСТУПНО', researching: 'ИЗУЧАЕТСЯ', studied: 'ИЗУЧЕНО' }[tech.status]}</span></div><h3>${tech.name}</h3><p>${tech.description}</p><button class="button button-small ${tech.status === 'available' ? '' : 'button-muted'}" data-research="${tech.id}" ${tech.status !== 'available' || state.activeTechnologyId ? 'disabled' : ''}>${tech.status === 'studied' ? 'Исследовано' : `Изучить · ${tech.cost} ◈`}</button></article>`).join('');
  const journal = state.journal.map((entry) => `<article class="log-entry"><span class="log-dot log-${entry.kind}"></span><div><div class="log-meta">${String(entry.day).padStart(3, '0')} · ${entry.year} <span>${{system:'СИСТЕМА', scan:'СКАНИРОВАНИЕ', travel:'НАВИГАЦИЯ', research:'ТЕХНОЛОГИИ'}[entry.kind] ?? 'СОБЫТИЕ'}</span></div><p>${entry.text}</p></div></article>`).join('');
  return `
    <section class="panel-section tab-panel ${activeTab === 'system' ? 'is-active' : ''}" data-panel="system">
      <div class="section-heading"><div><span class="eyebrow">ЦЕЛЬ НАБЛЮДЕНИЯ</span><h2>${planet.name}</h2></div><span class="object-id">PL · 0${state.system.planets.indexOf(planet)+1}</span></div>
      <p class="planet-type">${value('type', planet.type)} <span class="scan-state">${planet.revealed.length >= 5 ? 'ПОЛНЫЙ АНАЛИЗ' : planet.scanned ? 'ЧАСТИЧНЫЕ ДАННЫЕ' : 'НЕ ИЗУЧЕНО'}</span></p>
      <article class="star-summary"><div class="section-heading"><div><span class="eyebrow">ЗВЕЗДА · ${star.name}</span><b class="star-type">${starRevealed.includes('type') ? star.type : 'Класс неизвестен'}</b></div><span class="object-id">${star.class ?? ''}</span></div><div class="stat-list">${starField('luminosity', 'СВЕТИМОСТЬ', star.luminosity, ' L☉')}${starField('radius', 'РАДИУС', star.radius, ' R☉')}${starField('temperature', 'ТЕМПЕРАТУРА', star.temperature, ' K')}</div><button class="button button-secondary button-wide" data-action="scan-star" ${starFieldsComplete || state.resources.energy < scanCost ? 'disabled' : ''}>Сканировать звезду <small>−${scanCost} ЭН</small></button></article>
      <div class="stat-list"><div><span>РАДИУС</span><b>${planet.radius.toLocaleString('ru-RU')} км</b></div><div><span>ОРБИТА</span><b>${planet.orbit} млн км</b></div><div><span>ТЕМПЕРАТУРА</span><b>${value('temperature', `${planet.temperature > 0 ? '+' : ''}${planet.temperature} °C`)}</b></div><div><span>АТМОСФЕРА</span><b>${value('atmosphere', planet.atmosphere)}</b></div><div><span>СОСТАВ</span><b>${value('composition', planet.composition)}</b></div><div><span>НАУЧНЫЙ ПОТЕНЦИАЛ</span><b>${value('research', planet.research)}</b></div><div><span>РЕСУРСЫ</span><b>${value('resources', (planet.resources ?? []).join(' · ') || 'Не обнаружены')}</b></div></div>
      <button class="button button-primary button-wide" data-action="scan" ${planet.revealed.length >= 5 || state.resources.energy < scanCost ? 'disabled' : ''}><span>⌁</span> Сканировать объект <small>−${scanCost} ЭН</small></button>
      <button class="button button-secondary button-wide travel-button" data-action="travel" data-destination="${planet.id}" ${state.shipAt === planet.id || state.resources.energy < travelCost ? 'disabled' : ''}><span>↗</span> Перелёт к планете <small>${state.shipAt===planet.id?'КОРАБЛЬ НА ОРБИТЕ':`−${travelCost} ЭН`}</small></button>
      ${state.shipAt !== 'star' ? `<button class="button button-secondary button-wide travel-button" data-action="travel" data-destination="star" ${state.resources.energy < returnToStarCost ? 'disabled' : ''}><span>↖</span> Возврат к звезде <small>−${returnToStarCost} ЭН</small></button>` : ''}
      <div class="ship-location"><span class="ship-pip"></span> КОРАБЛЬ · ${state.shipAt==='star'?`ОРБИТА ${star.name.toUpperCase()}`:state.system.planets.find(item=>item.id===state.shipAt)?.name.toUpperCase()}</div><div class="recovery-note">ВОССТАНОВЛЕНИЕ · +${recoveryRate.toFixed(2)} ЭН / ДЕНЬ</div>
    </section>
    <section class="panel-section tab-panel ${activeTab === 'research' ? 'is-active' : ''}" data-panel="research"><div class="section-heading"><div><span class="eyebrow">ТЕХНОЛОГИЧЕСКИЙ КОНТУР</span><h2>Развитие</h2></div><span class="research-total">${state.resources.science} ◈</span></div><p class="section-intro">Научные данные экспедиции направляются на отдельные технологические проекты.</p><div class="tech-list">${technologies}</div></section>
    <section class="panel-section tab-panel ${activeTab === 'log' ? 'is-active' : ''}" data-panel="log"><div class="section-heading"><div><span class="eyebrow">ПАМЯТЬ E.O.S.</span><h2>Журнал экспедиции</h2></div><span class="object-id">${String(state.journal.length).padStart(2,'0')}</span></div><div class="log-list">${journal}</div></section>
    <section class="panel-section tab-panel overview-panel ${activeTab === 'overview' ? 'is-active' : ''}" data-panel="overview"><div class="section-heading"><div><span class="eyebrow">СОСТОЯНИЕ ЭКСПЕДИЦИИ</span><h2>Обзор</h2></div><span class="system-live"><i></i> В СЕТИ</span></div><div class="overview-card"><span>ТЕКУЩАЯ СИСТЕМА</span><strong>${state.system.name}</strong><small>${state.system.planets.length} планет · ${state.system.star.type}</small></div><div class="overview-card"><span>ПОЗИЦИЯ КОРАБЛЯ</span><strong>${state.shipAt==='star'?`Орбита ${star.name}`:state.system.planets.find(item=>item.id===state.shipAt)?.name}</strong><small>Исследовательский корабль · активно ${systems.filter((system)=>system.visited).length} системы</small></div>${systemCatalogMarkup(state, systems, visibleSystemCount)}<button class="button button-secondary button-wide system-discovery-button" data-action="discover-system" ${state.resources.energy<SYSTEM_DISCOVERY_COST?'disabled':''}>Поиск сигнала · −${SYSTEM_DISCOVERY_COST} ЭН · ${SYSTEM_DISCOVERY_DAYS} дн.</button><div class="overview-card"><span>ЭНЕРГИЯ У ЗВЕЗДЫ</span><strong>+${recoveryRate.toFixed(2)} ЭН / день</strong><small>Оценка для текущей орбиты. На поверхности планет эффективность зависит от расстояния до звезды.</small></div><button class="button button-secondary button-wide wait-button" data-action="wait" data-days="30">Ожидание 30 дней · ≈ +${Math.floor(recoveryRate*30)} ЭН</button><p class="eos-note"><span>E.O.S.</span> Данные систем открываются по мере наблюдения экспедиции.</p></section>`;
}



