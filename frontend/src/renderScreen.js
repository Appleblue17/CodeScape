import getAsciiSprite from "./sprite.js";
import { ASCIIWidth, ASCIIHeight, mapWidth, mapHeight, xmin, xmax, ymax } from "./sketch.js";

// ASCII art templates for terrain rendering
const tileTopImg = ["_______"];
const tileLeftImg = ["", "\\_", "  \\_", "    \\_"];
const tileRightImg = ["", "       \\_", "         \\_", "           \\_"];
const tileBottomImg = ["", "", "", "     _______"];
const tileFillingImg = ["", "AAAAAAAAA", "  AAAAAAAAA", "     AAAAAAA"];

// ASCII art templates for vertical elements
const pillarLeftImg = ["", "|", "|"];
const pillarMidImg = ["", "", "", "", "      |", "      |"];
const pillarRightImg = ["", "", "", "", "             |", "             |"];
const pillarLeftFillingImg = ["", "", " BB", " BBBB", "   BBBB"];
const pillarFrontFillingImg = ["", "", "", "", "       CCCCCCC", "       CCCCCCC"];

/**
 * Renders the final ASCII art representation of the terrain and sprites
 * Uses isometric projection to create a 3D effect with ASCII characters
 *
 * @param {Array<Array<number>>} terrain - The terrain height map
 * @param {Array<Array<Object>>} sprites - Placed sprite objects
 * @returns {Array<Array<string>>} - 2D array of ASCII characters
 */
export default function renderScreen(terrain, sprites) {
  const ASCIICanvas = Array.from({ length: ASCIIHeight }, () => Array(ASCIIWidth).fill(" "));

  const getHeight = (x, y) => {
    x -= xmin;
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return 0;
    return terrain[y][x];
  };
  const fillImg = (img, x, y, cover = true) => {
    for (let t = 0; t < img.length; t++) {
      for (let k = 0; k < img[t].length; k++) {
        if (
          img[t][k] !== " " &&
          x + t >= 0 &&
          y + k >= 0 &&
          x + t < ASCIIHeight &&
          y + k < ASCIIWidth
        ) {
          if (
            cover ||
            ASCIICanvas[x + t][y + k] === "A" ||
            ASCIICanvas[x + t][y + k] === "B" ||
            ASCIICanvas[x + t][y + k] === "C"
          ) {
            ASCIICanvas[x + t][y + k] = img[t][k];
          }
        }
      }
    }
  };

  for (let y = 0; y <= ymax; y++) {
    for (let x = xmax; x >= xmin; x--) {
      const height = getHeight(x, y);
      const i = y * 3 - height * 2,
        j = x * 7 + y * 6;
      if (height >= 0) {
        fillImg(tileFillingImg, i, j);

        if (getHeight(x, y - 1) !== height) fillImg(tileTopImg, i, j, false);
        if (getHeight(x, y + 1) < height) fillImg(tileBottomImg, i, j);
        if (getHeight(x - 1, y) < height) fillImg(tileLeftImg, i, j);
        if (getHeight(x + 1, y) !== height) fillImg(tileRightImg, i, j);

        const leftLength = max(getHeight(x - 1, y), getHeight(x, y - 1));
        const midLength = max(getHeight(x - 1, y), getHeight(x, y + 1));
        const rightLength = max(getHeight(x, y + 1), getHeight(x + 1, y));

        for (let t = 0; t <= height; t++) {
          fillImg(pillarLeftFillingImg, i + t * 2, j - 1);
        }
        for (let t = 0; t <= height; t++) {
          fillImg(pillarFrontFillingImg, i + t * 2, j - 1);
        }

        for (let t = 0; t < height - leftLength; t++) {
          fillImg(pillarLeftImg, i + t * 2, j - 1);
        }
        for (let t = 0; t < height - midLength; t++) {
          fillImg(pillarMidImg, i + t * 2, j - 1);
        }
        for (let t = 0; t < height - rightLength; t++) {
          fillImg(pillarRightImg, i + t * 2, j - 1);
        }
      }
    }

    for (let x = xmax; x >= xmin; x--) {
      const height = getHeight(x, y);
      const i = y * 3 - height * 2,
        j = x * 7 + y * 6;
      if (sprites[y][x - xmin] !== null) {
        const sprite = sprites[y][x - xmin];
        const brightness = map(noise(x / 30, y / 30), 0, 1, 0.5, 2);
        const img = getAsciiSprite(sprite.edgeImg, sprite.fillImg, brightness);
        fillImg(img, i + 3 - sprite.height, j + 6 - round(sprite.width / 2));
      }
    }
  }

  for (let y = 0; y < ASCIICanvas.length; y++) {
    for (let x = 0; x < ASCIICanvas[y].length; x++) {
      if (ASCIICanvas[y][x] === "A") ASCIICanvas[y][x] = " ";
      else if (ASCIICanvas[y][x] === "B") ASCIICanvas[y][x] = "#";
      else if (ASCIICanvas[y][x] === "C") ASCIICanvas[y][x] = ".";
    }
  }

  return ASCIICanvas;
}
