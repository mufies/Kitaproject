import { Search, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    debounceMs?: number;
    isLoading?: boolean;
}

export default function SearchBar({
    onSearch,
    placeholder = "Search for songs, artists...",
    debounceMs = 300,
    isLoading = false
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const debounceTimerRef = useRef<number | null>(null);

    // Debounced search effect
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Don't search for empty queries
        if (query.trim() === '') {
            onSearch('');
            return;
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            onSearch(query.trim());
        }, debounceMs);

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [query, debounceMs, onSearch]);

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <div className="relative w-full max-w-2xl">
            <div
                className={`
                    relative flex items-center gap-3 px-4 py-3 
                    bg-gradient-to-r from-gray-900/80 to-gray-800/80 
                    backdrop-blur-md rounded-full border-2
                    transition-all duration-300
                    ${isFocused
                        ? 'border-orange-500 shadow-lg shadow-orange-500/30'
                        : 'border-gray-700 hover:border-gray-600'
                    }
                `}
            >
                {/* Search Icon */}
                <Search
                    className={`
                        w-5 h-5 transition-colors duration-300
                        ${isFocused ? 'text-orange-500' : 'text-gray-400'}
                    `}
                />

                {/* Input Field */}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="
                        flex-1 bg-transparent text-white 
                        placeholder:text-gray-500 outline-none
                        text-base
                    "
                />

                {/* Loading Spinner or Clear Button */}
                {isLoading ? (
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                ) : query && (
                    <button
                        onClick={handleClear}
                        className="
                            p-1 rounded-full 
                            bg-gray-700 hover:bg-gray-600 
                            text-gray-400 hover:text-white
                            transition-all duration-200
                            hover:scale-110
                        "
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Search indicator hint */}
            {query && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 px-4">
                    <p className="text-xs text-gray-500">
                        Searching for "{query}"...
                    </p>
                </div>
            )}
        </div>
    );
}
