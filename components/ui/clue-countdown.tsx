"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getClueTimeline,
  type ClueTimelineEntry,
} from "@/app/actions/get-clues";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const REFRESH_INTERVAL_MS = 60_000; // อัปเดต timeline ใหม่ทุก 1 นาที เผื่อมีคำใบ้ใหม่ถูกตั้งเวลา
const TICK_INTERVAL_MS = 1_000;

function formatTimeLeft(targetIso: string, nowMs: number) {
  const totalMs = Math.max(0, Date.parse(targetIso) - nowMs);

  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
}

export function ClueCountdown() {
  const [entries, setEntries] = useState<ClueTimelineEntry[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const result = await getClueTimeline();
      if (cancelled) return;

      if (result.kind === "error") {
        setHasError(true);
        return;
      }

      setHasError(false);
      setEntries(result.entries);
    };

    load();
    const refreshId = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    const tickId = setInterval(() => setNowMs(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(tickId);
  }, []);

  const { releasedCount, totalCount, nextEntry } = useMemo(() => {
    if (!entries) {
      return {
        releasedCount: 0,
        totalCount: 0,
        nextEntry: null as ClueTimelineEntry | null,
      };
    }

    const released = entries.filter(
      (entry) => Date.parse(entry.releaseDate) <= nowMs,
    );
    const upcoming = entries
      .filter((entry) => Date.parse(entry.releaseDate) > nowMs)
      .sort((a, b) => Date.parse(a.releaseDate) - Date.parse(b.releaseDate));

    return {
      releasedCount: released.length,
      totalCount: entries.length,
      nextEntry: upcoming[0] ?? null,
    };
  }, [entries, nowMs]);

  if (hasError || !entries || totalCount === 0) {
    return (
      <div className="*:bg-foreground/20">
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  const allReleased = !nextEntry;

  return (
    <div className="flex flex-col md:flex-row justify-start md:items-center gap-2.5 ">
      <div className="flex gap-1">
        {Array.from({ length: totalCount }).map((_, index) => (
          <span
            key={index}
            className={
              index < releasedCount
                ? "size-3 bg-red-600 border border-b-2 border-r-2 border-primary/60"
                : "size-3 border border-b-2 border-r-2 border-primary/60"
            }
          />
        ))}
      </div>
      <p className="text-sm text-primary font-heading uppercase">
        {allReleased
          ? "All clues have been released!"
          : `Next clue in: ${formatTimeLeft(nextEntry.releaseDate, nowMs)}`}
      </p>
    </div>
  );
}
