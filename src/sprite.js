/**
 * Use pre-generated Edge and Fill img to synthesize an ASCII sprite
 *
 * @param {string[][]} edgeMatrix - The edge image represented as a 2D array of characters.
 * @param {number[][]} fillMatrix - The fill image represented as a 2D array of brightness values.
 * @returns {string[][]} A 2D array of ASCII characters representing the sprite.
 */
export default function getAsciiSprite(edgeMatrix, fillMatrix, brightScale = 1) {
  const spriteWidth = edgeMatrix[0].length,
    spriteHeight = edgeMatrix.length;
  const ASCIIMatrix = [];

  const charMap = " .:-+*oO%#@";
  for (let y = 0; y < spriteHeight; y++) {
    const ASCIIRowMatrix = [];
    for (let x = 0; x < spriteWidth; x++) {
      let ASCIIChar = " ";
      if(edgeMatrix[y][x] !== " ") {
        ASCIIChar = edgeMatrix[y][x];
      }
      else {
        const brightness = map(fillMatrix[y][x], 0, 255, 0, brightScale);
        const index = round(map(brightness, 0, 1, 0, charMap.length - 1, true));
        ASCIIChar = charMap[index];
      }
      ASCIIRowMatrix.push(ASCIIChar);
    }
    ASCIIMatrix.push(ASCIIRowMatrix);
  }
  
  return ASCIIMatrix;
}

export function generateSpriteEdge(img, spriteWidth, spriteHeight) {
  img.resize(spriteWidth * 8, spriteHeight * 16);
  img.filter(GRAY);

  const dogResult = createImage(spriteWidth * 8, spriteHeight * 16);
  const sobelResult = createImage(spriteWidth * 8, spriteHeight * 16);

  applyDoGFilter(img, dogResult);
  const ASCIIEdgeMatrix = applySobelFilter(dogResult, sobelResult);

  return ASCIIEdgeMatrix;
}

export function generateSpriteFilling(img, spriteWidth, spriteHeight) {
  img.resize(spriteWidth * 8, spriteHeight * 16);
  img.filter(GRAY);

  const ASCIIFillMatrix = getASCIIFill(img);
  return ASCIIFillMatrix;
}


function applyDoGFilter(src, dest) {
  // Create two blurred versions
  let blur1 = createImage(src.width, src.height);
  let blur2 = createImage(src.width, src.height);

  // Copy source
  blur1.copy(src, 0, 0, src.width, src.height, 0, 0, src.width, src.height);
  blur2.copy(src, 0, 0, src.width, src.height, 0, 0, src.width, src.height);

  // Apply different Gaussian blurs
  blur1.filter(BLUR, 1); // Smaller blur radius
  blur2.filter(BLUR, 3); // Larger blur radius

  // Calculate difference
  dest.loadPixels();
  blur1.loadPixels();
  blur2.loadPixels();

  for (let i = 0; i < dest.pixels.length; i += 4) {
    const val = blur1.pixels[i] - blur2.pixels[i];
    if (val < -10) dest.pixels[i] = dest.pixels[i + 1] = dest.pixels[i + 2] = 255;
    else dest.pixels[i] = dest.pixels[i + 1] = dest.pixels[i + 2] = 0;
    dest.pixels[i + 3] = 255;
  }

  dest.updatePixels();
}

function applySobelFilter(src, dest) {
  const chars = [
    {
      angle: 0,
      char: "|",
    },
    {
      angle: atan(0.5),
      char: "/",
    },
    {
      angle: PI / 2,
      char: "_",
    },
    {
      angle: PI / 2,
      char: "-",
    },
    {
      angle: PI / 2 + 0.45,
      char: "`",
    },
    {
      angle: PI - atan(0.5),
      char: "\\",
    },
  ];

  const getASCIIChar = (angle) => {
    let minDist = Infinity,
      minChar = " ";
    for (let i = 0; i < chars.length; i++) {
      const dist = min(
        abs(angle - chars[i].angle),
        abs(angle - (chars[i].angle + PI)),
        abs(angle - (chars[i].angle - PI))
      );
      if (dist < minDist) {
        minDist = dist;
        minChar = chars[i].char;
      }
    }
    return minChar;
  };

  src.loadPixels();
  dest.loadPixels();
  const ASCIIMatrix = [];

  // Sobel kernels
  const kernelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const kernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  // Apply Sobel operator
  for (let by = 0; by < src.height; by += 16) {
    const ASCIIRowMatrix = [];

    for (let bx = 0; bx < src.width; bx += 8) {
      const charVote = {};

      for (let y = by; y < by + 20; y++) {
        for (let x = bx; x < bx + 8; x++) {
          if (x > 0 && x < src.width - 1 && y > 0 && y < src.height - 1) {
            // Get pixel index
            const id = (y * src.width + x) * 4;
            let sumX = 0,
              sumY = 0;

            // Convolution
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * src.width + (x + kx)) * 4;
                const kernelValX = kernelX[ky + 1][kx + 1];
                const kernelValY = kernelY[ky + 1][kx + 1];
                sumX += src.pixels[idx] * kernelValX;
                sumY += src.pixels[idx] * kernelValY;
              }
            }

            // Calculate gradient magnitude
            const magnitude = sqrt(sumX * sumX + sumY * sumY);
            let angle = atan2(sumY, sumX);
            if (angle < 0) angle += PI;

            if (magnitude > 200) {
              // console.log(magnitude);
              const asciiChar = getASCIIChar(angle);
              if (asciiChar === "_") {
                if (y - by < 8) charVote["-"] = (charVote["-"] || 0) + 1.5;
                else charVote["_"] = (charVote["_"] || 0) + 1.5;
              } else charVote[asciiChar] = (charVote[asciiChar] || 0) + 1;
            }
          }
        }
      }

      let maxVote = 0,
        maxChar = " ";
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i].char;
        if (charVote[char] > maxVote) {
          maxVote = charVote[char];
          maxChar = char;
        }
      }

      if (maxVote > 15) ASCIIRowMatrix.push(maxChar);
      else ASCIIRowMatrix.push(" ");
    }
    ASCIIMatrix.push(ASCIIRowMatrix);
  }
  return ASCIIMatrix;
}

function getASCIIFill(src) {
  const ASCIIFillMatrix = [];
  src.loadPixels();
  for (let by = 0; by < src.height; by += 16) {
    const ASCIIRowMatrix = [];
    for (let bx = 0; bx < src.width; bx += 8) {
      let sum = 0,
        count = 0;
      for (let y = by; y < by + 16; y++) {
        for (let x = bx; x < bx + 8; x++) {
          if (x >= 0 && x < src.width && y >= 0 && y < src.height) {
            const id = (y * src.width + x) * 4;
            const val = src.pixels[id];
            sum += val;
            count++;
          }
        }
      }
      ASCIIRowMatrix.push(round(sum / count));
    }
    ASCIIFillMatrix.push(ASCIIRowMatrix);
  }
  return ASCIIFillMatrix;
}
