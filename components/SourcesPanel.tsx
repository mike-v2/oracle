'use client';

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowUpDown, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ArticleCard } from "@/components/ArticleCard";
import { publications } from "@/lib/constants";
import type { Article, SortOption } from "@/types";

type SourcesPanelProps = {
  sources: Article[];
  filters: {
    publications: string[];
    sort: SortOption;
    dateRange?: DateRange;
  };
  onFilterChange: (newFilters: Partial<SourcesPanelProps["filters"]>) => void;
  isOpen: boolean;
  onClose: () => void;
};

type GroupedSources = {
  [publication: string]: Article[];
};

export function SourcesPanel({
  sources,
  filters,
  onFilterChange,
  isOpen,
  onClose,
}: SourcesPanelProps) {
  const [displaySources, setDisplaySources] = useState<
    Article[] | GroupedSources
  >([]);

  useEffect(() => {
    let sorted = [...sources];
    if (filters.sort === "Date") {
      sorted.sort(
        (a, b) =>
          new Date(b.publication_date).getTime() -
          new Date(a.publication_date).getTime()
      );
      setDisplaySources(sorted);
    } else if (filters.sort === "Publication") {
      const grouped = sorted.reduce((acc, source) => {
        const pub = source.publication;
        if (!acc[pub]) {
          acc[pub] = [];
        }
        acc[pub].push(source);
        return acc;
      }, {} as GroupedSources);
      // Sort publications alphabetically
      const sortedGrouped = Object.keys(grouped)
        .sort()
        .reduce((acc, key) => {
          acc[key] = grouped[key];
          return acc;
        }, {} as GroupedSources);
      setDisplaySources(sortedGrouped);
    } else {
      // Default to 'Relevance' which is the order from the API
      setDisplaySources(sources);
    }
  }, [sources, filters.sort]);

  const handleSortChange = (sort: SortOption) => {
    onFilterChange({ sort });
  };

  const handleDateChange = (dateRange?: DateRange) => {
    onFilterChange({ dateRange });
  };

  const handlePublicationChange = (pub: string, checked: boolean) => {
    const newPublications = checked
      ? [...filters.publications, pub]
      : filters.publications.filter((p) => p !== pub);
    onFilterChange({ publications: newPublications });
  };

  const renderContent = () => {
    if (sources.length === 0) {
      return (
        <div className="p-4 text-sm text-gray-500">
          Sources from your search will appear here.
        </div>
      );
    }

    if (filters.sort === "Publication" && !Array.isArray(displaySources)) {
      return Object.entries(displaySources).map(([publication, articles]) => (
        <div key={publication}>
          <h3 className="p-4 font-semibold bg-gray-50 border-b border-t">
            {publication}
          </h3>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ));
    }

    if (Array.isArray(displaySources)) {
      return displaySources.map((source) => (
        <ArticleCard key={source.id} article={source} />
      ));
    }

    return null;
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-full max-w-sm transform overflow-y-auto border-r bg-white transition-transform duration-300 ease-in-out md:static md:z-auto md:w-1/3 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sources</h2>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort by {filters.sort}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSortChange("Relevance")}>
                  Relevance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("Date")}>
                  Date
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("Publication")}
                >
                  Publication
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <div className="px-4 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                      {format(filters.dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={filters.dateRange}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-2 px-4">Publications</h4>
          <div className="flex flex-col space-y-2 px-4">
            {publications.map((pub) => (
              <div key={pub.dbName} className="flex items-center space-x-2">
                <Checkbox
                  id={pub.dbName}
                  checked={filters.publications.includes(pub.dbName)}
                  onCheckedChange={(checked) =>
                    handlePublicationChange(pub.dbName, !!checked)
                  }
                />
                <label
                  htmlFor={pub.dbName}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {pub.displayName}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      {renderContent()}
    </div>
  );
} 