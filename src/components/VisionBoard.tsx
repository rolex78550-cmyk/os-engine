import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Image as ImageIcon, Trash2, Loader2, Sparkles, X } from 'lucide-react';
import { VisionItem } from '../types';

interface VisionBoardProps {
  items: VisionItem[];
  onAdd: (imageUrl: string, caption: string) => Promise<void>;
  onDelete: (id: string) => void;
  isUploading: boolean;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // === RESTORED TO PREVIOUS WORKING BEHAVIOR ===
        // This level was working before (600px @ 0.55 quality)
        // Still safe for Firestore but images look good
        const MAX_WIDTH = 580;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Quality restored to previous working value
        const dataUrl = canvas.toDataURL('image/webp', 0.55);
        
        const sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
        console.log(`[Vision] Restored compression: ${width}px → ${sizeKB}KB`);
        
        // Gentle safety warning only
        if (sizeKB > 920) {
          console.warn('[Vision] Image is large but will try to save');
        }
        
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image into canvas"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default function VisionBoard({ items, onAdd, onDelete, isUploading }: VisionBoardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setPreviewImage(compressed);
      } catch (err) {
        console.error("Image compression failed", err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!previewImage) return;
    
    const sizeKB = Math.round((previewImage.length * 0.75) / 1024);
    console.log(`[VisionBoard] Submitting image. Size: ${sizeKB}KB`);

    try {
      // This is the exact flow that worked before
      await onAdd(previewImage, caption);
      console.log("[VisionBoard] ✅ Vision saved to Firestore successfully");
    } catch (e: any) {
      console.error("[VisionBoard] Save failed:", e);
      alert("Image could not be saved to database. Please try again or use a smaller photo.");
      return;
    }
    
    setShowAddModal(false);
    setPreviewImage(null);
    setCaption("");
  };

  // Pinterest style requires breaking items into columns or using CSS columns
  // CSS `columns-2 md:columns-3 lg:columns-4 gap-4` is great for masonry!

  return (
    <div className="w-full space-y-8 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/40 p-6 md:p-8 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sparkles className="text-amber-400" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Vision Board</h2>
          </div>
          <p className="text-sm text-white/50 max-w-md">
            Anchor your reality. Upload images of the exact lifestyle, objects, and feelings you are currently magnetizing.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="relative z-10 shrink-0 group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
        >
          <Plus size={18} />
          Add Vision
        </button>
      </div>

      {/* Masonry Grid */}
      {items.length === 0 ? (
        <div className="text-center py-20 border border-white/5 border-dashed rounded-[32px] bg-white/[0.01]">
          <ImageIcon className="mx-auto mb-4 text-white/10" size={48} />
          <h3 className="text-lg font-bold text-white/40 mb-2">Your canvas is empty</h3>
          <p className="text-white/30 text-sm max-w-sm mx-auto mb-6">Start building your physical manifestation board by adding your first visual anchor.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all font-medium text-sm border border-white/10"
          >
            Upload First Vision
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-12">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: (i % 10) * 0.05 }}
                className="break-inside-avoid relative group rounded-3xl overflow-hidden bg-white/5 border border-white/10"
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.caption || "Vision"} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {item.caption && (
                    <p className="text-white font-medium text-sm leading-snug drop-shadow-md mb-2 font-sans">
                      {item.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this vision?')) onDelete(item.id);
                      }}
                      className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors backdrop-blur-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isUploading && setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowAddModal(false)} 
                disabled={isUploading}
                className="absolute top-6 right-6 text-white/40 hover:text-white z-10 disabled:opacity-50 bg-black/50 p-2 rounded-full backdrop-blur-md"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold mb-6 text-white px-2">Add New Vision</h3>

              <div className="space-y-6">
                {/* Image Upload Area */}
                {!previewImage ? (
                  <div 
                    onClick={() => !isCompressing && fileInputRef.current?.click()}
                    className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-amber-500/40 bg-white/5 flex flex-col items-center justify-center gap-3 transition-all group ${isCompressing ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-white/[0.08]'}`}
                  >
                    {isCompressing ? (
                      <>
                        <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                          <Loader2 className="text-amber-400 animate-spin" size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-amber-200">Processing Visual...</p>
                          <p className="text-[10px] font-mono text-amber-200/50 uppercase tracking-widest mt-1">Compressing quantum data</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ImageIcon className="text-white/40 group-hover:text-amber-400 transition-colors" size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-white/70">Click to browse image</p>
                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">PNG, JPG, WEBP</p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => setPreviewImage(null)}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest backdrop-blur-md"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />

                {/* Caption Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">Affirmation / Caption (Optional)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="E.g. The exact home I am moving into this year..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none placeholder:text-white/20"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!previewImage || isUploading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-sm tracking-widest uppercase disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  Add to Vision Board
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}