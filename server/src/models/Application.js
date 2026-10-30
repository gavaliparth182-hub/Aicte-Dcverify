import mongoose from 'mongoose';

const { Schema } = mongoose;

const MetaSchema = new Schema(
  { producer: String, created: String, modified: String },
  { _id: false }
);

const DocSchema = new Schema(
  {
    type: { type: String, required: true },
    name: { type: String, default: '' },
    reg: String,
    issue: String, // ISO date string, e.g. 2026-01-10
    expiry: String,
    auth: String,
    qr: String,
    ela: String, // demo marker: field where Error Level Analysis found an inconsistency
    file: String,
    meta: MetaSchema,
  },
  { _id: false }
);

const FlagSchema = new Schema(
  { key: { type: String, required: true }, status: { type: String, enum: ['confirmed', 'dismissed'], required: true } },
  { _id: false }
);

export const DECISIONS = ['Recommend approval', 'Request clarification', 'Escalate for inspection'];

const ApplicationSchema = new Schema(
  {
    appId: { type: String, required: true, unique: true },
    college: { type: String, required: true, trim: true },
    reg: { type: String, required: true, trim: true },
    faculty: { type: Number, default: 0 },
    docs: [DocSchema],
    flags: [FlagSchema], // officer review of individual findings
    decision: { type: String, enum: ['', ...DECISIONS], default: '' }, // recommendation only
    remarks: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

export default mongoose.model('Application', ApplicationSchema);
