/**
 * Main rendering engine for the CodeScape ASCII landscape generator
 *
 * This file handles:
 * - Canvas setup and WebSocket connectivity
 * - Terrain generation with different landscape types
 * - Sprite placement and rendering
 * - ASCII character-based rendering of the 3D landscape
 */

import { generateSpriteEdge, generateSpriteFilling } from "./sprite.js";
import { randomShuffle } from "./util.js";
import { refreshPages, getTerrain, getSpritePosition } from "./index.js";
import snowEffect from "./snowEffect.js";
import renderScreen from "./renderScreen.js";

import forestSpriteList from "./sprite_list/forest.js";
import fungiSpriteList from "./sprite_list/fungi.js";
import mountainSpriteList from "./sprite_list/mountain.js";
import iceSpriteList from "./sprite_list/ice.js";

// Global variables
let socket, socketReady; // WebSocket connection for sending rendered ASCII art
let socket_img; // WebSocket connection for sending rendered images
let socket_llm; // WebSocket connection for sending LLM requests
let speechRec; // Speech recognition object for voice commands
let chatModeOn = false; // Flag to indicate if chat mode is active
let genPicModeOn = false; // Flag to indicate if picture generation mode is active
let direction = "right";

const spriteRollList = {}; // Weighted list for random sprite selection
export { spriteRollList };

// Canvas dimension constants
const ASCIIWidth = 504,
  ASCIIHeight = 146;
let ymax, xmin, xmax; // Coordinate boundaries for the terrain
let mapWidth, mapHeight; // Dimensions of the terrain map
export { ASCIIWidth, ASCIIHeight, mapWidth, mapHeight, xmin, xmax, ymax };

let cameraX = 0; // Camera position in the X direction
const scrollSpeed = 1; // Speed of automatic scrolling (pixels per update)
const scrollInterval = 150; // Time between scroll updates (milliseconds)

/**
 * Preload assets before setup
 * - Loads custom font
 * - Loads sprite images and generates edge/fill representations
 * - Prepares weighted sprite distribution for random selection
 */
window.preload = function preload() {
  pixelDensity(1);
  for (let sprite of [
    ...forestSpriteList,
    ...fungiSpriteList,
    ...mountainSpriteList,
    ...iceSpriteList,
  ]) {
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
  const extendedForestSpriteList = [],
    extendedFungiSpriteList = [],
    extendedMountainSpriteList = [],
    extendedIceSpriteList = [];
  for (let sprite of forestSpriteList) {
    for (let i = 0; i < 10; i++) extendedForestSpriteList.push(sprite);
  }
  for (let sprite of fungiSpriteList) {
    for (let i = 0; i < 10; i++) extendedFungiSpriteList.push(sprite);
  }
  for (let sprite of mountainSpriteList) {
    for (let i = 0; i < 10; i++) extendedMountainSpriteList.push(sprite);
  }
  for (let sprite of iceSpriteList) {
    for (let i = 0; i < 10; i++) extendedIceSpriteList.push(sprite);
  }

  randomShuffle(extendedForestSpriteList);
  randomShuffle(extendedFungiSpriteList);
  randomShuffle(extendedMountainSpriteList);
  randomShuffle(extendedIceSpriteList);

  spriteRollList["forest"] = extendedForestSpriteList;
  spriteRollList["fungi"] = extendedFungiSpriteList;
  spriteRollList["mountain"] = extendedMountainSpriteList;
  spriteRollList["ice"] = extendedIceSpriteList;
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
    console.error("WebSocket error for Picture Generation:", error);
  };

  // Initialize the WebSocket connection for LLM processing
  socket_llm.onopen = function () {
    console.log("WebSocket 8082 (LLM processing) is open now.");
  };
  socket_llm.onclose = function () {
    console.error("WebSocket connection closed. Reconnecting...");
    setTimeout(() => {
      socket_llm = new WebSocket("ws://localhost:8082");
    }, 1000); // 尝试在 1 秒后重新连接
  };
  socket_llm.onerror = function (error) {
    console.error("WebSocket error for LLM requests:", error);
  };

  // real-time handling of LLM responses
  socket_llm.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "output",
          content: data.response,
        })
      );
    }
    console.log("Received LLM response:", data.response);
  };

  noiseSeed(0);

  // check for the loading of the p5.SpeechRec library
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

  function checkAndDrawScene() {
    if (socketReady) {
      console.log("Initialization done.");
      drawScene();
      // Start the continuous animation loop for auto-scrolling
      setInterval(autoScroll, scrollInterval);
    } else {
      setTimeout(checkAndDrawScene, 500);
    }
  }
  checkAndDrawScene();
};

