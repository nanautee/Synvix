import type { AIAnswer } from "@synvix/shared";

interface Props {
  answer: AIAnswer | null;
  streaming: string;
  isGenerating: boolean;
}

export function AnswerPanel({ answer, streaming, isGenerating }: Props) {
  const showStreaming = isGenerating && streaming;

  return (
    <section className="flex flex-col min-h-0 flex-[2]">
      <h2 className="text-[9px] font-semibold uppercase tracking-widest text-white/30 mb-1 px-0.5 flex items-center gap-1.5">
        Answer
        {isGenerating && <span className="w-1 h-1 bg-white rounded-full animate-pulse" />}
      </h2>
      <div className="selectable glass-panel flex-1 rounded-lg overflow-y-auto p-2.5 min-h-0 space-y-2">
        {!answer && !showStreaming ? (
          <p className="text-[10px] text-white/25 italic">AI answer appears here…</p>
        ) : (
          <>
            {showStreaming && (
              <p className="text-[10px] text-white/70 leading-relaxed whitespace-pre-wrap">
                {streaming}
                <span className="inline-block w-px h-3 bg-white/60 ml-0.5 animate-pulse" />
              </p>
            )}
            {answer && !isGenerating && (
              <>
                {answer.short && (
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-white/30 mb-0.5">Short</p>
                    <p className="text-[10px] text-white/90 leading-relaxed">{answer.short}</p>
                  </div>
                )}
                {answer.expanded && answer.expanded !== answer.short && (
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-white/30 mb-0.5">More</p>
                    <p className="text-[10px] text-white/55 leading-relaxed">{answer.expanded}</p>
                  </div>
                )}
                {answer.bullets.length > 0 && (
                  <ul className="space-y-0.5">
                    {answer.bullets.map((b, i) => (
                      <li key={i} className="text-[10px] text-white/60 flex gap-1.5">
                        <span className="text-white/30">·</span>{b}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
