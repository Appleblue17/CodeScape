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
    name: "Frost-Shattered Cliff Face 1",
    img: "../pregen/output/mountain/Frost-Shattered Cliff Face 1.png",
    width: 20,
    height: 12,
    dist: 3,
    weight: 5,
  },
  {
    name: "Frost-Shattered Cliff Face 2",
    img: "../pregen/output/mountain/Frost-Shattered Cliff Face 2.png",
    width: 15,
    height: 10,
    dist: 5,
    weight: 8,
  },
  {
    name: "Glacier Lily 1",
    img: "../pregen/output/mountain/Glacier Lily 1.png",
    width: 12,
    height: 8,
    dist: 3,
    weight: 10,
  },
  {
    name: "Glacier Lily 2",
    img: "../pregen/output/mountain/Glacier Lily 2.png",
    width: 10,
    height: 6,
    dist: 2,
    weight: 10,
  },
  {
    name: "Time-Lost Cairn 1",
    img: "../pregen/output/mountain/Time-Lost Cairn 1.png",
    width: 12,
    height: 8,
    dist: 2,
    weight: 3,
  },
  {
    name: "Quartz-Veined Granite 1",
    img: "../pregen/output/forest/Quartz-Veined Granite 1.png",
    width: 8,
    height: 10,
    dist: 1,
    weight: 8,
  },
  {
    name: "Autumn Maple 3",
    img: "../pregen/output/forest/Autumn Maple 3.png",
    width: 24,
    height: 16,
    dist: 3,
    weight: 5,
  },
  {
    name: "Autumn Maple 4",
    img: "../pregen/output/forest/Autumn Maple 4.png",
    width: 30,
    height: 20,
    dist: 4,
    weight: 3,
  },
  {
    name: "Quartzite Sentinel 1",
    img: "../pregen/output/ice/Quartzite Sentinel 1.png",
    width: 20,
    height: 15,
    dist: 4,
    weight: 8,
  },
];

export default spriteList;
