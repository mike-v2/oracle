'use client';

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="p-4 border-b flex items-center justify-start">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>
      <h1 className="text-xl font-semibold">Oracle</h1>
    </div>
  );
} 