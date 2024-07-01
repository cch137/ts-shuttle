import { Random } from "@cch137/random";
import md5 from "crypto-js/md5.js";

type NumberType =
  | "Float32"
  | "Float64"
  | "Int8"
  | "Int16"
  | "Int32"
  | "Uint8"
  | "Uint16"
  | "Uint32";
type BigIntType = "BigInt64" | "BigUint64";

const bytesMap = Object.freeze(
  new Map<NumberType | BigIntType, number>([
    ["Float32", 4],
    ["Float64", 8],
    ["Int8", 1],
    ["Int16", 2],
    ["Int32", 4],
    ["Uint8", 1],
    ["Uint16", 2],
    ["Uint32", 4],
    ["BigInt64", 8],
    ["BigUint64", 8],
  ])
);

const token = Object.freeze({
  Null: 0,
  End: 1,
  Float32: 2,
  Float64: 3,
  Int8: 4,
  Int16: 5,
  Int32: 6,
  Uint8: 7,
  Uint16: 8,
  Uint32: 9,
  BigInt64: 10,
  BigUint64: 11,
  String: 12,
  Array: 13,
  Object: 14,
  Set: 15,
  Map: 16,
  Date: 17,
  InvalidDate: 18,
  True: 19,
  False: 20,
  Undefined: 21,
  Uint8Array: 22,
  Uint16Array: 23,
  Uint32Array: 24,
});

type ShuttleOptions = {
  encoding?: BufferEncoding;
  md5?: boolean;
};

class Pointer {
  encoding?: BufferEncoding;
  value: number;
  constructor(value = 0, encoding?: BufferEncoding) {
    this.value = value;
    this.encoding = encoding;
  }
  go(value = 0) {
    this.value += value;
  }
  back(value = 0) {
    this.value -= value;
  }
}

function _encodeNumberic(num: number, key: NumberType): Uint8Array;
function _encodeNumberic(num: bigint, key: BigIntType): Uint8Array;
function _encodeNumberic(num: number | bigint, key: NumberType | BigIntType) {
  const array = new Uint8Array(bytesMap.get(key)! + 1);
  const view = new DataView(array.buffer);
  array[0] = token[key];
  // @ts-ignore
  view[`set${key}`](1, num, true);
  return array;
}

function _decodeNumberic(buf: Uint8Array, key: NumberType, p?: Pointer): number;
function _decodeNumberic(buf: Uint8Array, key: BigIntType, p?: Pointer): bigint;
function _decodeNumberic(
  buf: Uint8Array,
  key: NumberType | BigIntType,
  p?: Pointer
) {
  const offset = (p?.value || 0) + 1;
  p?.go(bytesMap.get(key)! + 1);
  return new DataView(buf.slice(offset, offset + 8).buffer)[`get${key}`](
    0,
    true
  );
}

function encodeNumber(num: number, key: NumberType = "Float64") {
  return _encodeNumberic(num, key);
}

function decodeNumber(
  buf: Uint8Array,
  key: NumberType = "Float64",
  p?: Pointer
) {
  return _decodeNumberic(buf, key, p);
}

function encodeBigint(num: bigint, key: BigIntType = "BigInt64") {
  return _encodeNumberic(num, key);
}

function decodeBigint(
  buf: Uint8Array,
  key: BigIntType = "BigInt64",
  p?: Pointer
) {
  return _decodeNumberic(buf, key, p);
}

function encodeString(str: string, options?: ShuttleOptions) {
  return new Uint8Array([
    token.String,
    ...Uint8Array.from(Buffer.from(str, options?.encoding)),
    token.Null,
  ]);
}

function decodeString(buf: Uint8Array, p?: Pointer) {
  const offset = (p?.value || 0) + 1;
  let i = 0;
  for (; i < buf.length; i++) {
    if (buf[offset + i] === token.Null) break;
  }
  p?.go(2 + i);
  return Buffer.from(buf.slice(offset, offset + i)).toString(p?.encoding);
}

