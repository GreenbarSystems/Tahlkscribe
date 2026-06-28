// Capability seam — Solo-safe defaults; Group tier injects real impls.
// Core modules import these accessors rather than group/ modules directly.

function soloDefaults() {
  return {
    recordAudit: () => {},
    currentProvider: () => null,
    currentUser: () => null,
    firstRun: () => false,
    hasGroupFeatures: () => false,
  };
}

let _caps = soloDefaults();

export function installCapabilities(impl) {
  _caps = { ...soloDefaults(), ...(impl || {}) };
}

export function resetCapabilities() {
  _caps = soloDefaults();
}

export const recordAudit    = (...args) => _caps.recordAudit(...args);
export const currentProvider = ()       => _caps.currentProvider();
export const currentUser    = ()        => _caps.currentUser();
export const firstRun       = ()        => _caps.firstRun();
export const hasGroupFeatures = ()      => _caps.hasGroupFeatures();

// Active provider id for stamping encounters/notes. Solo → 'solo' (no-op default);
// Group → the active roster provider's id (injected by entry-group.js).
export const providerId       = ()      => _caps.currentProvider()?.id ?? 'solo';
