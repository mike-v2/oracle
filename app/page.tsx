"use client";

import { useRef, useState } from "react";

import { useChat } from "@ai-sdk/react";
import { DateRange } from "react-day-picker";

import { TopBar } from "@/components/TopBar";
import { SourcesPanel } from "@/components/SourcesPanel";
import { LLMResponseArea } from "@/components/LLMResponseArea";
import { ChatInput } from "@/components/ChatInput";
import { SortOption, Article } from "@/types";

export default function Page() {
  const [sources, setSources] = useState<Article[]>([]);
  const [useReasoningModel, setUseReasoningModel] = useState<boolean>(false);
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(false);
  const [filters, setFilters] = useState<{
    publications: string[];
    sort: SortOption;
    dateRange?: DateRange;
  }>({
    publications: [],
    sort: "Relevance",
  });
  const responseRef = useRef<Response | null>(null);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: {
      filters,
      useReasoningModel,
    },
    onResponse: (response) => {
      responseRef.current = response;
    },
    onFinish: () => {
      if (responseRef.current) {
        const sourcesHeader = responseRef.current.headers.get("X-Sources");
        if (sourcesHeader) {
          try {
            const decodedSources = new TextDecoder().decode(
              Uint8Array.from(atob(sourcesHeader), (c) => c.charCodeAt(0))
            );
            const parsedSources = JSON.parse(decodedSources);
            console.log("Parsed sources:", parsedSources);
            setSources(parsedSources || []);
          } catch (e) {
            console.error("Failed to parse and decode sources header:", e);
          }
        }
      }
    },
  });

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleReasoningModelToggle = () => {
    setUseReasoningModel((prev) => !prev);
  };

  return (
    <main className="flex flex-col h-screen">
      <TopBar onMenuClick={() => setIsSourcesPanelOpen(true)} />
      <div className="flex flex-grow overflow-hidden">
        <SourcesPanel
          sources={sources}
          filters={filters}
          onFilterChange={handleFilterChange}
          isOpen={isSourcesPanelOpen}
          onClose={() => setIsSourcesPanelOpen(false)}
        />
        <div className="w-full md:w-2/3 flex flex-col">
          <LLMResponseArea messages={messages} />
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            useReasoningModel={useReasoningModel}
            onReasoningModelToggle={handleReasoningModelToggle}
          />
        </div>
        {isSourcesPanelOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsSourcesPanelOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
