import type { LLMProvider, TranscriptMessage } from "@synvix/shared";

const CLASSIFIER_MODEL: Record<LLMProvider, string> = {
  gemini: "gemini-2.0-flash",
  groq: "openai/gpt-oss-20b",
  claude: "claude-3-5-haiku-20241022",
  openai: "gpt-4o-mini",
};

const SYSTEM_PROMPT = `You classify text from a technical interview. The interviewer speaks to the candidate.

Classify if the text is a QUESTION the candidate should answer, or just the interviewer TALKING (explaining, giving instructions, making statements).

Examples of QUESTIONS:
- "Tell me about your experience with React"
- "How would you design a caching layer?"
- "What is the difference between TCP and UDP?"
- "Can you explain how a hash map works?"
- "Walk me through a time you handled a conflict"
- "Describe your approach to testing"
- "Why would you choose PostgreSQL over MongoDB?"

Examples of NOT A QUESTION:
- "Okay, let me explain the next part"
- "So the system works like this..."
- "We use a microservices architecture here"
- "I'll share my screen now"
- "Let me check your answers"
- "Great, moving on to the next topic"
- "The deadline is next Friday"

Output ONLY one word: YES or NO
YES = it is a question the candidate should answer
NO = the interviewer is just talking`;

export interface ClassificationResult {
  isQuestion: boolean;
}

export async function classifyText(
  provider: LLMProvider,
  context: TranscriptMessage[],
  text: string,
  interviewContext?: { model?: string; baseUrl?: string; language?: string }
): Promise<ClassificationResult> {
  const contextLines = context.slice(-4).map(
    (m) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.text}`
  );

  const userParts: string[] = [];
  if (contextLines.length) {
    userParts.push("Recent conversation:\n" + contextLines.join("\n"));
  }
  userParts.push(`Interviewer just said:\n"${text}"`);
  userParts.push("Is this a question the candidate should answer? Reply YES or NO.");

  const userPrompt = userParts.join("\n\n");

  try {
    const result = await callLLM(provider, CLASSIFIER_MODEL[provider], userPrompt, interviewContext);
    const normalized = result.trim().toUpperCase();
    return { isQuestion: normalized.startsWith("YES") };
  } catch {
    return { isQuestion: true };
  }
}

async function callLLM(
  provider: LLMProvider,
  model: string,
  userPrompt: string,
  ctx?: { baseUrl?: string }
): Promise<string> {
  const baseUrl = ctx?.baseUrl?.trim();

  switch (provider) {
    case "groq": {
      const Groq = (await import("groq-sdk")).default;
      const client = new Groq({
        apiKey: process.env.GROQ_API_KEY,
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      });
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4,
        temperature: 0,
      });
      return res.choices[0]?.message?.content || "YES";
    }
    case "openai": {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      });
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4,
        temperature: 0,
      });
      return res.choices[0]?.message?.content || "YES";
    }
    case "claude": {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      });
      const res = await client.messages.create({
        model,
        max_tokens: 4,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = res.content[0];
      return block?.type === "text" ? block.text : "YES";
    }
    case "gemini": {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const m = genAI.getGenerativeModel(
        { model, systemInstruction: SYSTEM_PROMPT },
        baseUrl ? { baseUrl } : undefined
      );
      const result = await m.generateContent(userPrompt);
      return result.response.text();
    }
  }
}
