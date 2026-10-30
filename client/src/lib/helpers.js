export const LAB = { fail: 'Fail', warn: 'Warning', na: 'Not verifiable', pass: 'Pass' };
export const NAMES = ['Upload', 'Read', 'Validate', 'Authenticate', 'Review'];
export const SUB = ['Application and documents', 'OCR reads key fields', 'Missing, expired, inconsistent', 'Signatures, QR, issuer records', 'Dashboard and report'];
export const DONE = ['Received', 'Fields read', 'Rules checked', 'Sources checked', 'Priority set'];
export const DECISIONS = ['Recommend approval', 'Request clarification', 'Escalate for inspection'];

// which document field a finding points at
const FIELD = { R0: 'issue', R2: 'expiry', T2: 'expiry', R3: 'issue', R4: 'name', R5: 'reg', A1: 'qr', T1: 'meta' };
export const fieldOf = (c) => FIELD[c.rule.slice(0, 2)];

export const lvc = (l) => (l === 'High' ? 'fail' : l === 'Medium' ? 'warn' : 'pass');
export const riskVar = (l) => (l === 'High' ? 'bad' : l === 'Medium' ? 'wn' : 'ok');

export const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

// findings that are not passes and not dismissed by the officer (these drive the score)
export const openItems = (a) => a.analysis.checks.filter((c) => c.status !== 'pass' && c.flag !== 'dismissed');
