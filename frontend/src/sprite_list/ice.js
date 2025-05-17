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
    name: "Avalanche Debris 1",
    img: "../pregen/output/ice/Avalanche Debris 1.png",
    width: 16,
    height: 12,
    dist: 6,
    weight: 5,
  },
  {
    name: "Avalanche Debris 2",
    img: "../pregen/output/ice/Avalanche Debris 2.png",
    width: 18,
    height: 13,
    dist: 8,
    weight: 8,
  },
  {
    name: "Edelweiss Cluster 1",
    img: "../pregen/output/ice/Edelweiss Cluster 1.png",
    width: 14,
    height: 8,
    dist: 4,
    weight: 10,
  },
  {
    name: "Edelweiss Cluster 2",
    img: "../pregen/output/ice/Edelweiss Cluster 2.png",
    width: 16,
    height: 10,
    dist: 5,
    weight: 10,
  },
  {
    name: "Frost-Heaved Megalith 1",
    img: "../pregen/output/ice/Frost-Heaved Megalith 1.png",
    width: 15,
    height: 12,
    dist: 5,
    weight: 8,
  },
  {
    name: "Frost-Shattered Cliff Face 1",
    img: "../pregen/output/ice/Frost-Shattered Cliff Face 1.png",
    width: 15,
    height: 12,
    dist: 6,
    weight: 5,
  },
  {
    name: "Frost-Shattered Cliff Face 2",
    img: "../pregen/output/ice/Frost-Shattered Cliff Face 2.png",
    width: 20,
    height: 15,
    dist: 8,
    weight: 5,
  },
  {
    name: "Glacier Lily 1",
    img: "../pregen/output/ice/Glacier Lily 1.png",
    width: 12,
    height: 8,
    dist: 3,
    weight: 10,
  },
  {
    name: "Glacier Lily 2",
    img: "../pregen/output/ice/Glacier Lily 2.png",
    width: 10,
    height: 7,
    dist: 2,
    weight: 10,
  },
  {
    name: "Hoarfrost Monolith 1",
    img: "../pregen/output/ice/Hoarfrost Monolith 1.png",
    width: 34,
    height: 26,
    dist: 12,
    weight: 2,
  },
  {
    name: "Lichen-Covered Boulder 1",
    img: "../pregen/output/ice/Lichen-Covered Boulder 1.png",
    width: 32,
    height: 24,
    dist: 10,
    weight: 2,
  },
  {
    name: "Pressure Ridge 1",
    img: "../pregen/output/ice/Pressure Ridge 1.png",
    width: 20,
    height: 10,
    dist: 6,
    weight: 5,
  },
  {
    name: "Stonecrop Succulent 1",
    img: "../pregen/output/ice/Stonecrop Succulent 1.png",
    width: 48,
    height: 30,
    dist: 15,
    weight: 1,
  },
];

export default spriteList;
