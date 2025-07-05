"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import type { Article } from "@/types/article";
import { TopBar, type SortOption } from "@/components/TopBar";
import { SourcesPanel } from "@/components/SourcesPanel";
import { LLMResponseArea } from "@/components/LLMResponseArea";
import { ChatInput } from "@/components/ChatInput";
import { DateRange } from "react-day-picker";

export default function Page() {
  const [sources, setSources] = React.useState<Article[]>([]);
  const [filters, setFilters] = React.useState<{
    publications: string[];
    sort: SortOption;
    dateRange?: DateRange;
  }>({
    publications: [],
    sort: "Relevance",
  });
  const responseRef = React.useRef<Response | null>(null);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: {
      filters,
    },
    onResponse: (response) => {
      responseRef.current = response;
    },
    onFinish: () => {
      if (responseRef.current) {
        const sourcesHeader = responseRef.current.headers.get("X-Sources");
        if (sourcesHeader) {
          try {
            const decodedSources = atob(sourcesHeader);
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

  return (
    <main className="flex flex-col h-screen">
      <TopBar filters={filters} onFilterChange={handleFilterChange} />
      <div className="flex flex-grow overflow-hidden">
        <SourcesPanel sources={sources} sort={filters.sort} />
        <div className="flex flex-col w-2/3">
          <LLMResponseArea messages={messages} />
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </main>
  );
}
