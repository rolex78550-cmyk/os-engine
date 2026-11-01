export const DEFAULT_TIMES = { morning: '07:00', evening: '18:00', night: '22:00' };
export type Slot = keyof typeof DEFAULT_TIMES;
export function localClock(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(now);
  const value = (key: string) => parts.find(p => p.type === key)!.value;
  return { date: `${value('year')}-${value('month')}-${value('day')}`, minute: Number(value('hour')) * 60 + Number(value('minute')) };
}
export function dueSlots(now: Date, zone: string, times: typeof DEFAULT_TIMES): Slot[] {
  const clock = localClock(now, zone);
  return (Object.keys(DEFAULT_TIMES) as Slot[]).filter(slot => {
    const [h,m] = times[slot].split(':').map(Number);
    const elapsed = clock.minute - (h * 60 + m);
    return elapsed >= 0 && elapsed < 30;
  });
}
