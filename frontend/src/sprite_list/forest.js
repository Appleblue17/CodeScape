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
    name: "Autumn Maple 1",
    img: "../pregen/output/forest/Autumn Maple 1.png",
    width: 36,
    height: 24,
    dist: 5,
    weight: 20,
  },
  {
    name: "Autumn Maple 2",
    img: "../pregen/output/forest/Autumn Maple 2.png",
    width: 48,
    height: 36,
    dist: 6,
    weight: 20,
  },
  {
    name: "Autumn Maple 3",
    img: "../pregen/output/forest/Autumn Maple 3.png",
    width: 24,
    height: 16,
    dist: 3,
    weight: 20,
  },
  {
    name: "Autumn Maple 4",
    img: "../pregen/output/forest/Autumn Maple 4.png",
    width: 30,
    height: 20,
    dist: 4,
    weight: 20,
  },
  {
    name: "Iron-Rich Hematite 1",
    img: "../pregen/output/forest/Iron-Rich Hematite 1.png",
    width: 16,
    height: 12,
    dist: 1,
    weight: 3,
  },
  {
    name: "Mature Frond 1",
    img: "../pregen/output/forest/Mature Frond 1.png",
    width: 4,
    height: 3,
    dist: 0,
    weight: 20,
  },
  {
    name: "Mature Frond 2",
    img: "../pregen/output/forest/Mature Frond 2.png",
    width: 8,
    height: 6,
    dist: 0,
    weight: 10,
  },
  {
    name: "Mature Oak 2",
    img: "../pregen/output/forest/Mature Oak 2.png",
    width: 54,
    height: 42,
    dist: 5,
    weight: 10,
  },
  {
    name: "Moss-Covered Log 1",
    img: "../pregen/output/forest/Moss-Covered Log 1.png",
    width: 15,
    height: 8,
    dist: 1,
    weight: 2,
  },
  {
    name: "Moss-Covered Log 2",
    img: "../pregen/output/forest/Moss-Covered Log 2.png",
    width: 15,
    height: 8,
    dist: 1,
    weight: 2,
  },
  {
    name: "Mossy Boulder 1",
    img: "../pregen/output/forest/Mossy Boulder 1.png",
    width: 15,
    height: 8,
    dist: 3,
    weight: 2,
  },
  {
    name: "Quartz-Veined Granite 1",
    img: "../pregen/output/forest/Quartz-Veined Granite 1.png",
    width: 8,
    height: 10,
    dist: 1,
    weight: 3,
  },
  {
    name: "Withered Fern 1",
    img: "../pregen/output/forest/Withered Fern 1.png",
    width: 10,
    height: 5,
    dist: 1,
    weight: 15,
  },
  {
    name: "Withered Fern 2",
    img: "../pregen/output/forest/Withered Fern 2.png",
    width: 8,
    height: 4,
    dist: 1,
    weight: 20,
  },
];

export default spriteList;