import { technologyBonuses } from './technologyTree.js';

export const FOOD_PRODUCTION_PER_DAY = 0.9;
export const FOOD_CREW_USE_PER_DAY = 0.85;
export const BASE_MINE_RATE = 0.35;
export const MINE_SETUP_COST = { energy: 8, metals: 18 };

export function advanceEconomy({ state, days, emit }) {
  const bonuses=technologyBonuses(state);
  const ship=state.ship??={};
  const foodAccrued=(ship.foodRemainder??0)+(FOOD_PRODUCTION_PER_DAY*bonuses.foodProduction-FOOD_CREW_USE_PER_DAY*bonuses.foodUse)*days;
  const wholeFood=foodAccrued>=0?Math.floor(foodAccrued+1e-9):Math.ceil(foodAccrued-1e-9);
  ship.foodRemainder=foodAccrued-wholeFood;
  const beforeFood=state.resources.food;
  state.resources.food=Math.max(0,Math.min(ship.maxFood??500,beforeFood+wholeFood));

  let mined=0;
  for(const system of state.systems??[state.system]) for(const planet of system.planets??[]) {
    const site=planet.miningSite;
    if(!site?.active || site.remaining<=0) continue;
    site.fraction=(site.fraction??0)+BASE_MINE_RATE*bonuses.mineRate*days;
    const whole=Math.min(site.remaining,Math.floor(site.fraction+1e-9));
    if(whole>0){site.remaining-=whole;site.fraction-=whole;mined+=whole;}
    if(site.remaining<=0){site.remaining=0;site.active=false;emit('mine:depleted',{systemId:system.id,planetId:planet.id});}
  }
  const beforeMetals=state.resources.metals;
  state.resources.metals=Math.min(ship.maxMetals??500,beforeMetals+mined);
  const stored=state.resources.metals-beforeMetals;
  if(stored)emit('mine:produced',{amount:stored,days});
  return { food:state.resources.food-beforeFood, metals:stored };
}

export function startMining(state, planetId, { emit }) {
  const planet=state.system.planets.find((item)=>item.id===planetId);
  if(!planet || !planet.revealed.includes('resources')) return {ok:false,message:'Сначала просканируйте ресурсы планеты.'};
  if(state.shipAt!==planetId) return {ok:false,message:'Для установки шахты корабль должен находиться у планеты.'};
  if(planet.miningSite?.active) return {ok:false,message:'Шахта на этой планете уже работает.'};
  if(!planet.miningSite && !(planet.resources??[]).some((resource)=>/железо|металл|никель|редкоземель|кремний|силикат/i.test(resource))) return {ok:false,message:'Подходящих металлических залежей не обнаружено.'};
  const reserve=planet.miningSite?.remaining ?? planet.metalReserve ?? 180;
  if(reserve<=0) return {ok:false,message:'Месторождение исчерпано.'};
  const setup=technologyBonuses(state).mineSetup;
  const energyCost=Math.max(1,Math.ceil(MINE_SETUP_COST.energy*setup));
  const metalCost=Math.max(1,Math.ceil(MINE_SETUP_COST.metals*setup));
  if(state.resources.energy<energyCost || state.resources.metals<metalCost) return {ok:false,message:'Недостаточно энергии или металлов для установки шахты.'};
  state.resources.energy-=energyCost; state.resources.metals-=metalCost;
  planet.miningSite={active:true,remaining:reserve,fraction:0};
  state.journal.unshift({id:crypto.randomUUID(),day:state.time.day,year:state.time.year,kind:'mine',text:`На планете ${planet.name} установлена автоматическая шахта. Запас месторождения: ${reserve} МТ.`});
  state.journal=state.journal.slice(0,60);
  emit('mine:started',{systemId:state.system.id,planetId,remaining:reserve});
  return {ok:true,message:`Шахта на ${planet.name} запущена · добыча начнётся с течением игрового времени.`};
}
