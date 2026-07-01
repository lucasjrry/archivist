"use client";
import { useState } from 'react';
import AddItemDrawer from './AddItemDrawer';
import Image from 'next/image';
import { toggleFavorite, moveToCloset, deleteItem } from '@/app/actions';

interface ClosetItem {
  id: string;
  model: string; // Changed from name
  category: string;
  brand: string | null;
  color: string | null; // Added color
  image_url: string | null;
  created_at?: string; // Added created_at for client-side sorting
  is_favorite?: boolean; // Added for favoriting functionality
  purchase_price?: number | null;
}

interface DashboardProps {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  items: ClosetItem[];
  mode: 'closet' | 'wishlist';
}

const CATEGORIES = ["Headwear", "Outerwear", "Tops", "Bottoms", "Footwear", "Accessories", "Other"];

export default function PrivateDashboard({ displayName, username, avatarUrl, bio, items, mode }: DashboardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
  const [sortBy, setSortBy] = useState<"recently_added" | "category" | "price_asc" | "price_desc">("recently_added");
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

  const handleMoveToCloset = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    try {
      const result = await moveToCloset(itemId);
      if (!result.success) {
        alert(`Failed to move item to closet: ${result.error}`);
      }
    } catch (err) {
      alert("Failed to move item to closet due to a connection error.");
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, itemId: string, itemModel: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to delete "${itemModel}"?`);
    if (!confirmed) return;

    try {
      const result = await deleteItem(itemId);
      if (!result.success) {
        alert(`Failed to delete item: ${result.error}`);
      }
    } catch (err) {
      alert("Failed to delete item due to a connection error.");
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
      if (sortBy === "price_asc") {
        const priceA = a.purchase_price !== null && a.purchase_price !== undefined ? a.purchase_price : Infinity;
        const priceB = b.purchase_price !== null && b.purchase_price !== undefined ? b.purchase_price : Infinity;
        if (priceA !== priceB) return priceA - priceB;
      }
      if (sortBy === "price_desc") {
        const priceA = a.purchase_price !== null && a.purchase_price !== undefined ? a.purchase_price : -Infinity;
        const priceB = b.purchase_price !== null && b.purchase_price !== undefined ? b.purchase_price : -Infinity;
        if (priceA !== priceB) return priceB - priceA;
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
        <div className="flex gap-4 items-start mb-10">
          {/* Profile Picture Box */}
          <div className="w-16 h-16 bg-neutral-50 border border-neutral-105 flex-shrink-0 relative overflow-hidden rounded-md shadow-2xs">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt={displayName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-300 uppercase tracking-widest font-light italic select-none">
                No Pic
              </div>
            )}
          </div>

          <header className="border-l border-black pl-4 flex-grow min-w-0">
            <h2 className="text-2xl font-light tracking-tight leading-tight text-black break-words">
              <span className="italic">{displayName}&apos;s</span> {mode === 'wishlist' ? 'Wishlist' : 'Archive'}
            </h2>
            {username && (
              <p className="text-neutral-400 text-[11px] mt-1.5 lowercase font-medium">
                @{username}
              </p>
            )}
            <p className="text-gray-400 mt-2 text-[11px] uppercase tracking-widest font-medium leading-relaxed break-words">
              {tagline}
            </p>
          </header>
        </div>

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

            {mode !== 'wishlist' && (
              <>
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
              </>
            )}

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
              <li 
                onClick={() => setSortBy('price_asc')}
                className={`cursor-pointer transition-colors ${
                  sortBy === 'price_asc' ? 'text-black font-bold' : 'text-neutral-300 hover:text-neutral-500 font-medium'
                }`}
              >
                Price: Low to High
              </li>
              <li 
                onClick={() => setSortBy('price_desc')}
                className={`cursor-pointer transition-colors ${
                  sortBy === 'price_desc' ? 'text-black font-bold' : 'text-neutral-300 hover:text-neutral-500 font-medium'
                }`}
              >
                Price: High to Low
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* 2. Main Content: The Grid */}
      <main className="flex-grow">
        <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">
            {mode === 'wishlist' ? 'The Wishlist' : 'The Collection'}
          </h3>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {mode === 'wishlist' ? '+ Add Wishlist Item' : '+ Add Piece'}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-32 border-2 border-dashed border-gray-100 rounded-xl bg-[#fafafa] flex flex-col items-center justify-center">
            <p className="text-gray-400 italic text-sm mb-4">
              {mode === 'wishlist' ? 'Your wishlist is currently empty.' : 'Your archive is currently empty.'}
            </p>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600 hover:underline"
            >
              {mode === 'wishlist' ? 'Add your first desired item' : 'Start your first entry'}
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

                    {/* Delete Button (Left side of card header) */}
                    <button
                      onClick={(e) => handleDeleteItem(e, item.id, item.model)}
                      className="absolute top-3 left-3 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-xs shadow-xs hover:bg-neutral-200 text-neutral-400 hover:text-neutral-850 transition-all cursor-pointer"
                      title="Delete Item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5 fill-none stroke-current"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>

                    {/* Move to Closet Button (Right side, Only for Wishlist mode) */}
                    {mode === 'wishlist' && (
                      <button
                        onClick={(e) => handleMoveToCloset(e, item.id)}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-xs shadow-xs hover:bg-emerald-600 hover:text-white transition-all cursor-pointer group/owned text-neutral-600"
                        title="Mark as Owned / Move to Closet"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-4 h-4 fill-none stroke-current"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    )}

                    {/* Heart Icon Button (Right side, Only for Closet mode) */}
                    {mode === 'closet' && (
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
                    )}
                  </div>

                  {/* Meta Data */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold group-hover:text-black transition-colors">
                      {item.brand || "Unbranded"}
                    </p>
                    <p className="text-sm font-medium text-black tracking-tight leading-snug truncate">
                      {item.model}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        {item.color && (
                          <span className="text-[10px] text-gray-400 font-light italic">
                            {item.color}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-200 uppercase tracking-widest">
                          {item.category}
                        </span>
                      </div>
                      {item.purchase_price !== null && item.purchase_price !== undefined && (
                        <span className="text-[10px] font-medium text-neutral-500 font-mono">
                          ${item.purchase_price}
                        </span>
                      )}
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
        isWishlist={mode === 'wishlist'}
      />
    </div>
  );
}