// Group (Pro/Firm) entry point.
// Installs Group-tier capabilities (active provider/user from the practice roster),
// then boots the shared app shell. Reuses the shared core + app UI; Group-specific
// UI (roster switcher, practice dashboard) grows under src/group/. The Solo build
// never imports this module — enforced by tests/build/test_solo_excludes_group.mjs.

import { installCapabilities, currentProvider } from './core/capabilities.js';
import { kvWarmup } from './core/storageBackend.js';
import { ensureRosterSeeded, groupCapabilities } from './group/groupCapabilities.js';

import { isOnboarded, renderOnboarding, wireOnboarding } from './solo/onboarding.js';
import { renderHeader, wireHeaderNav } from './solo/soloHeader.js';
import { renderHomeScreen, wireHomeScreen } from './solo/homeScreen.js';
import { renderEncounterPanel, wireEncounterPanel } from './solo/encounterPanel.js';
import { renderSettings, wireSettings } from './solo/settingsModal.js';
import { renderTemplatesView } from './solo/templatesView.js';

let _currentTab = 'sessions';
let _openEncounter = null;

async function bootstrap() {
  await kvWarmup();
  installCapabilities(groupCapabilities());

  if (!isOnboarded()) {
    document.getElementById('app').innerHTML = renderOnboarding();
    await wireOnboarding(() => {
      ensureRosterSeeded();            // seed roster from the just-entered profile
      _currentTab = 'sessions';
      renderApp();
    });
    return;
  }

  ensureRosterSeeded();               // existing install: seed from saved profile if empty
  renderApp();
}

// Minimal Group marker so the build is visibly the Pro/Firm tier and the active
// provider (via the capability seam) is shown. Replaced by the roster switcher next.
function renderGroupBanner() {
  const p = currentProvider();
  return `
    <div style="display:flex;gap:16px;align-items:center;padding:6px 16px;
                background:var(--navy,#16263f);color:#fff;font-size:12px;font-weight:600;">
      <span>Group · Pro / Firm</span>
      <span style="font-weight:400;">Active provider: <strong>${p?.name || '—'}</strong></span>
    </div>
  `;
}

async function renderApp() {
  const root = document.getElementById('app');
  root.innerHTML = `
    ${renderGroupBanner()}
    ${renderHeader(_currentTab)}
    <main class="app-main" id="main-content"></main>
    <div class="toast" id="toast"><span id="toast-msg"></span></div>
  `;

  wireHeaderNav(tab => {
    _currentTab = tab;
    _openEncounter = null;
    renderApp();
  });

  await renderMainContent();
}

async function renderMainContent() {
  const main = document.getElementById('main-content');
  if (!main) return;

  if (_openEncounter) {
    main.innerHTML = renderEncounterPanel(_openEncounter);
    wireEncounterPanel(
      _openEncounter,
      () => { _openEncounter = null; renderApp(); },
      updated => { _openEncounter = updated; },
    );
    return;
  }

  if (_currentTab === 'sessions') {
    main.innerHTML = await renderHomeScreen();
    await wireHomeScreen(encounter => {
      _openEncounter = encounter;
      renderMainContent();
    });
  } else if (_currentTab === 'templates') {
    main.innerHTML = renderTemplatesView();
  } else if (_currentTab === 'settings') {
    main.innerHTML = await renderSettings();
    wireSettings();
  }
}

bootstrap();
