import {font} from "./sketch.js";

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
 img.resize(spriteWidth*8, spriteHeight*16);
 img.filter(GRAY);

 const dogResult = createImage(spriteWidth*8, spriteHeight*16);
 const sobelResult = createImage(spriteWidth*8, spriteHeight*16);
 
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

function getColor(amt) {
  const col1 = color(255, 0, 0);
  const col2 = color(0, 255, 0);
  const col3 = color(0, 0, 255);
  const col4 = color(255, 255, 0);

  if (amt < 0.25) {
    return lerpColor(col1, col2, map(amt, 0, 0.25, 0, 1));
  } else if (amt < 0.5) {
    return lerpColor(col2, col3, map(amt, 0.25, 0.5, 0, 1));
  } else if (amt < 0.75) {
    return lerpColor(col3, col4, map(amt, 0.5, 0.75, 0, 1));
  } else {
    return lerpColor(col4, col1, map(amt, 0.75, 1, 0, 1));
  }
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

  // for (let i = 0; i < width; i += 10) {
  //   const col = getColor(map(i, 0, width, 0, 1));
  //   fill(col);
  //   rect(i, 10, 10, 10);
  // }
  // for (let i = 0; i < chars.length; i++) {
  //   console.log(chars[i].angle, chars[i].char);
  //   const pos = round(map(chars[i].angle, 0, PI, 0, width) / 10) * 10;
  //   fill(255);
  //   textAlign(CENTER, CENTER);
  //   textSize(32);
  //   text(chars[i].char, pos, 40);

  //   noFill();
  //   stroke(255);
  //   strokeWeight(2);
  //   rect(pos, 40, 20, 40);
  // }

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
            
            // const col = getColor(map(angle, 0, PI, 0, 1));
            // if (y - by < 16) {
            //   if (magnitude > 255) {
            //     dest.pixels[id] = red(col);
            //     dest.pixels[id + 1] = green(col);
            //     dest.pixels[id + 2] = blue(col);
            //     dest.pixels[id + 3] = 255; // Full opacity
            //   } else {
            //     dest.pixels[id] = 0; // black
            //     dest.pixels[id + 1] = 0;
            //     dest.pixels[id + 2] = 0;
            //     dest.pixels[id + 3] = 255; // Transparent
            //   }
            // }

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

  // dest.updatePixels();
  return ASCIIMatrix;
}

function getASCIIFill(src, brightscale) {
  const chars = " .:-+*oO%#@";

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
      const avg = sum / count;
      const brightness = map(avg, 0, 255, 0, brightscale);
      const index = round(map(brightness, 0, 1, 0, chars.length - 1, true));

      ASCIIRowMatrix.push(chars[index]);
    }
    ASCIIFillMatrix.push(ASCIIRowMatrix);
  }
  return ASCIIFillMatrix;
}
