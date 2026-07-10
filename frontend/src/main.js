import { fetchActivityHistory, fetchStatus, fetchYesterdayMemo, setOfficeState } from './core/api.js?v=step14b';
import { createGameConfig } from './scene/office-scene.js?v=step14b';
import { setupUI } from './ui/dom.js?v=step14b';

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

  ui = setupUI(
    async (stateName, detail, detailI18n) => {
      await setOfficeState(stateName, detail, detailI18n);
      const status = await fetchStatus();
      scene.setStatus(status);
      await refreshActivityHistory();
    },
    async (locale) => {
      try {
        await refreshMemo(locale);
      } catch (error) {
        console.error(error);
      }
    }
  );

  const game = new Phaser.Game(createGameConfig());

  await new Promise((resolve) => {
    game.events.once('ready', resolve);
    setTimeout(resolve, 500);
  });

  scene = game.scene.keys.office;

  const initialStatus = await fetchStatus();
  scene.setStatus(initialStatus);

  await refreshActivityHistory();
  await refreshMemo(ui.getLocale());

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
