'use client';

import * as React from 'react';
import type { Article } from '@/types/article';
import { ArticleCard } from './ArticleCard';
import type { SortOption } from './TopBar';

type SourcesPanelProps = {
  sources: Article[];
  sort: SortOption;
};

type GroupedSources = {
  [publication: string]: Article[];
};

export function SourcesPanel({ sources, sort }: SourcesPanelProps) {
  const [displaySources, setDisplaySources] = React.useState<Article[] | GroupedSources>([]);

  React.useEffect(() => {
    let sorted = [...sources];
    if (sort === 'Date') {
      sorted.sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime());
      setDisplaySources(sorted);
    } else if (sort === 'Publication') {
      const grouped = sorted.reduce((acc, source) => {
        const pub = source.publication;
        if (!acc[pub]) {
          acc[pub] = [];
        }
        acc[pub].push(source);
        return acc;
      }, {} as GroupedSources);
      // Sort publications alphabetically
      const sortedGrouped = Object.keys(grouped).sort().reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as GroupedSources);
      setDisplaySources(sortedGrouped);
    } else {
      // Default to 'Relevance' which is the order from the API
      setDisplaySources(sources);
    }
  }, [sources, sort]);

  const renderContent = () => {
    if (sources.length === 0) {
      return (
        <div className="p-4 text-sm text-gray-500">
          Sources from your search will appear here.
        </div>
      );
    }

    if (sort === 'Publication' && !Array.isArray(displaySources)) {
      return Object.entries(displaySources).map(([publication, articles]) => (
        <div key={publication}>
          <h3 className="p-4 font-semibold bg-gray-50 border-b border-t">
            {publication}
          </h3>
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ));
    }

    if (Array.isArray(displaySources)) {
      return displaySources.map(source => (
        <ArticleCard key={source.id} article={source} />
      ));
    }
    
    return null;
  };

  return (
    <div className="w-1/3 border-r overflow-y-auto">
      <div className="p-4 border-b text-sm font-semibold">Sources</div>
      {renderContent()}
    </div>
  );
} 