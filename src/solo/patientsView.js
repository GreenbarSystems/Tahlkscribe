// Patients tab — full-screen split: patient list on the left, session history on the right.
// Left: all patients + Add Patient form.
// Right: selected patient's sessions, or a placeholder when none selected.

import { tauriInvoke } from '../core/storageBackend.js';
import { genId, nowISO, todayISO, displayDateShort } from '../utils/format.js';
import { providerId } from '../core/capabilities.js';
import { listPatients, getPatient, savePatient, deletePatient } from './patients.js';

let _encounters = [];
let _selected = null;   // patient id, or null
let _adding = false;

export async function renderPatientsView() {
  _encounters = await tauriInvoke('list_encounters', { limit: 500 }).catch(() => []);
  _selected = null;
  _adding = false;

  return `<div class="patients-view split">
    <aside class="split-nav"><div class="nav-list" id="pt-nav-list">${renderPatientNav()}</div></aside>
    <section class="split-main" id="pt-main">${renderPatientMain()}</section>
  </div>`;
}

// ── Left nav ─────────────────────────────────────────────────────────────────

function renderPatientNav() {
  const pts = listPatients();
  return `
    <div class="nav-section-row">
      <span class="nav-section">Patients</span>
      <button class="nav-add" id="btn-pt-add">+ Add</button>
    </div>
    ${pts.length
      ? pts.map(p => {
          const active = _selected === p.id ? 'nav-item--active' : '';
          const count = sessionsFor(p).length;
          return `<div class="nav-item ${active}" data-pt-id="${esc(p.id)}" role="button" tabindex="0">
            <span class="nav-label">${esc(p.name)}</span>
            <span class="nav-count">${count}</span>
          </div>`;
        }).join('')
      : `<div class="nav-empty">No patients yet.<br>Click <strong>+ Add</strong> to create one.</div>`
    }
  `;
}

// ── Right pane ────────────────────────────────────────────────────────────────

function renderPatientMain() {
  if (_adding) return renderAddPatientForm();

  if (!_selected) {
    return `<div class="empty-state pt-placeholder">
      <p>Select a patient to view their session history.</p>
      <p>Click <strong>+ Add</strong> to create a new patient record.</p>
    </div>`;
  }

  const patient = getPatient(_selected);
  if (!patient) {
    _selected = null;
    return renderPatientMain();
  }

  const sessions = sessionsFor(patient);
  const subParts = [patient.mrn && `MRN ${patient.mrn}`, patient.dob && `DOB ${patient.dob}`].filter(Boolean);

  return `
    <div class="pane-head">
      <div class="pane-titles">
        <h3 class="pane-title">${esc(patient.name)}</h3>
        ${subParts.length ? `<div class="pane-sub">${esc(subParts.join('  ·  '))}</div>` : ''}
        ${patient.notes ? `<div class="pane-sub pt-notes-sub">${esc(patient.notes)}</div>` : ''}
      </div>
      <div class="pane-head-actions">
        <button class="btn btn-primary btn-sm" id="btn-pt-new-session">+ New Session</button>
        <button class="btn btn-ghost btn-sm" id="btn-pt-delete" title="Remove patient">Remove</button>
      </div>
    </div>
    ${sessions.length
      ? `<div class="encounter-list">${sessions.map(e => renderSessionRow(e)).join('')}</div>`
      : `<div class="empty-state">
          <p>No sessions for this patient yet.</p>
          <p>Click <strong>+ New Session</strong> to start one.</p>
        </div>`
    }
  `;
}

function renderAddPatientForm() {
  return `
    <div class="pane-head"><div class="pane-titles"><h3 class="pane-title">Add patient</h3></div></div>
    <div class="patient-form">
      <div class="field-row">
        <label>Name or initials <span class="req">*</span></label>
        <input id="pt-name" type="text" placeholder="e.g. J.S. or P-001" maxlength="60" />
      </div>
      <div class="field-row">
        <label>MRN (optional)</label>
        <input id="pt-mrn" type="text" placeholder="Medical record number" maxlength="40" />
      </div>
      <div class="field-row">
        <label>Date of birth (optional)</label>
        <input id="pt-dob" type="date" />
      </div>
      <div class="field-row">
        <label>Notes (optional)</label>
        <input id="pt-notes" type="text" placeholder="Anything to remember" maxlength="120" />
      </div>
      <div class="form-actions">
        <button class="btn btn-primary btn-sm" id="pt-form-save">Save patient</button>
        <button class="btn btn-ghost btn-sm" id="pt-form-cancel">Cancel</button>
      </div>
    </div>
  `;
}

