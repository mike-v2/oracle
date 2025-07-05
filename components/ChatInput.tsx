'use client';

import * as React from 'react';

type ChatInputProps = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <input
        value={input}
        onChange={handleInputChange}
        placeholder="Ask a question..."
        className="w-full p-2 border rounded"
      />
    </form>
  );
} 