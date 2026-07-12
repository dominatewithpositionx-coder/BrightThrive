'use client';

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import type { LocationResult } from '@/lib/geocoding/types';

interface CityAutocompleteProps {
  /** Current plain-text city value (shown in the input on mount and when editing is cancelled) */
  initialValue?: string;
  /** Called when a list item is selected OR when the input is blurred without a selection.
   *  result is null for manual/free-text entry; displayValue is always the visible string. */
  onSelect: (result: LocationResult | null, displayValue: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 400;

export default function CityAutocomplete({
  initialValue = '',
  onSelect,
  placeholder = 'City for weather (e.g. Toronto)',
  className = '',
  disabled = false,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [committed, setCommitted] = useState(false); // true once a list item was chosen

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const listboxId = useId();

  // Sync when parent resets the field (e.g. on cancel)
  useEffect(() => {
    setInputValue(initialValue);
    setCommitted(false);
  }, [initialValue]);

  const fetchSuggestions = useCallback(async (q: string) => {
    // Cancel in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetch(
        `/api/location-search?q=${encodeURIComponent(q)}`,
        { signal: abortRef.current.signal },
      );
      const data = await res.json() as { results?: LocationResult[] };
      setResults(data.results ?? []);
      setOpen((data.results?.length ?? 0) > 0);
      setActiveIndex(-1);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setInputValue(q);
    setCommitted(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < MIN_CHARS) {
      abortRef.current?.abort();
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => fetchSuggestions(q.trim()), DEBOUNCE_MS);
  }

  function commitSelection(result: LocationResult) {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue(result.displayName);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    setCommitted(true);
    onSelect(result, result.displayName);
  }

  function handleBlur(e: React.FocusEvent) {
    // Keep open if focus moved into the listbox (e.g. scrollbar click)
    if (listRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
    if (!committed) {
      onSelect(null, inputValue);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(null, inputValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          commitSelection(results[activeIndex]);
        } else {
          onSelect(null, inputValue);
          setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.focus();
        break;
    }
  }

  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        aria-label="City for weather"
        autoComplete="off"
        spellCheck={false}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`border rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-teal-400 pr-7 ${className}`}
      />

      {loading && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <span className="block w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </span>
      )}

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="City suggestions"
          className="absolute z-50 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {results.map((result, i) => (
            <li
              key={`${result.displayName}-${i}`}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={activeIndex === i}
              // mousedown before blur so selection fires before the input loses focus
              onMouseDown={(e) => { e.preventDefault(); commitSelection(result); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3 py-2 text-xs cursor-pointer transition-colors leading-snug ${
                activeIndex === i
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{result.city}</span>
              {result.region && (
                <span className="text-gray-400">, {result.region}</span>
              )}
              {result.country && (
                <span className="text-gray-400">, {result.country}</span>
              )}
            </li>
          ))}
          {/* OSM attribution — required when using OpenStreetMap data */}
          <li
            aria-hidden="true"
            className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100 bg-gray-50"
          >
            © <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              className="underline hover:text-gray-600"
            >
              OpenStreetMap
            </a>{' '}contributors via Photon
          </li>
        </ul>
      )}
    </div>
  );
}
