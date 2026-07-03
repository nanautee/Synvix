import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContextBuilder } from "../context/context-builder";

describe("ContextBuilder", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores messages with roles", () => {
    const ctx = new ContextBuilder();
    ctx.addMessage("interviewer", "Tell me about Node.js");
    ctx.addMessage("user", "I used it for APIs");

    const messages = ctx.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("interviewer");
    expect(messages[1].text).toBe("I used it for APIs");
  });

  it("limits messages to maxMessages", () => {
    const ctx = new ContextBuilder({ maxMessages: 3, maxAgeMs: 600_000 });

    for (let i = 0; i < 5; i++) {
      ctx.addMessage("interviewer", `Message ${i}`);
    }

    const messages = ctx.getMessages();
    expect(messages).toHaveLength(3);
    expect(messages[0].text).toBe("Message 2");
    expect(messages[2].text).toBe("Message 4");
  });

  it("prunes messages older than maxAgeMs", () => {
    const ctx = new ContextBuilder({ maxMessages: 20, maxAgeMs: 30_000 });

    ctx.addMessage("interviewer", "Old question");
    vi.advanceTimersByTime(31_000);
    ctx.addMessage("interviewer", "New question");

    const messages = ctx.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("New question");
  });

  it("formats context string", () => {
    const ctx = new ContextBuilder();
    ctx.addMessage("interviewer", "What is React?");
    ctx.addMessage("user", "A UI library");

    expect(ctx.getContextString()).toBe(
      "Interviewer: What is React?\nCandidate: A UI library"
    );
  });

  it("clears all messages", () => {
    const ctx = new ContextBuilder();
    ctx.addMessage("interviewer", "Hello");
    ctx.clear();
    expect(ctx.getMessages()).toHaveLength(0);
  });
});
