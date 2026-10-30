import { useEffect, useState } from 'react';
import { NAMES } from '../lib/helpers.js';

export function CountUp({ n, suffix = '' }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const f = (t) => {
      t0 = t0 ?? t;
      const p = Math.min(1, (t - t0) / 900);
      setV(Math.round(n * p));
      if (p < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return <>{v}{suffix}</>;
}

export function Donut({ h, m, l }) {
  const t = h + m + l || 1, C = 251.3, col = ['var(--bad)', 'var(--wn)', 'var(--ok)'];
  let off = 0;
  return (
    <svg viewBox="0 0 120 120" width="150" role="img" aria-label="Priority split">
      <circle cx="60" cy="60" r="40" fill="none" stroke="var(--tint)" strokeWidth="16" />
      {[h, m, l].map((n, i) => {
        const len = (n / t) * C;
        const el = (
          <circle key={i} className="gp" cx="60" cy="60" r="40" fill="none" stroke={col[i]} strokeWidth="16"
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />
        );
        off += len;
        return el;
      })}
      <text x="60" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor">{h + m + l || 0}</text>
    </svg>
  );
}

export function Gauge({ t, l }) {
  return (
    <div className="mt" role="img" aria-label={`Risk ${t} of 100, ${l} review priority`}>
      <div className="mn"><b>{t}</b> of 100 risk score</div>
      <div className="zn"><i /><i /><i /><span style={{ left: Math.min(t, 100) + '%' }} /></div>
      <div className="zl"><span style={{ left: 0 }}>Low</span><span style={{ left: '25%' }}>Medium</span><span style={{ left: '60%' }}>High</span></div>
    </div>
  );
}

export const Chevron = () => (
  <svg className="cv" viewBox="0 0 16 16"><path d="M10 3 5 8l5 5" /></svg>
);

// numbered five-stage progress strip
export function Stepper({ act, done, caps = [], onPick }) {
  return (
    <ol className={'stp ' + (onPick ? 'run' : '')}>
      {NAMES.map((n, i) => (
        <li key={n} className={i < done ? 'done' : i === act ? 'act' : ''} onClick={onPick ? () => onPick(i) : undefined}>
          <span className="c">{i < done ? '✓' : i + 1}</span>
          <b>{n}</b>
          <small>{caps[i] || ''}</small>
        </li>
      ))}
    </ol>
  );
}
