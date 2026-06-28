// Templates view — browse templates for the provider's specialty, create custom.

import { listTemplates } from '../templates/templateLibrary.js';
import { kvGet } from '../core/storageBackend.js';
import { specialtyLabel } from '../core/specialties.js';

export function renderTemplatesView() {
  const provider = kvGet('note_provider_v1::profile') || {};
  const templates = listTemplates(provider.specialty);

  return `
    <div class="templates-page">
      <div class="templates-header">
        <h2 class="settings-title">Note Templates</h2>
      </div>
      <div class="templates-grid">
        ${templates.map(t => renderTemplateCard(t)).join('')}
      </div>
    </div>
  `;
}

function renderTemplateCard(t) {
  return `
    <div class="template-card ${t.custom ? 'template-card--custom' : ''}">
      <div class="tc-name">${t.name}</div>
      <div class="tc-specialty">${specialtyLabel(t.specialty)}</div>
      <div class="tc-sections">${(t.sections || []).slice(0, 4).join(' · ')}${(t.sections || []).length > 4 ? ' …' : ''}</div>
      ${t.custom ? '<span class="tc-badge">Custom</span>' : '<span class="tc-badge tc-badge--builtin">Built-in</span>'}
    </div>
  `;
}