function renderSessionRow(e) {
  const chip = `<span class="status-chip status-chip--${e.status}">${statusLabel(e.status)}</span>`;
  return `
    <div class="encounter-row encounter-row--compact" data-enc-id="${e.id}" tabindex="0" role="button">
      <div class="enc-date">${displayDateShort(e.encounter_date)}</div>
      <div class="enc-status">${chip}</div>
    </div>
  `;
}

// ── Wiring ────────────────────────────────────────────────────────────────────

export function wirePatientsView(onOpenEncounter) {
  wireNav(onOpenEncounter);
  wireMain(onOpenEncounter);
}

function rerender(onOpenEncounter) {
  const nav = document.getElementById('pt-nav-list');
  const main = document.getElementById('pt-main');
  if (nav)  nav.innerHTML  = renderPatientNav();
  if (main) main.innerHTML = renderPatientMain();
  wireNav(onOpenEncounter);
  wireMain(onOpenEncounter);
}

function wireNav(onOpenEncounter) {
  document.getElementById('btn-pt-add')?.addEventListener('click', () => {
    _adding = true;
    _selected = null;
    rerender(onOpenEncounter);
  });

  document.querySelectorAll('.patients-view .nav-item[data-pt-id]').forEach(el => {
    const select = () => {
      _selected = el.dataset.ptId;
      _adding = false;
      rerender(onOpenEncounter);
    };
    el.addEventListener('click', select);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
  });
}

function wireMain(onOpenEncounter) {
  // Save new patient
  document.getElementById('pt-form-save')?.addEventListener('click', () => {
    const name = document.getElementById('pt-name')?.value.trim();
    if (!name) { document.getElementById('pt-name')?.focus(); return; }
    const p = savePatient({
      name,
      mrn:   document.getElementById('pt-mrn')?.value.trim()  || '',
      dob:   document.getElementById('pt-dob')?.value          || '',
      notes: document.getElementById('pt-notes')?.value.trim() || '',
    });
    _selected = p.id;
    _adding = false;
    rerender(onOpenEncounter);
  });

  document.getElementById('pt-form-cancel')?.addEventListener('click', () => {
    _adding = false;
    rerender(onOpenEncounter);
  });

  // New session for selected patient
  document.getElementById('btn-pt-new-session')?.addEventListener('click', async () => {
    const patient = _selected ? getPatient(_selected) : null;
    if (!patient) return;
    const encounter = {
      id: genId('enc'),
      provider_id: providerId(),
      encounter_date: todayISO(),
      patient_alias: patient.name,
      status: 'new',
      audio_path: null,
      created_at: nowISO(),
      signed_at: null,
      signed_hash: null,
    };
    await tauriInvoke('upsert_encounter', { encounter });
    onOpenEncounter(encounter);
  });

  // Delete patient
  document.getElementById('btn-pt-delete')?.addEventListener('click', () => {
    const patient = _selected ? getPatient(_selected) : null;
    if (!patient) return;
    if (!confirm(`Remove "${patient.name}"? Their sessions will remain but will no longer be linked to this record.`)) return;
    deletePatient(patient.id);
    _selected = null;
    rerender(onOpenEncounter);
  });

  // Open session row
  document.querySelectorAll('#pt-main .encounter-row[data-enc-id]').forEach(row => {
    const open = () => {
      const enc = _encounters.find(e => e.id === row.dataset.encId);
      if (enc) onOpenEncounter(enc);
    };
    row.addEventListener('click', open);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sessionsFor(patient) {
  const name = String(patient.name || '').trim();
  return [..._encounters]
    .filter(e => String(e.patient_alias || '').trim() === name)
    .sort((a, b) =>
      String(b.encounter_date || '').localeCompare(String(a.encounter_date || '')) ||
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
    );
}

function statusLabel(status) {
  return { new: 'New', recording: 'Recording', recording_done: 'Recorded',
           draft: 'Draft', signed: 'Signed', exported: 'Exported' }[status] || status;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