function gotSpeech() {
  console.log("gotSpeech called");
  if (speechRec.resultValue) {
    // output the recognized text to the console
    console.log(speechRec.resultString);
    // Turn the result string into a lowercase string
    let result = speechRec.resultString;
    result = result.toLowerCase();
    // Remove all the punctuation from the string, such as ?, !, ., etc.
    result = result.replace(/[.,\/#!$%?\^&\*;:{}=\-_`~()]/g, "");
    console.log("result: " + result);

    // 1. 用户输入显示到 terminal
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "input_confirm",
          content: speechRec.resultString,
        })
      );
    }

    // 2. 窗口移动
    if (result == "move left") {
      direction = "left";
      console.log("Moving left");
      return;
    }
    if (result == "move right") {
      direction = "right";
      console.log("Moving right");
      return;
    }
    if (result == "stop moving") {
      direction = "stop";
      console.log("Stop moving");
      return;
    }

    // 3. 图片生成模式
    if (result == "picture generation mode") {
      genPicModeOn = true;
      console.log("Picture Generation Mode On");
      return;
    } else if (result == "exit picture generation mode") {
      genPicModeOn = false;
      console.log("Picture Generation Mode Off");
      return;
    }
    // 4. 聊天模式
    else if (result == "chat mode") {
      // if the recieved information asks to chat:
      console.log("Chat Mode On");
      chatModeOn = true;
      return;
    } else if (result == "exit chat mode") {
      // if the recieved information asks to exit chat mode:
      console.log("Chat Mode Off");
      chatModeOn = false;
      return;
    } else {
      console.error("WebSocket is not open. Cannot send speech recognition result.");
    }

    // 传递语音识别结果给后端服务器
    if (chatModeOn && genPicModeOn == false) {
      // if the chat mode is on, send the recognized text to the backend server
      if (socket_llm.readyState === WebSocket.OPEN) {
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
 * Auto-scrolling function - continuously updates camera position
 * and redraws the scene
 */
function autoScroll() {
  switch (direction) {
    case "left":
      cameraX -= scrollSpeed;
      break;
    case "right":
      cameraX += scrollSpeed;
      break;
    case "stop":
    default:
      // 不动
      break;
  }
  if (cameraX > mapWidth * 20 || cameraX < -mapWidth * 20) {
    cameraX *= -1;
    socket.send(
      JSON.stringify({
        type: "output",
        content: "[ERROR] WORLD SEED CORRUPTED. LOVE REQUIRED TO RECOMPILE.",
      })
    );
  }
  drawScene();
}

/**
 * Main rendering function - draws the ASCII landscape scene
 */
function drawScene() {
  noiseSeed(0);
  randomSeed(0);

  ymax = ceil(ASCIIHeight / 3) + 10;
  xmin = floor((-6 * ymax) / 7) - 1;
  xmax = ceil(ASCIIWidth / 7);
  mapWidth = xmax - xmin + 1;
  mapHeight = ymax + 1;

  refreshPages(cameraX);
  const terrain = getTerrain(cameraX);
  const sprites = getSpritePosition(cameraX);

  const ASCIICanvas = renderScreen(terrain, sprites);
  const ASCIICanvasWithSnow = snowEffect(ASCIICanvas, cameraX);

  if (socket.readyState === WebSocket.OPEN) {
    // Send ASCII art content
    const asciiContent = JSON.stringify({
      type: "ascii",
      content: ASCIICanvasWithSnow.map((row) => row.join("")).join("\n"),
    });
    socket.send(asciiContent);
  }
}
