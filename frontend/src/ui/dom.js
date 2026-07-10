import { STRINGS, DETAIL_KEY_BY_STATE, resolveOfficeDetail } from '../config/i18n.js?v=step15b';

const AREA_KEY_BY_STATE = {
  idle: 'areaIdle',
  writing: 'areaWriting',
  researching: 'areaResearching',
  executing: 'areaExecuting',
  syncing: 'areaSyncing',
  error: 'areaError',
};

const STATE_LABEL_KEY_BY_STATE = {
  idle: 'stateIdle',
  writing: 'stateWriting',
  researching: 'stateResearching',
  executing: 'stateExecuting',
  syncing: 'stateSyncing',
  error: 'stateError',
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
    currentStatusPayload: null,
    currentActivityHistory: [],
    observerMode: false,
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
    metaPanel: document.getElementById('meta-panel'),
    metaTitle: document.getElementById('meta-title'),
    metaKicker: document.getElementById('meta-kicker'),
    metaStateLabel: document.getElementById('meta-state-label'),
    metaSummary: document.getElementById('meta-summary'),
    metaLabelFocus: document.getElementById('meta-label-focus'),
    metaLabelBranch: document.getElementById('meta-label-branch'),
    metaLabelChanges: document.getElementById('meta-label-changes'),
    metaLabelMode: document.getElementById('meta-label-mode'),
    metaLabelCommand: document.getElementById('meta-label-command'),
    metaValueFocus: document.getElementById('meta-value-focus'),
    metaValueBranch: document.getElementById('meta-value-branch'),
    metaValueChanges: document.getElementById('meta-value-changes'),
    metaValueMode: document.getElementById('meta-value-mode'),
    metaCommand: document.getElementById('meta-command'),
    metaCommandBadge: document.getElementById('meta-command-badge'),
    metaValueCommand: document.getElementById('meta-value-command'),
    metaFilesDetails: document.getElementById('meta-files-details'),
    metaFilesSummary: document.getElementById('meta-files-summary'),
    metaFilesList: document.getElementById('meta-files-list'),
    metaHistoryDetails: document.getElementById('meta-history-details'),
    metaHistorySummary: document.getElementById('meta-history-summary'),
    metaHistoryList: document.getElementById('meta-history-list'),
    consoleBadge: document.getElementById('console-badge'),
    shellDone: document.getElementById('shell-done'),
    memoBody: document.getElementById('memo-body'),
    memoDate: document.getElementById('memo-date'),
    statusLine: document.getElementById('status-line'),
    langButtons: [...document.querySelectorAll('[data-lang]')],
    stateTestButtons: [...document.querySelectorAll('[data-state]')],
    statesLabel: document.getElementById('states-label'),
    statesHint: document.getElementById('states-hint'),
  };

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

  function formatCount(strings, count) {
    if (count <= 0) return strings.changesZero;
    if (count === 1) return strings.changesOne;
    return (strings.changesMany || '{count}').replace('{count}', String(count));
  }

  function trimMiddle(text, max = 32) {
    const value = (text || '').trim();
    if (!value) return '';
    if (value.length <= max) return value;
    const head = Math.ceil((max - 1) / 2);
    const tail = Math.floor((max - 1) / 2);
    return `${value.slice(0, head)}…${value.slice(-tail)}`;
  }

  function trimCommand(text, max = 54) {
    const value = (text || '').replace(/\s+/g, ' ').trim();
    if (!value) return '';
    return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
  }

  function resolveModeText(strings, payload) {
    const mode = payload?.mode === 'manual' ? strings.modeManual : strings.modeAuto;
    const source = (payload?.source || '').replace(/^auto-/, '').replace(/^manual-/, '').replace(/-/g, ' ').trim();
    return source ? `${mode} · ${source}` : mode;
  }

  function renderChangedFiles(strings, payload) {
    const files = Array.isArray(payload?.changed_files) ? payload.changed_files : [];
    refs.metaFilesDetails.hidden = files.length === 0;
    refs.metaFilesSummary.textContent = (strings.filesSummary || '{count}').replace('{count}', String(files.length));
    refs.metaFilesList.replaceChildren(...files.map((path) => {
      const item = document.createElement('div');
      item.className = 'meta-file-item';
      item.textContent = path;
      item.title = path;
      return item;
    }));
    if (files.length === 0) refs.metaFilesDetails.open = false;
  }

  function formatActivityTime(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString(state.locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function renderActivityHistory(strings) {
    const items = Array.isArray(state.currentActivityHistory) ? state.currentActivityHistory : [];
    refs.metaHistorySummary.textContent = (strings.historySummary || '{count}').replace('{count}', String(items.length));

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'meta-history-empty';
      empty.textContent = strings.historyEmpty;
      refs.metaHistoryList.replaceChildren(empty);
      return;
    }

    refs.metaHistoryList.replaceChildren(...items.map((entry) => {
      const item = document.createElement('div');
      item.className = 'meta-history-item';
      item.dataset.state = entry.state || 'idle';

      const dot = document.createElement('span');
      dot.className = 'meta-history-dot';

      const copy = document.createElement('div');
      copy.className = 'meta-history-copy';

      const head = document.createElement('div');
      head.className = 'meta-history-head';
      const stateKey = STATE_LABEL_KEY_BY_STATE[entry.state] || STATE_LABEL_KEY_BY_STATE.idle;
      const label = document.createElement('span');
      label.className = 'meta-history-state';
      label.textContent = entry?.state_labels?.[state.locale] || strings[stateKey] || entry.state;
      const time = document.createElement('time');
      time.className = 'meta-history-time';
      time.dateTime = entry.recorded_at || '';
      time.textContent = formatActivityTime(entry.recorded_at);
      head.append(label, time);

      const fullDetail = resolveOfficeDetail(state.locale, entry.state || 'idle', entry);
      const detail = document.createElement('div');
      detail.className = 'meta-history-detail';
      detail.textContent = trimCommand(fullDetail, state.locale === 'en' ? 48 : 30);
      detail.title = fullDetail;

      copy.append(head, detail);
      item.append(dot, copy);
      return item;
    }));
  }

  function renderMeta(strings) {
    const payload = state.currentStatusPayload || {};
    const localizedDetail = resolveOfficeDetail(state.locale, state.currentOfficeState, {
      detail: state.currentOfficeDetail,
      detail_i18n: state.currentOfficeDetailI18n,
    });
    const runningCommand = payload?.running_command?.command || '';
    const stateLabelKey = STATE_LABEL_KEY_BY_STATE[state.currentOfficeState] || STATE_LABEL_KEY_BY_STATE.idle;

    refs.metaPanel.dataset.state = state.currentOfficeState;
    refs.metaPanel.dataset.mode = payload?.mode || 'auto';
    refs.metaKicker.textContent = strings.metaKicker;
    refs.metaStateLabel.textContent = payload?.state_labels?.[state.locale] || strings[stateLabelKey] || state.currentOfficeState;
    refs.metaSummary.textContent = strings.metaSummary;
    refs.metaLabelFocus.textContent = strings.metaLabelFocus;
    refs.metaLabelBranch.textContent = strings.metaLabelBranch;
    refs.metaLabelChanges.textContent = strings.metaLabelChanges;
    refs.metaLabelMode.textContent = strings.metaLabelMode;
    refs.metaLabelCommand.textContent = strings.metaLabelCommand;
    refs.metaValueFocus.textContent = localizedDetail || strings.detailIdle;
    refs.metaValueBranch.textContent = trimMiddle(payload.branch || strings.branchFallback, state.locale === 'en' ? 22 : 18);
    refs.metaValueChanges.textContent = formatCount(strings, Number(payload.changed_file_count || 0));
    refs.metaValueMode.textContent = resolveModeText(strings, payload);
    refs.metaCommand.classList.toggle('is-live', Boolean(runningCommand));
    refs.metaCommandBadge.textContent = runningCommand ? strings.commandLive : strings.commandRecent;
    refs.metaValueCommand.textContent = trimCommand(
      runningCommand || localizedDetail || strings.commandFallback,
      state.locale === 'en' ? 52 : 28,
    );
    renderChangedFiles(strings, payload);
    renderActivityHistory(strings);
  }

  function updateStateTestLabels(strings) {
    if (refs.statesLabel) refs.statesLabel.textContent = strings.statesLabel;
    if (refs.statesHint) refs.statesHint.textContent = state.observerMode ? strings.observerHint : strings.statesHint;
    if (refs.consoleBadge) refs.consoleBadge.textContent = strings.consoleBadge;
    refs.stateTestButtons.forEach((button) => {
      const key = button.dataset.labelKey;
      if (key && strings[key]) button.textContent = strings[key];
      button.title = state.observerMode ? strings.observerHint : '';
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

  refs.metaFilesDetails.addEventListener('toggle', () => {
    if (refs.metaFilesDetails.open) refs.metaHistoryDetails.open = false;
  });

  refs.metaHistoryDetails.addEventListener('toggle', () => {
    if (refs.metaHistoryDetails.open) refs.metaFilesDetails.open = false;
  });

  refs.stateTestButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (state.observerMode) return;
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
    state.currentStatusPayload = payload;

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
    setActivityHistory(items) {
      state.currentActivityHistory = Array.isArray(items) ? items : [];
      renderActivityHistory(state.strings);
    },
    setObserverMode(enabled) {
      state.observerMode = Boolean(enabled);
      document.body.dataset.observerMode = state.observerMode ? 'remote' : 'local';
      refs.stateTestButtons.forEach((button) => {
        button.disabled = state.observerMode;
        button.title = state.observerMode ? state.strings.observerHint : '';
      });
      updateStateTestLabels(state.strings);
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
