import React from 'react';

const cardThemes = {
  teal: {
    shell: 'border-teal-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdfa_54%,#ccfbf1_100%)] shadow-[0_20px_40px_rgba(15,118,110,0.16),0_8px_0_rgba(15,118,110,0.08)]',
    accent: 'from-teal-500 via-cyan-400 to-amber-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(15,118,110,0.35)]',
    value: 'text-teal-700',
    floor: 'bg-teal-700/10',
  },
  amber: {
    shell: 'border-amber-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#fffbeb_54%,#fde68a_100%)] shadow-[0_20px_40px_rgba(180,83,9,0.15),0_8px_0_rgba(180,83,9,0.08)]',
    accent: 'from-amber-400 via-orange-400 to-teal-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(180,83,9,0.28)]',
    value: 'text-amber-700',
    floor: 'bg-amber-700/10',
  },
  rose: {
    shell: 'border-rose-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#fff1f2_54%,#fecdd3_100%)] shadow-[0_20px_40px_rgba(190,18,60,0.14),0_8px_0_rgba(190,18,60,0.08)]',
    accent: 'from-rose-500 via-pink-400 to-cyan-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(190,18,60,0.28)]',
    value: 'text-rose-700',
    floor: 'bg-rose-700/10',
  },
  indigo: {
    shell: 'border-indigo-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_54%,#c7d2fe_100%)] shadow-[0_20px_40px_rgba(67,56,202,0.14),0_8px_0_rgba(67,56,202,0.08)]',
    accent: 'from-indigo-500 via-sky-400 to-amber-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(67,56,202,0.3)]',
    value: 'text-indigo-700',
    floor: 'bg-indigo-700/10',
  },
};

export default function StatCard({ title, label, value, icon, theme = 'teal', subtitle, onClick }) {
  const styles = cardThemes[theme] || cardThemes.teal;
  const Icon = icon;
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick ? { type: 'button', onClick } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative w-full overflow-hidden rounded-[8px] border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${styles.shell}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${styles.accent}`} />
      <div className={`absolute bottom-0 right-0 h-20 w-28 -skew-x-12 ${styles.floor}`} />
      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <dt className="truncate text-sm font-bold uppercase text-slate-500">{title || label}</dt>
            <dd className={`mt-4 text-3xl font-black leading-none ${styles.value}`}>{value}</dd>
          </div>
          {Icon && (
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] transition-transform group-hover:-translate-y-1 group-hover:rotate-3 ${styles.icon}`}>
              {React.createElement(Icon, { className: 'h-7 w-7' })}
            </div>
          )}
        </div>
        {subtitle && <dd className="inline-flex w-fit border border-white/80 bg-white/70 px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">{subtitle}</dd>}
      </div>
    </Wrapper>
  );
}
