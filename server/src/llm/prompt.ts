export function buildSystemPrompt(context?: {
  position?: string;
  techStack?: string;
}): string {
  const extras: string[] = [];

  if (context?.position) {
    extras.push(`The candidate is interviewing for: ${context.position}`);
  }
  if (context?.techStack) {
    extras.push(`Relevant technologies: ${context.techStack}`);
  }

  const contextBlock = extras.length
    ? `\n\nAdditional context:\n${extras.join("\n")}`
    : "";

  return `You help someone during a live technical interview. They hear the interviewer through their mic, you hear the question, and you give them an answer they can speak naturally.

Answer in the same language as the question. Be specific — numbers, tools, real scenarios. Never say "I don't know."

Format your answer in exactly three sections:

SHORT:
[2-3 sentences to say out loud. Direct, confident.]

EXPANDED:
[3-5 sentences with examples and trade-offs, if they ask for more detail.]

BULLETS:
- [Concrete point with specifics]
- [Another point — tools, patterns, numbers]
- [Third point — real-world case]
- [Fourth point if relevant]${contextBlock}`;
}

export function buildUserPrompt(
  contextStr: string,
  question: string,
  interviewContext?: { position?: string; techStack?: string }
): string {
  const parts: string[] = [];

  if (contextStr) {
    parts.push(`Recent conversation:\n${contextStr}`);
  }

  let interviewerLine = `Interviewer asked:\n"${question}"`;

  if (interviewContext?.position) {
    interviewerLine += `\n\nPosition: ${interviewContext.position}`;
  }
  if (interviewContext?.techStack) {
    interviewerLine += `\nTech stack: ${interviewContext.techStack}`;
  }

  parts.push(interviewerLine);
  parts.push(
    `Answer in the same language as the question. Be specific and natural.`
  );

  return parts.join("\n\n");
}

export function contextToString(
  messages: { role: string; text: string }[]
): string {
  return messages
    .map(
      (m) =>
        `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.text}`
    )
    .join("\n");
}
