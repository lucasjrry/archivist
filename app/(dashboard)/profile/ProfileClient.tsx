'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { updateProfileSettings, updateShowcaseItems, updateFavoriteBrands } from './actions';
import { getBrandSuggestions } from '@/app/actions';

interface ClosetItem {
  id: string;
  brand: string | null;
  model: string;
  image_url: string | null;
  category: string;
  purchase_price?: number | null;
  created_at?: string;
  is_wishlist?: boolean;
}

interface Profile {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  showcase_item_ids: string[] | null;
  favorite_brands: string[] | null;
}

interface ProfileClientProps {
  profile: Profile;
  allItems: ClosetItem[];
}

export default function ProfileClient({ profile, allItems }: ProfileClientProps) {
  const closetItems = allItems.filter(item => !item.is_wishlist);
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile);
  const [isEditing, setIsEditing] = useState(false);

  // Profile Form States
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Showcase Selector States
  const [activeItemSlot, setActiveItemSlot] = useState<number | null>(null);
  const [activeBrandSlot, setActiveBrandSlot] = useState<number | null>(null);

  // Search/Autocomplete States
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [brandSuggestions, setBrandSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [loadingBrandSuggestions, setLoadingBrandSuggestions] = useState(false);

  // Sync state if server data updates
  useEffect(() => {
    setCurrentProfile(profile);
    setFullName(profile.full_name || '');
    setBio(profile.bio || '');
    setAvatarPreview(profile.avatar_url || '');
  }, [profile]);

  // Autocomplete for Favorite Brands
  useEffect(() => {
    if (brandSearchQuery.trim().length >= 2) {
      const fetchSuggestions = async () => {
        setLoadingBrandSuggestions(true);
        try {
          const results = await getBrandSuggestions(brandSearchQuery);
          setBrandSuggestions(results);
        } catch (err) {
          console.error('Failed to search brands:', err);
        } finally {
          setLoadingBrandSuggestions(false);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
    } else {
      setBrandSuggestions([]);
    }
  }, [brandSearchQuery]);

  // Profile Form Change Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateProfileSettings(formData);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setIsEditing(false);
        // Optimistically set the profile state
        setCurrentProfile(prev => ({
          ...prev,
          full_name: fullName,
          bio: bio,
          avatar_url: avatarPreview
        }));
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Item Showcase Add/Remove
  const handleSelectShowcaseItem = async (itemId: string, index: number) => {
    const currentIds = [...(currentProfile.showcase_item_ids || [])];
    currentIds[index] = itemId;
    const newIds = currentIds.filter(id => id && id.trim() !== '');

    // Optimistic Update
    setCurrentProfile(prev => ({
      ...prev,
      showcase_item_ids: newIds
    }));
    setActiveItemSlot(null);
    setItemSearchQuery('');

    const res = await updateShowcaseItems(newIds);
    if (res.error) {
      alert(res.error);
      // Revert
      setCurrentProfile(prev => ({
        ...prev,
        showcase_item_ids: profile.showcase_item_ids
      }));
    }
  };

  const handleRemoveShowcaseItem = async (index: number) => {
    const currentIds = [...(currentProfile.showcase_item_ids || [])];
    currentIds.splice(index, 1);
    const newIds = currentIds.filter(id => id && id.trim() !== '');

    // Optimistic Update
    setCurrentProfile(prev => ({
      ...prev,
      showcase_item_ids: newIds
    }));

    const res = await updateShowcaseItems(newIds);
    if (res.error) {
      alert(res.error);
      // Revert
      setCurrentProfile(prev => ({
        ...prev,
        showcase_item_ids: profile.showcase_item_ids
      }));
    }
  };

  // Favorite Brand Add/Remove
  const handleSelectFavoriteBrand = async (brandName: string, index: number) => {
    const currentBrands = [...(currentProfile.favorite_brands || [])];
    currentBrands[index] = brandName;
    const newBrands = currentBrands.filter(b => b && b.trim() !== '');

    // Optimistic Update
    setCurrentProfile(prev => ({
      ...prev,
      favorite_brands: newBrands
    }));
    setActiveBrandSlot(null);
    setBrandSearchQuery('');

    const res = await updateFavoriteBrands(newBrands);
    if (res.error) {
      alert(res.error);
      // Revert
      setCurrentProfile(prev => ({
        ...prev,
        favorite_brands: profile.favorite_brands
      }));
    }
  };

  const handleRemoveFavoriteBrand = async (index: number) => {
    const currentBrands = [...(currentProfile.favorite_brands || [])];
    currentBrands.splice(index, 1);
    const newBrands = currentBrands.filter(b => b && b.trim() !== '');

    // Optimistic Update
    setCurrentProfile(prev => ({
      ...prev,
      favorite_brands: newBrands
    }));

    const res = await updateFavoriteBrands(newBrands);
    if (res.error) {
      alert(res.error);
      // Revert
      setCurrentProfile(prev => ({
        ...prev,
        favorite_brands: profile.favorite_brands
      }));
    }
  };

  // Helper values for rendering showcase slots
  const showcaseItemIds = currentProfile.showcase_item_ids || [];
  const favoriteBrands = currentProfile.favorite_brands || [];

  const itemSlots = Array.from({ length: 4 }, (_, i) => {
    const itemId = showcaseItemIds[i];
    return itemId ? closetItems.find(item => item.id === itemId) : null;
  });

  const brandSlots = Array.from({ length: 4 }, (_, i) => favoriteBrands[i] || null);

  // Group allItems by date string
  interface ActivityGroup {
    date: string;
    items: ClosetItem[];
  }

  const activityGroups: ActivityGroup[] = [];
  allItems.forEach(item => {
    const dateStr = item.created_at 
      ? new Date(item.created_at).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'Unknown Date';
      
    let group = activityGroups.find(g => g.date === dateStr);
    if (!group) {
      group = { date: dateStr, items: [] };
      activityGroups.push(group);
    }
    group.items.push(item);
  });

  const getLocalTimeString = (createdAtString?: string) => {
    if (!createdAtString) return '';
    return new Date(createdAtString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter closet items for selection
  const availableItems = closetItems.filter(item => {
    const isAlreadyShowcased = showcaseItemIds.includes(item.id);
    if (isAlreadyShowcased) return false;

    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase();
      const b = (item.brand || '').toLowerCase();
      const m = item.model.toLowerCase();
      return b.includes(q) || m.includes(q);
    }
    return true;
  });

  const displayName = currentProfile.full_name || `@${currentProfile.username}`;
  const showSubUsername = !!currentProfile.full_name;

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 border border-neutral-100 rounded-xl shadow-2xs">
        <header className="mb-10 border-l border-black pl-6">
          <h1 className="text-3xl font-light tracking-tight leading-tight text-black">
            Edit Profile
          </h1>
          <p className="text-gray-400 mt-2 text-[11px] uppercase tracking-widest font-medium leading-relaxed">
            Update your curator identity and bio.
          </p>
        </header>

        <form onSubmit={handleSaveProfile} className="space-y-8 text-black">
          {/* PROFILE PICTURE */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-3">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-neutral-50 border border-neutral-200 rounded-md flex-shrink-0 relative overflow-hidden flex items-center justify-center text-[10px] text-neutral-400 shadow-2xs">
                {avatarPreview ? (
                  <Image 
                    src={avatarPreview} 
                    alt="Profile Preview" 
                    fill 
                    className="object-cover" 
                  />
                ) : (
                  "No Photo"
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-neutral-350 hover:border-black hover:text-black text-xs font-semibold uppercase tracking-widest rounded transition-all text-neutral-700 cursor-pointer"
              >
                Change Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input type="hidden" name="avatarBase64" value={avatarPreview.startsWith('data:') ? avatarPreview : ''} />
            </div>
          </div>

          {/* USERNAME (READ-ONLY) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Username</label>
            <input 
              type="text" 
              value={currentProfile.username ? `@${currentProfile.username}` : ''}
              disabled
              className="w-full border-b border-gray-200 py-2 text-sm outline-none font-sans text-neutral-400 bg-transparent select-none cursor-not-allowed"
            />
            <p className="text-[10px] text-gray-400 italic">Username cannot be changed.</p>
          </div>

          {/* FULL NAME */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Full Name</label>
            <input 
              id="fullName"
              name="fullName" 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full border-b border-gray-200 py-2.5 text-sm outline-none font-sans focus:border-black transition-colors bg-transparent placeholder-gray-300"
            />
          </div>

          {/* BIO */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Bio</label>
            <textarea 
              id="bio"
              name="bio" 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your style curation..."
              rows={4}
              maxLength={250}
              className="w-full border border-gray-200 rounded-md p-3 text-sm outline-none font-sans focus:border-black transition-colors bg-transparent placeholder-gray-300 resize-none"
            />
          </div>

          {error && (
            <div className="bg-rose-50/70 border border-rose-100 text-rose-800 text-xs px-4 py-3 rounded-lg leading-relaxed">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-black text-white py-3.5 text-[10px] font-bold uppercase tracking-[0.3em] cursor-pointer hover:bg-neutral-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsEditing(false);
                setAvatarPreview(currentProfile.avatar_url || '');
                setFullName(currentProfile.full_name || '');
                setBio(currentProfile.bio || '');
              }}
              className="px-6 py-3.5 border border-neutral-350 hover:border-black text-[10px] font-bold uppercase tracking-[0.2em] transition-all text-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* 1. PROFILE HEADER CARD */}
      <section className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-center sm:items-start gap-8 bg-neutral-50/40 border border-neutral-100/80 p-8 rounded-2xl shadow-3xs relative">
        {/* Avatar Image */}
        <div className="w-28 h-28 bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden relative shadow-sm flex-shrink-0">
          {currentProfile.avatar_url ? (
            <Image 
              src={currentProfile.avatar_url} 
              alt={displayName}
              fill
              sizes="112px"
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-350 uppercase tracking-widest font-light italic select-none">
              No Pic
            </div>
          )}
        </div>

        {/* Identity Details */}
        <div className="flex-grow text-center sm:text-left space-y-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-light tracking-tight text-neutral-900 leading-none">
              {displayName}
            </h1>
            {showSubUsername && (
              <p className="text-neutral-400 text-xs lowercase font-mono">
                @{currentProfile.username}
              </p>
            )}
          </div>

          {currentProfile.bio ? (
            <p className="text-sm text-neutral-600 max-w-xl leading-relaxed italic">
              {currentProfile.bio}
            </p>
          ) : (
            <p className="text-sm text-neutral-350 max-w-xl leading-relaxed italic">
              No bio written yet.
            </p>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={() => {
            setFullName(currentProfile.full_name || '');
            setBio(currentProfile.bio || '');
            setAvatarPreview(currentProfile.avatar_url || '');
            setSuccess(false);
            setError('');
            setIsEditing(true);
          }}
          className="absolute top-6 right-6 px-4 py-2 border border-neutral-200 hover:border-black text-[9px] uppercase font-bold tracking-[0.2em] transition-all duration-300 rounded cursor-pointer text-neutral-500 hover:text-black bg-white shadow-3xs"
        >
          Edit Profile
        </button>
      </section>

      {/* 2. CONDENSED DISPLAY SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* ITEM SHOWCASE */}
        <div className="space-y-4">
          <header className="flex justify-between items-end border-b border-neutral-100 pb-2">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-400">
              Item Showcase
            </h3>
            <span className="text-[9px] uppercase tracking-wider text-neutral-300">
              Select up to 4 items
            </span>
          </header>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {itemSlots.map((item, index) => {
              if (item) {
                return (
                  <div key={item.id} className="relative aspect-[2/3] w-full bg-neutral-50 border border-neutral-150 overflow-hidden rounded shadow-2xs group">
                    <Image 
                      src={item.image_url || '/placeholder.png'} 
                      alt={item.model}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 text-white">
                      <button
                        onClick={() => handleRemoveShowcaseItem(index)}
                        className="self-end w-5 h-5 flex items-center justify-center bg-white/10 hover:bg-rose-600/90 border border-white/10 rounded-full text-[10px] text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm font-bold"
                        title="Remove from showcase"
                      >
                        ✕
                      </button>
                      <div className="text-left space-y-0.5">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 truncate">
                          {item.brand || 'Unknown'}
                        </p>
                        <h4 className="text-[11px] font-medium leading-snug line-clamp-2">
                          {item.model}
                        </h4>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={`empty-item-${index}`}
                  onClick={() => setActiveItemSlot(index)}
                  className="aspect-[2/3] w-full border border-dashed border-neutral-300 hover:border-neutral-800 bg-neutral-50/20 hover:bg-neutral-50/70 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer rounded group relative"
                >
                  <span className="text-3xl font-extralight text-neutral-400 group-hover:text-black transition-colors duration-300 leading-none">
                    +
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.15em] text-neutral-400 group-hover:text-black mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Add Item
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAVORITE BRANDS */}
        <div className="space-y-4">
          <header className="flex justify-between items-end border-b border-neutral-100 pb-2">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-400">
              Favorite Brands
            </h3>
            <span className="text-[9px] uppercase tracking-wider text-neutral-300">
              Top 4 curatorships
            </span>
          </header>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {brandSlots.map((brand, index) => {
              if (brand) {
                return (
                  <div 
                    key={`brand-${index}`} 
                    className="relative aspect-[2/3] w-full bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-850 rounded shadow-sm group flex flex-col items-center justify-center p-4 text-center"
                  >
                    {/* Brand Name Text (Poster-like style) */}
                    <div className="uppercase tracking-[0.2em] text-[10px] sm:text-xs font-semibold text-neutral-100 px-2 select-none leading-relaxed border-b border-neutral-800 pb-1.5 mb-1.5 w-full">
                      {brand}
                    </div>
                    <div className="text-[8px] tracking-widest text-neutral-500 uppercase select-none">
                      Rank {index + 1}
                    </div>

                    {/* Remove Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-end p-2.5 rounded">
                      <button
                        onClick={() => handleRemoveFavoriteBrand(index)}
                        className="w-5 h-5 flex items-center justify-center bg-white/10 hover:bg-rose-600/90 border border-white/10 rounded-full text-[10px] text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm font-bold"
                        title="Remove brand"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={`empty-brand-${index}`}
                  onClick={() => setActiveBrandSlot(index)}
                  className="aspect-[2/3] w-full border border-dashed border-neutral-300 hover:border-neutral-800 bg-neutral-50/20 hover:bg-neutral-50/70 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer rounded group relative"
                >
                  <span className="text-3xl font-extralight text-neutral-400 group-hover:text-black transition-colors duration-300 leading-none">
                    +
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.15em] text-neutral-400 group-hover:text-black mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Add Brand
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. ACTIVITY FEED */}
      <section className="space-y-8">
        <header className="border-b border-neutral-100 pb-2">
          <h3 className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-400">
            Activity Feed
          </h3>
        </header>

        {activityGroups.length > 0 ? (
          <div className="space-y-10">
            {activityGroups.map((group) => (
              <div key={group.date} className="space-y-4">
                {/* Date Group Header */}
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-800 bg-neutral-50 border border-neutral-200/60 px-3 py-1.5 rounded inline-block select-none">
                  {group.date}
                </h4>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 border border-neutral-100/70 hover:border-neutral-200 rounded-lg hover:bg-neutral-50/30 transition-all group">
                      {/* Item Image */}
                      <div className="relative w-14 h-18 sm:w-16 sm:h-20 bg-neutral-50 border border-neutral-150 rounded overflow-hidden flex-shrink-0">
                        <Image 
                          src={item.image_url || '/placeholder.png'} 
                          alt={item.model}
                          fill
                          sizes="64px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Info details */}
                      <div className="flex-grow space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.is_wishlist ? (
                            <span className="border border-neutral-350 text-neutral-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-neutral-50/50">
                              Wishlisted
                            </span>
                          ) : (
                            <span className="bg-black text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                              Added to closet
                            </span>
                          )}
                          
                          <span className="text-[10px] text-neutral-400 font-mono font-medium">
                            at {getLocalTimeString(item.created_at)}
                          </span>
                        </div>

                        <div className="space-y-0.5 mt-0.5">
                          <p className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 truncate">
                            {item.brand || 'Unknown Brand'}
                          </p>
                          <h4 className="text-sm font-semibold text-neutral-800 leading-snug truncate">
                            {item.model}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 pt-0.5">
                          <span className="text-[8px] uppercase tracking-wider text-neutral-500 bg-neutral-100 border border-neutral-150 px-1.5 py-0.5 rounded-sm">
                            {item.category}
                          </span>
                          {item.purchase_price !== null && item.purchase_price !== undefined && (
                            <span className="text-xs font-mono font-medium text-neutral-600">
                              ${item.purchase_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-lg bg-neutral-50/20">
            No activity history yet. Start by adding items to your closet or wishlist!
          </div>
        )}
      </section>

      {/* 4. ITEM SELECTOR MODAL */}
      {activeItemSlot !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-black">
          <div className="bg-white border border-neutral-100 rounded-xl max-w-lg w-full max-h-[75vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-150">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Select Item (Slot {activeItemSlot + 1})
              </h3>
              <button 
                onClick={() => {
                  setActiveItemSlot(null);
                  setItemSearchQuery('');
                }}
                className="text-neutral-400 hover:text-black text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </header>

            {/* Modal Search */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
              <input 
                type="text"
                placeholder="Search by brand or model..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full border border-neutral-250 rounded-md py-2 px-3 text-xs outline-none bg-white focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
              />
            </div>

            {/* Modal Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {availableItems.length > 0 ? (
                availableItems.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectShowcaseItem(item.id, activeItemSlot)}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-100 cursor-pointer transition-all duration-200"
                  >
                    <div className="relative w-12 h-16 bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 rounded-sm">
                      <Image 
                        src={item.image_url || '/placeholder.png'} 
                        alt={item.model}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="block text-[9px] uppercase font-bold tracking-widest text-neutral-400 truncate">
                        {item.brand || 'Unknown Brand'}
                      </span>
                      <span className="block text-xs font-semibold text-neutral-800 truncate">
                        {item.model}
                      </span>
                      <span className="inline-block text-[8px] uppercase tracking-wider text-neutral-400 bg-neutral-100 border border-neutral-150 px-1.5 py-0.5 rounded-sm mt-1">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Select</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-sm text-neutral-400">
                  {closetItems.length === 0 ? (
                    <span>You have no items in your closet yet.</span>
                  ) : (
                    <span>No matching available items.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. BRAND SELECTOR MODAL */}
      {activeBrandSlot !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-black">
          <div className="bg-white border border-neutral-100 rounded-xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-150">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Select Brand (Slot {activeBrandSlot + 1})
              </h3>
              <button 
                onClick={() => {
                  setActiveBrandSlot(null);
                  setBrandSearchQuery('');
                }}
                className="text-neutral-400 hover:text-black text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </header>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Search or Type Brand</label>
                <input 
                  type="text"
                  placeholder="e.g. Prada, Yohji Yamamoto..."
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && brandSearchQuery.trim()) {
                      handleSelectFavoriteBrand(brandSearchQuery.trim(), activeBrandSlot);
                    }
                  }}
                  className="w-full border border-neutral-250 rounded-md py-2 px-3 text-xs outline-none focus:border-black transition-all"
                  autoFocus
                />
              </div>

              {/* Suggestions dropdown container */}
              {(brandSearchQuery.trim().length >= 2 || brandSuggestions.length > 0) && (
                <div className="border-t border-neutral-100 max-h-56 overflow-y-auto pt-3 space-y-1">
                  {loadingBrandSuggestions && (
                    <div className="text-[10px] text-neutral-400 italic px-3 py-1">Searching...</div>
                  )}

                  {!loadingBrandSuggestions && brandSuggestions.map((brand) => (
                    <div 
                      key={brand.id}
                      onClick={() => handleSelectFavoriteBrand(brand.name, activeBrandSlot)}
                      className="flex items-center justify-between px-3 py-2 text-xs hover:bg-neutral-50 rounded cursor-pointer transition-colors text-neutral-800 font-medium"
                    >
                      <span>{brand.name}</span>
                      <span className="text-[9px] uppercase text-neutral-350 tracking-wider">Select</span>
                    </div>
                  ))}

                  {/* Add typed custom brand */}
                  {brandSearchQuery.trim() && !brandSuggestions.some(b => b.name.toLowerCase() === brandSearchQuery.trim().toLowerCase()) && (
                    <div 
                      onClick={() => handleSelectFavoriteBrand(brandSearchQuery.trim(), activeBrandSlot)}
                      className="flex items-center justify-between px-3 py-2 text-xs hover:bg-neutral-50 rounded cursor-pointer transition-colors text-neutral-500 italic"
                    >
                      <span>Add custom &ldquo;{brandSearchQuery.trim()}&rdquo;</span>
                      <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Enter ↵</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    if (brandSearchQuery.trim()) {
                      handleSelectFavoriteBrand(brandSearchQuery.trim(), activeBrandSlot);
                    }
                  }}
                  disabled={!brandSearchQuery.trim()}
                  className="bg-black text-white px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest cursor-pointer hover:bg-neutral-800 transition-colors disabled:bg-gray-250 disabled:cursor-not-allowed rounded-sm"
                >
                  Confirm Brand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
