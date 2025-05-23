import { font } from "./sketch.js";

/**
 * Converts an image into an ASCII sprite representation.
 *
 * @param {p5.Image} img - The source image to be converted.
 * @param {number} spriteWidth - The desired width of the ASCII sprite.
 * @param {number} spriteHeight - The desired height of the ASCII sprite.
 * @param {number} [brightscale=1] - A scaling factor for brightness adjustment. Default is 1.
 * @returns {string[][]} A 2D array of ASCII characters representing the sprite.
 */
export default function getASCIISprite(img, spriteWidth, spriteHeight, brightscale = 1) {
  img.resize(spriteWidth * 8, spriteHeight * 16);
  img.filter(GRAY);

  const dogResult = createImage(spriteWidth * 8, spriteHeight * 16);
  const sobelResult = createImage(spriteWidth * 8, spriteHeight * 16);

  applyDoGFilter(img, dogResult);
  const ASCIIFillMatrix = getASCIIFill(img, brightscale);
  const ASCIIEdgeMatrix = applySobelFilter(dogResult, sobelResult);
  const ASCIIMatrix = [];

  for (let y = 0; y < spriteHeight; y++) {
    const ASCIIRowMatrix = [];
    for (let x = 0; x < spriteWidth; x++) {
      let ASCIIChar = " ";
      if (ASCIIEdgeMatrix[y][x] === " ") ASCIIChar = ASCIIFillMatrix[y][x];
      else ASCIIChar = ASCIIEdgeMatrix[y][x];
      ASCIIRowMatrix.push(ASCIIChar);
    }
    ASCIIMatrix.push(ASCIIRowMatrix);
  }

  // The following code is for debugging purposes (demo the whole process)
  //  const ASCIIResult = createGraphics(spriteWidth*8, spriteHeight*16);
  //  for (let y = 0; y < spriteHeight / 16; y++) {
  //    for (let x = 0; x < spriteWidth; x++) {
  //      ASCIIResult.textAlign(CENTER, CENTER);
  //      ASCIIResult.textSize(16);
  //      ASCIIResult.textFont(font);
  //      ASCIIResult.fill(255);
  //      ASCIIResult.text(ASCIIMatrix[y][x], x * 8 + 4, y * 16 + 8);
  //    }
  //  }
  //  createCanvas(spriteWidth*8, spriteHeight*16 * 3 + 100);
  //  background(0);
  //  image(img, 0, 50);
  //  image(dogResult, 0, spriteHeight + 60);
  //  image(ASCIIResult, 0, spriteHeight * 2 + 70);
  return ASCIIMatrix;
}
