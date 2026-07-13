import { describe, it, expect } from "vitest";
import { buildUserPrompt, contextToString } from "../llm/prompt";

describe("prompt builders", () => {
  it("buildUserPrompt without context", () => {
    const prompt = buildUserPrompt("", "What is TypeScript?");
    expect(prompt).toContain("What is TypeScript?");
    expect(prompt).not.toContain("Interview context");
  });

  it("buildUserPrompt with context", () => {
    const context = "Interviewer: Tell me about yourself\nCandidate: I am a developer";
    const prompt = buildUserPrompt(context, "What is your experience with React?");
    expect(prompt).toContain("Recent conversation:");
    expect(prompt).toContain("What is your experience with React?");
  });

  it("contextToString formats roles", () => {
    const str = contextToString([
      { role: "interviewer", text: "Hello" },
      { role: "user", text: "Hi there" },
    ]);
    expect(str).toBe("Interviewer: Hello\nCandidate: Hi there");
  });
});
