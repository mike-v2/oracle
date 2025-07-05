'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';

const publications = ['MintPress', 'The Grayzone', 'Consortium News', 'The Cradle'];

export type SortOption = 'Relevance' | 'Date' | 'Publication';

type TopBarProps = {
  filters: {
    publications: string[];
    sort: SortOption;
    dateRange?: DateRange;
  };
  onFilterChange: (newFilters: Partial<TopBarProps['filters']>) => void;
};

export function TopBar({ filters, onFilterChange }: TopBarProps) {
  const handlePublicationChange = (pub: string, checked: boolean) => {
    const newPublications = checked
      ? [...filters.publications, pub]
      : filters.publications.filter(p => p !== pub);
    onFilterChange({ publications: newPublications });
  };

  const handleSortChange = (sort: SortOption) => {
    onFilterChange({ sort });
  };

  const handleDateChange = (dateRange?: DateRange) => {
    onFilterChange({ dateRange });
  };
  
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div>
          <h4 className="font-semibold text-sm mb-2">Publications</h4>
          <div className="flex items-center space-x-4">
            {publications.map(pub => (
              <div key={pub} className="flex items-center space-x-2">
                <Checkbox
                  id={pub}
                  checked={filters.publications.includes(pub)}
                  onCheckedChange={checked =>
                    handlePublicationChange(pub, !!checked)
                  }
                />
                <label
                  htmlFor={pub}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {pub}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort by {filters.sort}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleSortChange('Relevance')}>
              Relevance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('Date')}>
              Date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('Publication')}>
              Publication
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[280px] justify-start text-left font-normal',
                !filters.dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, 'LLL dd, y')} -{' '}
                    {format(filters.dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(filters.dateRange.from, 'LLL dd, y')
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
    </div>
  );
} 