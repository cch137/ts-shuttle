# @cch137/shuttle

## Overview

`@cch137/shuttle` is a lightweight TypeScript library designed for efficient serialization and deserialization of complex data structures. It supports various data types including numbers, strings, arrays, objects, sets, maps, and more. Shuttle also provides optional encryption and MD5 hashing for data integrity and security.

## Features

- **Number and BigInt Encoding/Decoding**: Supports various numeric types like `Float32`, `Float64`, `Int8`, `Int16`, `Int32`, `Uint8`, `Uint16`, `Uint32`, `BigInt64`, and `BigUint64`.
- **String Encoding/Decoding**: Efficiently encodes and decodes strings.
- **Complex Data Structures**: Supports arrays, objects, sets, and maps.
- **Binary Data**: Handles `Uint8Array`, `Uint16Array`, and `Uint32Array`.
- **Date Handling**: Encodes and decodes date objects, including handling invalid dates.
- **Optional Encryption**: Provides encryption and decryption of serialized data using salts.
- **MD5 Hashing**: Ensures data integrity with optional MD5 hashing.

## Installation

```bash
npm install @cch137/shuttle
```

## Usage

### Importing the Library

```typescript
import Shuttle from "@cch137/shuttle";
```

### Serialize

```typescript
const data = {
  name: "John Doe",
  age: 30,
  scores: [95, 87, 92],
  details: {
    married: false,
    address: "123 Main St",
  },
  bigNumber: BigInt("12345678901234567890"),
  birthDate: new Date("1990-01-01"),
};

const serializedData = Shuttle.serialize(data, {
  encoding: "utf-8",
  md5: true,
  salts: [12345],
});
```

### Parse

```typescript
const deserializedData = Shuttle.parse(serializedData, options);
console.log(deserializedData);
```

## API

### `Shuttle.serialize(data: any, options?: ShuttleOptions & { salts?: number[] }): Uint8Array`

Serializes the input data into a `Uint8Array`.

- `data`: The data to serialize.
- `options`: Optional settings.
  - `encoding`: The string encoding to use (default: `utf-8`).
  - `md5`: Whether to use MD5 hashing (default: `false`).
  - `salts`: An array of salts for encryption.

### `Shuttle.parse<T = unknown>(data: Uint8Array, options?: ShuttleOptions & { salts?: number[] }): T`

Deserializes the input `Uint8Array` back into the original data.

- `data`: The serialized data to parse.
- `options`: Optional settings.
  - `encoding`: The string encoding to use (default: `utf-8`).
  - `md5`: Whether to verify data integrity using MD5 hashing (default: `false`).
  - `salts`: An array of salts for decryption.

## Data Types

Shuttle supports the following data types:

- **Primitive Types**: `null`, `undefined`, `boolean`, `number`, `bigint`, `string`.
- **Complex Types**: `Array`, `Object`, `Set`, `Map`, `Date`.
- **Binary Data**: `Uint8Array`, `Uint16Array`, `Uint32Array`.

## Example

```typescript
import Shuttle from "@cch137/shuttle";

const originalData = {
  name: "Alice",
  age: 25,
  friends: ["Bob", "Charlie"],
  scores: new Set([100, 98, 95]),
  metadata: new Map([
    ["key1", "value1"],
    ["key2", "value2"],
  ]),
  birthDate: new Date("1995-12-17"),
  bigIntVal: BigInt("9876543210987654321"),
};

const options = {
  encoding: "utf-8",
  md5: true,
  salts: [54321],
};

// Serialize the data
const serializedData = Shuttle.serialize(originalData, options);

// Deserialize the data
const deserializedData = Shuttle.parse(serializedData, options);

console.log(deserializedData);
```
