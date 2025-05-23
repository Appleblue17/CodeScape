import { ASCIIWidth, ASCIIHeight, mapWidth, mapHeight, xmin, xmax, ymax } from "./sketch.js";
import { getTemperature, getBiomeType } from "./index.js";
import { medianFilter } from "./util.js";

/**
 * Generates terrain height map based on the selected terrain type
 * Uses Perlin noise to create natural-looking elevation patterns
 *
 * @param {Array<Array<number>>} terrain - 2D array to store elevation values
 */
export default function generateTerrain(terrain, offset) {
  const biomeType = getBiomeType(offset);
  const temp = getTemperature(offset);

  if (biomeType === "forest") {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 50, y / 50) * 10;
        terrain[y][x] = ceil(e);
      }
    }
    medianFilter(terrain, 10);
  } else if (biomeType === "fungi") {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 50, y / 50) * 10;
        terrain[y][x] = ceil(e);
      }
    }
    medianFilter(terrain, 10);

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 10 + 5, y / 10 + 5) * 30;
        if (e >= 15) terrain[y][x] += ceil(e - 15);
      }
    }
    medianFilter(terrain, 8);

    for (let t = 0; t < 30; t++) {
      const x0 = floor(random(0, mapWidth));
      const y0 = floor(random(0, mapHeight));
      const h = terrain[y0][x0] + floor(random(3, 8));
      for (let y = y0; y <= y0 + 1; y++) {
        for (let x = x0 - 1; x <= x0 + 1; x++) {
          if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
          terrain[y][x] = h;
        }
      }
    }
  } else if (biomeType === "mountain") {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 50, y / 50) * 10;
        terrain[y][x] = ceil(e);
      }
    }
    medianFilter(terrain, 10);

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 40 + 5, y / 40 + 5) * 60;
        if (e >= 30) terrain[y][x] += ceil(e - 30);
      }
    }
    medianFilter(terrain, 5);
  } else if (biomeType === "ice") {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 50, y / 50) * 10;
        terrain[y][x] = ceil(e);
      }
    }
    medianFilter(terrain, 10);

    const lim = map(temp, 0, -273, 0, 15, true);
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 5 + 3, y / 5 + 3) * 60;
        if (e >= 40) terrain[y][x] += ceil((e - 40) * lim);
      }
    }

    for (let t = 0; t < 30; t++) {
      const x0 = floor(random(0, mapWidth));
      const y0 = floor(random(0, mapHeight));
      terrain[y0][x0] = 0;
    }
  }
}
