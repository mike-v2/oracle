'use client';

import type { Message } from 'ai';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function LLMResponseArea({ messages }: { messages: Message[] }) {
  return (
    <div className="flex gap-4 flex-col p-4 overflow-y-auto h-full">
      {messages.map((m) => (
        <div key={m.id} className="prose border p-2 rounded-md max-w-none">
          <strong>{m.role === "user" ? "User: " : "AI: "}</strong>
          {m.role === "user" ? (
            m.content
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content}
            </ReactMarkdown>
          )}
        </div>
      ))}
    </div>
  );
} 