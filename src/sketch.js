import getAsciiSprite, { generateSpriteEdge, generateSpriteFilling } from "./sprite.js";
import { medianFilter, randomShuffle } from "./util.js";

export let font;

const spriteList = [
  {
    name: "tree_small",
    img: "./assets/tree_small.png",
    width: 16,
    height: 12,
    dist: 2,
    weight: 3,
  },
  {
    name: "tree_medium",
    img: "./assets/tree_medium.png",
    width: 32,
    height: 24,
    dist: 5,
    weight: 10,
  },
  {
    name: "tree_big",
    img: "./assets/tree_big.png",
    width: 48,
    height: 32,
    dist: 8,
    weight: 10,
  },
  {
    name: "tree_large",
    img: "./assets/tree_large.png",
    width: 64,
    height: 48,
    dist: 10,
    weight: 10,
  },
  {
    name: "rock_small",
    img: "./assets/rock_small.png",
    width: 16,
    height: 8,
    dist: 5,
    weight: 1,
  },
  {
    name: "rock_big",
    img: "./assets/rock_big.png",
    width: 32,
    height: 16,
    dist: 10,
    weight: 2,
  },
];
const spriteRollList = [];
let spriteRollIndex = 0;

window.preload = function preload() {
  font = loadFont("./assets/KodeMono-VariableFont_wght.ttf");
  pixelDensity(1);
  for (let sprite of spriteList) {
    sprite.loadedImg = loadImage(
      sprite.img,
      // Success callback - called when the image is fully loaded
      () => {
        console.log("loaded: " + sprite.name);
        // Generate edge and fill images once the image is fully loaded
        sprite.edgeImg = generateSpriteEdge(sprite.loadedImg, sprite.width, sprite.height);
        sprite.fillImg = generateSpriteFilling(sprite.loadedImg, sprite.width, sprite.height);

        for (let i = 0; i < sprite.weight * 5; i++) {
          spriteRollList.push(sprite);
        }
      },
      () => {
        console.log("error loading: " + sprite.name);
      }
    );
  }
  randomShuffle(spriteRollList);
  // console.log(spriteRollList)
};

const tileTopImg = ["_______"];
const tileLeftImg = ["", "\\_", "  \\_", "    \\_"];
const tileRightImg = ["", "       \\_", "         \\_", "           \\_"];
const tileBottomImg = ["", "", "", "     _______"];
const tileFillingImg = ["", "AAAAAAAAA", "  AAAAAAAAA", "     AAAAAAA"];

const pillarLeftImg = ["", "|", "|"];
const pillarMidImg = ["", "", "", "", "      |", "      |"];
const pillarRightImg = ["", "", "", "", "             |", "             |"];
const pillarLeftFillingImg = ["", "", " BB", " BBBB", "   BBBB"];
const pillarFrontFillingImg = ["", "", "", "", "       CCCCCCC", "       CCCCCCC"];

