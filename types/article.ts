export interface Article {
  id: string;
  authors: string[] | null;
  featured_image: string | null;
  is_truncated: boolean;
  publication: string;
  publication_date: string; // ISO 8601 date string
  scrape_timestamp: string; // ISO 8601 date string
  tags: string[] | null;
  text: string;
  title: string;
  url: string;
} 