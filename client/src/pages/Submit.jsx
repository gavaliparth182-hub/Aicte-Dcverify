import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppsContext.jsx';
import { api, errText } from '../api.js';
import { Stepper } from '../components/Widgets.jsx';

const EMPTY = { college: '', reg: '', faculty: '', docs: {} };

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="ul">
      {label}
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function Submit() {
  const { config, upsert } = useApps();
  const nav = useNavigate();
  const T = config.rules.required;
  const [U, setU] = useState(EMPTY);
  const [files, setFiles] = useState({}); // real File objects, kept out of the form state
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const uset = (k, v) => setU((u) => ({ ...u, [k]: v }));
  const dset = (t, k, v) => setU((u) => ({ ...u, docs: { ...u.docs, [t]: { ...(u.docs[t] || {}), [k]: v } } }));
  const have = T.filter((t) => U.docs[t] && U.docs[t].file).length;
  const ready = U.college.trim() && U.reg.trim() && have && !busy;

  async function pick(t, f) {
    if (!f) return;
    setErr('');
    try {
      const { meta } = await api.inspect(f); // server reads the file history
      setFiles((s) => ({ ...s, [t]: f }));
      dset(t, 'file', f.name);
      dset(t, 'meta', meta);
    } catch (e) {
      setErr(errText(e));
    }
  }

  function sample() {
    setFiles({});
    setU({
      college: 'Zenith Polytechnic', reg: 'SOC/TN/2018/00311', faculty: '36',
      docs: {
        'Society Registration': { file: 'society_cert.pdf', name: 'Zenith Polytechnic', reg: 'SOC/TN/2018/00311', issue: '2018-04-02', auth: 'Registrar of Societies', qr: 'RC-9999', meta: { producer: 'Scanner Pro', created: '2018-04-03', modified: '2018-04-03' } },
        'Fire Safety Certificate': { file: 'fire_cert.pdf', name: 'Zenith Polytechnic', issue: '2024-05-01', expiry: '2025-04-30', auth: 'State Fire Services', qr: 'FC-2001', meta: { producer: 'Canva', created: '2024-05-02', modified: '2024-05-02' } },
      },
    });
  }

  async function submitApp() {
    const fd = new FormData();
    fd.append('college', U.college.trim());
    fd.append('reg', U.reg.trim());
    fd.append('faculty', U.faculty);
    const docs = {};
    Object.entries(U.docs).forEach(([t, d]) => {
      if (!d.file) return;
      docs[t] = { ...d, lastModified: files[t] ? files[t].lastModified : undefined };
      if (files[t]) fd.append(t, files[t]);
    });
    fd.append('docs', JSON.stringify(docs));
    setBusy(true);
    setErr('');
    try {
      const app = await api.createApplication(fd);
      upsert(app);
      setU(EMPTY);
      setFiles({});
      nav(`/applications/${app.appId}/analysis`);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <h1 className="pt">Submit application documents</h1>
      <p className="sub">College side. Files are sent to the demo server, which reads their file history. Nothing is verified against a real issuer.</p>
      <Stepper act={0} done={0} caps={['You are here']} />
      <div className="two">
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h2>Institution</h2>
            <div className="ug">
              <Input label="Institution name" value={U.college} onChange={(v) => uset('college', v)} />
              <Input label="Society registration no." value={U.reg} onChange={(v) => uset('reg', v)} />
              <Input label="Faculty declared" value={U.faculty} onChange={(v) => uset('faculty', v)} type="number" />
            </div>
          </div>

          {T.map((t) => {
            const d = U.docs[t] || {};
            const D = (label, k, type) => <Input label={label} value={d[k]} onChange={(v) => dset(t, k, v)} type={type} />;
            return (
              <div className="card" style={{ marginBottom: 14 }} key={t}>
                <label
                  className={'dz ' + (d.file ? 'ok' : '')}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('over'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('over')}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('over'); pick(t, e.dataTransfer.files[0]); }}
                >
                  <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => pick(t, e.target.files[0])} />
                  <b>{t}</b>
                  <span>{d.file ? `${d.file} · made with ${d.meta?.producer ?? "unknown"}` : 'Drop a PDF or image here, or select a file'}</span>
                </label>
                <div className="ug">
                  {D('Name on document', 'name')}
                  {t !== 'Fire Safety Certificate' && D('Registration no. on document', 'reg')}
                  {D('Issued on', 'issue', 'date')}
                  {D('Valid until', 'expiry', 'date')}
                  {D('Issued by', 'auth')}
                  {D('QR certificate ID', 'qr')}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="card" style={{ position: 'sticky', top: 76 }}>
          <h2>Required documents</h2>
          <div style={{ textAlign: 'center' }}>
            <svg viewBox="0 0 80 80" width="100">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--tint)" strokeWidth="9" />
              <circle className="rg" cx="40" cy="40" r="32" fill="none" stroke="var(--pri2)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${(have / T.length) * 201} 201`} transform="rotate(-90 40 40)" />
              <text x="40" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor">{have}/{T.length}</text>
            </svg>
          </div>
          <div className="chk">
            {T.map((t) => {
              const got = U.docs[t] && U.docs[t].file;
              return (
                <div key={t}>
                  <b style={{ color: `var(--${got ? 'ok' : 'bad'})` }}>{got ? '✓' : '✗'}</b>
                  {t}
                </div>
              );
            })}
          </div>
          <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={!ready} onClick={submitApp}>
            {busy ? 'Submitting…' : 'Submit for review'}
          </button>
          <button className="act" style={{ width: '100%', marginTop: 8 }} onClick={sample}>Load sample submission</button>
          {err && <p className="note" style={{ color: 'var(--bad)' }}>{err}</p>}
          <p className="note">
            {ready || busy ? 'You can submit with documents missing. The review will flag them.' : 'Add the institution name, registration number and at least one document.'}{' '}
            QR IDs are checked against the simulated registry. Try RC-1001 or FC-2001.
          </p>
        </aside>
      </div>
    </div>
  );
}
