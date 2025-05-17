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
import forestSpriteList from "./sprite_list/forest.js";
import fungiSpriteList from "./sprite_list/fungi.js";

// Global variables
export let font; // Font used for rendering ASCII characters
let ready;
let socket, socketReady; // WebSocket connection for sending rendered ASCII art
let socket_img, socket_imgReady; // WebSocket connection for sending rendered images
let socket_llm, socket_llmReady; // WebSocket connection for sending LLM requests
let speechRec; // Speech recognition object for voice commands
let chatModeOn = false; // Flag to indicate if chat mode is active
let genPicModeOn = false; // Flag to indicate if picture generation mode is active

/**
 * Preload assets before setup
 * - Loads custom font
 * - Loads sprite images and generates edge/fill representations
 * - Prepares weighted sprite distribution for random selection
 */
window.preload = function preload() {
  font = loadFont("./assets/KodeMono-VariableFont_wght.ttf");
  pixelDensity(1);
  for (let sprite of [...forestSpriteList, ...fungiSpriteList]) {
    sprite.loadedImg = loadImage(
      sprite.img,
      // Success callback - called when the image is fully loaded
      (img) => {
        console.log("loaded: " + sprite.name);

        img.filter(GRAY);
        img.filter(INVERT);

        // Generate edge and fill images once the image is fully loaded
        sprite.edgeImg = generateSpriteEdge(img, sprite.width, sprite.height);
        sprite.fillImg = generateSpriteFilling(img, sprite.width, sprite.height);
      },
      () => {
        console.log("error loading: " + sprite.name);
      }
    );
  }
  const extentedForestSpriteList = [],
    extendedFungiSpriteList = [];
  for (let sprite of forestSpriteList) {
    for (let i = 0; i < 10; i++) extentedForestSpriteList.push(sprite);
  }
  for (let sprite of fungiSpriteList) {
    for (let i = 0; i < 10; i++) extendedFungiSpriteList.push(sprite);
  }

  randomShuffle(extentedForestSpriteList);
  randomShuffle(extendedFungiSpriteList);
  spriteRollList["forest"] = extentedForestSpriteList;
  spriteRollList["fungi"] = extendedFungiSpriteList;
};

/**
 * Setup function - initializes the canvas and WebSocket connection
 */
window.setup = function setup() {
  socket = new WebSocket("ws://localhost:8080");
  socket_img = new WebSocket("ws://localhost:8081");
  socket_llm = new WebSocket("ws://localhost:8082");

  createCanvas(ASCIIWidth * 8, ASCIIHeight * 16);

  socket.onopen = function () {
    console.log("WebSocket 8080 (backend) is open now.");
    socketReady = true;
  };

  // Initialize the WebSocket connection for image processing
  //socket_img.onopen = function () {
  //  console.log("WebSocket 8081 (image processing) is open now.");
  //  socket_imgReady = true;
  //}

  //socket_img.onclose = function () {
  //  console.error("WebSocket connection closed. Reconnecting...");
  //setTimeout(() => {
  //  socket_img = new WebSocket("ws://localhost:8081");
  //}, 1000); // 尝试在 1 秒后重新连接
  //};

  //socket_img.onerror = function (error) {
  //  console.error("WebSocket error for Picture Generation:", error);
  //};

  // Initialize the WebSocket connection for LLM processing
  // socket_llm.onopen = function () {
  //   console.log("WebSocket 8082 (LLM processing) is open now.");
  //   socket_llmReady = true;
  // }
  // socket_llm.onclose = function () {
  //   console.error("WebSocket connection closed. Reconnecting...");
  //   setTimeout(() => {
  //     socket_llm = new WebSocket("ws://localhost:8082");
  //   }, 1000); // 尝试在 1 秒后重新连接
  // };
  // socket_llm.onerror = function (error) {
  //   console.error("WebSocket error for LLM requests:", error);
  // }

  // // real-time handling of LLM responses
  // socket_llm.onmessage = function (event) {
  //   const data = JSON.parse(event.data);
  //   console.log("Received LLM response:", data.response);
  // };

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

  function checkAndDrawScene() {
    // if (socketReady && socket_imgReady && socket_llmReady) {
    if (socketReady) {
      ready = true;
      console.log("All WebSocket connections are open.");
      drawScene();
    } else {
      setTimeout(checkAndDrawScene, 100);
    }
  }
  checkAndDrawScene();

  // for (let i = -20; i <= 20; i++) {
  //   // console.log(i, getTemperature(i * ASCIIWidth));
  //   console.log(i, getBiomeType(i * ASCIIWidth));
  // }
};

