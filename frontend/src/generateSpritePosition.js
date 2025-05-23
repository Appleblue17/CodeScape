import { ASCIIWidth, ASCIIHeight, mapWidth, mapHeight, xmin, xmax, ymax } from "./sketch.js";
import { spriteRollList } from "./sketch.js";
import { getTemperature, getBiomeType } from "./index.js";
import { randomShuffle } from "./util.js";

let spriteRollIndex = 0; // Current position in the sprite selection list

/**
 * Places sprites throughout the terrain based on:
 * - Height map values (placement on flat areas)
 * - Noise-based density variation
 * - Minimum distance constraints between sprites
 *
 * @param {Array<Array<number>>} terrain - The terrain height map
 * @param {Array<Array<Object>>} sprites - 2D array to store placed sprites
 * @param {number} offset - The offset for the terrain generation
 */
export default function generateSpritePosition(terrain, sprites, offset) {
  let minDist = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  let occupied = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));
  const biomeType = getBiomeType(offset);
  const temp = getTemperature(offset);

  const getHeight = (x, y) => {
    x -= xmin;
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return 0;
    return terrain[y][x];
  };

  const gridPermutation = [];
  for (let y = 0; y <= ymax; y++) {
    for (let x = xmax; x >= xmin; x--) {
      gridPermutation.push({ x, y });
    }
  }
  randomShuffle(gridPermutation);

  for (let x = xmin; x <= xmax; x++) {
    let current = 0;
    for (let y = 0; y <= ymax; y++) {
      if (getHeight(x, y) === getHeight(x, y - 1)) current++;
      else current = 0;
      minDist[y][x - xmin] = current;
    }
  }
  for (let y = 0; y <= ymax; y++) {
    let current = 0;
    for (let x = xmin; x <= xmax; x++) {
      if (getHeight(x, y) === getHeight(x - 1, y)) current++;
      else current = 0;
      minDist[y][x - xmin] = min(minDist[y][x - xmin], current);
    }
  }
  for (let y = 0; y <= ymax; y++) {
    let current = 0;
    for (let x = xmax; x >= xmin; x--) {
      if (getHeight(x, y) === getHeight(x + 1, y)) current++;
      else current = 0;
      minDist[y][x - xmin] = min(minDist[y][x - xmin], current);
    }
  }

  const setOccupy = (x, y, size) => {
    x -= xmin;
    for (let i = -size; i <= size; i++) {
      for (let j = -size; j <= size; j++) {
        if (x + i < 0 || x + i >= mapWidth || y + j < 0 || y + j >= mapHeight) continue;
        occupied[y + j][x + i] = true;
      }
    }
  };

  let coef = 1;
  if (biomeType === "forest") {
    coef = map(temp, 0, 30, 0, 1, true);
  } else if (biomeType === "fungi") {
    coef = map(temp, 0, 30, 0.2, 1, true);
  } else if (biomeType === "ice") {
    coef = map(temp, 0, -40, 1, 0.2, true);
  }

  spriteRollIndex %= spriteRollList[biomeType].length;
  for (let t = 0; t < gridPermutation.length; t++) {
    const { x, y } = gridPermutation[t];
    if (occupied[y][x - xmin]) continue;
    const density = noise(x / 50, y / 50) * coef;
    if (random() < density) {
      let attempt = 0;
      while (attempt < 10) {
        const sprite = spriteRollList[biomeType][spriteRollIndex];
        spriteRollIndex = (spriteRollIndex + 1) % spriteRollList[biomeType].length;
        if (sprite.dist <= minDist[y][x - xmin]) {
          sprites[y][x - xmin] = sprite;
          setOccupy(x, y, round(sprite.dist * 0.5));
          break;
        }
        attempt++;
      }
    }
  }
}
