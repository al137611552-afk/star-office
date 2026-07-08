import { GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '../config/layout.js';

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super('office');
    this.currentState = 'idle';
  }

  preload() {
    this.load.image('office-bg', '/static/assets/office_bg_small.webp');
    this.load.image('sofa-idle', '/static/assets/sofa-idle-v3.png');
    this.load.image('sofa-shadow', '/static/assets/sofa-shadow-v1.png');
    this.load.image('desk', '/static/assets/desk-v3.webp');
    this.load.image('star-idle', '/static/assets/star-idle-v5.png');
    this.load.spritesheet('plants', '/static/assets/plants-spritesheet.webp', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('posters', '/static/assets/posters-spritesheet.webp', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('coffee-machine', '/static/assets/coffee-machine-v3-grid.webp', { frameWidth: 230, frameHeight: 230 });
    this.load.image('coffee-machine-shadow', '/static/assets/coffee-machine-shadow-v1.png');
    this.load.spritesheet('serverroom', '/static/assets/serverroom-spritesheet.webp', { frameWidth: 180, frameHeight: 251 });
    this.load.spritesheet('flowers', '/static/assets/flowers-bloom-v2.webp', { frameWidth: 65, frameHeight: 65 });
    this.load.spritesheet('star-working', '/static/assets/star-working-spritesheet-grid.webp', { frameWidth: 230, frameHeight: 144 });
    this.load.spritesheet('error-bug', '/static/assets/error-bug-spritesheet-grid.webp', { frameWidth: 180, frameHeight: 180 });
    this.load.spritesheet('sync-anim', '/static/assets/sync-animation-v3-grid.webp', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('cats', '/static/assets/cats-spritesheet.webp', { frameWidth: 160, frameHeight: 160 });

    this.load.on('progress', (value) => {
      window.dispatchEvent(new CustomEvent('asset-progress', { detail: value }));
    });
  }

  create() {
    const bg = this.add.image(LAYOUT.stage.background.x, LAYOUT.stage.background.y, 'office-bg');
    bg.setOrigin(0.5).setDepth(0);

    const { furniture } = LAYOUT;

    this.add.image(furniture.sofaShadow.x, furniture.sofaShadow.y, 'sofa-shadow')
      .setOrigin(furniture.sofaShadow.origin.x, furniture.sofaShadow.origin.y)
      .setDepth(furniture.sofaShadow.depth);

    this.add.image(furniture.sofa.x, furniture.sofa.y, 'sofa-idle')
      .setOrigin(furniture.sofa.origin.x, furniture.sofa.origin.y)
      .setDepth(furniture.sofa.depth);

    furniture.plants.forEach((plant) => {
      this.add.sprite(plant.x, plant.y, 'plants', plant.frame)
        .setOrigin(0.5)
        .setDepth(plant.depth);
    });

    this.add.sprite(furniture.poster.x, furniture.poster.y, 'posters', furniture.poster.frame)
      .setOrigin(0.5)
      .setDepth(furniture.poster.depth);

    this.add.sprite(furniture.serverroom.x, furniture.serverroom.y, 'serverroom', furniture.serverroom.frame)
      .setOrigin(furniture.serverroom.origin.x, furniture.serverroom.origin.y)
      .setDepth(furniture.serverroom.depth);

    this.add.image(furniture.coffeeMachineShadow.x, furniture.coffeeMachineShadow.y, 'coffee-machine-shadow')
      .setOrigin(furniture.coffeeMachineShadow.origin.x, furniture.coffeeMachineShadow.origin.y)
      .setDepth(furniture.coffeeMachineShadow.depth);

    this.add.sprite(furniture.coffeeMachine.x, furniture.coffeeMachine.y, 'coffee-machine', furniture.coffeeMachine.frame)
      .setOrigin(furniture.coffeeMachine.origin.x, furniture.coffeeMachine.origin.y)
      .setDepth(furniture.coffeeMachine.depth);

    this.add.sprite(furniture.syncAnim.x, furniture.syncAnim.y, 'sync-anim', furniture.syncAnim.frame)
      .setOrigin(furniture.syncAnim.origin.x, furniture.syncAnim.origin.y)
      .setDepth(furniture.syncAnim.depth);

    this.add.sprite(furniture.errorBug.x, furniture.errorBug.y, 'error-bug', furniture.errorBug.frame)
      .setOrigin(furniture.errorBug.origin.x, furniture.errorBug.origin.y)
      .setScale(furniture.errorBug.scale)
      .setDepth(furniture.errorBug.depth);

    this.add.sprite(furniture.starWorking.x, furniture.starWorking.y, 'star-working', furniture.starWorking.frame)
      .setOrigin(furniture.starWorking.origin.x, furniture.starWorking.origin.y)
      .setScale(furniture.starWorking.scale)
      .setDepth(furniture.starWorking.depth);

    this.add.image(furniture.desk.x, furniture.desk.y, 'desk')
      .setOrigin(furniture.desk.origin.x, furniture.desk.origin.y)
      .setDepth(furniture.desk.depth);

    this.add.sprite(furniture.flower.x, furniture.flower.y, 'flowers', furniture.flower.frame)
      .setOrigin(furniture.flower.origin.x, furniture.flower.origin.y)
      .setScale(furniture.flower.scale)
      .setDepth(furniture.flower.depth);

    this.add.sprite(furniture.cat.x, furniture.cat.y, 'cats', furniture.cat.frame)
      .setOrigin(furniture.cat.origin.x, furniture.cat.origin.y)
      .setDepth(furniture.cat.depth);

    this.star = this.add.image(furniture.starIdle.x, furniture.starIdle.y, 'star-idle')
      .setOrigin(furniture.starIdle.origin.x, furniture.starIdle.origin.y)
      .setScale(furniture.starIdle.scale)
      .setAlpha(furniture.starIdle.alpha)
      .setDepth(furniture.starIdle.depth);

    this.drawPlaque();
  }

  drawPlaque() {
    const { x, y, width, height } = LAYOUT.plaque;
    const bg = this.add.rectangle(x, y, width, height, 0x5d4037).setDepth(3000);
    bg.setStrokeStyle(3, 0x3e2723);
    this.add.text(x - 190, y, '⭐', {
      fontFamily: 'ArkPixelLatin, monospace',
      fontSize: '20px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3001);
    this.add.text(x + 190, y, '⭐', {
      fontFamily: 'ArkPixelLatin, monospace',
      fontSize: '20px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3001);
    this.plaqueText = this.add.text(x, y, '海辛小龙虾的办公室', {
      fontFamily: 'ArkPixelZH, monospace',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3002);
  }

  setStatus(state) {
    this.currentState = state.state || 'idle';
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