function gotSpeech() {
  if (!ready) return;
  console.log("gotSpeech called");
  if (speechRec.resultValue) {
    // output the recognized text to the console
    console.log(speechRec.resultString);
    // Turn the result string into a lowercase string
    const result = speechRec.resultString.toLowerCase();
    console.log("result: " + result);

    // send the recognized text to the backend server
    if (speechRec.resultString == "picture generation mode.") {
      genPicModeOn = true;
      console.log("Picture Generation Mode On");
      return;
    } else if (result == "exit picture generation mode.") {
      genPicModeOn = false;
      console.log("Picture Generation Mode Off");
      return;
    } else if (result == "chat mode.") {
      // if the recieved information asks to chat:
      console.log("Chat Mode On");
      chatModeOn = true;
      return;
    } else if (result == "exit chat mode.") {
      // if the recieved information asks to exit chat mode:
      console.log("Chat Mode Off");
      chatModeOn = false;
      return;
    } else {
      console.error("WebSocket is not open. Cannot send speech recognition result.");
    }

    if (chatModeOn && genPicModeOn == false) {
      // if the chat mode is on, send the recognized text to the backend server
      if (socket_llm.readyState === WebSocket.OPEN) {
        console.log("Chatting with LLM");
        const message = JSON.stringify({ text: speechRec.resultString });
        socket_llm.send(message);
      } else {
        console.error("WebSocket is not open. Cannot send speech recognition result.");
      }
    } else if (genPicModeOn && chatModeOn == false) {
      // if the picture generation mode is on, send the recognized text to the backend server
      if (socket_img.readyState === WebSocket.OPEN) {
        console.log("Generating picture");
        const message = JSON.stringify({ text: speechRec.resultString });
        socket_img.send(message);
      } else {
        console.error("WebSocket is not open. Cannot send speech recognition result.");
      }
    }
  }
}

/**
 * Handle keyboard input to control camera movement
 * - Left arrow key: Move camera left
 * - Right arrow key: Move camera right
 */
window.keyPressed = function keyPressed() {
  if (!ready) return;
  if (keyCode === LEFT_ARROW) {
    cameraX -= 10; // Move camera left
  } else if (keyCode === RIGHT_ARROW) {
    cameraX += 10; // Move camera right
  }
  console.log("camera", cameraX);
  drawScene();
};

// Canvas dimension constants
const ASCIIWidth = 504,
  ASCIIHeight = 146;
let ymax, xmin, xmax; // Coordinate boundaries for the terrain
let mapWidth, mapHeight; // Dimensions of the terrain map

let cameraX = 100; // Camera position in the X direction
const terrainPages = [],
  spritePages = []; // Store generated sprite in previous pages
let pageStart = 0,
  pageEnd = -1; // Start and end indices for sprite pages

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

  refreshPages(cameraX);
  const terrain = getTerrain(cameraX);
  const sprites = getSpritePosition(cameraX);

  const ASCIICanvas = renderScreen(terrain, sprites);

  // textAlign(CENTER, CENTER);
  // textSize(16);
  // textFont(font);
  // fill(255);
  // for (let y = 0; y < ASCIICanvas.length; y++) {
  //   for (let x = 0; x < ASCIICanvas[y].length; x++) {
  //     text(ASCIICanvas[y][x], x * 8 + 4, y * 16 + 8);
  //   }
  // }

  if (socket.readyState === WebSocket.OPEN) {
    // Send ASCII art content
    const asciiContent = JSON.stringify({
      type: "ascii",
      content: ASCIICanvas.map((row) => row.join("")).join("\n"),
    });
    socket.send(asciiContent);

    // For testing the terminal UI - these lines send test messages
    // to see how the terminal overlay works with the ASCII display

    // Test tentative input (as if user is speaking)
    setTimeout(() => {
      socket.send(
        JSON.stringify({
          type: "input",
          content: "Exploring the landscape...",
        })
      );
    }, 1000);

    // Test confirmed input (after user finishes speaking)
    setTimeout(() => {
      socket.send(
        JSON.stringify({
          type: "input_confirm",
          content: "Show me what's beyond that mountain",
        })
      );
    }, 2000);

    // Test system output (response to user)
    setTimeout(() => {
      socket.send(
        JSON.stringify({
          type: "output",
          content:
            "Beyond the mountains lies a mysterious fungi forest. Would you like to explore it?",
        })
      );
    }, 3000);
  }
}

function getTemperature(offset) {
  const x = offset / ASCIIWidth;
  const temp = -273.15 + Math.exp((-x * x) / 3600) * 300;
  const randomTemp = random() * 10;
  return Math.max(temp + randomTemp, -273.15);
}

function getBiomeType(offset) {
  const temp = getTemperature(offset);
  if (temp < 0) {
    return "ice";
  } else {
    let e = noise(offset / 2 + 20);
    if (e < 0.4) {
      return "fungi";
    } else if (e < 0.7) {
      return "forest";
    } else {
      return "fungi";
    }
  }
}

/**
 * Generates terrain height map based on the selected terrain type
 * Uses Perlin noise to create natural-looking elevation patterns
 *
 * @param {Array<Array<number>>} terrain - 2D array to store elevation values
 */
function generateTerrain(terrain, offset) {
  const biomeType = getBiomeType(offset);

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
  }
}

const spriteRollList = {}; // Weighted list for random sprite selection
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
function generateSpritePosition(terrain, sprites, offset) {
  let minDist = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(0));
  let occupied = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(null));
  const biomeType = getBiomeType(offset);

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
    const density = noise(x / 50, y / 50);
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

function extendPages(direction) {
  console.log("extend", direction);
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
