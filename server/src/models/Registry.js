import mongoose from 'mongoose';

// SIMULATED issuer registry - demo records only, not a real issuer confirmation.
const RegistrySchema = new mongoose.Schema({
  certId: { type: String, required: true, unique: true },
  expiry: { type: String, default: null },
});

export default mongoose.model('Registry', RegistrySchema);
