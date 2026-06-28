// First-run onboarding — collect provider info and Anthropic API key.
// The transcription model is bundled with the app, so there's no download step.

import { kvGet, kvSet } from '../core/storageBackend.js';
import { toast } from '../utils/format.js';

const PROVIDER_KEY = 'note_provider_v1::profile';
const ONBOARDED_KEY = 'note_settings_v1::onboarded';

export function isOnboarded() {
  return !!kvGet(ONBOARDED_KEY);
}

export function renderOnboarding() {
  return `
    <div class="onboarding-backdrop">
      <div class="onboarding-card">
        <img class="onboarding-logo-img" src="/tahlk-logo.png" alt="Tahlk — AI-native ambient scribe" />
        <h1 class="onboarding-title">Set up Tahlk</h1>

        <div class="onboarding-steps">

          <!-- Step 1: Provider info -->
          <div class="onboarding-step" id="step-provider">
            <div class="step-num">1</div>
            <div class="step-body">
              <h3>Your provider profile</h3>
              <div class="field-row">
                <label>Full name <span class="req">*</span></label>
                <input id="ob-name" type="text" placeholder="Dr. Jane Smith" autocomplete="name" />
              </div>
              <div class="field-row">
                <label>Credentials</label>
                <input id="ob-creds" type="text" placeholder="MD, PMHNP-BC, LCSW…" />
              </div>
              <div class="field-row">
                <label>Specialty</label>
                <select id="ob-specialty">
                  <option value="psychiatry">Psychiatry</option>
                  <option value="behavioral-health">Behavioral Health / Therapy</option>
                  <option value="psychology">Psychology</option>
                  <option value="podiatry">Podiatry</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 2: Whisper model -->
          <div class="onboarding-step" id="step-model">
            <div class="step-num">2</div>
            <div class="step-body">
              <h3>Transcription model</h3>
              <p class="step-desc">Transcription runs entirely on this device, so no audio ever leaves your computer — nothing to download or set up.</p>
              <div class="model-status">✓ Included — ready to use</div>
            </div>
          </div>

          <!-- Step 3: Anthropic API key -->
          <div class="onboarding-step" id="step-apikey">
            <div class="step-num">3</div>
            <div class="step-body">
              <h3>Note generation API key</h3>
              <p class="step-desc">Tahlk uses Claude (Anthropic) to turn transcripts into clinical notes. Add your key now or later in Settings — recording and transcription work without it. Stored on this device only, never sent to Tahlk servers.</p>
              <div class="field-row">
                <label>Anthropic API key (optional)</label>
                <input id="ob-apikey" type="password" placeholder="sk-ant-…" autocomplete="off" />
              </div>
              <p class="step-hint"><a href="#" id="ob-apikey-link">Get a key at console.anthropic.com →</a></p>
            </div>
          </div>

        </div>

        <div class="onboarding-footer">
          <button class="btn btn-primary btn-lg" id="ob-finish">Start using Tahlk</button>
        </div>
      </div>
      <div class="toast" id="toast"><span id="toast-msg"></span></div>
    </div>
  `;
}

export async function wireOnboarding(onComplete) {
  document.getElementById('ob-finish')?.addEventListener('click', async () => {
    const name = document.getElementById('ob-name')?.value.trim();
    if (!name) { toast('Provider name is required.'); return; }

    const apiKey = document.getElementById('ob-apikey')?.value.trim();

    kvSet(PROVIDER_KEY, {
      name,
      credentials: document.getElementById('ob-creds')?.value.trim() || '',
      specialty:   document.getElementById('ob-specialty')?.value || 'psychiatry',
    });
    if (apiKey) kvSet('note_settings_v1::anthropic_api_key', apiKey);
    kvSet(ONBOARDED_KEY, true);

    onComplete();
  });
}
