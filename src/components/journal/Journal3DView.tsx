import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Image as ImageIcon, Trash2, Edit3, Type, Bold, Loader2, Sparkles, Send, X, Calendar } from 'lucide-react';
import { JournalEntry } from '../../types';

interface Journal3DProps {
  entries: JournalEntry[];
  onSubmit: (payload: { text: string, type: "scripting" | "369" | "gratitude", images: string[], textColor: string, fontFamily: string, isBold: boolean }) => void;
  isAnalyzing: boolean;
  onDelete: (id: string) => void;
}

const FONTS = [
  { id: 'font-sans', name: 'Clean', style: 'font-sans' },
  { id: 'font-caveat', name: 'Script', style: "font-['Caveat'] text-2xl" },
  { id: 'font-kalam', name: 'Marker', style: "font-['Kalam'] text-lg" },
];

const COLORS = [
  { id: '#ffffff', bg: 'bg-white' },
  { id: '#fbbf24', bg: 'bg-amber-400' },
  { id: '#38bdf8', bg: 'bg-cyan-400' },
  { id: '#f472b6', bg: 'bg-pink-400' },
  { id: '#a78bfa', bg: 'bg-purple-400' },
  { id: '#34d399', bg: 'bg-emerald-400' },
];

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
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
        resolve(canvas.toDataURL('image/webp', 0.6));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default function Journal3DView({ entries, onSubmit, isAnalyzing, onDelete }: Journal3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Editor State
  const [text, setText] = useState("");
  const [type, setType] = useState<"scripting" | "369" | "gratitude">("scripting");
  const [images, setImages] = useState<string[]>([]);
  const [fontFamily, setFontFamily] = useState(FONTS[1].style);
  const [textColor, setTextColor] = useState(COLORS[0].id);
  const [isBold, setIsBold] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const sortedEntries = [...entries].sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
  const items = [
    { id: 'new-entry', isNew: true },
    ...sortedEntries.map(e => ({ ...e, isNew: false })),
  ] as (JournalEntry & { isNew: boolean })[];

  const handleNext = () => setActiveIndex((p) => Math.min(items.length - 1, p + 1));
  const handlePrev = () => setActiveIndex((p) => Math.max(0, p - 1));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      alert("Maximum 3 images allowed per entry.");
      return;
    }
    const compressed = await Promise.all(files.map(compressImage));
    setImages(prev => [...prev, ...compressed]);
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) return;
    try {
      // IMPORTANT: Await so that Firestore write completes
      await onSubmit({ text, type, images, textColor, fontFamily, isBold });
    } catch (err) {
      console.error("[Journal3DView] submit failed:", err);
      alert("Failed to save journal to database. Please try again.");
      return;
    }
    // Reset editor only after successful write
    setText("");
    setImages([]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  return (
    <div className="relative w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
      
      {/* 3D Carousel Stage */}
      <div className="relative w-full flex-1 flex items-center justify-center" style={{ perspective: '1600px' }}>
        <AnimatePresence>
          {items.map((item, i) => {
            const offset = i - activeIndex;
            const absOffset = Math.abs(offset);
            const sign = Math.sign(offset);
            const isActive = offset === 0;

            if (absOffset > 3) return null; // Hide far items for perf

            return (
              <motion.div
                key={item.id}
                animate={{
                  x: offset * (window.innerWidth < 768 ? 80 : 220),
                  z: absOffset * -150,
                  rotateY: sign * -35,
                  scale: isActive ? 1 : 0.85,
                  opacity: isActive ? 1 : Math.max(1 - absOffset * 0.4, 0),
                }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                className={`absolute w-[85vw] md:w-[60vw] max-w-2xl aspect-[3/4] md:aspect-[4/3] rounded-3xl overflow-hidden flex flex-col bg-[#080808] border ${isActive ? 'border-white/20 shadow-[0_0_80px_rgba(255,255,255,0.05)]' : 'border-white/5 shadow-2xl pointer-events-none'}`}
                style={{
                  zIndex: 50 - absOffset,
                  transformStyle: 'preserve-3d',
                }}
              >
                {item.isNew ? (
                  /* EDITOR VIEW */
                  <div className="w-full h-full flex flex-col p-6 md:p-10 relative">
                    <div className="flex justify-between items-center mb-6 z-10">
                      <div className="flex bg-white/5 rounded-xl p-1 border border-white/5 overflow-x-auto scrollbar-none max-w-[70vw]">
                        {(["scripting", "369", "gratitude"] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-all whitespace-nowrap ${type === t ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/80'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowTools(!showTools)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
                        <Edit3 size={18} />
                      </button>
                    </div>

                    {/* Toolbar Overlay */}
                    <AnimatePresence>
                      {showTools && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="absolute top-24 right-6 md:right-10 z-20 bg-[#111] border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col gap-4"
                        >
                          <div>
                            <p className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-widest">Font Style</p>
                            <div className="flex gap-2">
                              {FONTS.map(f => (
                                <button key={f.id} onClick={() => setFontFamily(f.style)} className={`px-2 py-1 rounded text-xs ${fontFamily === f.style ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}>
                                  {f.name}
                                </button>
                              ))}
                              <button onClick={() => setIsBold(!isBold)} className={`p-1.5 rounded ${isBold ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}>
                                <Bold size={14} />
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-widest">Ink Color</p>
                            <div className="flex gap-2">
                              {COLORS.map(c => (
                                <button key={c.id} onClick={() => setTextColor(c.id)} className={`w-6 h-6 rounded-full ${c.bg} border-2 ${textColor === c.id ? 'border-white' : 'border-transparent'}`} />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Images Preview Grid */}
                    {images.length > 0 && (
                      <div className={`grid gap-2 mb-4 shrink-0 ${images.length === 1 ? 'grid-cols-1 h-40' : images.length === 2 ? 'grid-cols-2 h-32' : 'grid-cols-3 h-24'}`}>
                        {images.map((src, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden group">
                            <img src={src} className="w-full h-full object-cover" alt="Memory" />
                            <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/60 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Script your reality..."
                      className={`w-full flex-1 bg-transparent resize-none outline-none leading-relaxed placeholder:text-white/10 scrollbar-none ${fontFamily} ${isBold ? 'font-bold' : ''}`}
                      style={{ color: textColor }}
                    />

                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between shrink-0 gap-3">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white/50 cursor-pointer transition-colors relative z-50">
                        <ImageIcon size={14} /> Add Visual
                        <input type="file" multiple accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <button
                        onClick={handleSubmit}
                        disabled={isAnalyzing || (!text.trim() && images.length === 0)}
                        className="flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all disabled:opacity-50 relative z-50"
                      >
                        {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Materialize
                      </button>
                    </div>
                  </div>
                ) : (
                  /* EXISTING ENTRY VIEW */
                  <div className="w-full h-full p-6 md:p-10 relative overflow-y-auto scrollbar-none flex flex-col">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                      <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
                        {new Date((item as JournalEntry).createdTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <button onClick={() => onDelete(item.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-400/10 rounded-xl">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Collage */}
                    {(item as JournalEntry).images && (item as JournalEntry).images!.length > 0 && (
                      <div className={`grid gap-2 mb-6 shrink-0 rounded-2xl overflow-hidden ${
                        (item as JournalEntry).images!.length === 1 ? 'grid-cols-1 h-48 md:h-64' : 
                        (item as JournalEntry).images!.length === 2 ? 'grid-cols-2 h-40 md:h-56' : 
                        'grid-cols-3 h-32 md:h-48'
                      }`}>
                        {(item as JournalEntry).images!.map((src, idx) => (
                          <img key={idx} src={src} className="w-full h-full object-cover" alt="Memory" />
                        ))}
                      </div>
                    )}

                    <div 
                      className={`whitespace-pre-wrap leading-relaxed flex-1 ${(item as JournalEntry).fontFamily || FONTS[1].style} ${(item as JournalEntry).isBold ? 'font-bold' : ''}`}
                      style={{ color: (item as JournalEntry).textColor || '#ffffff' }}
                    >
                      {(item as JournalEntry).text}
                    </div>

                    {(item as JournalEntry).analysis?.insight && (
                      <div className="mt-8 shrink-0 p-5 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-amber-400" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/50">Oracle Insight</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-sans">
                          {(item as JournalEntry).analysis?.insight}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 left-0 w-full flex items-center justify-center gap-4 sm:gap-6 z-40">
        <button 
          onClick={handlePrev} 
          disabled={activeIndex === 0}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none backdrop-blur-md shadow-xl"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-xl">
          <span className="text-xs font-mono text-white/70 font-bold">{activeIndex === 0 ? 'Editor' : `Page ${activeIndex}`}</span>
          <span className="text-xs font-mono text-white/40">/</span>
          <span className="text-xs font-mono text-white/50">{Math.max(0, items.length - 1)}</span>
        </div>

        <button 
          onClick={handleNext}
          disabled={activeIndex === items.length - 1}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none backdrop-blur-md shadow-xl"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <button 
        onClick={() => setActiveIndex(0)}
        className={`absolute bottom-20 sm:bottom-4 right-4 sm:right-6 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] z-50 ${activeIndex === 0 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <Plus size={20} />
      </button>

    </div>
  );
}