window.setup = function setup() {
  const ASCIIWidth = 600,
    ASCIIHeight = 240;
  createCanvas(ASCIIWidth * 8, ASCIIHeight * 16);
  background(0);

  const ASCIICanvas = Array.from({ length: ASCIIHeight }, () => Array(ASCIIWidth).fill(" "));

  const ymax = ceil(ASCIIHeight / 3) + 5;
  const xmin = floor((-6 * ymax) / 7) - 1,
    xmax = ceil(ASCIIWidth / 7);
  const mapWidth = xmax - xmin + 1,
    mapHeight = ymax + 1;

  let platform = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  let minDist = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  let occupied = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));
  let sprites = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      let e = noise(x / 50, y / 50) * 10;
      platform[y][x] = ceil(e);
    }
  }
  platform = medianFilter(platform, 10);

  // debug
  // platform[3][0 - xmin] = 1;
  // platform[3][1 - xmin] = 2;
  // platform[3][2 - xmin] = 1;
  // platform[4][0 - xmin] = 1;
  // platform[4][1 - xmin] = 2;
  // platform[4][2 - xmin] = 1;
  // platform[5][0 - xmin] = 1;
  // platform[5][1 - xmin] = 2;
  // platform[5][2 - xmin] = 1;

  // hills
  // for (let y = 0; y < mapHeight; y++) {
  //   for (let x = 0; x < mapWidth; x++) {
  //     let e = noise(x / 10 + 5, y / 10 + 5) * 30;
  //     if (e >= 15) platform[y][x] += ceil(e - 15);
  //   }
  // }
  // platform = medianFilter(platform, 8);

  //mountain
  // for (let y = 0; y < mapHeight; y++) {
  //   for (let x = 0; x < mapWidth; x++) {
  //     let e = noise(x / 40 + 5, y / 40 + 5) * 60;
  //     if (e >= 30) platform[y][x] += ceil(e - 30);
  //   }
  // }
  // platform = medianFilter(platform, 5);

  const getHeight = (x, y) => {
    x -= xmin;
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return 0;
    return platform[y][x];
  };

  const gridPermutation = [];
  for (let y = 0; y <= ymax; y++) {
    const L = floor((-6 * y) / 7) - 1,
      R = ceil((ASCIIWidth - 6 * y) / 7);
    for (let x = R; x >= L; x--) {
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
    const L = floor((-6 * y) / 7) - 1,
      R = ceil((ASCIIWidth - 6 * y) / 7);
    let current = 0;
    for (let x = L; x <= R; x++) {
      if (getHeight(x, y) === getHeight(x - 1, y)) current++;
      else current = 0;
      minDist[y][x - xmin] = min(minDist[y][x - xmin], current);
    }
  }
  for (let y = 0; y <= ymax; y++) {
    const L = floor((-6 * y) / 7) - 1,
      R = ceil((ASCIIWidth - 6 * y) / 7);
    let current = 0;
    for (let x = R; x >= L; x--) {
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

  let count = 0;
  for (let t = 0; t < gridPermutation.length; t++) {
    const { x, y } = gridPermutation[t];
    if (occupied[y][x - xmin]) continue;
    const density = noise(x / 50, y / 50) * 0.3;
    if (random() < density) {
      let attempt = 0;
      while (attempt < 10) {
        const sprite = spriteRollList[spriteRollIndex];
        spriteRollIndex = (spriteRollIndex + 1) % spriteRollList.length;
        if (sprite.dist <= minDist[y][x - xmin]) {
          sprites[y][x - xmin] = sprite;
          count++;
          setOccupy(x, y, round(sprite.dist * 0.5));
          break;
        }
        attempt++;
      }
    }
  }

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

  let fl;
  for (let y = 0; y <= ymax; y++) {
    const L = floor((-6 * y) / 7) - 1,
      R = ceil((ASCIIWidth - 6 * y) / 7);
    for (let x = R; x >= L; x--) {
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

    for (let x = R; x >= L; x--) {
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

  // for (let y = 0; y <= ymax; y++) {
  //   const L = floor((-6 * y) / 7) - 1,
  //     R = ceil((ASCIIWidth - 6 * y) / 7);
  //   for (let x = R; x >= L; x--) {
  //     const height = getHeight(x, y);
  //     const i = y * 3 - height * 2 + 2,
  //       j = x * 7 + y * 6 + 6;
  //     if (i < 0 || i >= ASCIICanvas.length || j < 0 || j >= ASCIICanvas[0].length) continue;
  //     ASCIICanvas[i][j] = minDist[y][x - xmin].toString();
  //   }
  // }

  textAlign(CENTER, CENTER);
  textSize(16);
  textFont(font);
  fill(255);
  for (let y = 0; y < ASCIICanvas.length; y++) {
    for (let x = 0; x < ASCIICanvas[y].length; x++) {
      let ASCIIChar = ASCIICanvas[y][x];
      if (ASCIIChar === "A") ASCIIChar = " ";
      else if (ASCIIChar === "B") ASCIIChar = "#";
      else if (ASCIIChar === "C") ASCIIChar = ".";
      text(ASCIIChar, x * 8 + 4, y * 16 + 8);
    }
  }

  // This is an example of how to use the getASCIISprite function
  // const res = getASCIISprite(treeImg[0], 256, 400, 1.3);

  // createCanvas(256, 400);
  // background(0);
  // for (let y = 0; y < res.length; y++) {
  //   for (let x = 0; x < res[y].length; x++) {
  //     let ASCIIChar = res[y][x];

  //     textAlign(CENTER, CENTER);
  //     textSize(16);
  //     textFont(font);
  //     fill(255);
  //     text(ASCIIChar, x * 8 + 4, y * 16 + 8);
  //   }
  // }

  noLoop();
};
