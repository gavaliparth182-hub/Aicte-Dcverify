import 'dotenv/config';
import mongoose from 'mongoose';
import Application from './models/Application.js';
import Registry from './models/Registry.js';
import { APPLICATIONS_SEED, REGISTRY_SEED } from './data/seedData.js';

export async function seedIfEmpty() {
  if ((await Application.countDocuments()) === 0) {
    await Application.insertMany(APPLICATIONS_SEED);
    console.log('Seeded 3 demo applications (DEMO DATA)');
  }
  if ((await Registry.countDocuments()) === 0) {
    await Registry.insertMany(Object.entries(REGISTRY_SEED).map(([certId, v]) => ({ certId, expiry: v.expiry })));
    console.log('Seeded simulated issuer registry');
  }
}

// `npm run seed` wipes and re-creates the demo data.
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aicte_docverify');
  await Application.deleteMany({});
  await Registry.deleteMany({});
  await seedIfEmpty();
  await mongoose.disconnect();
}
