'use client';

import * as React from 'react';
import { Button } from "./ui/button";

type ChatInputProps = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  useReasoningModel: boolean;
  onReasoningModelToggle: () => void;
};

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  useReasoningModel,
  onReasoningModelToggle,
}: ChatInputProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t flex items-center gap-2"
    >
      <input
        value={input}
        onChange={handleInputChange}
        placeholder="Ask a question..."
        className="w-full p-2 border rounded"
      />
      <Button
        type="button"
        onClick={onReasoningModelToggle}
        className={useReasoningModel ? "bg-blue-500 text-white" : ""}
        variant={useReasoningModel ? "default" : "outline"}
      >
        Reasoning
      </Button>
    </form>
  );
} 