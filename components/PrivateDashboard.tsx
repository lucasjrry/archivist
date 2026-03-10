"use client";
import { useState } from 'react';
import AddItemDrawer from './AddItemDrawer';
import Image from 'next/image';

interface ClosetItem {
  id: string;
  model: string; // Changed from name
  category: string;
  brand: string | null;
  color: string | null; // Added color
  image_url: string | null;
}

interface DashboardProps {
  displayName: string;
  bio?: string | null;
  items: ClosetItem[];
}

export default function PrivateDashboard({ displayName, bio, items }: DashboardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const tagline = bio || "Collecting perfect menswear";

  const categories = ["Outerwear", "Tops", "Bottoms", "Footwear", "Accessories"];

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
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4 text-gray-300">
              Filters
            </h3>
            <ul className="space-y-3 text-xs text-gray-500 uppercase tracking-[0.15em]">
              <li className="text-black font-bold cursor-pointer transition-colors">
                All Items
              </li>
              {categories.map((cat) => (
                <li 
                  key={cat} 
                  className="hover:text-black cursor-pointer transition-colors"
                >
                  {cat}
                </li>
              ))}
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
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12 text-black">
            {items.map((item) => (
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
                      // unoptimized is removed because your domain is now whitelisted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-widest italic">
                      No Preview
                    </div>
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
            ))}
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