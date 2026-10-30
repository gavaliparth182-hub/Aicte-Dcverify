import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApps } from '../context/AppsContext.jsx';
import { Chevron, Gauge, Stepper } from '../components/Widgets.jsx';
import { DONE, LAB, NAMES, fmt, openItems } from '../lib/helpers.js';

const DESC = [
  'The college submits the application and its supporting documents.',
  'Key fields such as names, dates and registration numbers are read. In this demo they come from stored demo records or the form the college filled in. There is no OCR engine yet.',
  'Rules check for missing documents and fields, expired documents, date logic and mismatched details.',
  'QR codes are looked up in the simulated issuer registry. File history and image consistency are checked for signs of editing.',
  'A risk score sets the review priority. The officer makes the final decision.',
];

function Rows({ rows }) {
  return rows.map((y, k) => (
    <div className="srow" style={{ animationDelay: k * 120 + 'ms' }} key={k}>
      <span className={'sb ' + y[0]}>{y[1]}</span>
      <div><b>{y[2]}</b><div className="m">{y[3]}</div></div>
    </div>
  ));
}

export default function Run() {
  const { appId } = useParams();
  const { apps, config } = useApps();
  const nav = useNavigate();
  const a = apps.find((x) => x.appId === appId);
  const [i, setI] = useState(0);

  // walk through the five stages automatically; stages can also be clicked
  useEffect(() => {
    setI(0);
    const t = setInterval(() => setI((v) => (v >= 4 ? (clearInterval(t), v) : v + 1)), 2200);
    return () => clearInterval(t);
  }, [appId]);

  if (!a) return <div className="wrap"><div className="card"><h2>Application not found</h2></div></div>;
  const r = a.analysis, C = r.checks;
  const st = (x) => [x.status, LAB[x.status], x.name, x.found];
  let body;

  if (i === 0) {
    body = <Rows rows={[
      ...a.docs.map((d) => ['pass', 'Received', d.type, d.file || 'Demo scan']),
      ...config.rules.required.filter((t) => !a.docs.some((d) => d.type === t)).map((t) => ['fail', 'Missing', t, 'Not submitted']),
    ]} />;
  } else if (i === 1) {
    const d = a.docs[0];
    body = (
      <div className="two" style={{ marginTop: 12 }}>
        <div className="paper scan">
          <h2>{d.type}</h2>
          <div className="s">Reading the page</div>
          <dl style={{ margin: 0 }}>
            {[['Institution', d.name], ['Registration', d.reg], ['Issued', d.issue && fmt(d.issue)], ['Valid until', d.expiry && fmt(d.expiry)]]
              .filter((x) => x[1])
              .map((x) => (<div className="fr" key={x[0]}><dt>{x[0]}</dt><dd>{x[1]}</dd></div>))}
          </dl>
        </div>
        <div>
          <Rows rows={a.docs.map((x) => ['pass', 'Read', x.type, [x.name, x.reg, x.issue ? 'Issued ' + fmt(x.issue) : '', x.expiry ? 'Valid until ' + fmt(x.expiry) : ''].filter(Boolean).join(' · ')])} />
        </div>
      </div>
    );
  } else if (i === 2) {
    body = <Rows rows={C.filter((c) => c.rule[0] === 'R').map(st)} />;
  } else if (i === 3) {
    body = (
      <>
        {a.docs.map((d, k) => {
          const c = C.find((x) => x.rule[0] === 'A' && x.doc === d.type);
          return (
            <div className="srow" style={{ animationDelay: k * 150 + 'ms' }} key={d.type}>
              <span className={'sb ' + c.status}>{LAB[c.status]}</span>
              <div style={{ flex: 1 }}>
                <b>{d.type}</b>
                <div className="lk"><span className="q">{d.qr || 'No QR'}</span><span className="ln" /><span className="q">Issuer registry (simulated)</span></div>
                <div className="m">{c.found}</div>
              </div>
            </div>
          );
        })}
        <Rows rows={C.filter((c) => c.rule[0] === 'T').map(st)} />
      </>
    );
  } else {
    const n = openItems(a).length;
    body = (
      <div style={{ textAlign: 'center', padding: 10 }}>
        <Gauge t={r.total} l={r.level} />
        <p>{n} open flag{n === 1 ? '' : 's'}. A score supports review and does not prove fraud. The officer decides.</p>
        <button className="btn" onClick={() => nav('/applications/' + a.appId)}>Open full review</button>
      </div>
    );
  }

  return (
    <div className="wrap">
      <button className="back" onClick={() => nav('/')}><Chevron />Overview</button>
      <h1 className="pt">Analysing {a.college}</h1>
      <p className="sub">Select a stage to revisit it.</p>
      <Stepper act={i} done={i === 4 ? 5 : i} caps={DONE} onPick={setI} />
      <div className="card">
        <h2>{NAMES[i]}</h2>
        <p className="note" style={{ margin: '0 0 6px' }}>{DESC[i]}</p>
        {body}
      </div>
    </div>
  );
}
