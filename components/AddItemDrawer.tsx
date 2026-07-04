"use client";
import { useState, useRef } from 'react';
import { scrapeProductMetadata, saveItem, getBrandSuggestions, getItemSuggestions } from '@/app/actions';
import { compressImage } from '@/utils/image';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isWishlist?: boolean;
}

const CATEGORIES = ["Outerwear", "Tops", "Bottoms", "Footwear", "Accessories", "Headwear", "Other"];

export default function AddItemDrawer({ isOpen, onClose, isWishlist }: Props) {
  const [loading, setLoading] = useState(false);
  const [scraperStatus, setScraperStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [url, setUrl] = useState("");
  const [foundImages, setFoundImages] = useState<string[]>([]);
  const [isManualImage, setIsManualImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    model: "",
    brand: "",
    category: "Tops",
    color: "",
    image_url: "",
    purchase_price: ""
  });

  const [brandSuggestions, setBrandSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<{ id: string; name: string; category: string }[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleClose = () => {
    setUrl("");
    setFoundImages([]);
    setIsManualImage(false);
    setFormData({ model: "", brand: "", category: "Tops", color: "", image_url: "", purchase_price: "" });
    setBrandSuggestions([]);
    setItemSuggestions([]);
    setSelectedBrandId(null);
    setSelectedItemId(null);
    setScraperStatus(null);
    onClose();
  };

  const handleLinkPaste = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pastedUrl = e.target.value;
    setUrl(pastedUrl);
    if (pastedUrl.startsWith('http')) {
      setLoading(true);
      setScraperStatus('loading');
      const data = await scrapeProductMetadata(pastedUrl);
      if (data) {
        setFoundImages(data.images || []);
        setIsManualImage(false);
        setFormData(prev => ({ 
          ...prev, 
          model: data.model || "", 
          brand: data.brand || "", 
          image_url: data.images?.[0] || "",
          category: data.category || prev.category,
          purchase_price: data.price !== null && data.price !== undefined ? String(data.price) : ""
        }));
        setScraperStatus('success');
      } else {
        setScraperStatus('error');
      }
      setLoading(false);
    } else {
      setScraperStatus(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("The selected file is too large (over 15MB). Please select a smaller image.");
        e.target.value = "";
        return;
      }
      try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, image_url: compressedBase64 }));
        setIsManualImage(true);
      } catch (err) {
        console.error("Failed to compress image:", err);
        // Fallback: read file raw if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, image_url: reader.result as string }));
          setIsManualImage(true);
        };
        reader.readAsDataURL(file);
      }
    }
    // Clear the input value so selecting the same file again fires the change event
    e.target.value = "";
  };

  const handleBrandChange = async (val: string) => {
    setFormData(prev => ({ ...prev, brand: val }));
    setSelectedBrandId(null);
    setSelectedItemId(null);
    setItemSuggestions([]);
    
    if (val.trim().length >= 2) {
      try {
        const results = await getBrandSuggestions(val);
        setBrandSuggestions(results);
      } catch (err) {
        console.error(err);
      }
    } else {
      setBrandSuggestions([]);
    }
  };

  const handleSelectBrand = (brand: { id: string; name: string }) => {
    setFormData(prev => ({ ...prev, brand: brand.name }));
    setSelectedBrandId(brand.id);
    setBrandSuggestions([]);
  };

  const handleModelChange = async (val: string) => {
    setFormData(prev => ({ ...prev, model: val }));
    setSelectedItemId(null);
    
    if (selectedBrandId && val.trim().length >= 2) {
      try {
        const results = await getItemSuggestions(selectedBrandId, val);
        setItemSuggestions(results);
      } catch (err) {
        console.error(err);
      }
    } else {
      setItemSuggestions([]);
    }
  };

  const handleSelectItem = (item: { id: string; name: string; category: string }) => {
    setFormData(prev => ({ 
      ...prev, 
      model: item.name,
      category: item.category
    }));
    setSelectedItemId(item.id);
    setItemSuggestions([]);
  };

  const handleConfirm = async () => {
    if (!formData.model || !formData.brand || !formData.image_url) {
      alert("Please ensure Brand, Model, and an Image are provided.");
      return;
    }
    setLoading(true);
    const parsedPrice = formData.purchase_price ? parseInt(formData.purchase_price) : null;
    const result = await saveItem({ 
      ...formData, 
      purchase_price: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : null,
      isManualImage,
      brandId: selectedBrandId,
      canonicalItemId: selectedItemId,
      is_wishlist: isWishlist ?? false,
    });
    setLoading(false);
    if (result.success) handleClose();
    else alert(`Error: ${result.error}`);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={handleClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col text-black overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-light italic uppercase tracking-widest">{isWishlist ? "Add Wishlist Item" : "Add Piece"}</h2>
            <button onClick={handleClose} className="text-gray-400">✕</button>
          </div>

          <div className="space-y-6 flex-grow">
            {/* Scraper Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Option 1: Paste Link</label>
                {scraperStatus === 'loading' && (
                  <span className="text-[9px] uppercase tracking-wider text-amber-500 font-bold animate-pulse">Scraping...</span>
                )}
                {scraperStatus === 'success' && (
                  <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold">Autofilled ✓</span>
                )}
                {scraperStatus === 'error' && (
                  <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold">Could not autofill</span>
                )}
              </div>
              <input value={url} onChange={handleLinkPaste} placeholder="Paste store URL..." className="w-full bg-transparent border-b border-gray-200 py-2 outline-none text-sm" />
              {scraperStatus === 'error' && (
                <p className="text-[9px] text-gray-400 mt-1.5 italic">
                  We couldn&apos;t automatically scrape details. You can still input them manually below.
                </p>
              )}
            </div>

            {/* Manual Upload Section */}
            <div className={`bg-gray-50 p-4 rounded-lg border transition-all ${isManualImage ? 'border-neutral-800' : 'border-gray-100'}`}>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Option 2: Manual Upload</label>
              <div className="flex gap-3 items-center">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-grow py-4 border-2 border-dashed rounded-lg text-xs transition-all ${
                    isManualImage 
                      ? 'border-neutral-800 text-neutral-800 font-bold bg-neutral-50' 
                      : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'
                  }`}
                >
                  {isManualImage ? "Manual Image Active ✓" : "Click to select photo"}
                </button>
                {isManualImage && formData.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={formData.image_url} 
                    alt="Manual upload preview"
                    className="w-12 h-16 object-cover border rounded bg-white shadow-xs"
                  />
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            {/* Preview & Details */}
            <div className="space-y-4 pt-4 border-t">
              {/* Brand Input with Autocomplete */}
              <div className="relative">
                <input 
                  value={formData.brand} 
                  onChange={e => handleBrandChange(e.target.value)} 
                  onBlur={() => setTimeout(() => setBrandSuggestions([]), 200)}
                  placeholder="Brand" 
                  className="w-full border-b py-2 text-sm outline-none font-sans" 
                />
                {brandSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {brandSuggestions.map(brand => (
                      <li 
                        key={brand.id}
                        onMouseDown={() => handleSelectBrand(brand)}
                        className="px-4 py-2.5 text-xs text-gray-700 hover:bg-black hover:text-white cursor-pointer transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium">{brand.name}</span>
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Existing Brand</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Model Input with Autocomplete */}
              <div className="relative">
                <input 
                  value={formData.model} 
                  onChange={e => handleModelChange(e.target.value)} 
                  onBlur={() => setTimeout(() => setItemSuggestions([]), 200)}
                  placeholder="Model Name" 
                  className="w-full border-b py-2 text-sm outline-none font-sans" 
                  disabled={!formData.brand} 
                />
                {itemSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {itemSuggestions.map(item => (
                      <li 
                        key={item.id}
                        onMouseDown={() => handleSelectItem(item)}
                        className="px-4 py-2.5 text-xs text-gray-700 hover:bg-black hover:text-white cursor-pointer transition-colors flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium block">{item.name}</span>
                          <span className="text-[9px] text-gray-400 italic block">{item.category}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Existing Item</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Color" className="w-full border-b py-2 text-sm outline-none font-sans" />
              
              <div className="relative">
                <input 
                  type="number"
                  value={formData.purchase_price} 
                  onChange={e => setFormData({...formData, purchase_price: e.target.value})} 
                  placeholder={isWishlist ? "Target / Retail Price ($)" : "Purchase Price ($)"} 
                  className="w-full border-b py-2 text-sm outline-none font-sans"
                  min="0"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 text-sm rounded bg-white font-sans text-gray-700 outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Image Picker for Scraped Images */}
            {foundImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-4">
                {foundImages.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    key={i} 
                    src={img} 
                    alt={`Scraped product ${i + 1}`}
                    onClick={() => { setFormData({...formData, image_url: img}); setIsManualImage(false); }}
                    className={`aspect-square object-cover cursor-pointer border-2 ${formData.image_url === img && !isManualImage ? 'border-emerald-500' : 'border-transparent'}`} 
                  />
                ))}
              </div>
            )}

            {/* Closet Card Preview */}
            <div className="pt-6 border-t border-gray-150 space-y-4">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Closet Card Preview
              </label>
              <div className="max-w-[220px] mx-auto bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                {/* Image Box */}
                <div className="aspect-[3/4] bg-neutral-50 border border-neutral-100 mb-4 overflow-hidden relative">
                  {formData.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={formData.image_url} 
                      alt={formData.model || "Preview"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-widest italic">
                      No Preview
                    </div>
                  )}
                </div>
                {/* Meta Data */}
                <div className="space-y-1 text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold truncate">
                    {formData.brand.trim() || "Brand"}
                  </p>
                  <p className="text-sm font-medium text-black tracking-tight leading-snug truncate">
                    {formData.model.trim() || "Model Name"}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {formData.color.trim() && (
                        <span className="text-[10px] text-gray-400 font-light italic truncate">
                          {formData.color.trim()}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-250 uppercase tracking-widest font-sans truncate">
                        {formData.category}
                      </span>
                    </div>
                    {formData.purchase_price && (
                      <span className="text-[10px] font-medium text-neutral-500 font-mono">
                        ${formData.purchase_price}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleConfirm} disabled={loading} className="w-full bg-black text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] mt-8 cursor-pointer hover:bg-neutral-800 transition-colors">
            {loading ? "Processing..." : "Confirm Add"}
          </button>
        </div>
      </div>
    </>
  );
}