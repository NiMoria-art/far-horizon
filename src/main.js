import './styles/main.css';
import { createGame, createNewState } from './core/gameState.js';
import { createSimulationEngine } from './core/simulationEngine.js';
import { loadGame, saveGame, clearSave } from './storage/saveManager.js';
import { createMapRenderer } from './ui/mapRenderer.js';
import { createInterface } from './ui/interface.js';
import { scanPlanet, scanStar } from './simulation/exploration.js';
import { travelTo } from './simulation/travel.js';
import { startResearch } from './simulation/research.js';
import { recoverEnergy } from './simulation/energy.js';
import { discoverSystem, travelToSystem } from './simulation/systemNavigation.js';
const root=document.querySelector('#app');
let game=createGame(loadGame()??createNewState());
let engine;
let activeRenderer=null;
const rendererProxy={render(state){activeRenderer?.render(state);}};
const actions={
 scan(id){execute('scan',(state,context)=>scanPlanet(state,id,context));},
 scanStar(){execute('star-scan',scanStar);},
 travel(id){execute('travel',(state,context)=>travelTo(state,id,context));},
 discoverSystem(){execute('system-discovery',discoverSystem);},
 travelSystem(id){execute('inter-system-travel',(state,context)=>travelToSystem(state,id,context));},
 advanceTime(days){const result=engine.advanceBy(days,'manual-wait');game.emit('toast',result);},
 research(id){execute('research',(state,context)=>startResearch(state,id,context));},
 save(){const ok=saveGame(game.state);game.emit('toast',{message:ok?'Экспедиция сохранена на этом устройстве.':'Не удалось сохранить данные браузера.',ok});},
 reset(){activeRenderer?.destroy();clearSave();game=createGame(createNewState());mount();},
};
function execute(action, operation){
 const result=engine.run(action,operation);
 game.emit('toast',result);
 return result;
}
function mount(){
 engine=createSimulationEngine(game,{save:saveGame});
 engine.registerTimeProcessor(recoverEnergy);
 createInterface(root,game,rendererProxy,actions);
 activeRenderer=createMapRenderer(root.querySelector('canvas'),(id)=>{game.state.selectedPlanetId=id;game.changed();});
 activeRenderer.render(game.state);
}
mount();
