/**
 * Main rendering engine for the CodeScape ASCII landscape generator
 *
 * This file handles:
 * - Canvas setup and WebSocket connectivity
 * - Terrain generation with different landscape types
 * - Sprite placement and rendering
 * - ASCII character-based rendering of the 3D landscape
 */

//import { text } from "body-parser";
import getAsciiSprite, { generateSpriteEdge, generateSpriteFilling } from "./sprite.js";
import { capitalize, medianFilter, randomShuffle } from "./util.js";

// Global variables
export let font; // Font used for rendering ASCII characters
let socket; // WebSocket connection for sending rendered ASCII art
let socket_img; // WebSocket connection for sending rendered images
let speechRec; // Speech recognition object for voice commands

/**
 * Preload assets before setup
 * - Loads custom font
 * - Loads sprite images and generates edge/fill representations
 * - Prepares weighted sprite distribution for random selection
 */
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
};

/**
 * Setup function - initializes the canvas and WebSocket connection
 */
window.setup = function setup() {
  socket = new WebSocket("ws://localhost:8080");
  socket_img = new WebSocket("ws://localhost:8081");

  // Set canvas to have much more space for the giant buttons
  createCanvas(ASCIIWidth * 8, ASCIIHeight * 16); // Significantly increased from +110

  socket.onopen = function () {
    console.log("WebSocket 8080 is open now.");
  };

  socket_img.onopen = function () {
    console.log("WebSocket 8081 for image processing is open now.");
  };

  socket_img.onclose = function () {
    console.error("WebSocket connection closed. Reconnecting...");
    setTimeout(() => {
      socket_img = new WebSocket("ws://localhost:8081");
    }, 1000); // 尝试在 1 秒后重新连接
  };

  socket_img.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
  drawScene();

  noiseSeed(0);
  // check for the loading of the p5.SpeechRec library
  console.log(typeof p5.SpeechRec);
  if (typeof p5.SpeechRec === "undefined") {
    console.error("p5.SpeechRec is not defined. Please check your p5.js library version.");
    return;
  }
  // initialize a voice recognition object
  speechRec = new p5.SpeechRec("en-US", gotSpeech);
  speechRec.continuous = true; // keep recognizing even after a pause
  speechRec.interimResults = false; // do not return interim results

  // start listening for speech input
  speechRec.start();

  // show the user to speak
  console.log("Say something!");
};

function gotSpeech() {
  if (speechRec.resultValue) {
    // output the recognized text to the console
    console.log(speechRec.resultString);

    // send the recognized text to the backend server
    if (socket_img.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ text: speechRec.resultString });
      socket_img.send(message);
    } else {
      console.error("WebSocket is not open. Cannot send speech recognition result.");
    }
  }
}

/**
 * Handle keyboard input to control camera movement
 * - Left arrow key: Move camera left
 * - Right arrow key: Move camera right
 */
window.keyPressed = function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    cameraX -= 10; // Move camera left
    drawScene();
  } else if (keyCode === RIGHT_ARROW) {
    cameraX += 10; // Move camera right
    drawScene();
  }
};

// Canvas dimension constants
const ASCIIWidth = 600,
  ASCIIHeight = 180;
let ymax, xmin, xmax; // Coordinate boundaries for the terrain
let mapWidth, mapHeight; // Dimensions of the terrain map

let cameraX = 100; // Camera position in the X direction
const spritePages = []; // Store generated sprite in previous pages
let spritePageStart = 0,
  spritePageEnd = -1; // Start and end indices for sprite pages

/**
 * Main rendering function - draws the ASCII landscape scene
 */
function drawScene() {
  noiseSeed(0);
  randomSeed(0);
  background(0);

  ymax = ceil(ASCIIHeight / 3) + 10;
  xmin = floor((-6 * ymax) / 7) - 1;
  xmax = ceil(ASCIIWidth / 7);
  mapWidth = xmax - xmin + 1;
  mapHeight = ymax + 1;

  let terrain = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  generateTerrain(terrain, cameraX);

  const sprites = getSpritePosition(cameraX);

  const ASCIICanvas = renderScreen(terrain, sprites);

  textAlign(CENTER, CENTER);
  textSize(16);
  textFont(font);
  fill(255);
  for (let y = 0; y < ASCIICanvas.length; y++) {
    for (let x = 0; x < ASCIICanvas[y].length; x++) {
      text(ASCIICanvas[y][x], x * 8 + 4, y * 16 + 8);
    }
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(ASCIICanvas.map((row) => row.join("")).join("\n"));
  }
}

