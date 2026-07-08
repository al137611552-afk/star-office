import { STRINGS } from '../config/i18n.js';

const PALETTE = [
  ['#1a1a2e', 'bg-page'],
  ['#141722', 'panel'],
  ['#64477d', 'stage-shadow'],
  ['#ffd700', 'gold'],
  ['#e94560', 'rose'],
  ['#22c55e', 'green'],
  ['#78a340', 'olive'],
  ['#5d4037', 'plaque'],
];

export function setupUI() {
  const state = {
    locale: 'zh',
    strings: STRINGS.zh,
  };

  const refs = {
    loadingText: document.getElementById('loading-text'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingBar: document.getElementById('loading-progress-bar'),
    officeTitle: document.getElementById('office-title'),
    controlTitle: document.getElementById('control-title'),
    memoTitle: document.getElementById('memo-title'),
    metaTitle: document.getElementById('meta-title'),
    shellDone: document.getElementById('shell-done'),
    memoBody: document.getElementById('memo-body'),
    memoDate: document.getElementById('memo-date'),
    statusLine: document.getElementById('status-line'),
    paletteList: document.getElementById('palette-list'),
    stateButtons: [...document.querySelectorAll('[data-lang]')],
  };

  function renderPalette() {
    refs.paletteList.innerHTML = PALETTE.map(([hex, label]) => `
      <span class="palette-swatch"><span class="palette-chip" style="background:${hex}"></span>${label} ${hex}</span>
    `).join('');
  }

  function applyLocale(locale) {
    const strings = STRINGS[locale] || STRINGS.zh;
    state.locale = locale;
    state.strings = strings;
    document.documentElement.lang = locale;
    document.body.dataset.locale = locale;
    document.documentElement.style.setProperty(
      '--font-pixel-ui',
      locale === 'ja' ? 'var(--font-pixel-ja)' : locale === 'en' ? 'var(--font-pixel-latin)' : 'var(--font-pixel-zh)'
    );

    refs.loadingText.textContent = strings.loading;
    refs.officeTitle.textContent = strings.officeTitle;
    refs.controlTitle.textContent = strings.controlTitle;
    refs.memoTitle.textContent = strings.memoTitle;
    refs.metaTitle.textContent = strings.metaTitle;
    refs.shellDone.textContent = strings.shellDone;
    refs.memoBody.textContent = strings.memoBody;

    refs.stateButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.lang === locale);
    });
  }

  refs.stateButtons.forEach((button) => {
    button.addEventListener('click', () => applyLocale(button.dataset.lang));
  });

  window.addEventListener('asset-progress', (event) => {
    refs.loadingBar.style.width = `${Math.round(event.detail * 100)}%`;
  });

  window.addEventListener('office-status', (event) => {
    const payload = event.detail || {};
    refs.statusLine.textContent = `state=${payload.state || 'idle'} | detail=${payload.detail || '-'} | updated_at=${payload.updated_at || '-'}`;
  });

  renderPalette();
  applyLocale('zh');

  return {
    hideLoading() {
      refs.loadingOverlay.style.display = 'none';
    },
    setMemo(date, memo) {
      refs.memoDate.textContent = date;
      refs.memoBody.textContent = memo;
    },
  };
}
