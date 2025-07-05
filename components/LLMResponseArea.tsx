'use client';

import type { Message } from 'ai';

export function LLMResponseArea({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-grow p-4 overflow-y-auto">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          <strong>{m.role === 'user' ? 'User: ' : 'AI: '}</strong>
          {m.content}
        </div>
      ))}
    </div>
  );
} 