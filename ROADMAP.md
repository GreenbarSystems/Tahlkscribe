# Tahlk Roadmap

Status legend: ✅ done · 🔨 in progress · ⏭️ next (no blockers) · ⛔ blocked (gate noted)

This roadmap reflects the product as of 2026-06-26. The big sequencing truth:
**managed-key, paid-tier billing, subscription gating, and Pro/Firm cloud sync all
converge on ONE backend** — and anything that routes PHI through Tahlk infrastructure
is gated behind the HIPAA **BAA chain**. The client-side foundation for Pro/Firm, however,
can start **now** because the codebase already has the Group-tier seam.

---

## Phase 0 — Solo MVP foundation ✅ (shippable, modulo Phase 1 polish)

- ✅ App builds & runs (Tauri + Vite); whisper.cpp sidecar + DLLs wired
- ✅ Whisper model **bundled** as a resource — no first-run download (installer +142 MB)
- ✅ Local record → on-device transcribe → Claude note-gen → physician sign-off
- ✅ SHA-256 audit/history chain; sign-off locks the note
- ✅ Multi-specialty via a **specialty-family** model (`core/specialties.js`):
  behavioral health (psych-eval, med-mgmt, crisis, therapy-progress) **+ podiatry**
  (new-patient eval, procedure, diabetic foot exam, follow-up) + generic SOAP
- ✅ Specialty-scoped templates **and** EHR exports (SimplePractice/TherapyNotes/Kareo for
  BH; ModMed/eClinicalWorks for podiatry; plain text universal)
- ✅ Outcomes dashboard (notes completed, avg review time, est. time saved)
- ✅ Privacy copy made honest (transcript → Anthropic disclosed)

---

## Phase 1 — Solo polish & honesty ⏭️ (client-only, no gates — do next, small)

- ⏭️ Replace **placeholder icons** (green "T") with real branding before any release
- ⏭️ Update stale **"behavioral health"-only metadata** → multi-specialty
  (`package.json` description, `tauri.conf.json` long/short descriptions, README)
- ⏭️ Retire/fix the stale `test:js` script (points at non-existent files); add unit tests
  for specialty filtering + `computeOutcomeStats`
- ⏭️ Privacy hardening that needs **no backend**:
  - Encrypt the Anthropic API key at rest (OS keychain / Tauri Stronghold; today it's
    plaintext in SQLite)
  - Stamp the generation engine (BYO vs managed vs on-device) into the audit chain
  - Tighten CSP `connect-src` when not in cloud mode
- ⏭️ Refresh the **GTM doc** — pricing ($599/$1,699/$3,499), multi-specialty, ARR targets
  are all stale vs. current decisions

---

## Phase 2 — Backend foundation 🔨/⛔ (THE LINCHPIN — unblocks paid + managed + Pro/Firm sync)

Run these tracks in parallel; **start 2a immediately** (legal lead time is the long pole).

- ⛔ **2a · Legal/compliance (BAA chain)** — the gate on everything PHI-through-Tahlk:
  - Execute **Anthropic BAA** + enable **Zero-Data-Retention**
  - Tahlk's own **BAA template** to sign with each practice
  - SOC 2 Type II program kicked off
