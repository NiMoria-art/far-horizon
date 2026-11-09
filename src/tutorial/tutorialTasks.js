export const TUTORIAL_TASKS = [
  { id: 'welcome', moduleId: 'orientation', title: 'Бортовой компьютер', instruction: 'Для начала отметьте, что сообщение получено.', condition: 'acknowledge', focus: '[data-tutorial-help]' },
  { id: 'select-planet', moduleId: 'orientation', title: 'Выбор цели', instruction: 'Коснитесь любой планеты на карте, чтобы выбрать её.', condition: 'planet-selected', focus: '.map-frame' },
  { id: 'open-overview', moduleId: 'ship-status', title: 'Панель состояния', instruction: 'Откройте раздел «Обзор».', condition: 'overview-opened', focusTab: 'overview' },
  { id: 'scan-planet', moduleId: 'planetary-research', title: 'Сканирование планеты', instruction: 'В разделе «Система» выберите доступную планету и выполните сканирование. Если кнопка недоступна из-за энергии, используйте ожидание в обзоре.', condition: 'planet-scanned', focusTab: 'system', focus: '[data-action="scan"]' },
  { id: 'scan-star', moduleId: 'planetary-research', title: 'Анализ звезды', instruction: 'Выполните доступный анализ звезды в панели системы. Если кнопка недоступна из-за энергии, используйте ожидание в обзоре.', condition: 'star-scanned', focusTab: 'system', focus: '[data-action="scan-star"]' },
  { id: 'open-journal', moduleId: 'planetary-research', title: 'Журнал экспедиции', instruction: 'Откройте раздел «Журнал» и просмотрите запись о сканировании.', condition: 'journal-opened', focusTab: 'log' },
  { id: 'travel-to-planet', moduleId: 'navigation', title: 'Перелёт внутри системы', instruction: 'Перейдите к выбранной планете. Если она уже изучена, можно выбрать другую; при недостатке энергии сначала продвиньте время ожиданием.', condition: 'planet-reached', focusTab: 'system', focus: '[data-action="travel"]' },
  { id: 'open-overview-energy', moduleId: 'energy', title: 'Оценка восстановления', instruction: 'Откройте обзор, чтобы посмотреть оценку восстановления энергии.', condition: 'overview-energy-opened', focusTab: 'overview' },
  { id: 'wait-for-energy', moduleId: 'energy', title: 'Продвижение времени', instruction: 'В обзоре выберите «Ожидание 30 дней». При полном запасе энергия не увеличится выше предела.', condition: 'waited-30-days', focusTab: 'overview', focus: '[data-action="wait"]' },
  { id: 'open-research', moduleId: 'independent-work', title: 'Технологические проекты', instruction: 'Откройте раздел «Исследования».', condition: 'research-opened', focusTab: 'research' },
  { id: 'study-technology', moduleId: 'independent-work', title: 'Первый технологический проект', instruction: 'Завершите любой доступный технологический проект. Если данных не хватает, продолжите сканирование неизвестных объектов. Можно также пропустить это задание.', condition: 'technology-studied', focusTab: 'research' },
  { id: 'discover-system', moduleId: 'independent-work', title: 'Поиск сигнала', instruction: 'В обзоре запустите поиск сигнала, если доступен запас энергии.', condition: 'system-discovered', focusTab: 'overview', focus: '[data-action="discover-system"]' },
  { id: 'enter-system', moduleId: 'independent-work', title: 'Межсистемный переход', instruction: 'В обзоре выберите обнаруженную систему и перейдите к ней. Если энергии недостаточно, пополните запас ожиданием.', condition: 'system-entered', focusTab: 'overview', focus: '[data-travel-system]' },
];


