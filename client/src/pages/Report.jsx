import { useNavigate, useParams } from 'react-router-dom';
import { useApps } from '../context/AppsContext.jsx';
import { Chevron } from '../components/Widgets.jsx';
import { fmt, openItems } from '../lib/helpers.js';

export default function Report() {
  const { appId } = useParams();
  const { apps, config } = useApps();
  const nav = useNavigate();
  const a = apps.find((x) => x.appId === appId);
  if (!a) return <div className="wrap"><div className="card"><h2>Application not found</h2></div></div>;
  const r = a.analysis, items = openItems(a);
  const generated = fmt(config.today).replace(/^0/, '');

  return (
    <div className="wrap" style={{ maxWidth: 780 }}>
      <button className="back" onClick={() => nav('/applications/' + a.appId)}><Chevron />Back to review</button>
      <div className="paper">
        <h2>Verification report</h2>
        <div className="s">{a.college} · generated {generated} · Demo data, simulated verification, AI is decision support only</div>
        <p><b>Review priority:</b> {r.level} ({r.total} of 100)</p>
        <h3>Flagged items</h3>
        {items.length ? (
          items.map((c) => (
            <p key={c.id}><b>{c.name}</b> ({c.rule})<br />{c.found}. {c.why}</p>
          ))
        ) : (
          <p>No open flags.</p>
        )}
        <p className="note">{r.checks.filter((c) => c.status === 'pass').length} of {r.checks.length} checks passed.</p>
        <h3>Officer recommendation</h3>
        <p>{a.decision || 'Not recorded yet'}{a.remarks ? ': ' + a.remarks : ''}</p>
        <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
      </div>
    </div>
  );
}
