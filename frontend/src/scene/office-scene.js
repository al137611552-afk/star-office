import { GAME_HEIGHT, GAME_WIDTH, LAYOUT } from '../config/layout.js?v=step7';
import { STRINGS } from '../config/i18n.js?v=step7';

const STATES = {
  idle: { labelKey: 'stateIdle', fallback: '待命', area: 'breakroom' },
  writing: { labelKey: 'stateWriting', fallback: '工作', area: 'writing' },
  researching: { labelKey: 'stateResearching', fallback: '搜索信息', area: 'researching' },
  executing: { labelKey: 'stateExecuting', fallback: '执行任务', area: 'writing' },
  syncing: { labelKey: 'stateSyncing', fallback: '同步', area: 'writing' },
  error: { labelKey: 'stateError', fallback: '报警', area: 'error' },
};

const BUBBLE_TEXTS = {
  idle: ['待命中：耳朵竖起来了', '我在这儿，随时可以开工'],
  writing: ['进入专注模式：勿扰', '先把关键路径跑通', '把复杂变简单'],
  researching: ['先搜集上下文', '让我再查一遍资料', '把线索串起来'],
  executing: ['开始落地执行', '把计划变成结果', '现在进入实操阶段'],
  syncing: ['正在同步备份', '别急，我先对齐版本', '把变更安全落盘'],
  error: ['这里有异常', '先别慌，我在排查', '发现 bug，马上处理'],
  cat: ['喵~', '咕噜咕噜…'],
};

