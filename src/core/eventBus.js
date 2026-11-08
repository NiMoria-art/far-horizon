export function createEventBus() {
  const listeners = new Map();
  return {
    on(type, handler) {
      const group = listeners.get(type) ?? new Set(); group.add(handler); listeners.set(type, group);
      return () => group.delete(handler);
    },
    emit(type, payload) { listeners.get(type)?.forEach((handler) => handler(payload)); },
  };
}