function encodeArray<T>(arr: T[], options?: ShuttleOptions): Uint8Array {
  const items = arr
    .map((i) => encodeItem(i, options))
    .reduce((prev, i) => prev.concat([...i]), [token.Array] as number[]);
  items.push(token.End);
  return new Uint8Array(items);
}

function decodeArray<T = any>(buf: Uint8Array, p = new Pointer()): T[] {
  p?.go(1);
  const array: T[] = [];
  while (buf[p.value] !== token.End) {
    if (p.value >= buf.length) throw new Error("Invalid Pointer");
    const item = decodeItem(buf, p) as T;
    array.push(item);
  }
  p?.go(1);
  return array;
}

function encodeObject<T extends object>(obj: T, options?: ShuttleOptions) {
  const arr: any[] = [token.Object];
  for (const key in obj)
    arr.push(...encodeString(key, options), ...encodeItem(obj[key]));
  arr.push(token.End);
  return new Uint8Array(arr);
}

function decodeObject<T extends object>(buf: Uint8Array, p = new Pointer()): T {
  p?.go(1);
  const obj: any = {};
  while (buf[p.value] !== token.End) {
    if (p.value >= buf.length) throw new Error("Invalid Pointer");
    const key = decodeString(buf, p);
    const val = decodeItem(buf, p);
    obj[key] = val;
  }
  p?.go(1);
  return obj;
}

function encodeSet<T>(arr: Set<T>, options?: ShuttleOptions): Uint8Array {
  const set = [...arr]
    .map((i) => encodeItem(i, options))
    .reduce((prev, i) => prev.concat([...i]), [token.Set] as number[]);
  set.push(token.End);
  return new Uint8Array(set);
}

function decodeSet<T = any>(buf: Uint8Array, p = new Pointer()): Set<T> {
  p?.go(1);
  const set = new Set<T>();
  while (buf[p.value] !== token.End) {
    if (p.value >= buf.length) throw new Error("Invalid Pointer");
    const item = decodeItem(buf, p) as T;
    set.add(item);
  }
  p?.go(1);
  return set;
}

function encodeMap<K, V>(map: Map<K, V>, options?: ShuttleOptions) {
  const arr = [token.Map] as number[];
  map.forEach((v, k) =>
    arr.push(...encodeItem(k, options), ...encodeItem(v, options))
  );
  arr.push(token.End);
  return new Uint8Array(arr);
}

function decodeMap<K, V>(buf: Uint8Array, p = new Pointer()): Map<K, V> {
  p?.go(1);
  const map = new Map<K, V>();
  while (buf[p.value] !== token.End) {
    if (p.value >= buf.length) throw new Error("Invalid Pointer");
    const key = decodeItem(buf, p);
    const val = decodeItem(buf, p);
    map.set(key as K, val as V);
  }
  p?.go(1);
  return map;
}

function encodeDate(date: Date) {
  if (isNaN(date.getTime())) return new Uint8Array([token.InvalidDate]);
  const data = new DataView(Buffer.alloc(8).buffer);
  data.setBigInt64(0, BigInt(date.getTime()));
  data.setUint8(1, token.Date);
  const buf = Buffer.from(data.buffer.slice(1));
  buf[0] = buf[0] | (data.getUint8(0) & 0b10000000);
  return new Uint8Array(buf);
}

function decodeDate(arr: Uint8Array, p?: Pointer) {
  const offset = (p?.value || 0) + 1;
  const signed = Boolean(arr[offset] & 0b10000000);
  arr[offset] = arr[offset] & 0b01111111;
  const buf = Buffer.alloc(8);
  buf.set(arr.slice(offset, offset + 6), 2);
  const num = Number(new DataView(buf.buffer).getBigInt64(0));
  p?.go(7);
  return new Date(signed ? -num : num);
}

