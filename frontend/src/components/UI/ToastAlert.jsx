import { useEffect } from 'react';
import { toast } from '../../utils/toast';

export default function ToastAlert({ type = 'error', message }) {
  useEffect(() => {
    if (!message) return;
    const notify = toast[type] || toast.info;
    notify(message);
  }, [type, message]);

  return null;
}