/**
 * Current terrain type - controls landscape generation algorithm
 * Options: "mountain", "hill", "debug"
 */
let terrainType = "mountain";

/**
 * Generates terrain height map based on the selected terrain type
 * Uses Perlin noise to create natural-looking elevation patterns
 *
 * @param {Array<Array<number>>} terrain - 2D array to store elevation values
 */
function generateTerrain(terrain, offset) {
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      let e = noise((x + offset) / 50, y / 50) * 10;
      terrain[y][x] = ceil(e);
    }
  }
  medianFilter(terrain, 10);

  // hills
  if (terrainType === "hill") {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 10 + 5, y / 10 + 5) * 30;
        if (e >= 15) terrain[y][x] += ceil(e - 15);
      }
    }
    medianFilter(terrain, 8);
  }

  //mountain
  if (terrainType === "mountain") {
    console.log("OK");
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let e = noise((x + offset) / 40 + 5, y / 40 + 5) * 60;
        if (e >= 30) terrain[y][x] += ceil(e - 30);
      }
    }
    medianFilter(terrain, 5);
  }
}

/**
 * Sprite definitions with size, distribution and weighting parameters
 * - name: Sprite identifier
 * - img: Path to image asset
 * - width/height: Dimensions in pixels
 * - dist: Minimum spacing distance between sprites
 * - weight: Relative probability of selection (higher = more common)
 */
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

const spriteRollList = []; // Weighted list for random sprite selection
let spriteRollIndex = 0; // Current position in the sprite selection list

/**
 * Places sprites throughout the terrain based on:
 * - Height map values (placement on flat areas)
 * - Noise-based density variation
 * - Minimum distance constraints between sprites
 *
 * @param {Array<Array<number>>} terrain - The terrain height map
 * @param {Array<Array<Object>>} sprites - 2D array to store placed sprites
 */
function generateSpritePosition(terrain, sprites) {
  let minDist = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  let occupied = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));

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
          setOccupy(x, y, round(sprite.dist * 0.5));
          break;
        }
        attempt++;
      }
    }
  }
}

function extendSpritePosition(direction) {
  console.log("extendSpritePosition", direction);
  let terrain = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  if (direction === 0) {
    // Extend to the left
    spritePages.unshift(Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null)));
    generateTerrain(terrain, (spritePageStart - 1) * mapWidth);
    generateSpritePosition(terrain, spritePages[0]);
    spritePageStart--;
  } else {
    // Extend to the right
    spritePages.push(Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null)));
    generateTerrain(terrain, (spritePageEnd + 1) * mapWidth);
    generateSpritePosition(terrain, spritePages[spritePages.length - 1]);
    spritePageEnd++;
  }
}

function getSpritePosition(offset) {
  while (offset < spritePageStart * mapWidth) {
    extendSpritePosition(0);
  }
  while (offset >= spritePageEnd * mapWidth) {
    extendSpritePosition(1);
  }
  let sprites = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));
  // calculate which page the offset is in
  let page = Math.floor((offset - spritePageStart * mapWidth) / mapWidth);
  let pageOffset = offset - (spritePageStart + page) * mapWidth;

  for (let y = 0; y < mapHeight; y++) {
    for (let x = pageOffset; x < mapWidth; x++) {
      sprites[y][x - pageOffset] = spritePages[page][y][x];
    }
  }

  // Fill the right half of the sprite with the next page
  console.log(mapWidth - pageOffset);
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < pageOffset; x++) {
      sprites[y][x + mapWidth - pageOffset] = spritePages[page + 1][y][x];
      // if(console.log(spritePages[page + 1][y][x]);
    }
  }
  return sprites;
}

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
function renderScreen(terrain, sprites) {
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
