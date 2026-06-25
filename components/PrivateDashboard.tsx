"use client";
import { useState } from 'react';
import AddItemDrawer from './AddItemDrawer';
import Image from 'next/image';
import { toggleFavorite } from '@/app/actions';

interface ClosetItem {
  id: string;
  model: string; // Changed from name
  category: string;
  brand: string | null;
  color: string | null; // Added color
  image_url: string | null;
  created_at?: string; // Added created_at for client-side sorting
  is_favorite?: boolean; // Added for favoriting functionality
}

interface DashboardProps {
  displayName: string;
  bio?: string | null;
  items: ClosetItem[];
}

const CATEGORIES = ["Headwear", "Outerwear", "Tops", "Bottoms", "Footwear", "Accessories", "Other"];

export default function PrivateDashboard({ displayName, bio, items }: DashboardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
  const [sortBy, setSortBy] = useState<"recently_added" | "category">("recently_added");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({});

  const tagline = bio || "Collecting perfect menswear";

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const allSelected = selectedCategories.length === CATEGORIES.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(CATEGORIES);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, itemId: string, currentStatus: boolean) => {
    e.stopPropagation(); // Avoid triggering details card navigation if any
    const nextStatus = !currentStatus;

    // Optimistically update favorite status
    setOptimisticFavorites(prev => ({ ...prev, [itemId]: nextStatus }));

    try {
      const result = await toggleFavorite(itemId, nextStatus);
      if (!result.success) {
        // Revert optimistic update if failed
        setOptimisticFavorites(prev => ({ ...prev, [itemId]: currentStatus }));
        alert(`Failed to update favorite: ${result.error}`);
      }
    } catch (err) {
      setOptimisticFavorites(prev => ({ ...prev, [itemId]: currentStatus }));
      alert("Failed to toggle favorite due to a connection error.");
    }
  };

  // Filter and sort items client-side
  const filteredAndSortedItems = [...items]
    .filter(item => {
      // Resolve favorite status (taking optimistic state into account)
      const isFav = optimisticFavorites[item.id] !== undefined 
        ? optimisticFavorites[item.id] 
        : !!item.is_favorite;

      if (showFavoritesOnly && !isFav) {
        return false;
      }
      return selectedCategories.includes(item.category);
    })
    .sort((a, b) => {
      if (sortBy === "category") {
        const indexA = CATEGORIES.indexOf(a.category);
        const indexB = CATEGORIES.indexOf(b.category);
        const orderA = indexA === -1 ? 99 : indexA;
        const orderB = indexB === -1 ? 99 : indexB;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
      }
      // Fallback/Recently Added: newest first (order determined by database created_at or fallback)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row gap-12 py-12 px-8 min-h-screen bg-white">
      
      {/* 1. Sidebar: Brand Header & Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <header className="mb-10 border-l border-black pl-6">
          <h2 className="text-3xl font-light tracking-tight leading-tight text-black">
            <span className="italic">{displayName}&apos;s</span> Archive
          </h2>
          <p className="text-gray-400 mt-2 text-[11px] uppercase tracking-widest font-medium leading-relaxed">
            {tagline}
          </p>
        </header>

        <nav className="space-y-8 mt-12">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">
                Filters
              </h3>
              <button 
                onClick={toggleAll}
                className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 hover:text-black font-bold transition-colors cursor-pointer"
              >
                {allSelected ? "Hide All" : "Show All"}
              </button>
            </div>

            <ul className="space-y-3 text-xs uppercase tracking-[0.15em] mb-4">
              <li 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`cursor-pointer transition-colors flex items-center justify-between group ${
                  showFavoritesOnly 
                    ? 'text-rose-400 font-bold' 
                    : 'text-neutral-300 hover:text-neutral-500 font-medium'
                }`}
              >
                <span>Favorites</span>
                <span className={`text-[10px] ${showFavoritesOnly ? 'text-rose-400 opacity-100' : 'text-neutral-300 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  ♥
                </span>
              </li>
            </ul>

            <div className="h-px bg-neutral-100 my-4" />

            <ul className="space-y-3 text-xs uppercase tracking-[0.15em]">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <li 
                    key={cat} 
                    onClick={() => toggleCategory(cat)}
                    className={`cursor-pointer transition-colors flex items-center justify-between group ${
                      isSelected 
                        ? 'text-black font-bold' 
                        : 'text-neutral-300 hover:text-neutral-500 font-medium'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-black opacity-100' : 'text-neutral-300 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      {isSelected ? "✓" : "+"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4 text-gray-300">
              Sort By
            </h3>
            <ul className="space-y-3 text-xs uppercase tracking-[0.15em]">
              <li 
                onClick={() => setSortBy('recently_added')}
                className={`cursor-pointer transition-colors ${
                  sortBy === 'recently_added' ? 'text-black font-bold' : 'text-neutral-300 hover:text-neutral-500 font-medium'
                }`}
              >
                Recently Added
              </li>
              <li 
                onClick={() => setSortBy('category')}
                className={`cursor-pointer transition-colors ${
                  sortBy === 'category' ? 'text-black font-bold' : 'text-neutral-300 hover:text-neutral-500 font-medium'
                }`}
              >
                Category (Top to Bottom)
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* 2. Main Content: The Grid */}
      <main className="flex-grow">
        <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">
            The Collection
          </h3>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            + Add Piece
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-32 border-2 border-dashed border-gray-100 rounded-xl bg-[#fafafa] flex flex-col items-center justify-center">
            <p className="text-gray-400 italic text-sm mb-4">
              Your archive is currently empty.
            </p>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600 hover:underline"
            >
              Start your first entry
            </button>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="py-32 border border-neutral-100 rounded-xl bg-neutral-50 flex flex-col items-center justify-center">
            <p className="text-gray-400 italic text-sm mb-4">
              No items match your selected filters.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={toggleAll}
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-black hover:underline"
              >
                Show all categories
              </button>
              {showFavoritesOnly && (
                <button 
                  onClick={() => setShowFavoritesOnly(false)}
                  className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-500 hover:underline"
                >
                  Clear Favorites Filter
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12 text-black">
            {filteredAndSortedItems.map((item) => {
              const isFavorite = optimisticFavorites[item.id] !== undefined
                ? optimisticFavorites[item.id]
                : !!item.is_favorite;
              return (
                <div key={item.id} className="group cursor-pointer">
                  {/* Image Container */}
                  <div className="aspect-[3/4] bg-gray-50 border border-gray-100 mb-4 overflow-hidden relative">
                    {item.image_url ? (
                      <Image 
                        src={item.image_url} 
                        alt={item.model}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-widest italic">
                        No Preview
                      </div>
                    )}

                    {/* Heart Icon Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, item.id, isFavorite)}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-xs shadow-xs hover:bg-white transition-all cursor-pointer group/heart"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className={`w-4 h-4 transition-colors ${
                          isFavorite
                            ? "fill-rose-500 stroke-rose-500"
                            : "fill-transparent stroke-rose-400 group-hover/heart:stroke-rose-600"
                        }`}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  {/* Meta Data */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold group-hover:text-black transition-colors">
                      {item.brand || "Unbranded"}
                    </p>
                    <p className="text-sm font-medium text-black tracking-tight leading-snug truncate">
                      {item.model}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-light italic">
                        {item.color}
                      </span>
                      <span className="text-[10px] text-gray-200 uppercase tracking-widest">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Hidden Components */}
      <AddItemDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}