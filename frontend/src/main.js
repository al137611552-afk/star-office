import { fetchActivityHistory, fetchStatus, fetchYesterdayMemo, isRemoteObserver, setOfficeState } from './core/api.js?v=step15c';
import { createGameConfig } from './scene/office-scene.js?v=step15c';
import { setupUI } from './ui/dom.js?v=step15c';

async function main() {
  let ui;
  let scene;

  async function refreshMemo(locale) {
    const memo = await fetchYesterdayMemo(locale);
    if (memo?.success && ui) {
      ui.setMemo(memo.date, memo.memo);
    }
  }

  async function refreshActivityHistory() {
    const history = await fetchActivityHistory(6);
    if (ui) ui.setActivityHistory(history?.items || []);
  }

  const observerMode = isRemoteObserver();
  const stateHandler = observerMode ? null : async (stateName, detail, detailI18n) => {
    await setOfficeState(stateName, detail, detailI18n);
    const status = await fetchStatus();
    scene.setStatus(status);
    await refreshActivityHistory();
  };

  ui = setupUI(
    stateHandler,
    async (locale) => {
      try {
        await refreshMemo(locale);
      } catch (error) {
        console.error(error);
      }
    }
  );
  ui.setObserverMode(observerMode);

  const game = new Phaser.Game(createGameConfig());

  await new Promise((resolve) => {
    game.events.once('ready', resolve);
    setTimeout(resolve, 500);
  });

  scene = game.scene.keys.office;

  let initialStatus;
  try {
    initialStatus = await fetchStatus();
  } catch (error) {
    console.error(error);
    initialStatus = {
      state: 'error',
      mode: 'auto',
      source: 'observer-unreachable',
      detail: 'Remote observer unavailable; retrying automatically',
      detail_i18n: {
        zh: '远程观察接口暂时无法连接，正在自动重试',
        en: 'Remote observer unavailable; retrying automatically',
        ja: 'リモート監視 API に接続できません。自動再試行中です',
      },
    };
  }
  scene.setStatus(initialStatus);

  void Promise.allSettled([
    refreshActivityHistory(),
    refreshMemo(ui.getLocale()),
  ]);

  ui.hideLoading();

  setInterval(async () => {
    try {
      const status = await fetchStatus();
      scene.setStatus(status);
    } catch (error) {
      console.error(error);
    }
  }, 2000);

  setInterval(async () => {
    try {
      await refreshActivityHistory();
    } catch (error) {
      console.error(error);
    }
  }, 5000);
}

main().catch((error) => {
  console.error(error);
  const el = document.getElementById('loading-text');
  if (el) el.textContent = `Failed: ${error.message}`;
});
