const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i;

export function detectDeviceContext(environment = {}) {
  const navigatorLike = environment.navigator ?? globalThis.navigator ?? {};
  const viewportWidth = environment.viewportWidth ?? globalThis.innerWidth ?? 1024;
  const matchMedia = environment.matchMedia ?? globalThis.matchMedia?.bind(globalThis);
  const matches = (query) => Boolean(matchMedia?.(query)?.matches);
  const hasTouch = matches('(pointer: coarse)') || Number(navigatorLike.maxTouchPoints) > 0;
  const mobileAgent = navigatorLike.userAgentData?.mobile === true || MOBILE_USER_AGENT.test(navigatorLike.userAgent ?? '');
  const mobileViewport = matches('(max-width: 760px)') || viewportWidth <= 760;
  const isMobile = mobileAgent || (hasTouch && mobileViewport);

  return {
    deviceLabel: isMobile ? 'ТЕЛЕФОН / ПЛАНШЕТ' : hasTouch ? 'СЕНСОРНЫЙ ПК' : 'ПК',
    inputMode: hasTouch ? 'touch' : 'pointer',
  };
}

export function formatTutorialInstruction(instruction, inputMode = 'pointer') {
  const phrases = inputMode === 'touch'
    ? {
        selectPlanet: 'Коснитесь любой планеты на карте',
        confirm: 'Коснитесь кнопки',
        scanPlanet: 'Коснитесь кнопки сканирования планеты',
        scanStar: 'Коснитесь кнопки анализа звезды',
        wait: 'Коснитесь кнопки «Ожидание 30 дней»',
        research: 'Коснитесь кнопки запуска проекта',
        search: 'Коснитесь кнопки «Поиск сигнала»',
        travel: 'Коснитесь кнопки перелёта',
      }
    : {
        selectPlanet: 'Щёлкните по любой планете на карте',
        confirm: 'Нажмите кнопку',
        scanPlanet: 'Нажмите кнопку сканирования планеты',
        scanStar: 'Нажмите кнопку анализа звезды',
        wait: 'Нажмите кнопку «Ожидание 30 дней»',
        research: 'Нажмите кнопку запуска проекта',
        search: 'Нажмите кнопку «Поиск сигнала»',
        travel: 'Нажмите кнопку перелёта',
      };

  return instruction.replace(/\{\{(selectPlanet|confirm|scanPlanet|scanStar|wait|research|search|travel)\}\}/g, (token, key) => phrases[key] ?? token);
}
