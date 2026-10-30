import { RULES } from '../config/rules.js';
import { norm, lev, sim, pct, fmt } from './text.js';

const DAY = 864e5;

// Runs every rule against one application and returns a flat list of checks.
// registry: Map(certId -> { expiry }) - the SIMULATED issuer registry.
export function analyze(app, { registry, today }) {
  const C = [];
  const add = (id, rule, name, status, sev, doc, found, why) =>
    C.push({ id: id + '-' + C.length, rule, name, status, sev, doc, found, why });
  const have = app.docs.map((d) => d.type);

  RULES.required.forEach((r) =>
    add(
      'R1', 'R1 · Required documents', r + ' submitted',
      have.includes(r) ? 'pass' : 'fail', 'critical', r,
      have.includes(r) ? 'Present' : 'Missing',
      'Mandatory document list is configurable in the rules file (EXAMPLE).'
    )
  );

  app.docs.forEach((d) => {
    const miss = ['name', 'issue'].filter((k) => !d[k]);
    add(
      'R0', 'R0 · Field completeness', d.type + ' mandatory fields',
      miss.length ? 'warn' : 'pass', 'warning', d.type,
      miss.length ? 'Missing: ' + miss.join(', ') : 'Name and issue date present',
      miss.length
        ? 'Mandatory details were left blank or could not be read. Ask the college to complete them.'
        : 'All mandatory fields were extracted.'
    );

    if (d.expiry) {
      const e = new Date(d.expiry);
      add(
        'R2', 'R2 · Document validity', d.type + ' not expired',
        e < today ? 'fail' : 'pass', 'critical', d.type,
        'Valid until ' + fmt(d.expiry),
        e < today
          ? 'Expired ' + Math.round((today - e) / DAY) + ' days before the review date. Request a renewed certificate.'
          : 'Still valid on the review date.'
      );
    }

    if (d.issue) {
      const bad = new Date(d.issue) > today || (d.expiry && new Date(d.issue) > new Date(d.expiry));
      add(
        'R3', 'R3 · Date sanity', d.type + ' dates are logical',
        bad ? 'fail' : 'pass', 'warning', d.type,
        'Issued ' + fmt(d.issue),
        bad ? 'Issue date is in the future or after expiry.' : 'Issue date precedes expiry and is not in the future.'
      );
    }

    const s = sim(d.name, app.college);
    const st = s >= RULES.nameOk ? 'pass' : s >= RULES.nameWarn ? 'warn' : 'fail';
    add(
      'R4', 'R4 · Cross-document name match', d.type + ' institution name',
      st, st === 'fail' ? 'critical' : 'warning', d.type,
      '“' + (d.name || '') + '” vs application “' + app.college + '” – ' + pct(s) + ' match',
      st === 'pass'
        ? 'Names match.'
        : st === 'warn'
        ? 'Possible abbreviation or spelling variant (minor/moderate). Confirm it is the same institution.'
        : 'Names differ substantially; may be a different entity.'
    );

    if (d.reg) {
      const ok = norm(d.reg) === norm(app.reg);
      add(
        'R5', 'R5 · Registration number match', d.type + ' registration no.',
        ok ? 'pass' : 'warn', 'warning', d.type,
        d.reg + ' vs application ' + app.reg,
        ok ? 'Identical.' : 'Registration numbers differ by ' + lev(d.reg, app.reg) + ' character(s) – possible typo or alteration.'
      );
    }

    const m = d.meta || {};
    const edited = /photoshop|gimp|editor|paint/i.test(m.producer || '');
    const late = new Date(m.modified) - new Date(m.created) > 30 * DAY;
    add(
      'T1', 'T1 · PDF metadata', d.type + ' file metadata',
      edited || late ? 'warn' : 'pass', 'warning', d.type,
      'Producer: ' + m.producer + ' · created ' + fmt(m.created) + ' · modified ' + fmt(m.modified),
      edited || late
        ? 'Edited with image-editing software and/or modified long after creation. Indicator only – legitimate edits are possible.'
        : 'No editing indicators found.'
    );

    add(
      'T2', 'T2 · Error Level Analysis', d.type + ' image consistency',
      d.ela ? 'fail' : 'pass', 'critical', d.type,
      d.ela ? 'Inconsistent compression around the ' + d.ela + ' date field' : 'Uniform compression',
      d.ela
        ? 'Region around the ' + d.ela + ' date compresses differently from the rest of the page, which can indicate pasted or retouched content. Needs human examination.'
        : 'No inconsistent regions detected.'
    );

    if (d.qr) {
      const r = registry.get(d.qr);
      const ok = r && (r.expiry === null || r.expiry === undefined || r.expiry === d.expiry);
      add(
        'A1', 'A1 · Trusted-source check (SIMULATED)', d.type + ' QR ' + d.qr,
        ok ? 'pass' : 'fail', 'critical', d.type,
        r ? (r.expiry ? 'Registry expiry ' + fmt(r.expiry) + ' vs document ' + fmt(d.expiry) : 'Registry record found') : 'No registry record',
        ok
          ? 'Matches the simulated registry record.'
          : 'Document value differs from the simulated registry record. Confirm with the issuing authority.'
      );
    } else {
      add(
        'A1', 'A1 · Trusted-source check (SIMULATED)', d.type + ' authentication',
        'na', 'info', d.type,
        'No QR / digital signature',
        'Cannot be verified automatically. Appearance alone cannot prove authenticity.'
      );
    }
  });

  add(
    'R6', 'R6 · Faculty strength', 'Faculty count ≥ ' + RULES.minFaculty + ' (EXAMPLE)',
    app.faculty >= RULES.minFaculty ? 'pass' : 'warn', 'warning', 'Application form',
    'Declared faculty: ' + app.faculty,
    app.faculty >= RULES.minFaculty
      ? 'Meets the configured example minimum.'
      : 'Below the configured example minimum. Verify against current AICTE norms.'
  );

  return C;
}

// Officer flags are keyed by rule code + application + document + check name.
export const flagKey = (app, c) => c.id.split('-')[0] + app.appId + c.doc + c.name;

// Adds officer-flag state, then computes the transparent 0-100 risk score.
export function evaluate(app, ctx) {
  const checks = analyze(app, ctx);
  const flagMap = new Map((app.flags || []).map((f) => [f.key, f.status]));
  checks.forEach((c) => {
    c.key = flagKey(app, c);
    c.flag = flagMap.get(c.key) || null;
  });
  const items = checks.filter((c) => c.status !== 'pass' && c.flag !== 'dismissed');
  const total = Math.min(100, items.reduce((a, c) => a + RULES.weights[c.sev], 0));
  const level = total >= RULES.buckets.high ? 'High' : total >= RULES.buckets.medium ? 'Medium' : 'Low';
  return { checks, total, level, openFlags: items.length };
}

// Shape sent to the React client.
export function serialize(doc, ctx) {
  const a = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    appId: a.appId,
    college: a.college,
    reg: a.reg,
    faculty: a.faculty,
    docs: a.docs.map((d) => ({
      type: d.type, name: d.name || '', reg: d.reg, issue: d.issue, expiry: d.expiry,
      auth: d.auth, qr: d.qr, ela: d.ela, file: d.file,
      meta: d.meta || { producer: 'Not stated', created: '', modified: '' },
    })),
    decision: a.decision || '',
    remarks: a.remarks || '',
    createdAt: a.createdAt,
    analysis: evaluate(a, ctx),
  };
}
