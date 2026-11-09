import { advanceDays } from './gameTime.js';

function restoreState(target, snapshot) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, snapshot);
}

/** Runs game actions and time-dependent processors in one atomic state transaction. */
export function createSimulationEngine(game, { save = () => true, timeProcessors = [] } = {}) {
  const processors = new Set(timeProcessors);

  function run(action, operation) {
    if (typeof action !== 'string' || !action || typeof operation !== 'function') {
      throw new TypeError('A simulation action needs a name and an operation.');
    }

    const snapshot = structuredClone(game.state);
    const pendingEvents = [];
    const context = {
      emit(type, payload) { pendingEvents.push([type, payload]); },
      advanceTime(days, source = action, options = {}) {
        const previousTime = { ...game.state.time };
        advanceDays(game.state.time, days);
        const event = { days, source, previousTime, time: { ...game.state.time }, ...options };
        for (const processor of processors) {
          processor({ state: game.state, ...event, emit: context.emit });
        }
        context.emit('time:advanced', event);
        return event;
      },
    };

    let result;
    try {
      result = operation(game.state, context);
      if (!result?.ok) {
        restoreState(game.state, snapshot);
        return result ?? { ok: false, message: 'Операция не выполнена.' };
      }
    } catch (error) {
      restoreState(game.state, snapshot);
      throw error;
    }

    for (const [type, payload] of pendingEvents) game.emit(type, payload);
    game.emit('simulation:action-completed', { action, result, time: { ...game.state.time } });
    game.changed();
    const saved = save(game.state);
    game.emit('save:completed', { ok: saved });
    return result;
  }

  function advanceBy(days, source = 'command') {
    return run(source, (_state, context) => {
      context.advanceTime(days, source);
      return { ok: true, message: `Прошло ${days} игровых дней.` };
    });
  }

  return {
    run,
    advanceBy,
    registerTimeProcessor(processor) {
      if (typeof processor !== 'function') throw new TypeError('A time processor must be a function.');
      processors.add(processor);
      return () => processors.delete(processor);
    },
  };
}
