import { motion } from "motion/react";
import { Award, Download, X, Star, Crown, CheckCircle2 } from "lucide-react";
import { AcademyBadge } from "../../types";

interface AcademyCertificateProps {
  badges: AcademyBadge[];
  completedModules: number;
  overallStreak: number;
  onClose: () => void;
}

export default function AcademyCertificate({
  badges,
  completedModules,
  overallStreak,
  onClose,
}: AcademyCertificateProps) {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Inner border
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

    // Title
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 48px serif";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICATE OF MASTERY", canvas.width / 2, 160);

    // Subtitle
    ctx.fillStyle = "#f59e0b";
    ctx.font = "24px sans-serif";
    ctx.fillText("Manifestation Academy", canvas.width / 2, 200);

    // Line
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 230);
    ctx.lineTo(900, 230);
    ctx.stroke();

    // Body
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px sans-serif";
    ctx.fillText("This certifies that the bearer has successfully completed", canvas.width / 2, 300);
    ctx.fillText("all modules of the Manifestation Academy program.", canvas.width / 2, 340);

    // Stats
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(`${completedModules} Modules`, canvas.width / 2, 420);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Streak: ${overallStreak} days | Badges: ${badges.length} | Date: ${date}`, canvas.width / 2, 470);

    // Footer
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 28px serif";
    ctx.fillText("Menifest OS", canvas.width / 2, 650);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "16px sans-serif";
    ctx.fillText("The Resonance Hall — Excellence in Conscious Creation", canvas.width / 2, 690);

    // Download
    const link = document.createElement("a");
    link.download = `Manifestation-Academy-Certificate-${date.replace(/\s/g, "-")}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/[0.03] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl w-full space-y-8">
        {/* Close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Certificate Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
          className="rounded-[32px] bg-black border-2 border-amber-400/20 p-8 md:p-12 text-center space-y-8 relative overflow-hidden"
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-400/20 rounded-tl-[32px]" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-400/20 rounded-tr-[32px]" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-amber-400/20 rounded-bl-[32px]" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-amber-400/20 rounded-br-[32px]" />

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Crown size={20} className="text-amber-400" />
              <Star size={14} className="text-amber-400/60" />
              <Crown size={20} className="text-amber-400" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-amber-100 tracking-tight font-serif">
              Certificate of Mastery
            </h1>
            <p className="text-sm text-amber-200/40 font-medium tracking-widest uppercase">
              Manifestation Academy
            </p>
          </div>

          <div className="h-px bg-amber-400/10 w-full" />

          <div className="space-y-4">
            <p className="text-sm text-white/40 leading-relaxed">
              This certifies that the bearer has successfully completed all modules of the Manifestation Academy program, demonstrating mastery in sacred manifestation techniques, quantum consciousness, and reality creation.
            </p>

            <div className="grid grid-cols-3 gap-4 py-6">
              <div className="space-y-1">
                <p className="text-3xl font-bold text-amber-400">{completedModules}</p>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-wider">Modules</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-amber-400">{overallStreak}</p>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-wider">Day Streak</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-amber-400">{badges.length}</p>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-wider">Badges</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-white/20 uppercase tracking-wider">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Issued on {date}
            </div>
          </div>

          <div className="h-px bg-amber-400/10 w-full" />

          <div className="space-y-1">
            <p className="text-lg font-bold text-amber-100 tracking-tight">Menifest OS</p>
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-wider">
              The Resonance Hall — Excellence in Conscious Creation
            </p>
          </div>
        </motion.div>

        {/* Download Button */}
        <div className="flex justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer shadow-lg shadow-amber-400/10 hover:scale-105 active:scale-95"
          >
            <Download size={14} strokeWidth={3} />
            Download Certificate
          </button>
        </div>

        {/* Badges Grid */}
        {badges.length > 0 && (
          <div className="rounded-[24px] bg-black border border-white/[0.04] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award size={14} className="text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-200/40 font-bold">Earned Badges</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-[11px] font-medium text-white/60">{badge.name}</span>
                  <span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${
                    badge.tier === 'platinum' ? 'text-violet-400' :
                    badge.tier === 'gold' ? 'text-amber-400' :
                    badge.tier === 'silver' ? 'text-slate-300' : 'text-orange-400'
                  }`}>
                    {badge.tier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
