// Specialty taxonomy — shared across templates, exports, and UI.
// A "family" groups related specialties so a provider sees their own family's
// templates and export targets (plus universal ones), and so adding a new
// specialty never regresses an existing family.

export const SPECIALTY_FAMILY = {
  psychiatry: 'behavioral-health',
  'behavioral-health': 'behavioral-health',
  psychology: 'behavioral-health',
  podiatry: 'podiatry',
};

// The family for a specialty, or null for unmapped values ('other', unset) —
// callers treat null as "show everything" for backward compatibility.
export function familyOf(specialty) {
  return SPECIALTY_FAMILY[specialty] || null;
}

export const SPECIALTY_LABEL = {
  psychiatry: 'Psychiatry',
  'behavioral-health': 'Behavioral Health / Therapy',
  psychology: 'Psychology',
  podiatry: 'Podiatry',
  general: 'General',
  other: 'Other',
};

export function specialtyLabel(v) {
  return SPECIALTY_LABEL[v] || v;
}
