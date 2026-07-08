import { GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '../config/layout.js';

const AREA_COLORS = {
  writing: 0x22c55e,
  breakroom: 0xffd700,
  error: 0xe94560,
  door: 0x8fbe4a,
};

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super('office');
    this.currentState = 'idle';
  }

  preload() {
    this.load.image('office-bg', '/static/assets/office_bg_small.webp');
    this.load.image('star-idle', '/static/assets/star-idle-v5.png');
    this.load.image('sofa-idle', '/static/assets/sofa-idle-v3.png');
    this.load.image('desk', '/static/assets/desk-v3.webp');

    this.load.on('progress', (value) => {
      window.dispatchEvent(new CustomEvent('asset-progress', { detail: value }));
    });
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'office-bg').setOrigin(0.5).setDepth(0);

    this.add.image(LAYOUT.furniture.sofa.x, LAYOUT.furniture.sofa.y, 'sofa-idle')
      .setOrigin(0.5, 0.5)
      .setDepth(LAYOUT.furniture.sofa.depth);

    this.add.image(LAYOUT.furniture.desk.x, LAYOUT.furniture.desk.y, 'desk')
      .setOrigin(0, 0.5)
      .setDepth(LAYOUT.furniture.desk.depth)
      .setScale(1);

    this.star = this.add.image(640, 558, 'star-idle')
      .setOrigin(0.5, 1)
      .setDepth(1600);

    this.drawMarkers();
    this.drawPlaque();
  }

  drawMarkers() {
    Object.entries(LAYOUT.areas).forEach(([name, pos]) => {
      const color = AREA_COLORS[name] || 0xffffff;
      const dot = this.add.circle(pos.x, pos.y, 6, color, 0.95).setDepth(4000);
      const label = this.add.text(pos.x, pos.y - 18, name, {
        fontFamily: 'ArkPixelLatin, monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4001);
      dot.setData('label', label);
    });
  }

  drawPlaque() {
    const { x, y, width, height } = LAYOUT.plaque;
    const bg = this.add.rectangle(x, y, width, height, 0x5d4037).setDepth(3000);
    bg.setStrokeStyle(3, 0x3e2723);
    this.plaqueText = this.add.text(x, y, 'WAITING...', {
      fontFamily: 'ArkPixelLatin, monospace',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3001);
  }

  setStatus(state) {
    this.currentState = state.state || 'idle';
    if (this.plaqueText) {
      this.plaqueText.setText(String(this.currentState || 'idle').toUpperCase());
    }
    window.dispatchEvent(new CustomEvent('office-status', { detail: state }));
  }
}

export function createGameConfig() {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    transparent: false,
    backgroundColor: '#1a1a2e',
    scene: [OfficeScene],
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
  };
}
