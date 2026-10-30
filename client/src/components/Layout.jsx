import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppsContext.jsx';

const ic = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export default function Layout() {
  const { apps, ready, error } = useApps();
  const nav = useNavigate();
  const { pathname } = useLocation();

  // derive the current view and selected application from the URL
  const m = pathname.match(/^\/applications\/([^/]+)(?:\/(analysis|report))?\/?$/);
  const view = pathname === '/submit' ? 'submit' : m ? m[2] || 'review' : 'home';
  const sel = m ? decodeURIComponent(m[1]) : null;
  const cur = apps.find((x) => x.appId === sel);
  const college = cur ? cur.college : '';

  const sorted = [...apps].sort((p, q) => q.analysis.total - p.analysis.total);
  const crumbs = {
    home: ['Overview'],
    submit: ['Submit documents'],
    analysis: ['Overview', 'Analysis', college],
    review: ['Overview', 'Review', college],
    report: ['Overview', 'Review', 'Report'],
  }[view];
  const on = (id) => (['review', 'analysis', 'report'].includes(view) && sel === id ? 'on' : '');

  return (
    <div className="shell">
      <nav className="side">
        <div className="logo">
          <svg width="34" height="34" viewBox="0 0 34 34">
            <rect width="34" height="34" rx="6" fill="#fff" />
            <path d="M9 7h11l5 5v15H9z" fill="none" stroke="#0f2342" strokeWidth="2" strokeLinejoin="round" />
            <path d="m13 19 3 3 6-7" fill="none" stroke="#0f2342" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div><b>AICTE DocVerify</b><small>अखिल भारतीय तकनीकी शिक्षा परिषद</small></div>
        </div>
        <h4>Workspace</h4>
        <button className={'t ' + (view === 'home' ? 'on' : '')} onClick={() => nav('/')}>
          <svg {...ic}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
          Overview
        </button>
        <button className={'t ' + (view === 'submit' ? 'on' : '')} onClick={() => nav('/submit')}>
          <svg {...ic}><path d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" /></svg>
          Submit documents
        </button>
        <h4>Applications by risk</h4>
        {sorted.map((x) => (
          <button key={x.appId} className={'t ap ' + on(x.appId)} onClick={() => nav('/applications/' + x.appId)}>
            <i className={'d ' + x.analysis.level} />
            <span>{x.college}</span>
            <em>{x.analysis.total}</em>
          </button>
        ))}
        <div className="foot">Demo data only. Flags support review and never replace the officer's decision.</div>
      </nav>
      <main className="main">
        <header className="top">
          <div className="bc">
            {crumbs.map((c, i) => (
              <span key={i}>
                {i > 0 && <i />}
                {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
              </span>
            ))}
          </div>
          <span className="chip">Demo data. The issuer registry is simulated, not a real confirmation.</span>
        </header>
        {ready ? (
          <Outlet />
        ) : (
          <div className="wrap">
            <div className="card">
              <h2>{error ? 'Cannot reach the server' : 'Loading…'}</h2>
              {error && <p className="note">{error}. Check that MongoDB and the API are running (see README).</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