function toUintArray(
  arr: Uint8Array | Uint16Array | Uint32Array,
  to: 8
): Uint8Array;
function toUintArray(
  arr: Uint8Array | Uint16Array | Uint32Array,
  to: 16
): Uint16Array;
function toUintArray(
  arr: Uint8Array | Uint16Array | Uint32Array,
  to: 32
): Uint32Array;
function toUintArray(
  arr: Uint8Array | Uint16Array | Uint32Array,
  to: 8 | 16 | 32
) {
  const dv = new DataView(arr.buffer);
  const length = dv.buffer.byteLength;
  switch (to) {
    case 8:
      return new Uint8Array(length).map((_, i) => dv.getUint8(i));
    case 16:
      return new Uint16Array(length / 2).map((_, i) =>
        dv.getUint16(i * 2, true)
      );
    case 32:
      return new Uint32Array(length / 4).map((_, i) =>
        dv.getUint32(i * 4, true)
      );
  }
}

function encodeUint8Array(buf: Uint8Array) {
  const u8 = buf;
  return new Uint8Array([
    token.Uint8Array,
    ...encodeBigint(BigInt(u8.length), "BigUint64"),
    ...buf,
  ]);
}

function encodeUint16Array(buf: Uint16Array) {
  const u8 = toUintArray(buf, 8);
  return new Uint8Array([
    token.Uint16Array,
    ...encodeBigint(BigInt(u8.length), "BigUint64"),
    ...u8,
  ]);
}

function encodeUint32Array(buf: Uint32Array) {
  const u8 = toUintArray(buf, 8);
  return new Uint8Array([
    token.Uint32Array,
    ...encodeBigint(BigInt(u8.length), "BigUint64"),
    ...u8,
  ]);
}

function decodeUint8Array(buf: Uint8Array, p = new Pointer()) {
  p.go(1);
  const length = Number(decodeBigint(buf, "BigUint64", p));
  const arr = buf.slice(p.value, p.value + length);
  p.go(length);
  return arr;
}

function decodeUint16Array(buf: Uint8Array, p = new Pointer()) {
  p.go(1);
  const length = Number(decodeBigint(buf, "BigUint64", p));
  const arr = toUintArray(buf.slice(p.value, p.value + length), 16);
  p.go(length);
  return arr;
}

function decodeUint32Array(buf: Uint8Array, p = new Pointer()) {
  p.go(1);
  const length = Number(decodeBigint(buf, "BigUint64", p));
  const arr = toUintArray(buf.slice(p.value, p.value + length), 32);
  p.go(length);
  return arr;
}

function encodeItem(val: any, options?: ShuttleOptions): Uint8Array {
  switch (typeof val) {
    case "string":
      return encodeString(val, options);
    case "boolean":
      return new Uint8Array([val ? token.True : token.False]);
    case "number":
      return encodeNumber(val);
    case "object":
      if (val === null) return new Uint8Array([token.Null]);
      if (Array.isArray(val)) return encodeArray(val, options);
      if (val instanceof Date) return encodeDate(val);
      if (val instanceof Set) return encodeSet(val, options);
      if (val instanceof Map) return encodeMap(val, options);
      if (val instanceof Uint8Array) return encodeUint8Array(val);
      if (val instanceof Uint16Array) return encodeUint16Array(val);
      if (val instanceof Uint32Array) return encodeUint32Array(val);
      return encodeObject(val, options);
    case "bigint":
      return encodeBigint(val);
    case "undefined":
      return new Uint8Array([token.Undefined]);
  }
  throw new Error("Unsupported data type");
}

