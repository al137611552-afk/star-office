import { fetchStatus, fetchYesterdayMemo, setOfficeState } from './core/api.js';
import { createGameConfig } from './scene/office-scene.js';
import { setupUI } from './ui/dom.js';

async function main() {
  const ui = setupUI(async (stateName, detail) => {
    await setOfficeState(stateName, detail);
    const status = await fetchStatus();
    scene.setStatus(status);
  });
  const game = new Phaser.Game(createGameConfig());

  await new Promise((resolve) => {
    game.events.once('ready', resolve);
    setTimeout(resolve, 500);
  });

  const scene = game.scene.keys.office;

  const initialStatus = await fetchStatus();
  scene.setStatus(initialStatus);

  const memo = await fetchYesterdayMemo();
  if (memo?.success) {
    ui.setMemo(memo.date, memo.memo);
  }

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