const BUBBLE_INTERVAL = 8000;
const CAT_BUBBLE_INTERVAL = 18000;
const TRANSITION_MS = 120;

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super('office');
    this.currentState = 'idle';
    this.currentDetail = 'Waiting...';
    this.locale = 'zh';
    this.lastBubble = 0;
    this.lastCatBubble = 0;
    this.bubble = null;
    this.catBubble = null;
    this.errorBugDir = 1;
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
    this.createAnimations();

    const bg = this.add.image(LAYOUT.stage.background.x, LAYOUT.stage.background.y, 'office-bg');
    bg.setOrigin(0.5).setDepth(0);

    const { furniture } = LAYOUT;

    this.add.image(furniture.sofaShadow.x, furniture.sofaShadow.y, 'sofa-shadow')
      .setOrigin(furniture.sofaShadow.origin.x, furniture.sofaShadow.origin.y)
      .setDepth(furniture.sofaShadow.depth);

    this.sofa = this.add.image(furniture.sofa.x, furniture.sofa.y, 'sofa-idle')
      .setOrigin(furniture.sofa.origin.x, furniture.sofa.origin.y)
      .setDepth(furniture.sofa.depth);
    this.sofaBaseY = this.sofa.y;

    furniture.plants.forEach((plant) => {
      this.add.sprite(plant.x, plant.y, 'plants', plant.frame)
        .setOrigin(0.5)
        .setDepth(plant.depth);
    });

    this.add.sprite(furniture.poster.x, furniture.poster.y, 'posters', furniture.poster.frame)
      .setOrigin(0.5)
      .setDepth(furniture.poster.depth);

    this.serverroom = this.add.sprite(furniture.serverroom.x, furniture.serverroom.y, 'serverroom', furniture.serverroom.frame)
      .setOrigin(furniture.serverroom.origin.x, furniture.serverroom.origin.y)
      .setDepth(furniture.serverroom.depth);

    this.add.image(furniture.coffeeMachineShadow.x, furniture.coffeeMachineShadow.y, 'coffee-machine-shadow')
      .setOrigin(furniture.coffeeMachineShadow.origin.x, furniture.coffeeMachineShadow.origin.y)
      .setDepth(furniture.coffeeMachineShadow.depth);

    this.add.sprite(furniture.coffeeMachine.x, furniture.coffeeMachine.y, 'coffee-machine', furniture.coffeeMachine.frame)
      .setOrigin(furniture.coffeeMachine.origin.x, furniture.coffeeMachine.origin.y)
      .setDepth(furniture.coffeeMachine.depth)
      .play('coffee-machine');

    this.syncAnim = this.add.sprite(furniture.syncAnim.x, furniture.syncAnim.y, 'sync-anim', 0)
      .setOrigin(furniture.syncAnim.origin.x, furniture.syncAnim.origin.y)
      .setDepth(furniture.syncAnim.depth)
      .setVisible(false);

    this.errorBug = this.add.sprite(furniture.errorBug.x, furniture.errorBug.y, 'error-bug', furniture.errorBug.frame)
      .setOrigin(furniture.errorBug.origin.x, furniture.errorBug.origin.y)
      .setScale(furniture.errorBug.scale)
      .setDepth(furniture.errorBug.depth)
      .setVisible(false);
    this.errorBugHomeX = furniture.errorBug.x;

    this.starWorking = this.add.sprite(furniture.starWorking.x, furniture.starWorking.y, 'star-working', furniture.starWorking.frame)
      .setOrigin(furniture.starWorking.origin.x, furniture.starWorking.origin.y)
      .setScale(furniture.starWorking.scale)
      .setDepth(furniture.starWorking.depth)
      .setVisible(false);

    this.add.image(furniture.desk.x, furniture.desk.y, 'desk')
      .setOrigin(furniture.desk.origin.x, furniture.desk.origin.y)
      .setDepth(furniture.desk.depth);

    this.add.sprite(furniture.flower.x, furniture.flower.y, 'flowers', furniture.flower.frame)
      .setOrigin(furniture.flower.origin.x, furniture.flower.origin.y)
      .setScale(furniture.flower.scale)
      .setDepth(furniture.flower.depth);

    this.cat = this.add.sprite(furniture.cat.x, furniture.cat.y, 'cats', furniture.cat.frame)
      .setOrigin(furniture.cat.origin.x, furniture.cat.origin.y)
      .setDepth(furniture.cat.depth);

    this.star = this.add.image(furniture.starIdle.x, furniture.starIdle.y, 'star-idle')
      .setOrigin(furniture.starIdle.origin.x, furniture.starIdle.origin.y)
      .setScale(furniture.starIdle.scale)
      .setAlpha(furniture.starIdle.alpha)
      .setDepth(furniture.starIdle.depth)
      .setVisible(true);
    this.starBaseY = this.star.y;

    this.createAmbientTweens();
    this.drawPlaque();
    window.addEventListener('office-locale', (event) => {
      this.locale = event.detail?.locale || 'zh';
      this.updatePlaque({ state: this.currentState, detail: this.currentDetail });
    });
    this.applyStateVisuals('idle', true);
  }

  createAnimations() {
    if (!this.anims.exists('serverroom-on')) {
      this.anims.create({
        key: 'serverroom-on',
        frames: this.anims.generateFrameNumbers('serverroom', { start: 0, end: 39 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists('coffee-machine')) {
      this.anims.create({
        key: 'coffee-machine',
        frames: this.anims.generateFrameNumbers('coffee-machine', { start: 0, end: 95 }),
        frameRate: 12.5,
        repeat: -1,
      });
    }
    if (!this.anims.exists('star-working')) {
      this.anims.create({
        key: 'star-working',
        frames: this.anims.generateFrameNumbers('star-working', { start: 0, end: 191 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    if (!this.anims.exists('error-bug')) {
      this.anims.create({
        key: 'error-bug',
        frames: this.anims.generateFrameNumbers('error-bug', { start: 0, end: 95 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    if (!this.anims.exists('sync-anim')) {
      this.anims.create({
        key: 'sync-anim',
        frames: this.anims.generateFrameNumbers('sync-anim', { start: 1, end: 52 }),
        frameRate: 12,
        repeat: -1,
      });
    }
  }

  createAmbientTweens() {
    this.idleFloatTween = this.tweens.add({
      targets: this.star,
      y: this.starBaseY - 6,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.sofaBreatheTween = this.tweens.add({
      targets: this.sofa,
      y: this.sofaBaseY - 2,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  getLocaleStrings() {
    return STRINGS[this.locale] || STRINGS.zh;
  }

  getStateLabel(stateName) {
    const info = STATES[stateName] || STATES.idle;
    const strings = this.getLocaleStrings();
    return strings[info.labelKey] || info.fallback;
  }

  drawPlaque() {
    const { x, y, width, height } = LAYOUT.plaque;

    this.plaqueShadow = this.add.rectangle(x, y + 2, width, height, 0x120e0d, 0.5)
      .setDepth(2998);
    this.plaqueBase = this.add.rectangle(x, y, width, height, 0x2c1f1a, 0.94)
      .setDepth(2999);
    this.plaqueBase.setStrokeStyle(2, 0x6a4d39);

    this.plaqueTrim = this.add.rectangle(x, y - 10, width - 18, 8, 0x8f6c4c, 0.96)
      .setDepth(3000);
    this.plaqueTrim.setStrokeStyle(1, 0xc6a16f);

    this.plaqueInset = this.add.rectangle(x, y + 4, width - 20, height - 18, 0x211714, 0.72)
      .setDepth(3000);
    this.plaqueInset.setStrokeStyle(1, 0x3e2723);

    this.add.circle(x - width / 2 + 16, y - 10, 2.5, 0xffd700).setDepth(3001);
    this.add.circle(x + width / 2 - 16, y - 10, 2.5, 0xffd700).setDepth(3001);

    this.plaqueStateText = this.add.text(x, y - 7, this.getStateLabel('idle'), {
      fontFamily: 'ArkPixelZH, monospace',
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(3002);

    this.plaqueDetailText = this.add.text(x, y + 9, '耳朵竖起来了', {
      fontFamily: 'ArkPixelZH, monospace',
      fontSize: '11px',
      color: '#f4e7c1',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(3002);
  }

  update(time) {
    if (time - this.lastBubble > BUBBLE_INTERVAL) {
      this.showBubble();
      this.lastBubble = time;
    }
    if (time - this.lastCatBubble > CAT_BUBBLE_INTERVAL) {
      this.showCatBubble();
      this.lastCatBubble = time;
    }

    if (this.currentState === 'error' && this.errorBug.visible) {
      const { leftX, rightX, speed } = LAYOUT.furniture.errorBug.pingPong;
      this.errorBug.x += speed * this.errorBugDir;
      this.errorBug.y = LAYOUT.furniture.errorBug.y;
      if (this.errorBug.x >= rightX) {
        this.errorBug.x = rightX;
        this.errorBugDir = -1;
      } else if (this.errorBug.x <= leftX) {
        this.errorBug.x = leftX;
        this.errorBugDir = 1;
      }
    } else if (this.errorBug) {
      this.errorBug.x = this.errorBugHomeX;
    }
  }

  setStatus(state) {
    const nextState = STATES[state.state] ? state.state : 'idle';
    const payload = { ...state, state: nextState, stateLabel: this.getStateLabel(nextState) };
    const changed = nextState !== this.currentState;

    if (changed) {
      this.tweens.add({
        targets: [this.star, this.starWorking, this.errorBug, this.syncAnim],
        alpha: 0.25,
        duration: TRANSITION_MS,
        ease: 'Linear',
        yoyo: true,
        hold: 16,
        onYoyo: () => this.applyStateVisuals(nextState, false),
      });
    } else {
      this.applyStateVisuals(nextState, false);
    }

    this.currentState = nextState;
    this.currentDetail = payload.detail || '';
    this.updatePlaque(payload);
    window.dispatchEvent(new CustomEvent('office-status', { detail: payload }));
  }

  applyStateVisuals(stateName, immediate = false) {
    this.currentState = stateName;
    const busyAtDesk = ['writing', 'researching', 'executing'].includes(stateName);
    const syncing = stateName === 'syncing';
    const errored = stateName === 'error';
    const idle = stateName === 'idle';

    this.star.setVisible(idle);
    this.star.setAlpha(idle ? 0.95 : 0);

    this.starWorking.setVisible(busyAtDesk);
    this.starWorking.setAlpha(busyAtDesk ? 1 : 0);
    if (busyAtDesk) this.starWorking.play('star-working', true);
    else this.starWorking.stop();

    this.errorBug.setVisible(errored);
    this.errorBug.setAlpha(errored ? 1 : 0);
    if (errored) this.errorBug.play('error-bug', true);
    else {
      this.errorBug.stop();
      this.errorBug.setFrame(LAYOUT.furniture.errorBug.frame);
      this.errorBug.x = this.errorBugHomeX;
    }

    this.syncAnim.setVisible(syncing);
    this.syncAnim.setAlpha(syncing ? 1 : 0);
    if (syncing) this.syncAnim.play('sync-anim', true);
    else {
      this.syncAnim.stop();
      this.syncAnim.setFrame(0);
    }

    if (idle) {
      this.serverroom.stop();
      this.serverroom.setFrame(0);
    } else if (!this.serverroom.anims.isPlaying || this.serverroom.anims.currentAnim?.key !== 'serverroom-on') {
      this.serverroom.play('serverroom-on', true);
    }

    if (immediate) return;
    if (this.bubble) {
      this.bubble.destroy();
      this.bubble = null;
    }
  }

  updatePlaque(payload) {
    const stateLabel = this.getStateLabel(payload.state);
    const detail = (payload.detail || '').slice(0, 22);
    if (this.plaqueStateText) {
      this.plaqueStateText.setText(stateLabel);
    }
    if (this.plaqueDetailText) {
      this.plaqueDetailText.setText(detail || '耳朵竖起来了');
    }
  }

  getBubbleAnchor() {
    if (this.currentState === 'syncing' && this.syncAnim.visible) {
      return { x: this.syncAnim.x, y: this.syncAnim.y };
    }
    if (this.currentState === 'error' && this.errorBug.visible) {
      return { x: this.errorBug.x, y: this.errorBug.y };
    }
    if (this.starWorking.visible) {
      return { x: this.starWorking.x, y: this.starWorking.y };
    }
    return { x: this.star.x, y: this.star.y };
  }

  showBubble() {
    if (this.bubble) {
      this.bubble.destroy();
      this.bubble = null;
    }
    if (this.currentState === 'idle') return;

    const texts = BUBBLE_TEXTS[this.currentState] || BUBBLE_TEXTS.idle;
    const text = texts[Math.floor(Math.random() * texts.length)];
    const { x, y } = this.getBubbleAnchor();
    const bubbleY = y - 70;
    const bg = this.add.rectangle(x, bubbleY, text.length * 10 + 20, 28, 0xffffff, 0.95);
    bg.setStrokeStyle(2, 0x000000);
    const txt = this.add.text(x, bubbleY, text, {
      fontFamily: 'ArkPixelZH, monospace',
      fontSize: '12px',
      color: '#000000',
      align: 'center',
    }).setOrigin(0.5);
    this.bubble = this.add.container(0, 0, [bg, txt]);
    this.bubble.setDepth(1200);
    this.time.delayedCall(3000, () => {
      if (this.bubble) {
        this.bubble.destroy();
        this.bubble = null;
      }
    });
  }

  showCatBubble() {
    if (!this.cat) return;
    if (this.catBubble) {
      this.catBubble.destroy();
      this.catBubble = null;
    }
    const text = BUBBLE_TEXTS.cat[Math.floor(Math.random() * BUBBLE_TEXTS.cat.length)];
    const anchorX = this.cat.x;
    const anchorY = this.cat.y - 60;
    const bg = this.add.rectangle(anchorX, anchorY, text.length * 10 + 20, 24, 0xfffbeb, 0.95);
    bg.setStrokeStyle(2, 0xd4a574);
    const txt = this.add.text(anchorX, anchorY, text, {
      fontFamily: 'ArkPixelZH, monospace',
      fontSize: '11px',
      color: '#8b6914',
      align: 'center',
    }).setOrigin(0.5);
    this.catBubble = this.add.container(0, 0, [bg, txt]);
    this.catBubble.setDepth(2100);
    this.time.delayedCall(4000, () => {
      if (this.catBubble) {
        this.catBubble.destroy();
        this.catBubble = null;
      }
    });
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