function decodeItem(buf: Uint8Array, p?: Pointer) {
  const head = buf[p?.value || 0];
  switch (head) {
    case token.String:
      return decodeString(buf, p);
    case token.Float64:
      return decodeNumber(buf, "Float64", p);
    case token.True:
      return p?.go(1), true;
    case token.False:
      return p?.go(1), false;
    case token.Array:
      return decodeArray(buf, p);
    case token.Object:
      return decodeObject(buf, p);
    case token.Date:
      return decodeDate(buf, p);
    case token.Null:
      return p?.go(1), null;
    case token.Undefined:
      return p?.go(1), undefined;
    case token.InvalidDate:
      return p?.go(1), new Date("Invalid Date");
    case token.Set:
      return decodeSet(buf, p);
    case token.Map:
      return decodeMap(buf, p);
    case token.Uint8Array:
      return decodeUint8Array(buf, p);
    case token.Uint16Array:
      return decodeUint16Array(buf, p);
    case token.Uint32Array:
      return decodeUint32Array(buf, p);
    case token.BigInt64:
      return decodeBigint(buf, "BigInt64", p);
    case token.Float32:
      return decodeNumber(buf, "Float32", p);
    case token.Int8:
      return decodeNumber(buf, "Int8", p);
    case token.Int16:
      return decodeNumber(buf, "Int16", p);
    case token.Int32:
      return decodeNumber(buf, "Int32", p);
    case token.Uint8:
      return decodeNumber(buf, "Uint8", p);
    case token.Uint16:
      return decodeNumber(buf, "Uint16", p);
    case token.Uint32:
      return decodeNumber(buf, "Uint32", p);
    case token.BigUint64:
      return decodeBigint(buf, "BigUint64", p);
  }
  throw new Error("Unknown token");
}

function arrayLeftShift(array: Uint8Array) {
  const firstBit = array[0] & 0x80;
  return array.map((value, index) => {
    if (index === array.length - 1) {
      value <<= 1;
      value |= firstBit >> 7;
    } else {
      value = (value << 1) | ((array[index + 1] & 0x80) >> 7);
    }
    return value;
  });
}

function arrayRightShift(array: Uint8Array) {
  const lastBit = array[array.length - 1] & 0x01;
  return array.map((value, index) => {
    if (index === 0) {
      value >>= 1;
      value |= lastBit << 7;
    } else {
      value = (value >> 1) | ((array[index - 1] & 0x01) << 7);
    }
    return value;
  });
}

function encryptUint8Array(array: Uint8Array | number[], ...salts: number[]) {
  if (salts.length > 1)
    return encryptUint8Array(
      encryptUint8Array(array, salts[0]),
      ...salts.slice(1)
    );
  if (salts.length === 0)
    return array instanceof Uint8Array ? array : new Uint8Array(array);
  const shuffledIndexes = new Random(salts[0]).shuffle(
    new Array(array.length).fill(0).map((v, i) => i)
  );
  return arrayRightShift(
    new Uint8Array(array.length).map((v, i) => array[shuffledIndexes[i]])
  );
}

function decryptUint8Array(array: Uint8Array | number[], ...salts: number[]) {
  if (salts.length > 1)
    return decryptUint8Array(
      decryptUint8Array(array, ...salts.slice(1)),
      salts[0]
    );
  if (salts.length === 0)
    return array instanceof Uint8Array ? array : new Uint8Array(array);
  const shuffledIndexes = new Random(salts[0]).shuffle(
    new Array(array.length).fill(0).map((v, i) => i)
  );
  const buffer = new Uint8Array(array.length);
  arrayLeftShift(
    array instanceof Uint8Array ? array : new Uint8Array(array)
  ).forEach((v, i) => (buffer[shuffledIndexes[i]] = v));
  return buffer;
}

export function serialize(
  data: any,
  options?: ShuttleOptions & { salts?: number[] }
) {
  const encoded = encodeItem(data, options);
  if (!options?.md5)
    return encryptUint8Array(encoded, ...(options?.salts || []));
  const hashed = md5(Buffer.from(encoded).toString()).toString();
  return encryptUint8Array(
    [...encodeString(hashed), ...encoded],
    ...(options?.salts || [])
  );
}

export function deserialize<T = unknown>(
  data: Uint8Array,
  options?: ShuttleOptions & { salts?: number[] }
): T {
  const decrypted = decryptUint8Array(data, ...((options?.salts || []) as any));
  if (!options?.md5) return decodeItem(decrypted) as T;
  const encoded = decrypted.slice(34);
  const hashed = decodeString(decrypted.slice(0, 34));
  const trueHash = md5(Buffer.from(encoded).toString()).toString();
  if (trueHash !== hashed) throw new Error("Invalid hash");
  return decodeItem(encoded) as T;
}

export default class Shuttle {
  static serialize = serialize;
  static deserialize = deserialize;
}
