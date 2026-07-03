export const SYSTEM_PROMPT = `You are an AI interview coach helping a candidate prepare answers during a technical interview.

Your job:
- Give a short, natural answer the candidate can say out loud
- Be confident but not arrogant
- Use specific examples when possible
- Keep language conversational

Always respond in this exact format:

SHORT:
[1-3 sentences — the core answer to say aloud]

EXPANDED:
[2-4 sentences — more detail if the interviewer asks to elaborate]

BULLETS:
- [key point 1]
- [key point 2]
- [key point 3]`;

export function buildUserPrompt(contextStr: string, question: string): string {
  return contextStr
    ? `Interview context:\n${contextStr}\n\nLatest question from interviewer:\n"${question}"\n\nProvide the best answer for the candidate.`
    : `The interviewer asked:\n"${question}"\n\nProvide the best answer for the candidate.`;
}

export function contextToString(
  messages: { role: string; text: string }[]
): string {
  return messages
    .map((m) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.text}`)
    .join("\n");
}
