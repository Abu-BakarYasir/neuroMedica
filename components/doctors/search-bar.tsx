"use client";

import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder = "Search",
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-[10px] border border-[#EDEDED] bg-white px-3 h-[40px] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)]"
    >
      <Search className="h-4 w-4 text-[#212121]" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[#212121] placeholder:text-[#8D8D8D]"
      />
      <div className="rounded-[22px] bg-[#F8F8F8] px-1.5 py-0.5 text-xs text-[#212121] font-normal">
        ⌘ K
      </div>
    </form>
  );
}




