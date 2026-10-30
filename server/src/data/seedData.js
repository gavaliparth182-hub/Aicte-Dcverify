// DEMO DATA ONLY. Three fictional colleges and a SIMULATED issuer registry.

// ---- Simulated issuer registry (DEMO) - not a real issuer confirmation ----
export const REGISTRY_SEED = {
  'RC-1001': { expiry: null },
  'FC-2001': { expiry: '2027-01-09' },
  'RC-2001': { expiry: null },
  'FC-2002': { expiry: '2026-03-14' },
  'RC-3001': { expiry: null },
  'FC-3001': { expiry: '2026-02-01' },
};

const mk = (type, o) => ({ type, ...o });

export const APPLICATIONS_SEED = [
  {
    appId: 'A', college: 'Meridian Institute of Technology', reg: 'SOC/MH/2012/04411', faculty: 62,
    docs: [
      mk('Society Registration', { name: 'Meridian Institute of Technology', reg: 'SOC/MH/2012/04411', issue: '2012-06-18', auth: 'Registrar of Societies', qr: 'RC-1001', meta: { producer: 'Scanner Pro', created: '2012-06-20', modified: '2012-06-20' } }),
      mk('Fire Safety Certificate', { name: 'Meridian Institute of Technology', issue: '2026-01-10', expiry: '2027-01-09', auth: 'State Fire Services', qr: 'FC-2001', meta: { producer: 'Scanner Pro', created: '2026-01-11', modified: '2026-01-11' } }),
      mk('Affiliation Letter', { name: 'Meridian Institute of Technology', reg: 'SOC/MH/2012/04411', issue: '2025-07-01', expiry: '2028-06-30', auth: 'Affiliating University', meta: { producer: 'Word', created: '2025-07-02', modified: '2025-07-02' } }),
    ],
  },
  {
    appId: 'B', college: 'Sunrise College of Engineering and Technology', reg: 'SOC/GJ/2010/01177', faculty: 48,
    docs: [
      mk('Society Registration', { name: 'Sunrise College of Engg and Technology', reg: 'SOC/GJ/2010/01177', issue: '2010-03-02', auth: 'Registrar of Societies', qr: 'RC-2001', meta: { producer: 'Scanner Pro', created: '2010-03-05', modified: '2010-03-05' } }),
      mk('Fire Safety Certificate', { name: 'Sunrise College of Engineering and Technology', issue: '2025-03-15', expiry: '2026-03-14', auth: 'State Fire Services', qr: 'FC-2002', meta: { producer: 'Scanner Pro', created: '2025-03-16', modified: '2025-03-16' } }),
      mk('Affiliation Letter', { name: 'Sunrise College of Engineering and Technology', reg: 'SOC/GJ/2010/01177', issue: '2025-06-01', expiry: '2028-05-31', auth: 'Affiliating University', meta: { producer: 'Word', created: '2025-06-02', modified: '2025-06-02' } }),
    ],
  },
  {
    appId: 'C', college: 'Orion Institute of Management Sciences', reg: 'SOC/KA/2015/00982', faculty: 31,
    docs: [
      mk('Society Registration', { name: 'Orion Institute of Management Sciences', reg: 'SOC/KA/2015/00982', issue: '2015-09-10', auth: 'Registrar of Societies', qr: 'RC-3001', meta: { producer: 'Scanner Pro', created: '2015-09-12', modified: '2015-09-12' } }),
      mk('Fire Safety Certificate', { name: 'Orion Institute of Management Sciences', issue: '2025-02-01', expiry: '2027-02-01', auth: 'State Fire Services', qr: 'FC-3001', ela: 'expiry', meta: { producer: 'Adobe Photoshop 25.0', created: '2025-02-03', modified: '2026-10-12' } }),
      mk('Affiliation Letter', { name: 'Orion Institute of Management Sciences', reg: 'SOC/KA/2015/00928', issue: '2025-08-01', expiry: '2028-07-31', auth: 'Affiliating University', meta: { producer: 'Word', created: '2025-08-02', modified: '2025-08-02' } }),
    ],
  },
];
