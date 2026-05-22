import { useEffect, useRef, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import type { AdminTab } from "./adminNav";

export type AdminSearchResult = {
  id: string;
  label: string;
  description?: string;
  tab: AdminTab;
  group?: string;
};

type AdminSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  results: AdminSearchResult[];
  onSelect: (result: AdminSearchResult) => void;
};

export default function AdminSearch({
  query,
  onQueryChange,
  results,
  onSelect,
}: AdminSearchProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, results.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length > 0;

  const selectResult = (result: AdminSearchResult) => {
    onSelect(result);
    onQueryChange("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (event.key === "Enter" && trimmed.length > 0) {
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const result = results[highlightIndex];
      if (result) selectResult(result);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[220px] sm:max-w-[240px] lg:max-w-64">
      <div className="flex items-center gap-2 rounded-xl bg-white border border-[#54037C]/10 px-3 py-2 focus-within:border-[#54037C]/30 focus-within:ring-2 focus-within:ring-[#54037C]/10 transition">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search admin..."
          aria-label="Search admin"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full"
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
        />
        <kbd className="hidden lg:inline text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
          ⌘F
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white border border-[#54037C]/10 shadow-xl overflow-hidden z-50">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">
              No results for &ldquo;{trimmed}&rdquo;
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-2" role="listbox">
              {results.map((result, index) => (
                <li key={result.id} role="option" aria-selected={index === highlightIndex}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectResult(result)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                      index === highlightIndex
                        ? "bg-[#54037C]/10"
                        : "hover:bg-[#54037C]/5"
                    }`}
                  >
                    <div className="min-w-0">
                      {result.group && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A4EBF] mb-0.5">
                          {result.group}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-gray-800 truncate">{result.label}</p>
                      {result.description && (
                        <p className="text-xs text-gray-500 truncate">{result.description}</p>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-gray-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
