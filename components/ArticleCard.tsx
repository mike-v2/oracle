'use client';

import { format } from 'date-fns';
import type { Article } from '@/types/article';

export function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="p-4 border-b hover:bg-gray-50">
      <div className="flex items-center text-xs text-gray-500 mb-1">
        <span>{article.publication}</span>
        <span className="mx-2">·</span>
        <span>{format(new Date(article.publication_date), 'MMM d, yyyy')}</span>
      </div>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-gray-800 hover:underline"
      >
        {article.title}
      </a>
    </div>
  );
} 