import type { AIAnswer } from "@synvix/shared";

export function parseAnswer(text: string): AIAnswer {
  const sections: AIAnswer = { short: "", expanded: "", bullets: [] };

  const shortMatch = text.match(/SHORT:\s*([\s\S]*?)(?=EXPANDED:|BULLETS:|$)/i);
  const expandedMatch = text.match(/EXPANDED:\s*([\s\S]*?)(?=BULLETS:|$)/i);
  const bulletsMatch = text.match(/BULLETS:\s*([\s\S]*?)$/i);

  if (shortMatch) sections.short = shortMatch[1].trim();
  if (expandedMatch) sections.expanded = expandedMatch[1].trim();
  if (bulletsMatch) {
    sections.bullets = bulletsMatch[1]
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }

  if (!sections.short && !sections.expanded) {
    sections.short = text.trim();
    sections.expanded = text.trim();
  }

  return sections;
}
