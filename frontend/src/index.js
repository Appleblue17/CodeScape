import { ASCIIWidth, ASCIIHeight, mapWidth, mapHeight, xmin, xmax, ymax } from "./sketch.js";
import generateTerrain from "./generateTerrain.js";
import generateSpritePosition from "./generateSpritePosition.js";

const terrainPages = [],
  spritePages = []; // Store generated sprite in previous pages
let pageStart = 0,
  pageEnd = -1; // Start and end indices for sprite pages

function getTemperature(offset) {
  const x = offset / ASCIIWidth;
  const temp = -273.15 + Math.exp((-x * x) / 100) * 300;
  const randomTemp = noise(x) * 10;
  return Math.max(temp + randomTemp, -273.15);
}

function getBiomeType(offset) {
  const temp = getTemperature(offset);
  if (temp < 0) {
    return "ice";
  } else {
    let e = noise(offset / 2 + 20);
    if (e < 0.4) {
      return "mountain";
    } else if (e < 0.7) {
      return "forest";
    } else {
      return "fungi";
    }
  }
}

function extendPages(direction) {
  if (direction === 0) {
    // Extend to the left
    terrainPages.unshift(Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0)));
    spritePages.unshift(Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null)));
    generateTerrain(terrainPages[0], (pageStart - 1) * mapWidth);
    generateSpritePosition(terrainPages[0], spritePages[0], (pageStart - 1) * mapWidth);
    pageStart--;
  } else {
    // Extend to the right
    terrainPages.push(Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0)));
    spritePages.push(Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null)));
    generateTerrain(terrainPages[terrainPages.length - 1], (pageEnd + 1) * mapWidth);
    generateSpritePosition(
      terrainPages[terrainPages.length - 1],
      spritePages[spritePages.length - 1],
      (pageEnd + 1) * mapWidth
    );
    pageEnd++;
  }
}

function refreshPages(offset) {
  while (offset < pageStart * mapWidth) {
    extendPages(0);
  }
  while (offset >= pageEnd * mapWidth) {
    extendPages(1);
  }
}

function getTerrain(offset) {
  let terrain = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  // calculate which page the offset is in
  const page = Math.floor((offset - pageStart * mapWidth) / mapWidth);
  const pageOffset = offset - (pageStart + page) * mapWidth;

  for (let y = 0; y < mapHeight; y++) {
    for (let x = pageOffset; x < mapWidth; x++) {
      terrain[y][x - pageOffset] = terrainPages[page][y][x];
    }
  }
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < pageOffset; x++) {
      terrain[y][x + mapWidth - pageOffset] = terrainPages[page + 1][y][x];
    }
  }
  return terrain;
}

function getSpritePosition(offset) {
  let sprites = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));
  // calculate which page the offset is in
  const page = Math.floor((offset - pageStart * mapWidth) / mapWidth);
  const pageOffset = offset - (pageStart + page) * mapWidth;

  for (let y = 0; y < mapHeight; y++) {
    for (let x = pageOffset; x < mapWidth; x++) {
      sprites[y][x - pageOffset] = spritePages[page][y][x];
    }
  }
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < pageOffset; x++) {
      sprites[y][x + mapWidth - pageOffset] = spritePages[page + 1][y][x];
    }
  }
  return sprites;
}

export { getTemperature, getBiomeType, extendPages, refreshPages, getTerrain, getSpritePosition };
