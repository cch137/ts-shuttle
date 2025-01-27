import Shuttle from "./index.js";

const data1 = [
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
  [{ name: "Alex", age: 8 }],
];
const salts =
  Array.from({ length: 256 })
    .fill(1)
    .map((i) => Math.floor(Math.random() * 1000000000000000)) || [];
const s1 = Shuttle.serialize(data1, { salts, md5: true });
const x1 = Buffer.from(s1);
const y1 = Shuttle.parse(x1, { salts, md5: true });
console.log(x1.buffer.byteLength, y1);
console.log(Shuttle.bufferToBase64Url(s1));
