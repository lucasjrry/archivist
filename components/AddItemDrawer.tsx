"use client";
import { useState, useRef } from 'react';
import { scrapeProductMetadata, saveItem } from '@/app/actions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ["Outerwear", "Tops", "Bottoms", "Footwear", "Accessories"];

export default function AddItemDrawer({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [foundImages, setFoundImages] = useState<string[]>([]);
  const [isManualImage, setIsManualImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    model: "",
    brand: "",
    category: "Tops",
    color: "",
    image_url: ""
  });

  const handleClose = () => {
    setUrl("");
    setFoundImages([]);
    setIsManualImage(false);
    setFormData({ model: "", brand: "", category: "Tops", color: "", image_url: "" });
    onClose();
  };

  const handleLinkPaste = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pastedUrl = e.target.value;
    setUrl(pastedUrl);
    if (pastedUrl.startsWith('http')) {
      setLoading(true);
      const data = await scrapeProductMetadata(pastedUrl);
      if (data) {
        setFoundImages(data.images || []);
        setIsManualImage(false);
        setFormData(prev => ({ ...prev, model: data.model || "", brand: data.brand || "", image_url: data.images?.[0] || "" }));
      }
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
        setIsManualImage(true);
        setFoundImages([]); // Clear scraped images if manual upload is used
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (!formData.model || !formData.brand || !formData.image_url) {
      alert("Please ensure Brand, Model, and an Image are provided.");
      return;
    }
    setLoading(true);
    const result = await saveItem({ ...formData, isManualImage });
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
            <h2 className="text-xl font-light italic uppercase tracking-widest">Add Piece</h2>
            <button onClick={handleClose} className="text-gray-400">✕</button>
          </div>

          <div className="space-y-6 flex-grow">
            {/* Scraper Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Option 1: Paste Link</label>
              <input value={url} onChange={handleLinkPaste} placeholder="Paste store URL..." className="w-full bg-transparent border-b border-gray-200 py-2 outline-none text-sm" />
            </div>

            {/* Manual Upload Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Option 2: Manual Upload</label>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-black hover:text-black transition-all"
              >
                {isManualImage ? "Image Selected ✓" : "Click to select photo"}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            {/* Preview & Details */}
            <div className="space-y-4 pt-4 border-t">
              <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Brand" className="w-full border-b py-2 text-sm outline-none" />
              <input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="Model Name" className="w-full border-b py-2 text-sm outline-none" />
              <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Color" className="w-full border-b py-2 text-sm outline-none" />
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 text-sm rounded bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Image Picker for Scraped Images */}
            {foundImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-4">
                {foundImages.map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    onClick={() => { setFormData({...formData, image_url: img}); setIsManualImage(false); }}
                    className={`aspect-square object-cover cursor-pointer border-2 ${formData.image_url === img && !isManualImage ? 'border-emerald-500' : 'border-transparent'}`} 
                  />
                ))}
              </div>
            )}
          </div>

          <button onClick={handleConfirm} disabled={loading} className="w-full bg-black text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] mt-8">
            {loading ? "Processing..." : "Confirm Add"}
          </button>
        </div>
      </div>
    </>
  );
}