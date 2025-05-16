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
    name: "Curled Fiddlehead 1",
    img: "../pregen/output/fungi/Curled Fiddlehead 1.png",
    width: 6,
    height: 4,
    dist: 1,
    weight: 5,
  },
  {
    name: "Curled Fiddlehead 2",
    img: "../pregen/output/fungi/Curled Fiddlehead 2.png",
    width: 8,
    height: 4,
    dist: 1,
    weight: 5,
  },
  {
    name: "Curled Fiddlehead 3",
    img: "../pregen/output/fungi/Curled Fiddlehead 3.png",
    width: 7,
    height: 3,
    dist: 1,
    weight: 5,
  },
  {
    name: "Elf Cup 1",
    img: "../pregen/output/fungi/Elf Cup 1.png",
    width: 30,
    height: 20,
    dist: 5,
    weight: 10,
  },
  {
    name: "Elf Cup 2",
    img: "../pregen/output/fungi/Elf Cup 2.png",
    width: 20,
    height: 15,
    dist: 4,
    weight: 6,
  },
  {
    name: "Elf Cup 3",
    img: "../pregen/output/fungi/Elf Cup 3.png",
    width: 8,
    height: 6,
    dist: 1,
    weight: 10,
  },
  {
    name: "Fly Agaric 1",
    img: "../pregen/output/fungi/Fly Agaric 1.png",
    width: 18,
    height: 12,
    dist: 4,
    weight: 6,
  },
  {
    name: "Fly Agaric 2",
    img: "../pregen/output/fungi/Fly Agaric 2.png",
    width: 24,
    height: 18,
    dist: 3,
    weight: 6,
  },
  {
    name: "Fungus-Covered Stone 1",
    img: "../pregen/output/fungi/Fungus-Covered Stone 1.png",
    width: 32,
    height: 24,
    dist: 4,
    weight: 2,
  },
  {
    name: "Fungus-Covered Stone 2",
    img: "../pregen/output/fungi/Fungus-Covered Stone 2.png",
    width: 32,
    height: 24,
    dist: 4,
    weight: 2,
  },
  {
    name: "Turkey Tail Fungi 1",
    img: "../pregen/output/fungi/Turkey Tail Fungi 1.png",
    width: 32,
    height: 20,
    dist: 5,
    weight: 3,
  },
  {
    name: "Turkey Tail Fungi 2",
    img: "../pregen/output/fungi/Turkey Tail Fungi 2.png",
    width: 32,
    height: 20,
    dist: 5,
    weight: 3,
  },
  {
    name: "Withered Fern 1",
    img: "../pregen/output/fungi/Withered Fern 1.png",
    width: 10,
    height: 5,
    dist: 1,
    weight: 20,
  },
  {
    name: "Withered Fern 2",
    img: "../pregen/output/fungi/Withered Fern 2.png",
    width: 8,
    height: 4,
    dist: 1,
    weight: 20,
  },
];

export default spriteList;