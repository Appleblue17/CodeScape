/**
 * Utility functions for the CodeScape project
 * Contains reusable helper functions for text processing,
 * image filtering, and array manipulation
 */

/**
 * Capitalizes the first letter of a string
 *
 * @param {string} string - The input string to capitalize
 * @returns {string} The capitalized string
 */
export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Applies a median filter to smooth a 2D image/array
 * Used for noise reduction in terrain generation
 *
 * @param {Array<Array<number>>} img - 2D array to be filtered
 * @param {number} size - Size of the filter kernel (odd number)
 */
export function medianFilter(img, size) {
  const half = floor(size / 2);
  const result = Array.from({ length: img.length }, () => Array(img[0].length).fill(0));

  // Calculate median values within the filter window
  for (let i = 0; i < img.length; i++) {
    for (let j = 0; j < img[i].length; j++) {
      const values = [];

      // Gather values from the neighborhood
      for (let x = -half; x <= half; x++) {
        for (let y = -half; y <= half; y++) {
          if (i + x >= 0 && i + x < img.length && j + y >= 0 && j + y < img[i].length)
            values.push(img[i + x][j + y]);
        }
      }

      // Find median value
      values.sort((a, b) => a - b);
      result[i][j] = values[floor(values.length / 2)];
    }
  }

  // Apply filtered results back to original array
  for (let i = 0; i < img.length; i++) {
    for (let j = 0; j < img[i].length; j++) {
      img[i][j] = result[i][j];
    }
  }
}

/**
 * Randomly shuffles elements in an array using Fisher-Yates algorithm
 *
 * @param {Array} array - The array to be shuffled
 * @returns {Array} The shuffled array (also modifies original)
 */
export function randomShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
