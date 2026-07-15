const TOAST_EVENT = 'hrm:toast';
const recentToasts = new Map();
const DUPLICATE_WINDOW = 750;

function emit(type, message) {
  if (!message) return;
  const key = `${type}:${message}`;
  const now = Date.now();

  if (now - (recentToasts.get(key) || 0) < DUPLICATE_WINDOW) return;
  recentToasts.set(key, now);

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: {
      id: `${now}-${Math.random().toString(16).slice(2)}`,
      type,
      message,
    },
  }));
}

export const toast = {
  success: message => emit('success', message),
  error: message => emit('error', message),
  warning: message => emit('warning', message),
  info: message => emit('info', message),
};

export { TOAST_EVENT };
