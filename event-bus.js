
// Minimal EventBus (no jQuery)
const EventBus = {
  _events: {},
  on(event, handler) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(handler);
  },
  off(event, handler) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(h => h !== handler);
  },
  trigger(event, data) {
    if (!this._events[event]) return;
    this._events[event].forEach(handler => handler(data));
  }
};

export default EventBus;


