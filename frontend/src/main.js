import { fetchStatus, fetchYesterdayMemo, setOfficeState } from './core/api.js?v=step7';
import { createGameConfig } from './scene/office-scene.js?v=step7';
import { setupUI } from './ui/dom.js?v=step7';

async function main() {
  let ui;
  let scene;

  async function refreshMemo(locale) {
    const memo = await fetchYesterdayMemo(locale);
    if (memo?.success && ui) {
      ui.setMemo(memo.date, memo.memo);
    }
  }

  ui = setupUI(
    async (stateName, detail) => {
      await setOfficeState(stateName, detail);
      const status = await fetchStatus();
      scene.setStatus(status);
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
}

main().catch((error) => {
  console.error(error);
  const el = document.getElementById('loading-text');
  if (el) el.textContent = `Failed: ${error.message}`;
});
