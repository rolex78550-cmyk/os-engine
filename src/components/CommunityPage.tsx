import React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  TrendingUp,
  Sparkles,
  Flame,
  Send,
  X,
  Plus,
  Filter,
  Calendar,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";
import { CommunityPost, CommunityCategory } from "../types";

interface CommunityPageProps {
  posts: CommunityPost[];
  userName: string;
  onAddPost: (post: Omit<CommunityPost, "id" | "createdAt" | "likes">) => void;
  onLikePost: (id: string) => void;
}

const categoryConfig: Record<CommunityCategory, { label: string; icon: typeof Sparkles; color: string; border: string; bg: string }> = {
  success: { label: "Success Story", icon: TrendingUp, color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
  journey: { label: "Journey", icon: Flame, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
  gratitude: { label: "Gratitude", icon: Heart, color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5" },
  tip: { label: "Tip / Method", icon: Sparkles, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/5" },
  question: { label: "Question", icon: MessageCircle, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/5" },
};

const demoPosts: CommunityPost[] = [
  {
    id: "demo-1",
    authorName: "Aryan Mehta",
    authorInitial: "A",
    authorColor: "#fbbf24",
    title: "From ₹30k to ₹3L/month — My Wealth Manifestation",
    content: "I started using Menifest OS 6 months ago. I was stuck in a 9-to-5 making barely enough. I scripted daily, visualized my agency scaling, and practiced gratitude every morning. Last month I closed my first ₹3L retainer. This app kept my focus razor-sharp. If I can do it, anyone can. Trust the process. 🔥",
    category: "success",
    tags: ["wealth", "business", "369method"],
    likes: 128,
    createdAt: "2026-06-10T08:30:00Z",
  },
  {
    id: "demo-2",
    authorName: "Priya Sharma",
    authorInitial: "P",
    authorColor: "#f472b6",
    title: "Attracted My Dream Remote Job at Google",
    content: "I had been rejected 12 times before I started manifestation rituals. Every morning I did the visualization practice from this app. I wrote my offer letter before I even got the interview. 3 months later, I got the email. I literally cried. The daily streak feature kept me consistent when I wanted to quit. 🙏",
    category: "success",
    tags: ["career", "remotejob", "visualization"],
    likes: 94,
    createdAt: "2026-06-08T14:20:00Z",
  },
  {
    id: "demo-3",
    authorName: "Rahul Kapoor",
    authorInitial: "R",
    authorColor: "#60a5fa",
    title: "Manifested My Soul Partner After 2 Years Alone",
    content: "I was skeptical about manifesting love. But I started scripting about the kind of person I wanted to meet — not looks, but energy. I wrote about feeling safe, understood, and inspired. Two months later I met her at a meditation retreat. Everything matched my script. The gratitude journal in this app was the game changer. ❤️",
    category: "journey",
    tags: ["love", "partner", "gratitude"],
    likes: 215,
    createdAt: "2026-06-05T19:45:00Z",
  },
  {
    id: "demo-4",
    authorName: "Sneha Iyer",
    authorInitial: "S",
    authorColor: "#a78bfa",
    title: "369 Method Changed My Life Forever",
    content: "I used the 369 method for 33 days straight. Morning: 3 writings. Afternoon: 6. Night: 9. I focused on one sentence: 'I am so grateful that my business generates ₹5,00,000 monthly with ease.' On day 34, I got a wholesale order that put me at exactly ₹4.8L that month. The alignment is real. Stay consistent. ✨",
    category: "tip",
    tags: ["369method", "business", "consistency"],
    likes: 342,
    createdAt: "2026-06-02T11:10:00Z",
  },
  {
    id: "demo-5",
    authorName: "Vikram Desai",
    authorInitial: "V",
    authorColor: "#34d399",
    title: "First Week Using Menifest OS — Mind Blown",
    content: "I just downloaded this app last week and the onboarding alone shifted something in me. Setting my belief level, choosing my focus category, and seeing the daily rituals laid out made it feel real. Already completed 7 days streak. The UI is insanely beautiful. Black and gold aesthetic hits different. 🖤✨",
    category: "gratitude",
    tags: ["newuser", "streak", "feedback"],
    likes: 67,
    createdAt: "2026-06-11T09:00:00Z",
  },
];

export default function CommunityPage({ posts, userName, onAddPost, onLikePost }: CommunityPageProps) {
  const [filter, setFilter] = useState<CommunityCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<CommunityCategory>("journey");
  const [newTags, setNewTags] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const allPosts = useMemo(() => {
    // Prioritize REAL dynamic posts from Firestore
    const realPosts = posts.filter(p => p.id && !p.id.startsWith('demo-'));
    if (realPosts.length > 0) {
      // Dedup real posts
      const seen = new Set<string>();
      return realPosts.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // Only fallback to demo if absolutely no real posts yet
    const merged = [...demoPosts, ...posts];
    const seen = new Set<string>();
    return merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (filter === "all") return allPosts;
    return allPosts.filter((p) => p.category === filter);
  }, [allPosts, filter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const tagList = newTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
    onAddPost({
      authorName: userName || "Seeker",
      authorInitial: (userName || "S")[0].toUpperCase(),
      authorColor: "#fbbf24",
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: tagList,
    });
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setShowForm(false);
  };

  const handleLike = (id: string) => {
    if (likedIds.has(id)) return;
    setLikedIds((prev) => new Set(prev).add(id));
    onLikePost(id);
  };

  const totalLikes = allPosts.reduce((sum, p) => sum + p.likes + (likedIds.has(p.id) ? 1 : 0), 0);
  const totalPosts = allPosts.length;
  const topTag = useMemo(() => {
    const counts: Record<string, number> = {};
    allPosts.forEach((p) => p.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "manifestation";
  }, [allPosts]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-[28px] bg-black border border-amber-500/[0.08] p-6 md:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-200/40 font-bold">The Resonance Hall</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Community
            </h2>
            <p className="text-sm text-white/30 max-w-md leading-relaxed">
              Share your manifestation wins, journeys, and techniques. Every story raises the collective frequency.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 px-5 py-3 rounded-2xl bg-amber-500/[0.03] border border-amber-500/[0.06]">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-100">{totalPosts}</p>
                <p className="text-[9px] font-mono text-amber-200/30 uppercase tracking-wider">Posts</p>
              </div>
              <div className="w-px h-8 bg-amber-500/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-amber-100">{totalLikes}</p>
                <p className="text-[9px] font-mono text-amber-200/30 uppercase tracking-wider">Likes</p>
              </div>
              <div className="w-px h-8 bg-amber-500/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-amber-100 capitalize">{topTag}</p>
                <p className="text-[9px] font-mono text-amber-200/30 uppercase tracking-wider">Trending</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer shadow-lg shadow-amber-400/10"
            >
              <Plus size={14} strokeWidth={3} />
              Share Story
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full border text-[10px] font-mono uppercase tracking-widest font-bold transition-all cursor-pointer shadow-sm ${
            filter === "all"
              ? "bg-amber-400 text-black border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
              : "bg-white/5 text-white/50 border-white/10 hover:border-amber-500/30 hover:text-white/80 hover:bg-white/10"
          }`}
        >
          <Filter size={14} className="inline mr-1.5 -mt-0.5" />
          All Pulses
        </button>
        {(Object.keys(categoryConfig) as CommunityCategory[]).map((cat) => {
          const cfg = categoryConfig[cat];
          const Icon = cfg.icon;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full border text-[10px] font-mono uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                filter === cat
                  ? `${cfg.bg.replace('/5', '/20')} ${cfg.color} ${cfg.border} shadow-[0_0_15px_${cfg.border.replace('border-', '')}]`
                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              <Icon size={14} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, index) => {
            const cfg = categoryConfig[post.category];
            const Icon = cfg.icon;
            const isLiked = likedIds.has(post.id) || post.likedByMe;
            const date = new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

            return (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: (index % 10) * 0.05 }}
                className="break-inside-avoid relative rounded-[32px] bg-[#0a0a0a] border border-white/5 hover:border-white/10 p-6 md:p-8 transition-all duration-500 flex flex-col gap-6 shadow-2xl overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-48 h-48 ${cfg.bg.replace('/5', '/10')} blur-[80px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Top Meta Row */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-black shadow-lg"
                      style={{ backgroundColor: post.authorColor }}
                    >
                      {post.authorInitial}
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">{post.authorName}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
                        <Calendar size={10} />
                        {date}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-mono uppercase tracking-widest font-bold ${cfg.bg} ${cfg.color} ${cfg.border} backdrop-blur-md shadow-sm`}>
                    <Icon size={12} />
                    {cfg.label}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 relative z-10">
                  <h3 className="text-xl font-bold text-white leading-tight group-hover:text-amber-300 transition-colors duration-300">
                    {post.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] font-mono text-white/30 uppercase tracking-wider"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                      isLiked ? "text-rose-400" : "text-white/25 hover:text-rose-300"
                    }`}
                  >
                    <Heart size={14} className={isLiked ? "fill-rose-400" : ""} />
                    {post.likes + (likedIds.has(post.id) ? 1 : 0)}
                  </button>
                  <div className="flex items-center gap-1 text-[10px] text-white/20 font-mono uppercase tracking-wider">
                    <ArrowUpRight size={10} className="group-hover:text-amber-400 transition-colors" />
                    <span className="group-hover:text-amber-200/40 transition-colors">Read</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-16 rounded-[28px] bg-black border border-white/[0.04]">
          <Sparkles size={32} className="text-white/10 mx-auto mb-4" />
          <p className="text-sm text-white/30 font-medium">No posts in this category yet.</p>
          <p className="text-[11px] text-white/20 mt-1 font-mono">Be the first to share your resonance.</p>
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/90" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-black border border-amber-500/10 rounded-[32px] shadow-2xl overflow-hidden p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                    <Sparkles size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Share Your Story</h3>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Raise the collective frequency</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/30 font-bold">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(categoryConfig) as CommunityCategory[]).map((cat) => {
                      const cfg = categoryConfig[cat];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewCategory(cat)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                            newCategory === cat
                              ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                              : "bg-transparent text-white/25 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <Icon size={14} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/30 font-bold">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. How I Manifested My Dream Home"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/30 font-bold">Your Experience</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Describe what you manifested, how long it took, and what techniques worked for you..."
                    rows={5}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/30 font-bold">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="wealth, 369method, gratitude, business..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-amber-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={14} strokeWidth={3} />
                  Publish to Resonance Hall
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
