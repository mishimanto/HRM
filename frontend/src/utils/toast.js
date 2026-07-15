const TOAST_EVENT = 'hrm:toast';

function emit(type, message) {
  if (!message) return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
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
