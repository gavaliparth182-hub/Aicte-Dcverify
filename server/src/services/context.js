import Registry from '../models/Registry.js';
import { reviewDate } from '../config/rules.js';

// Everything the rules engine needs besides the application itself.
export async function loadContext() {
  const rows = await Registry.find().lean();
  return { registry: new Map(rows.map((r) => [r.certId, { expiry: r.expiry ?? null }])), today: reviewDate() };
}
