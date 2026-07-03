import { describe, it, expect } from "vitest";
import { parseAnswer } from "../answer-parser";

describe("parseAnswer", () => {
  it("parses structured LLM response", () => {
    const text = `SHORT:
I have 5 years of Node.js experience.

EXPANDED:
I started with Express APIs and later moved to microservices with NestJS.

BULLETS:
- Built REST APIs with Express
- Migrated monolith to microservices
- Used Node.js for real-time WebSocket services`;

    const result = parseAnswer(text);

    expect(result.short).toBe("I have 5 years of Node.js experience.");
    expect(result.expanded).toContain("Express APIs");
    expect(result.bullets).toHaveLength(3);
    expect(result.bullets[0]).toBe("Built REST APIs with Express");
  });

  it("falls back to raw text when no sections found", () => {
    const result = parseAnswer("Just a plain answer without formatting.");
    expect(result.short).toBe("Just a plain answer without formatting.");
    expect(result.expanded).toBe("Just a plain answer without formatting.");
    expect(result.bullets).toEqual([]);
  });

  it("handles bullets with different markers", () => {
    const text = `SHORT:
Test

BULLETS:
• First point
- Second point
* Third point`;

    const result = parseAnswer(text);
    expect(result.bullets).toEqual(["First point", "Second point", "Third point"]);
  });
});
