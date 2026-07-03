import { describe, it, expect } from "vitest";
import { bufferToBase64 } from "../lib/audio-utils";

describe("bufferToBase64", () => {
  it("encodes array buffer to base64", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = bufferToBase64(bytes.buffer);
    expect(result).toBe(btoa("Hello"));
  });

  it("handles empty buffer", () => {
    const result = bufferToBase64(new ArrayBuffer(0));
    expect(result).toBe("");
  });
});
