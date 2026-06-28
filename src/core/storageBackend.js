// Storage backend — Solo tier only uses TauriBackend (SQLite on disk).
// The RemoteHttpBackend and HybridRouter are Group-tier concerns and
// are never imported here, keeping this module group-free.

import { toast } from '../utils/format.js';

const IS_TAURI = typeof window !== 'undefined' && (
  '__TAURI__' in window || '__TAURI_INTERNALS__' in window
);

const _cache = new Map();

// All note_* key prefixes the warmup phase pre-fetches from SQLite.
export const KEY_PREFIXES = [
  'note_encounters_v1',
  'note_content_v1',
  'note_history_v1',
  'note_templates_v1',
  'note_provider_v1',
  'note_settings_v1',
  'note_audit_v1',
  'note_group_v1',
  'note_patients_v1',
];

// ── Tauri invoke helper ────────────────────────────────────────────────────

function _tauriInvoke(cmd, args) {
  const t = window.__TAURI__;
  if (t?.core?.invoke) return t.core.invoke(cmd, args);
  if (t?.tauri?.invoke) return t.tauri.invoke(cmd, args);
  if (typeof t?.invoke === 'function') return t.invoke(cmd, args);
  return Promise.reject(new Error('Tauri invoke unavailable'));
}

// ── TauriBackend ───────────────────────────────────────────────────────────

const TauriBackend = {
  kind: 'tauri',

  async warmup() {
    await Promise.all(KEY_PREFIXES.map(async prefix => {
      try {
        const rows = await _tauriInvoke('kv_list', { prefix });
        if (Array.isArray(rows)) {
          for (const row of rows) {
            if (Array.isArray(row) && row.length === 2) _cache.set(row[0], row[1]);
          }
        }
      } catch (e) {
        console.error('Tauri kv_list failed for ' + prefix, e);
      }
    }));
  },

  getSync(key) {
    return _cache.has(key) ? _cache.get(key) : null;
  },

  setSync(key, value) {
    _cache.set(key, value);
    _tauriInvoke('kv_set', { key, value })
      .catch(e => {
        console.error('Tauri kv_set failed for ' + key, e);
        toast(`Disk write failed — change may not be saved`, 4500);
      });
  },

  removeSync(key) {
    _cache.delete(key);
    _tauriInvoke('kv_remove', { key })
      .catch(e => console.error('Tauri kv_remove failed for ' + key, e));
  },

  listKeys(prefix) {
    const out = [];
    _cache.forEach((_, k) => { if (!prefix || k.startsWith(prefix)) out.push(k); });
    return out;
  },
};

// ── LocalStorageBackend (dev / non-Tauri fallback) ─────────────────────────

const LocalStorageBackend = {
  kind: 'local',

  async warmup() {
    KEY_PREFIXES.forEach(prefix => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === prefix || k.startsWith(prefix + '::'))) {
          try { _cache.set(k, JSON.parse(localStorage.getItem(k))); }
          catch { _cache.set(k, null); }
        }
      }
    });
  },

  getSync(key) {
    if (_cache.has(key)) return _cache.get(key);
    try {
      const raw = localStorage.getItem(key);
      const v = raw == null ? null : JSON.parse(raw);
      _cache.set(key, v);
      return v;
    } catch { return null; }
  },

  setSync(key, value) {
    _cache.set(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { toast(`Storage error — NOT saved (${e?.name || 'unknown'})`, 4500); }
  },

  removeSync(key) {
    _cache.delete(key);
    try { localStorage.removeItem(key); } catch {}
  },

  listKeys(prefix) {
    const out = new Set();
    _cache.forEach((_, k) => { if (!prefix || k.startsWith(prefix)) out.add(k); });
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (!prefix || k.startsWith(prefix))) out.add(k);
    }
    return [...out];
  },
};

// ── Active backend + public surface ───────────────────────────────────────

const _backend = IS_TAURI ? TauriBackend : LocalStorageBackend;

export function kvGet(key)          { return _backend.getSync(key); }
export function kvSet(key, value)   { return _backend.setSync(key, value); }
export function kvRemove(key)       { return _backend.removeSync(key); }
export function kvList(prefix)      { return _backend.listKeys(prefix); }
export async function kvWarmup()    { await _backend.warmup(); }

export function kvBackendInfo() {
  return { kind: _backend.kind, isTauri: IS_TAURI };
}

// ── Browser/demo fallback for non-KV Tauri commands ────────────────────────
// Lets the UI be clicked through in a plain browser preview (no desktop SQLite
// backend). Production runs in Tauri, where IS_TAURI is true and this is unused.
const ENC_FALLBACK_KEY = 'note_encounters_fallback_v1';

function _browserEncounters() {
  try { return JSON.parse(localStorage.getItem(ENC_FALLBACK_KEY)) || []; }
  catch { return []; }
}

function _browserInvoke(cmd, args) {
  switch (cmd) {
    case 'list_encounters': {
      const list = _browserEncounters().sort((a, b) =>
        String(b.encounter_date || '').localeCompare(String(a.encounter_date || '')) ||
        String(b.created_at || '').localeCompare(String(a.created_at || '')));
      return Promise.resolve(args && args.limit ? list.slice(0, args.limit) : list);
    }
    case 'upsert_encounter': {
      const e = args && args.encounter;
      if (!e) return Promise.resolve();
      const list = _browserEncounters();
      const i = list.findIndex(x => x.id === e.id);
      if (i >= 0) list[i] = { ...list[i], ...e }; else list.push(e);
      try { localStorage.setItem(ENC_FALLBACK_KEY, JSON.stringify(list)); } catch {}
      return Promise.resolve();
    }
    case 'model_downloaded': return Promise.resolve(true);
    case 'data_location':    return Promise.resolve('Browser preview — data kept in localStorage');
    case 'save_audio_chunk': return Promise.resolve('');
    default:
      return Promise.reject(new Error(`"${cmd}" is only available in the desktop app.`));
  }
}

// Direct Tauri IPC for commands beyond KV. In a plain browser (preview/demo),
// falls back to a localStorage-backed stub so the UI stays clickable.
export function tauriInvoke(cmd, args) {
  return IS_TAURI ? _tauriInvoke(cmd, args) : _browserInvoke(cmd, args);
}
