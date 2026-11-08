import './styles/main.css';
import { createGame, createNewState } from './core/gameState.js';
import { loadGame, saveGame, clearSave } from './storage/saveManager.js';
import { createMapRenderer } from './ui/mapRenderer.js';
import { createInterface } from './ui/interface.js';
import { scanPlanet } from './simulation/exploration.js';
import { travelTo } from './simulation/travel.js';
import { startResearch } from './simulation/research.js';
const root=document.querySelector('#app');
let game=createGame(loadGame()??createNewState());
let activeRenderer=null;
const rendererProxy={render(state){activeRenderer?.render(state);}};
function notify(result){if(result.ok){game.changed();saveGame(game.state);}game.emit('toast',result);}
const actions={
 scan(id){notify(scanPlanet(game.state,id));}, travel(id){notify(travelTo(game.state,id));}, research(id){notify(startResearch(game.state,id));},
 save(){const ok=saveGame(game.state);game.emit('toast',{message:ok?'Экспедиция сохранена на этом устройстве.':'Не удалось сохранить данные браузера.',ok});},
 reset(){activeRenderer?.destroy();clearSave();game=createGame(createNewState());mount();},
};
function mount(){
 createInterface(root,game,rendererProxy,actions);
 activeRenderer=createMapRenderer(root.querySelector('canvas'),(id)=>{game.state.selectedPlanetId=id;game.changed();});
 activeRenderer.render(game.state);
}
mount();
