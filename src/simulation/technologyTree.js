const branches = [
  ['energy', 'Энергетика', [
    ['solar','Эффективные солнечные панели','Снижают расход энергии на сканирование на 25%.',{scanCost:0.75},30],
    ['reactor','Стабилизаторы реактора','Увеличивают восстановление энергии на 8%.',{energyRate:1.08}],
    ['storage','Усиленные аккумуляторы','Увеличивают запас энергии на 20.',{energyCapacity:20}],
    ['thermal','Терморегуляция','Увеличивает восстановление энергии на 10%.',{energyRate:1.1}],
    ['grid','Распределительная сеть','Снижает энергозатраты экспедиционных действий на 10%.',{actionCost:0.9}],
    ['fusion','Компактный термояд','Увеличивает восстановление энергии на 12%.',{energyRate:1.12}],
    ['photonic','Фотонные коллекторы','Дополнительное восстановление энергии 15%.',{energyRate:1.15}],
    ['powercore','Высокоплотный энергоблок','Увеличивает запас энергии ещё на 30.',{energyCapacity:30}],
  ]],
  ['industry', 'Добыча и промышленность', [
    ['ore','Геологические анализаторы','Открывает первичные данные о запасах месторождений.',{mineRate:1.1}],
    ['drills','Автономные буровые','Повышают добычу металлов на 20%.',{mineRate:1.2}],
    ['smelting','Эффективная плавка','Повышает добычу металлов на 20%.',{mineRate:1.2}],
    ['robots','Промышленные манипуляторы','Повышают добычу металлов на 25%.',{mineRate:1.25}],
    ['refinery','Мобильный переработчик','Повышает добычу металлов на 25%.',{mineRate:1.25}],
    ['deepcore','Глубинное бурение','Открывает глубокие залежи: +30% к добыче.',{mineRate:1.3}],
    ['recycling','Переработка отходов','Снижает стоимость установки шахт на 25%.',{mineSetup:0.75}],
    ['fabrication','Автоматизированные цеха','Повышает добычу металлов на 30%.',{mineRate:1.3}],
  ]],
  ['biosphere', 'Биосфера и жизнеобеспечение', [
    ['hydroponics','Гидропонные фермы','Повышают производство пищи на 20%.',{foodProduction:1.2}],
    ['nutrients','Замкнутый цикл питательных веществ','Повышает производство пищи на 20%.',{foodProduction:1.2}],
    ['algae','Белковые культуры','Повышают производство пищи на 25%.',{foodProduction:1.25}],
    ['habitats','Оптимизация жилых модулей','Снижает расход пищи экипажем на 10%.',{foodUse:0.9}],
    ['seeds','Банк адаптивных семян','Повышает производство пищи на 25%.',{foodProduction:1.25}],
    ['waterloop','Регенерация воды','Снижает расход пищи экипажем на 10%.',{foodUse:0.9}],
    ['mycoprotein','Микопротеиновые фермы','Повышает производство пищи на 30%.',{foodProduction:1.3}],
    ['ecosystem','Устойчивая биосфера','Снижает расход пищи экипажем на 15%.',{foodUse:0.85}],
  ]],
  ['science', 'Наука и исследование', [
    ['analyzer','Автономные анализаторы','Приносят на 8 научных данных больше за сканирование.',{scanScience:8},40],
    ['spectrometry','Точная спектрометрия','Увеличивает научные данные сканирования на 20%.',{scanYield:1.2}],
    ['survey','Системное картирование','Снижает научные затраты на проекты на 8%.',{researchCost:0.92}],
    ['databanks','Квантовые архивы','Увеличивает запас данных при сканировании на 20%.',{scanYield:1.2}],
    ['remote','Дистанционная аналитика','Увеличивает научные данные сканирования на 25%.',{scanYield:1.25}],
    ['lab','Модульные лаборатории','Снижает научную стоимость проектов на 10%.',{researchCost:0.9}],
    ['prediction','Модели предсказания','Увеличивает научные данные сканирования на 30%.',{scanYield:1.3}],
    ['synthesis','Синтез знаний','Снижает научные затраты на проекты на 12%.',{researchCost:0.88}],
  ]],
  ['navigation', 'Корабль и навигация', [
    ['navigation','Улучшенная навигация','Снижает стоимость перелётов на 25%.',{travelCost:0.75},35],
    ['thrusters','Экономичные двигатели','Снижают стоимость перелётов на 10%.',{travelCost:0.9}],
    ['mapping','Инерциальные карты','Снижают стоимость перелётов на 10%.',{travelCost:0.9}],
    ['autopilot','Автономный пилот','Снижает стоимость перелётов на 10%.',{travelCost:0.9}],
    ['hull','Облегчённый корпус','Снижает стоимость перелётов на 10%.',{travelCost:0.9}],
    ['beacons','Навигационные буи','Снижает стоимость межсистемного перелёта на 15%.',{interTravel:0.85}],
    ['folded','Дальняя навигация','Снижает стоимость межсистемного перелёта ещё на 15%.',{interTravel:0.85}],
    ['route','Оптимизация маршрутов','Снижает стоимость всех перелётов на 12%.',{travelCost:0.88}],
  ]],
];
export const technologyTree = branches.flatMap(([branch, category, nodes]) => nodes.map(([id,name,description,effects,cost], index) => ({ id,name,description,effects,cost:cost??(45+index*12),metalCost: index===0?0:20+index*5,category,branch,tier:index+1,prerequisites:index?[nodes[index-1][0]]:[],status:'locked' })));
technologyTree.forEach((tech) => { if (!tech.prerequisites.length) tech.status='available'; });
export const initialTechnologies = technologyTree;
export function technologyBonuses(state) {
  const bonuses={scanCost:1,scanScience:0,scanYield:1,travelCost:1,interTravel:1,energyRate:1,energyCapacity:0,actionCost:1,mineRate:1,mineSetup:1,foodProduction:1,foodUse:1,researchCost:1};
  for(const tech of state.technologies??[]) if(tech.status==='studied') for(const [key,value] of Object.entries(tech.effects??{})) bonuses[key]=['scanScience','energyCapacity'].includes(key)?bonuses[key]+value:(bonuses[key]??1)*value;
  return bonuses;
}

export function refreshTechnologyAvailability(state) {
  const known=new Map(state.technologies.map((tech)=>[tech.id,tech]));
  for(const tech of state.technologies) if(tech.status==='locked' && tech.prerequisites?.every((id)=>known.get(id)?.status==='studied')) tech.status='available';
}
