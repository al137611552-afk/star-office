export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const LAYOUT = {
  game: { width: GAME_WIDTH, height: GAME_HEIGHT },
  areas: {
    door: { x: 640, y: 550 },
    writing: { x: 320, y: 360 },
    researching: { x: 320, y: 360 },
    error: { x: 1066, y: 180 },
    breakroom: { x: 640, y: 360 },
  },
  furniture: {
    sofa: { x: 670, y: 144, depth: 10 },
    desk: { x: 218, y: 417, depth: 1000 },
    flower: { x: 310, y: 390, depth: 1100 },
    starWorking: { x: 217, y: 333, depth: 900 },
    coffeeMachine: { x: 659, y: 397, depth: 99 },
    serverroom: { x: 1021, y: 142, depth: 2 },
    errorBug: { x: 1007, y: 221, depth: 50 },
    syncAnim: { x: 1157, y: 592, depth: 40 },
    cat: { x: 94, y: 557, depth: 2000 },
  },
  plaque: {
    x: 640,
    y: 684,
    width: 420,
    height: 44,
  },
};
