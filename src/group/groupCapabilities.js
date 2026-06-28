// Group (Pro/Firm) capability implementation.
// Installed by entry-group.js so shared core modules resolve the active provider
// from the practice roster instead of the Solo no-op defaults. Full roster
// management UI is a later step (ROADMAP 4a.3); this provides a minimal, real
// roster so the Group build runs end-to-end and exercises the capability seam.

import { kvGet, kvSet } from '../core/storageBackend.js';

const ROSTER_KEY = 'note_group_v1::roster';
const ACTIVE_KEY = 'note_group_v1::active_provider';

export function loadRoster() {
  return kvGet(ROSTER_KEY) || [];
}

export function activeProviderId() {
  return kvGet(ACTIVE_KEY) || (loadRoster()[0]?.id ?? null);
}

export function setActiveProvider(id) {
  kvSet(ACTIVE_KEY, id);
}

// Seed a single-provider roster from the existing provider profile on first run,
// so an upgraded Solo practice keeps working. Multi-provider add/edit comes next.
export function ensureRosterSeeded() {
  if (loadRoster().length) return;
  const profile = kvGet('note_provider_v1::profile') || {};
  const seed = {
    id: 'prov-1',
    name: profile.name || 'Provider 1',
    credentials: profile.credentials || '',
    specialty: profile.specialty || 'psychiatry',
    role: 'admin',
  };
  kvSet(ROSTER_KEY, [seed]);
  kvSet(ACTIVE_KEY, seed.id);
}

// The capability object installed into the seam. Functions read the roster live,
// so switching the active provider takes effect without re-installing.
export function groupCapabilities() {
  const active = () => loadRoster().find(p => p.id === activeProviderId()) || null;
  return {
    hasGroupFeatures: () => true,
    currentProvider: active,
    currentUser: active,
  };
}
