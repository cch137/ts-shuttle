import { deserialize, serialize } from "./index.js";

const x3 = [
  [1, "hi 你好", false, true, null],
  {
    age: 8,
    d: new Date(),
    s: new Set([1, 2]),
  },
  [
    new Map([
      [1, 2n],
      [3, 4n],
    ]),
    new Date("a"),
    NaN,
    Infinity,
  ],
  [
    new Uint8Array([1, 2, 3]),
    new Uint16Array([1, 2, 3]),
    new Uint32Array([1, 2, 3]),
  ],
];
const salts =
  Array.from({ length: 256 })
    .fill(1)
    .map((i) => Math.floor(Math.random() * 1000000000000000)) || [];
const a3 = serialize(x3, { salts, md5: true });
const b3 = deserialize(a3, { salts, md5: true });
console.log(a3.buffer.byteLength, b3);
