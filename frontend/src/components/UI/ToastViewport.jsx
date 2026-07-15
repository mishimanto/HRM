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
    shell: 'border-emerald-400 border-b-emerald-950 bg-emerald-600 text-white shadow-[0_7px_0_rgba(6,78,59,0.80),0_24px_48px_rgba(5,150,105,0.32),inset_0_1px_0_rgba(255,255,255,0.32)]',
    icon: 'border border-emerald-300/70 bg-emerald-800/55 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_7px_16px_rgba(6,78,59,0.38)]',
    Icon: CheckCircleIcon,
  },
  error: {
    shell: 'border-rose-400 border-b-rose-950 bg-rose-600 text-white shadow-[0_7px_0_rgba(136,19,55,0.80),0_24px_48px_rgba(225,29,72,0.32),inset_0_1px_0_rgba(255,255,255,0.32)]',
    icon: 'border border-rose-300/70 bg-rose-800/55 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_7px_16px_rgba(136,19,55,0.38)]',
    Icon: ExclamationTriangleIcon,
  },
  warning: {
    shell: 'border-amber-300 border-b-amber-900 bg-amber-400 text-slate-950 shadow-[0_7px_0_rgba(146,64,14,0.76),0_24px_48px_rgba(245,158,11,0.30),inset_0_1px_0_rgba(255,255,255,0.38)]',
    icon: 'border border-amber-200/80 bg-amber-600/35 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.30),0_7px_16px_rgba(146,64,14,0.30)]',
    Icon: ExclamationTriangleIcon,
  },
  info: {
    shell: 'border-sky-400 border-b-sky-950 bg-sky-600 text-white shadow-[0_7px_0_rgba(7,89,133,0.80),0_24px_48px_rgba(2,132,199,0.30),inset_0_1px_0_rgba(255,255,255,0.32)]',
    icon: 'border border-sky-300/70 bg-sky-800/55 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_7px_16px_rgba(7,89,133,0.36)]',
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
          <div key={item.id} className={`toast-3d-enter relative overflow-hidden border border-b-2 p-4 pr-12 ${style.shell}`}>
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/55" />
            <div className="relative flex items-start gap-3.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${style.icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="pt-1.5 text-[16px] font-bold leading-6">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setItems(current => current.filter(toast => toast.id !== item.id))}
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center border border-white/0 text-current opacity-70 transition hover:border-white/25 hover:bg-white/15 hover:opacity-100"
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
