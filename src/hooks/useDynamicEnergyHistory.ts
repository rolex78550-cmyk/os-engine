import { useMemo } from "react";
import { JournalEntry, RitualItem, EnergyPoint, ProfileState } from "../types";
import { getTodayStr, addDaysToDateStr } from "../lib/gamification";

export function useDynamicEnergyHistory(
  journalEntries: JournalEntry[],
  rituals: RitualItem[],
  profile: ProfileState,
  days = 30
): EnergyPoint[] {
  return useMemo(() => {
    const history: EnergyPoint[] = [];
    const today = getTodayStr();

    for (let i = days - 1; i >= 0; i--) {
      const dateStr = addDaysToDateStr(today, -i);
      const shortDate = dateStr.split('-').slice(1).join('/'); // MM/DD

      // 1. Belief Score (Journal Coherence)
      const journalsToday = journalEntries.filter(j => 
        j.createdTime.startsWith(dateStr)
      );
      
      let belief = profile.belief; // Fallback
      if (journalsToday.length > 0) {
        const avgCoherence = journalsToday.reduce((acc, curr) => acc + (curr.analysis?.coherenceScore || 0), 0) / journalsToday.length;
        belief = Math.round((profile.belief * 0.4) + (avgCoherence * 0.6));
      }

      // 2. Emotion Score (Habit Consistency)
      const ritualsDoneToday = rituals.filter(r => 
        r.lastCompletedDate === dateStr || (r.completedDates || []).includes(dateStr)
      ).length;
      
      const ritualRatio = rituals.length > 0 ? (ritualsDoneToday / rituals.length) : 0.8;
      const emotion = Math.round(40 + (ritualRatio * 60)); // Baseline 40

      // 3. Action Score (Derived from consistency and profile)
      const action = Math.round((belief + emotion) / 2 + (Math.random() * 5)); // Add minor variance for visual organic feel

      history.push({
        day: i === 0 ? "Today" : shortDate,
        belief: Math.min(100, belief),
        emotion: Math.min(100, emotion),
        action: Math.min(100, action)
      });
    }

    // Return only specific snapshots if list is too long for the chart
    // Recharts handles it well, but let's take steps for 30 days
    return history.filter((_, idx) => idx % Math.ceil(history.length / 7) === 0 || idx === history.length - 1);
  }, [journalEntries, rituals, profile, days]);
}
