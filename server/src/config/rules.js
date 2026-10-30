// ---- Configurable rules (EXAMPLE values - configure per current AICTE handbook) ----
export const RULES = {
  weights: { critical: 25, warning: 10, info: 2 },
  minFaculty: 40,
  required: ['Society Registration', 'Fire Safety Certificate', 'Affiliation Letter'],
  nameWarn: 0.75,
  nameOk: 0.97,
  buckets: { medium: 25, high: 60 },
};

// Review date: fixed by REVIEW_DATE for a repeatable demo, otherwise today.
export const reviewDate = () => new Date(process.env.REVIEW_DATE || Date.now());
