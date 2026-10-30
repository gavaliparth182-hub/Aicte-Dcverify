// Reads simple file-history metadata from an uploaded file.
// PDFs: /Producer, /CreationDate, /ModDate found in the raw bytes.
// Images: no PDF metadata, so the file's last-modified date is used.
export function extractMeta(buffer, name, lastModified) {
  const mod = new Date(Number(lastModified) || Date.now()).toISOString().slice(0, 10);
  let m = { producer: 'Image file, no PDF metadata', created: mod, modified: mod };
  if (/\.pdf$/i.test(name || '')) {
    m.producer = 'Not readable';
    try {
      const x = buffer.toString('latin1');
      const dt = (re) => {
        const q = x.match(re);
        return q ? `${q[1]}-${q[2]}-${q[3]}` : mod;
      };
      const p = x.match(/\/Producer\s*\(([^)]*)\)/);
      m = {
        producer: p ? p[1] : 'Not stated',
        created: dt(/\/CreationDate\s*\(D:(\d{4})(\d{2})(\d{2})/),
        modified: dt(/\/ModDate\s*\(D:(\d{4})(\d{2})(\d{2})/),
      };
    } catch {
      /* keep "Not readable" */
    }
  }
  return m;
}

// Used for the demo "sample submission", which has no real file behind it.
export function cleanMeta(meta) {
  const s = (v) => String(v ?? '').slice(0, 120);
  const today = new Date().toISOString().slice(0, 10);
  return { producer: s(meta?.producer) || 'Not stated', created: s(meta?.created) || today, modified: s(meta?.modified) || today };
}
