import { TUTORIAL_MODULES } from './tutorialModules.js';
import { TUTORIAL_TASKS } from './tutorialTasks.js';

export { TUTORIAL_MODULES, TUTORIAL_TASKS };
export const TUTORIAL_TASK_BY_ID = new Map(TUTORIAL_TASKS.map((task) => [task.id, task]));
export const TUTORIAL_MODULE_BY_ID = new Map(TUTORIAL_MODULES.map((module) => [module.id, module]));
