export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function medianFilter(img, size) {
  const half = floor(size / 2);
  const result = Array.from({ length: img.length }, () => Array(img[0].length).fill(0));

  for (let i = 0; i < img.length; i++) {
    for (let j = 0; j < img[i].length; j++) {
      const values = [];

      for (let x = -half; x <= half; x++) {
        for (let y = -half; y <= half; y++) {
          if (i + x >= 0 && i + x < img.length && j + y >= 0 && j + y < img[i].length)
            values.push(img[i + x][j + y]);
        }
      }

      values.sort((a, b) => a - b);
      result[i][j] = values[floor(values.length / 2)];
    }
  }

  return result;
}

export function randomShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
