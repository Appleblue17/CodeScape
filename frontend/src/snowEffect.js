import { ASCIIWidth, ASCIIHeight } from "./sketch.js";
import { getTemperature } from "./index.js";
const snowflakes = [];

export default function snowEffect(ASCIICanvas, offset) {
  const temp = getTemperature(offset);
  if (temp > 0) return ASCIICanvas;

  const snowDensity = map(temp, 0, -40, 0, 0.6);
  const snowSize = map(temp, 0, -40, 0.5, 1.0);

  const snowflakeCount = random() * snowDensity * ASCIIWidth;
  for (let i = 0; i < snowflakeCount; i++) {
    let x = Math.floor(Math.random() * ASCIIWidth);
    let speed = Math.random() * 0.5 + 0.5;
    snowflakes.push({
      x: x,
      y: 0,
      speed: speed,
    });
  }

  const newSnowflakes = [];
  for (let flake of snowflakes) {
    const xBegin = Math.floor(flake.x - snowSize),
      xEnd = Math.floor(flake.x + snowSize),
      yBegin = Math.floor(flake.y - snowSize),
      yEnd = Math.floor(flake.y + snowSize);
    for (let i = xBegin; i <= xEnd; i++) {
      for (let j = yBegin; j <= yEnd; j++) {
        if ((i - flake.x) ** 2 + (j - flake.y) ** 2 <= snowSize ** 2) {
          if (j >= 0 && j < ASCIIHeight && i >= 0 && i < ASCIIWidth) {
            ASCIICanvas[j][i] = ".";
          }
        }
      }
    }
    flake.x += random() * 2 - 1.5;
    if (flake.x < 0) flake.x = ASCIIWidth - 1;
    if (flake.x >= ASCIIWidth) flake.x = 0;
    flake.y += flake.speed;
    if (flake.y < ASCIIHeight) newSnowflakes.push(flake);
  }
  snowflakes = newSnowflakes;
  return ASCIICanvas;
}