- ⛔ **2b · Identity & billing service** (spec'd, not built):
  - Provider/practice accounts + auth
  - **Hybrid token** (short-lived JWT w/ `account_id`/`plan`/**seat** claims + `jti` denylist)
  - Billing (Stripe or similar) for Solo/Pro/Firm + **seat counts** + soft-cap/overage metering
- ⛔ **2c · Managed-key proxy** — build to `MANAGED-KEY-PROXY-CONTRACT.md` (Anthropic
  passthrough; allotments in `MANAGED-KEY-PLAN-ALLOTMENTS.md`)
- ⛔ **2d · Sync backend** (`RemoteHttpBackend` server) — HIPAA-grade store for practice data;
  required for Pro/Firm multi-device sync

---

## Phase 3 — Managed key + subscription gating ⛔ (gated on 2a + 2b + 2c)

- ⛔ Client `generation_mode`: `byo` (default today) → `managed` — base-URL + auth swap in
  `src-tauri/src/lib.rs` `generate_note` (per the rollout plan)
- ⛔ In-app subscription state (plan display, `403 subscription_inactive` handling)
- ⛔ Flip default BYO → managed once the BAA chain is green
- ⛔ **Subscription/licensing gating** = enforced here via the plan/seat claims in the token
  (NOT separate work; do not build hollow gating before 2b exists)

---

## Phase 4 — Pro & Firm (the Group tier) 🔨 starts now / ⛔ finishes after backend

Pro ($1,699, 2–3 providers) and Firm ($3,499, 4–5) are the **Group tier** the architecture
already anticipates (capability seam, `group.html`/`dist-group` build target, build guard).
Split into a foundation that starts **now** and a synced layer gated on the backend.

### 4a · Local multi-provider foundation ⏭️ — **START HERE, no backend needed**

Build and test the full multi-provider UX on a single device with local SQLite first; this
de-risks the data model and UI before the (gated) sync layer.

1. **De-hardcode provider identity.** Replace `provider_id: 'solo'`
   (`homeScreen.js`, `encounterPanel.js`, `noteEditor.js signNote`) with a
   `providerId()` helper backed by the capability seam
   (`currentProvider()?.id ?? 'solo'`). No behavior change in Solo; makes encounters
   multi-provider-ready.
2. **Stand up the Group build target.** Create `src/group/`, `entry-group.js`, and
   `group.html` (Vite already routes `mode !== solo` → these). `entry-group.js` calls
   `installCapabilities({ hasGroupFeatures: () => true, currentProvider, currentUser })`.
   Reuse the shared core (scribe/editor/templates/export/specialties); the build guard keeps
   Solo lean. Add `dev:group` / `build:group` npm scripts.
3. **Provider roster + switcher.** A practice with N providers; UI to add/select the active
   provider; encounters stamped with the real `provider_id`.
4. **Practice + per-provider dashboards.** Extend `computeOutcomeStats` to aggregate across
   the roster (practice view) and filter per provider.
5. **Shared template library.** Practice-level templates shared across providers (a stated
   Group differentiator), layered on the existing specialty-family filtering.
6. **Roles.** Practice-admin vs provider; scaffolding for supervisory review.

### 4b · Synced, authenticated, billed ⛔ (gated on 2b + 2d)

- ⛔ `HybridRouter` + `RemoteHttpBackend` — multi-device practice sync (the defining Group
  value); plug into `storageBackend` via a selectable backend
- ⛔ Provider login + practice membership (from 2b)
- ⛔ **Seat enforcement** — Pro 2–3, Firm 4–5 — driven by billing/identity
- ⛔ Supervisory review workflow (provider drafts → admin co-signs), extending the audit chain

---

## Phase 5 — Expansion (later)

- More specialties (GI / neurology per the GTM plan; deeper podiatry coverage)
- FHIR R4 / direct EHR API export (GTM Phase 3)
- Enterprise tier (6+ providers, custom processing/contracts)
- **On-device LLM** (llama.cpp sidecar) — max-privacy generation that needs no BAA; mirrors
  the whisper sidecar pattern already in place

---

## What to start this week

1. **Kick off 2a (Anthropic BAA + ZDR + your BAA template)** — non-code, longest lead time,
   gates the entire paid/managed/sync surface. Start the clock now.
2. **Begin 4a step 1–2** — de-hardcode `provider_id` and scaffold the `group/` build. Pure
   client work, unblocked, and the foundation everything else in Pro/Firm sits on.
3. **Phase 1 polish** in parallel (icons, metadata, tests) — cheap, ships confidence.

Dependency map: `2a → (2c, 2d, 3, 4b)` · `2b → (3, 4b)` · `2d → 4b` · **4a is independent.**
