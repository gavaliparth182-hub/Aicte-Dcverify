import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApps } from '../context/AppsContext.jsx';
import { api } from '../api.js';
import { Chevron, Gauge, Stepper } from '../components/Widgets.jsx';
import { DECISIONS, DONE, LAB, fieldOf, fmt } from '../lib/helpers.js';

const EDITABLE = ['name', 'reg', 'auth', 'qr'];

function Matrix({ a, r }) {
  const cols = [['Name', ['R4']], ['Registration', ['R5']], ['Dates and fields', ['R0', 'R2', 'R3']], ['File history', ['T1']], ['Image', ['T2']], ['Issuer record', ['A1']]];
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h2>Cross-document consistency</h2>
      <div className="tw">
        <table className="mx">
          <thead><tr><th>Document</th>{cols.map((c) => <th key={c[0]}>{c[0]}</th>)}</tr></thead>
          <tbody>
            {a.docs.map((d) => (
              <tr key={d.type}>
                <td><b>{d.type}</b></td>
                {cols.map(([n, ps]) => {
                  const cs = r.checks.filter((c) => c.doc === d.type && ps.some((p) => c.rule.startsWith(p)));
                  if (!cs.length) return <td key={n}><span className="sb na">n/a</span></td>;
                  const s = cs.some((c) => c.status === 'fail') ? 'fail' : cs.some((c) => c.status === 'warn') ? 'warn' : cs.every((c) => c.status === 'na') ? 'na' : 'pass';
                  const m = ps[0] === 'R4' && (cs[0].found.match(/(\d+)%/) || [])[1];
                  return <td key={n}><span className={'sb ' + s}>{m ? m + '% match' : LAB[s]}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Review() {
  const { appId } = useParams();
  const { apps, upsert } = useApps();
  const nav = useNavigate();
  const a = apps.find((x) => x.appId === appId);
  const [st, setSt] = useState(null); // { open, doc } once the officer has chosen something
  if (!a) return <div className="wrap"><div className="card"><h2>Application not found</h2></div></div>;

  const r = a.analysis;
  const open = r.checks.filter((c) => c.status !== 'pass');
  const num = {};
  open.forEach((c, i) => (num[c.id] = i + 1));

  // by default the first failing finding is open and its document is shown
  const first = open.find((c) => c.status === 'fail') || open[0];
  const def = first ? { open: first.id, doc: Math.max(0, a.docs.findIndex((d) => d.type === first.doc)) } : { open: '', doc: 0 };
  const cur = st && (!st.open || open.some((c) => c.id === st.open)) ? st : def;
  const di = Math.min(cur.doc, a.docs.length - 1);
  const d = a.docs[di];
  const passed = r.checks.filter((c) => c.status === 'pass').length;

  const openF = (id, docIdx) => (cur.open === id ? setSt(null) : setSt({ open: id, doc: docIdx >= 0 ? docIdx : cur.doc }));
  const setF = async (key, status) => upsert(await api.setFlag(a.appId, key, status));
  const setDecision = async (decision) => upsert(await api.saveReview(a.appId, { decision }));
  const saveRemarks = async (remarks) => {
    if (remarks !== (a.remarks || '')) upsert(await api.saveReview(a.appId, { remarks }));
  };
  const edit = async (k, v) => {
    v = v.trim();
    if (v === 'None printed') v = '';
    if (v === (d[k] || '')) return;
    upsert(await api.editField(a.appId, di, k, v));
  };

  const rows = [
    ['name', 'Institution', d.name],
    ['reg', 'Registration no.', d.reg],
    ['issue', 'Issued on', fmt(d.issue)],
    ['expiry', 'Valid until', d.expiry ? fmt(d.expiry) : 'No expiry stated'],
    ['auth', 'Issued by', d.auth],
    ['qr', 'QR certificate ID', d.qr || 'None printed'],
    ['meta', 'File history', d.meta.producer + ', created ' + fmt(d.meta.created) + ', saved ' + fmt(d.meta.modified)],
  ].filter((x) => x[2] || x[0] === 'name');

  return (
    <div className="wrap">
      <button className="back" onClick={() => nav('/')}><Chevron />Overview</button>
      <div className="card rh">
        <div>
          <h1>{a.college}</h1>
          <div className="sub">Application {a.appId} · Registration {a.reg} · {a.faculty} faculty declared</div>
          <Stepper act={5} done={5} caps={DONE} />
          <button className="act" onClick={() => nav(`/applications/${a.appId}/analysis`)}>Replay analysis</button>
        </div>
        <div className="rs">
          <div className={'stamp ' + r.level}>{r.level} priority<small>Officer decides</small></div>
          <Gauge t={r.total} l={r.level} />
        </div>
      </div>

      <div className="two">
        <div>
          <div className="tabs">
            {a.docs.map((x, i) => (
              <button key={x.type} className={'tab ' + (i === di ? 'on' : '')} onClick={() => setSt({ open: cur.open, doc: i })}>{x.type}</button>
            ))}
          </div>
          <div className="paper">
            <h2>{d.type}</h2>
            <div className="s">As read from the uploaded file · Demo data · Click a name, registration number, issuer or QR ID to correct it</div>
            <dl style={{ margin: 0 }}>
              {rows.map(([k, l, v]) => {
                const fs = open.filter((c) => c.doc === d.type && fieldOf(c) === k);
                const w = fs.some((c) => c.status === 'fail') ? 'fail' : fs.some((c) => c.status === 'warn') ? 'warn' : fs.length ? 'na' : '';
                const ela = k === 'expiry' && d.ela;
                const editable = EDITABLE.includes(k);
                return (
                  <div className={`fr ${w} ${ela ? 'ela' : ''}`} key={k}>
                    <dt>{l}</dt>
                    <dd>
                      <span
                        className="v"
                        key={k + ':' + v}
                        {...(editable ? { contentEditable: 'plaintext-only', suppressContentEditableWarning: true, spellCheck: false, onBlur: (e) => edit(k, e.currentTarget.textContent) } : {})}
                      >{v}</span>
                      {fs.map((c) => (
                        <button key={c.id} className={'mk ' + c.status} aria-label={'Finding ' + num[c.id]} onClick={() => openF(c.id, di)}>{num[c.id]}</button>
                      ))}
                      {ela && <span className="elc">Compression differs from the rest of the page here</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>

        <div>
          <div className="card">
            <h2>{open.length ? `${open.length} finding${open.length > 1 ? 's' : ''} to review` : 'No findings'}</h2>
            {open.length ? (
              open.map((c) => {
                const o = cur.open === c.id;
                const idx = a.docs.findIndex((x) => x.type === c.doc);
                return (
                  <div className={`fd ${o ? 'open' : ''} ${c.flag === 'dismissed' ? 'dis' : ''}`} key={c.id}>
                    <button className="fh" onClick={() => openF(c.id, idx)}>
                      <span className={'n ' + c.status}>{num[c.id]}</span>
                      <span><b>{c.name}</b><small>{LAB[c.status]}{c.flag ? ' · ' + c.flag : ''}</small></span>
                    </button>
                    {o && (
                      <div className="fb">
                        <p><span className="k">Found</span><br />{c.found}</p>
                        <p><span className="k">Why it matters</span><br />{c.why}</p>
                        <p><span className="k">Rule</span><br />{c.rule} (example rule, set per current AICTE handbook)</p>
                        <button className={'act ' + (c.flag === 'confirmed' ? 'on' : '')} onClick={() => setF(c.key, 'confirmed')}>Confirm issue</button>{' '}
                        <button className={'act ' + (c.flag === 'dismissed' ? 'on' : '')} onClick={() => setF(c.key, 'dismissed')}>Dismiss</button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="note">Every check passed.</p>
            )}
            <p className="note">{passed} checks passed. Flags are indicators for human review, not proof of fraud.</p>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <h2>Your recommendation</h2>
            <div className="ul">Decision</div>
            <div className="opt">
              {DECISIONS.map((o) => (
                <button key={o} className={'ch ' + (a.decision === o ? 'on' : '')} aria-pressed={a.decision === o} onClick={() => setDecision(o)}>{o}</button>
              ))}
            </div>
            <label className="ul" style={{ marginTop: 8 }}>
              Remarks
              <textarea key={a.appId} defaultValue={a.remarks || ''} onBlur={(e) => saveRemarks(e.target.value)} />
            </label>
            <button className="btn" style={{ marginTop: 12 }} onClick={() => nav(`/applications/${a.appId}/report`)}>Open report</button>
            <p className="note">Final approval stays with the authorized officer.</p>
          </div>
        </div>
      </div>

      <Matrix a={a} r={r} />
    </div>
  );
}
