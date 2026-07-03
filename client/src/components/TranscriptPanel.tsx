import type { TranscriptMessage } from "@synvix/shared";

interface Props {
  messages: TranscriptMessage[];
}

export function TranscriptPanel({ messages }: Props) {
  return (
    <section className="flex flex-col min-h-0 flex-1">
      <h2 className="text-[9px] font-semibold uppercase tracking-widest text-white/30 mb-1 px-0.5">
        Transcript
      </h2>
      <div className="selectable glass-panel flex-1 rounded-lg overflow-y-auto p-2 space-y-1.5 min-h-0 max-h-24">
        {messages.length === 0 ? (
          <p className="text-[10px] text-white/25 italic">Waiting for speech…</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="flex gap-1.5">
              <span className="text-[9px] font-medium text-white/35 shrink-0 mt-px w-6">
                {msg.role === "interviewer" ? "INT" : "YOU"}
              </span>
              <p className="text-[10px] text-white/75 leading-relaxed">{msg.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
