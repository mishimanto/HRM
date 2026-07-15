import React, { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { TOAST_EVENT } from '../../utils/toast';

const styles = {
  success: {
    shell: 'border-teal-200 bg-white text-slate-900 shadow-[0_18px_44px_rgba(15,118,110,0.18)]',
    icon: 'bg-teal-50 text-teal-700',
    bar: 'from-teal-500 via-cyan-400 to-amber-300',
    Icon: CheckCircleIcon,
  },
  error: {
    shell: 'border-rose-200 bg-white text-slate-900 shadow-[0_18px_44px_rgba(190,18,60,0.18)]',
    icon: 'bg-rose-50 text-rose-700',
    bar: 'from-rose-500 via-pink-400 to-amber-300',
    Icon: ExclamationTriangleIcon,
  },
  warning: {
    shell: 'border-amber-200 bg-white text-slate-900 shadow-[0_18px_44px_rgba(180,83,9,0.18)]',
    icon: 'bg-amber-50 text-amber-700',
    bar: 'from-amber-400 via-orange-400 to-teal-300',
    Icon: ExclamationTriangleIcon,
  },
  info: {
    shell: 'border-indigo-200 bg-white text-slate-900 shadow-[0_18px_44px_rgba(67,56,202,0.16)]',
    icon: 'bg-indigo-50 text-indigo-700',
    bar: 'from-indigo-500 via-sky-400 to-teal-300',
    Icon: InformationCircleIcon,
  },
};

export default function ToastViewport() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = event => {
      const item = event.detail;
      setItems(current => [item, ...current].slice(0, 4));
      setTimeout(() => {
        setItems(current => current.filter(toast => toast.id !== item.id));
      }, 4200);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[10000] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {items.map(item => {
        const style = styles[item.type] || styles.info;
        const Icon = style.Icon;
        return (
          <div key={item.id} className={`relative overflow-hidden rounded-[8px] border p-4 pr-11 backdrop-blur ${style.shell}`}>
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.bar}`} />
            <div className="flex items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${style.icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="pt-1 text-sm font-bold leading-5">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setItems(current => current.filter(toast => toast.id !== item.id))}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
