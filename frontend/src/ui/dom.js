import { STRINGS, DETAIL_KEY_BY_STATE, resolveOfficeDetail } from '../config/i18n.js?v=step11a';

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

const AREA_KEY_BY_STATE = {
  idle: 'areaIdle',
  writing: 'areaWriting',
  researching: 'areaResearching',
  executing: 'areaExecuting',
  syncing: 'areaSyncing',
  error: 'areaError',
};

const TYPEWRITER_DELAY = 50;

export function setupUI(onStateSelect, onLocaleChange) {
  const state = {
    locale: 'zh',
    strings: STRINGS.zh,
    statusTimer: null,
    statusText: '',
    statusTarget: '',
    currentOfficeState: 'idle',
    currentOfficeDetail: STRINGS.zh.detailIdle,
    currentOfficeDetailI18n: null,
    currentMemoDate: '2026-02-26',
    currentMemoBody: '',
  };

  const refs = {
    loadingText: document.getElementById('loading-text'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingBar: document.getElementById('loading-progress-bar'),
    officeTitle: document.getElementById('office-title'),
    controlTitle: document.getElementById('control-title'),
    memoTitle: document.getElementById('memo-title'),
    memoKicker: document.getElementById('memo-kicker'),
    memoStamp: document.getElementById('memo-stamp'),
    metaTitle: document.getElementById('meta-title'),
    metaKicker: document.getElementById('meta-kicker'),
    metaSummary: document.getElementById('meta-summary'),
    metaLabelScene: document.getElementById('meta-label-scene'),
    metaLabelFocus: document.getElementById('meta-label-focus'),
    metaLabelMotion: document.getElementById('meta-label-motion'),
    metaLabelBubbles: document.getElementById('meta-label-bubbles'),
    metaLabelPalette: document.getElementById('meta-label-palette'),
    metaValueScene: document.getElementById('meta-value-scene'),
    metaValueFocus: document.getElementById('meta-value-focus'),
    metaValueMotion: document.getElementById('meta-value-motion'),
    metaValueBubbles: document.getElementById('meta-value-bubbles'),
    consoleBadge: document.getElementById('console-badge'),
    shellDone: document.getElementById('shell-done'),
    memoBody: document.getElementById('memo-body'),
    memoDate: document.getElementById('memo-date'),
    statusLine: document.getElementById('status-line'),
    paletteList: document.getElementById('palette-list'),
    langButtons: [...document.querySelectorAll('[data-lang]')],
    stateTestButtons: [...document.querySelectorAll('[data-state]')],
    statesLabel: document.getElementById('states-label'),
    statesHint: document.getElementById('states-hint'),
  };

  function renderPalette() {
    refs.paletteList.innerHTML = PALETTE.map(([hex, label]) => `
      <span class="palette-swatch"><span class="palette-chip" style="background:${hex}"></span>${label}</span>
    `).join('');
  }

  function getAreaLabel(strings, stateName) {
    const key = AREA_KEY_BY_STATE[stateName] || AREA_KEY_BY_STATE.idle;
    return strings[key] || stateName;
  }

  function renderMemo(strings) {
    refs.memoKicker.textContent = strings.memoKicker;
    refs.memoStamp.textContent = strings.memoStamp;
    refs.memoDate.textContent = state.currentMemoDate;
    refs.memoBody.textContent = state.currentMemoBody || '';
  }

  function renderMeta(strings) {
    const localizedDetail = resolveOfficeDetail(state.locale, state.currentOfficeState, {
      detail: state.currentOfficeDetail,
      detail_i18n: state.currentOfficeDetailI18n,
    });
    refs.metaKicker.textContent = strings.metaKicker;
    refs.metaSummary.textContent = strings.metaSummary;
    refs.metaLabelScene.textContent = strings.metaLabelScene;
    refs.metaLabelFocus.textContent = strings.metaLabelFocus;
    refs.metaLabelMotion.textContent = strings.metaLabelMotion;
    refs.metaLabelBubbles.textContent = strings.metaLabelBubbles;
    refs.metaLabelPalette.textContent = strings.metaLabelPalette;
    refs.metaValueScene.textContent = getAreaLabel(strings, state.currentOfficeState);
    refs.metaValueFocus.textContent = localizedDetail || strings.detailIdle;
    refs.metaValueMotion.textContent = strings.metaMotionValue;
    refs.metaValueBubbles.textContent = strings.metaBubbleValue;
    renderPalette();
  }

  function updateStateTestLabels(strings) {
    if (refs.statesLabel) refs.statesLabel.textContent = strings.statesLabel;
    if (refs.statesHint) refs.statesHint.textContent = strings.statesHint;
    if (refs.consoleBadge) refs.consoleBadge.textContent = strings.consoleBadge;
    refs.stateTestButtons.forEach((button) => {
      const key = button.dataset.labelKey;
      if (key && strings[key]) button.textContent = strings[key];
    });
  }

  function formatStatusLine(stateLabel, detail) {
    const base = `${stateLabel} · ${detail}`;
    if (state.locale !== 'en' || base.length <= 34) return base;
    const splitIndex = detail.lastIndexOf(' ', 22);
    if (splitIndex > 6) {
      return `${stateLabel} · ${detail.slice(0, splitIndex)}\n${detail.slice(splitIndex + 1)}`;
    }
    return base;
  }

  function typeStatus(nextText) {
    if (state.statusTarget === nextText && refs.statusLine.textContent === nextText) return;
    if (state.statusTarget === nextText && state.statusTimer) return;
    if (state.statusTimer) {
      clearInterval(state.statusTimer);
      state.statusTimer = null;
    }
    state.statusTarget = nextText;
    state.statusText = '';
    refs.statusLine.textContent = '';
    let index = 0;
    state.statusTimer = setInterval(() => {
      state.statusText += state.statusTarget[index] || '';
      refs.statusLine.textContent = state.statusText;
      index += 1;
      if (index >= state.statusTarget.length) {
        clearInterval(state.statusTimer);
        state.statusTimer = null;
      }
    }, TYPEWRITER_DELAY);
  }

  function applyLocale(locale, options = {}) {
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
    updateStateTestLabels(strings);
    renderMemo(strings);
    renderMeta(strings);

    refs.langButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.lang === locale);
    });

    window.dispatchEvent(new CustomEvent('office-locale', { detail: { locale } }));

    if (!options.skipNotify && onLocaleChange) {
      onLocaleChange(locale);
    }
  }

  refs.langButtons.forEach((button) => {
    button.addEventListener('click', () => applyLocale(button.dataset.lang));
  });

  refs.stateTestButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const stateName = button.dataset.state;
      const detailKey = button.dataset.detailKey;
      const detail = state.strings[detailKey] || stateName;
      const detailI18n = Object.fromEntries(
        Object.entries(STRINGS).map(([locale, bundle]) => [locale, bundle[detailKey] || detail])
      );
      if (onStateSelect) onStateSelect(stateName, detail, detailI18n);
      setActiveStateButton(stateName);
    });
  });

  function setActiveStateButton(stateName) {
    refs.stateTestButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.state === stateName);
    });
  }

  window.addEventListener('asset-progress', (event) => {
    refs.loadingBar.style.width = `${Math.round(event.detail * 100)}%`;
  });

  window.addEventListener('office-status', (event) => {
    const payload = event.detail || {};
    const nextState = payload.state || 'idle';
    const stateLabel = payload.stateLabel || nextState;
    const detail = resolveOfficeDetail(state.locale, nextState, payload);

    state.currentOfficeState = nextState;
    state.currentOfficeDetail = payload.detail || '';
    state.currentOfficeDetailI18n = payload.detail_i18n || null;

    typeStatus(formatStatusLine(stateLabel, detail));
    setActiveStateButton(nextState);
    renderMeta(state.strings);
  });

  applyLocale('zh', { skipNotify: true });
  setActiveStateButton('idle');

  return {
    hideLoading() {
      refs.loadingOverlay.style.display = 'none';
    },
    setMemo(date, memo) {
      state.currentMemoDate = date;
      state.currentMemoBody = memo;
      renderMemo(state.strings);
    },
    getStateDetail(stateName) {
      const key = DETAIL_KEY_BY_STATE[stateName] || `detail${stateName.charAt(0).toUpperCase()}${stateName.slice(1)}`;
      return state.strings[key] || stateName;
    },
    setActiveStateButton,
    getLocale() {
      return state.locale;
    },
    applyLocale,
  };
}
