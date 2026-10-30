import { useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppsContext.jsx';
import { CountUp, Donut } from '../components/Widgets.jsx';
import { NAMES, SUB, openItems, riskVar } from '../lib/helpers.js';

export default function Home() {
  const { apps } = useApps();
  const nav = useNavigate();

  const R = apps.map((a) => ({ a, r: a.analysis, items: openItems(a) })).sort((x, y) => y.r.total - x.r.total);
  const lv = (l) => R.filter((x) => x.r.level === l).length;
  const tot = R.reduce((n, x) => n + x.r.checks.length, 0);
  const ok = R.reduce((n, x) => n + x.r.checks.filter((c) => c.status === 'pass').length, 0);
  const flags = R.reduce((n, x) => n + x.items.length, 0);
  const dec = apps.filter((x) => x.decision).length;
  const docs = apps.reduce((n, x) => n + x.docs.length, 0);
  const src = R.reduce((n, x) => n + x.r.checks.filter((c) => c.rule[0] === 'A' && c.status !== 'na').length, 0);
  const cnt = {};
  R.forEach((x) => x.items.forEach((c) => (cnt[c.rule] = (cnt[c.rule] || 0) + 1)));
  const iss = Object.entries(cnt).sort((p, q) => q[1] - p[1]);
  const mx = iss.length ? iss[0][1] : 1;
  const cap = [apps.length + ' applications', docs + ' documents', tot + ' checks', src + ' sources', dec + ' decisions'];

  return (
    <div className="wrap">
      <div className="hero">
        <h1>From manual document checking to intelligent compliance verification</h1>
        <p>Helps AICTE officers pre-validate Extension of Approval applications. It flags and explains issues. The officer always decides.</p>
        <div className="trio">
          <span>Detect<small>Alterations and inconsistencies</small></span>
          <span>Explain<small>The reason and the rule</small></span>
          <span>Verify<small>Trusted records, then human review</small></span>
        </div>
        <div className="pipe">
          <i className="pk" />
          {NAMES.map((n, i) => (
            <div className="nd" style={{ '--i': i }} key={n}>
              <span className="c">{i + 1}</span><b>{n}</b><em>{cap[i]}</em><small>{SUB[i]}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><b><CountUp n={apps.length} /></b><span>Applications</span></div>
        <div className="kpi"><b><CountUp n={lv('High')} /></b><span>High priority</span></div>
        <div className="kpi"><b><CountUp n={flags} /></b><span>Open flags</span></div>
        <div className="kpi"><b><CountUp n={tot ? Math.round((ok / tot) * 100) : 0} suffix="%" /></b><span>Checks passed</span></div>
        <div className="kpi"><b>{dec}/{apps.length}</b><span>Recommendations recorded</span></div>
      </div>

      <div className="g2">
        <div className="card">
          <h2>Review priority</h2>
          <div className="dn">
            <Donut h={lv('High')} m={lv('Medium')} l={lv('Low')} />
            <div className="lg">
              <div><i style={{ background: 'var(--bad)' }} />High {lv('High')}</div>
              <div><i style={{ background: 'var(--wn)' }} />Medium {lv('Medium')}</div>
              <div><i style={{ background: 'var(--ok)' }} />Low {lv('Low')}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <h2>Most common issues</h2>
          {iss.length ? (
            iss.map(([n, c]) => (
              <div className="bar" key={n}>
                <div><span>{n}</span><b>{c}</b></div>
                <div className="tr"><i style={{ width: (c / mx) * 100 + '%' }} /></div>
              </div>
            ))
          ) : (
            <p className="note">No issues found.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Applications, highest risk first</h2>
        {R.map((x) => {
          const t = x.items.find((c) => c.sev === 'critical') || x.items[0];
          return (
            <div className="ar" key={x.a.appId} onClick={() => nav('/applications/' + x.a.appId)}>
              <div><b>{x.a.college}</b><small>Application {x.a.appId} · {x.a.docs.length} documents</small></div>
              <span className={'pl ' + x.r.level}>{x.r.level}</span>
              <div>
                <b>{x.r.total}</b> of 100
                <div className="tr"><i style={{ width: x.r.total + '%', background: `var(--${riskVar(x.r.level)})` }} /></div>
              </div>
              <div>
                <small>Main issue</small>
                {t ? t.name : 'None'}
                <small>{x.a.decision || 'No recommendation yet'}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
