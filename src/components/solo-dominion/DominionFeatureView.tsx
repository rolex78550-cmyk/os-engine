import React from "react";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";

import type { DominionFeature } from "./SoloDominionHub";

interface FeatureViewProps {
  feature: DominionFeature;
  title: string;
  subtitle: string;
  jpLabel: string;
  icon: string;
  heroImage?: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const DominionFeatureView: React.FC<FeatureViewProps> = ({
  feature,
  title,
  subtitle,
  jpLabel,
  icon,
  heroImage,
  onBack,
  children,
}) => {
  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100dvh" }}
    >
      {/* ===================== HERO HEADER ===================== */}
      <section className="relative w-full" style={{ minHeight: 200 }}>
        {/* Hero image (optional) */}
        {heroImage && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              opacity: 0.18,
            }}
          />
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,1) 100%)",
          }}
        />

        {/* Top bar: back + status */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors active:scale-[0.97]"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
            }}
          >
            <span style={{ fontSize: 16 }}>←</span>
            <span className="text-[12px] font-semibold">Hub</span>
          </button>

          <div
            className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: ORANGE,
            }}
          >
            {jpLabel}
          </div>
        </div>

        {/* Title section */}
        <div className="relative z-10 px-6 pt-8 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontSize: 28 }}>{icon}</span>
            <h1
              className="font-extrabold tracking-tight leading-none"
              style={{
                color: TEXT_PRIMARY,
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
          </div>
          <p
            className="text-[14px]"
            style={{ color: TEXT_SECONDARY, maxWidth: 460 }}
          >
            {subtitle}
          </p>
        </div>
      </section>

      {/* ===================== FEATURE CONTENT ===================== */}
      <section className="px-5 pb-12 relative z-10">
        {children}
      </section>
    </div>
  );
};
