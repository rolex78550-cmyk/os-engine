import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Save,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { AcademyModule, AcademyLesson } from "../../types";
import { DEFAULT_MODULES } from "./AcademyPage";

interface AdminAcademyPanelProps {
  modules: AcademyModule[];
  lessons: Record<string, AcademyLesson[]>;
  onUpdateModules: (modules: AcademyModule[]) => void;
  onUpdateLessons: (moduleId: string, lessons: AcademyLesson[]) => void;
}

export default function AdminAcademyPanel({
  modules,
  lessons,
  onUpdateModules,
  onUpdateLessons,
}: AdminAcademyPanelProps) {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModule, setNewModule] = useState<Partial<AcademyModule>>({});
  const [newLesson, setNewLesson] = useState<Partial<AcademyLesson>>({});
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState<Partial<AcademyLesson>>({});
  const [notification, setNotification] = useState<string | null>(null);

  const activeModules = modules.length > 0 ? modules : DEFAULT_MODULES;
  const activeModule = activeModules.find((m) => m.id === activeModuleId);
  const moduleLessons = activeModuleId ? (lessons[activeModuleId] || LESSON_DATA[activeModuleId] || []) : [];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddModule = () => {
    if (!newModule.title || !newModule.id) return;
    const mod: AcademyModule = {
      id: newModule.id,
      title: newModule.title,
      subtitle: newModule.subtitle || "",
      description: newModule.description || "",
      icon: newModule.icon || "sparkles",
      accentColor: newModule.accentColor || "#fbbf24",
      estimatedMinutes: Number(newModule.estimatedMinutes) || 10,
      totalLessons: 0,
      category: (newModule.category as any) || "method",
      badgeName: newModule.badgeName || `${newModule.title} Badge`,
      badgeIcon: newModule.badgeIcon || "🏅",
    };
    onUpdateModules([...activeModules, mod]);
    setShowAddModule(false);
    setNewModule({});
    showToast("Module added successfully");
  };

  const handleDeleteModule = (id: string) => {
    if (!confirm("Delete this module? All lessons will be lost.")) return;
    onUpdateModules(activeModules.filter((m) => m.id !== id));
    showToast("Module deleted");
  };

  const handleAddLesson = () => {
    if (!activeModuleId || !newLesson.title) return;
    const existing = lessons[activeModuleId] || LESSON_DATA[activeModuleId] || [];
    const lesson: AcademyLesson = {
      id: `${activeModuleId}-${existing.length + 1}`,
      moduleId: activeModuleId,
      stepIndex: existing.length + 1,
      title: newLesson.title,
      content: newLesson.content || "",
      actionPrompt: newLesson.actionPrompt || "",
      durationMinutes: Number(newLesson.durationMinutes) || 5,
    };
    onUpdateLessons(activeModuleId, [...existing, lesson]);
    setShowAddLesson(false);
    setNewLesson({});
    showToast("Lesson added");
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!activeModuleId) return;
    const existing = lessons[activeModuleId] || LESSON_DATA[activeModuleId] || [];
    onUpdateLessons(activeModuleId, existing.filter((l) => l.id !== lessonId));
    showToast("Lesson deleted");
  };

  const handleSaveLessonEdit = () => {
    if (!activeModuleId || !editingLessonId) return;
    const existing = lessons[activeModuleId] || LESSON_DATA[activeModuleId] || [];
    const updated = existing.map((l) =>
      l.id === editingLessonId
        ? {
            ...l,
            title: editLesson.title || l.title,
            content: editLesson.content !== undefined ? editLesson.content : l.content,
            actionPrompt: editLesson.actionPrompt !== undefined ? editLesson.actionPrompt : l.actionPrompt,
            durationMinutes: Number(editLesson.durationMinutes) || l.durationMinutes,
          }
        : l
    );
    onUpdateLessons(activeModuleId, updated);
    setEditingLessonId(null);
    setEditLesson({});
    showToast("Lesson updated");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            Academy CMS
          </h2>
          <p className="text-[11px] text-white/30 mt-1">
            Manage modules, lessons, and content dynamically.
          </p>
        </div>
        <button
          onClick={() => setShowAddModule(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer"
        >
          <Plus size={14} strokeWidth={3} />
          Add Module
        </button>
      </div>

      {/* Add Module Form */}
      <AnimatePresence>
        {showAddModule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Module ID (kebab-case)"
                value={newModule.id || ""}
                onChange={(e) => setNewModule({ ...newModule, id: e.target.value })}
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
              />
              <input
                placeholder="Title"
                value={newModule.title || ""}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
              />
              <input
                placeholder="Subtitle"
                value={newModule.subtitle || ""}
                onChange={(e) => setNewModule({ ...newModule, subtitle: e.target.value })}
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
              />
              <input
                placeholder="Accent Color (hex)"
                value={newModule.accentColor || ""}
                onChange={(e) => setNewModule({ ...newModule, accentColor: e.target.value })}
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
              />
              <input
                placeholder="Estimated Minutes"
                type="number"
                value={newModule.estimatedMinutes || ""}
                onChange={(e) => setNewModule({ ...newModule, estimatedMinutes: Number(e.target.value) })}
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
              />
              <select
                value={newModule.category || "method"}
                onChange={(e) => setNewModule({ ...newModule, category: e.target.value as any })}
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/20 transition-all appearance-none"
              >
                <option value="method">Method</option>
                <option value="mindset">Mindset</option>
                <option value="spiritual">Spiritual</option>
                <option value="quantum">Quantum</option>
              </select>
            </div>
            <textarea
              placeholder="Description"
              rows={2}
              value={newModule.description || ""}
              onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddModule}
                disabled={!newModule.id || !newModule.title}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-amber-300 transition-all disabled:opacity-30 cursor-pointer"
              >
                <Save size={12} />
                Save Module
              </button>
              <button
                onClick={() => { setShowAddModule(false); setNewModule({}); }}
                className="px-4 py-2.5 rounded-xl text-white/30 hover:text-white text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modules List */}
      <div className="space-y-3">
        {activeModules.map((mod) => {
          const isOpen = activeModuleId === mod.id;
          const modLessons = lessons[mod.id] || LESSON_DATA[mod.id] || [];
          return (
            <div
              key={mod.id}
              className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden"
            >
              <button
                onClick={() => setActiveModuleId(isOpen ? null : mod.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.01] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${mod.accentColor}20`, color: mod.accentColor }}
                  >
                    {mod.title[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{mod.title}</p>
                    <p className="text-[10px] text-white/20 font-mono uppercase tracking-wider">
                      {mod.category} • {modLessons.length} lessons
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                    className="p-1.5 rounded-lg text-white/10 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                  {isOpen ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.03] p-4 space-y-4">
                      {/* Lessons */}
                      <div className="space-y-2">
                        {modLessons.map((lesson, idx) => (
                          <div key={lesson.id} className="flex items-start justify-between p-3 rounded-xl bg-black border border-white/[0.03]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-white/20">{idx + 1}.</span>
                                {editingLessonId === lesson.id ? (
                                  <div className="flex-1 space-y-2">
                                    <input
                                      value={editLesson.title || lesson.title}
                                      onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })}
                                      className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1 text-sm text-white outline-none"
                                    />
                                    <textarea
                                      value={editLesson.content !== undefined ? editLesson.content : lesson.content}
                                      onChange={(e) => setEditLesson({ ...editLesson, content: e.target.value })}
                                      rows={2}
                                      className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1 text-xs text-white/50 outline-none resize-none"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={handleSaveLessonEdit}
                                        className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => { setEditingLessonId(null); setEditLesson({}); }}
                                        className="px-3 py-1 rounded-lg text-white/20 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="min-w-0">
                                    <p className="text-sm text-white/70 truncate">{lesson.title}</p>
                                    <p className="text-[10px] text-white/20 truncate">{lesson.content.slice(0, 60)}...</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {editingLessonId !== lesson.id && (
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => { setEditingLessonId(lesson.id); setEditLesson({}); }}
                                  className="p-1 rounded-lg text-white/10 hover:text-white/40 transition-all cursor-pointer"
                                >
                                  <BookOpen size={10} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="p-1 rounded-lg text-white/10 hover:text-rose-400 transition-all cursor-pointer"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Lesson */}
                      <AnimatePresence>
                        {showAddLesson && activeModuleId === mod.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                          >
                            <input
                              placeholder="Lesson Title"
                              value={newLesson.title || ""}
                              onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
                            />
                            <textarea
                              placeholder="Content"
                              rows={3}
                              value={newLesson.content || ""}
                              onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all resize-none"
                            />
                            <textarea
                              placeholder="Action Prompt"
                              rows={2}
                              value={newLesson.actionPrompt || ""}
                              onChange={(e) => setNewLesson({ ...newLesson, actionPrompt: e.target.value })}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                placeholder="Duration (min)"
                                type="number"
                                value={newLesson.durationMinutes || ""}
                                onChange={(e) => setNewLesson({ ...newLesson, durationMinutes: Number(e.target.value) })}
                                className="w-32 bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 outline-none focus:border-amber-500/20 transition-all"
                              />
                              <button
                                onClick={handleAddLesson}
                                disabled={!newLesson.title}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-amber-300 transition-all disabled:opacity-30 cursor-pointer"
                              >
                                <Save size={12} />
                                Add Lesson
                              </button>
                              <button
                                onClick={() => { setShowAddLesson(false); setNewLesson({}); }}
                                className="px-3 py-2.5 rounded-xl text-white/20 hover:text-white text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!showAddLesson && (
                        <button
                          onClick={() => setShowAddLesson(true)}
                          className="flex items-center gap-2 text-[11px] font-mono text-amber-400/60 hover:text-amber-400 uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Plus size={12} />
                          Add Lesson
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {activeModules.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <AlertCircle size={24} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No modules yet.</p>
        </div>
      )}
    </div>
  );
}

const LESSON_DATA: Record<string, any[]> = {};
