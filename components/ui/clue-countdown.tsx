"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getClueTimeline,
  type ClueTimelineEntry,
} from "@/app/actions/get-clues";
import { Card, CardContent } from "@/components/ui/card";

const REFRESH_INTERVAL_MS = 60_000; // อัปเดต timeline ใหม่ทุก 1 นาที เผื่อมีคำใบ้ใหม่ถูกตั้งเวลา
const TICK_INTERVAL_MS = 1_000;

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

function getTimeLeft(targetIso: string, nowMs: number): TimeLeft {
  const targetMs = Date.parse(targetIso);
  const totalMs = Math.max(0, targetMs - nowMs);

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);

  return { days, hours, minutes, seconds, totalMs };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-foreground text-surface px-3 py-2 min-w-14">
      <span className="font-code text-xl md:text-2xl tabular-nums leading-none">
        {pad(value)}
      </span>
      <span className="text-[10px] font-heading uppercase tracking-wider text-surface/70">
        {label}
      </span>
    </div>
  );
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
      return { releasedCount: 0, totalCount: 0, nextEntry: null as ClueTimelineEntry | null };
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

  if (hasError) {
    return null;
  }

  if (!entries) {
    return (
      <Card className="bg-surface border-2 border-primary">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          กำลังโหลดตารางเวลาคำใบ้...
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return null;
  }

  const progressPercent = Math.round((releasedCount / totalCount) * 100);
  const timeLeft = nextEntry ? getTimeLeft(nextEntry.releaseDate, nowMs) : null;
  const allReleased = !nextEntry;

  return (
    <Card className="bg-surface border-2 border-primary">
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-heading uppercase tracking-wide text-foreground">
              {allReleased ? "All Released" : "Next Hint"}
            </p>
          </div>
          <p className="text-xs font-code text-muted-foreground uppercase">
            Released {releasedCount}/{totalCount}
          </p>
        </div>

        <div className="h-2 w-full bg-muted border border-primary/30 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!allReleased && timeLeft && (
          <div className="flex justify-center gap-2">
            {timeLeft.days > 0 && (
              <TimeBlock value={timeLeft.days} label="Days" />
            )}
            <TimeBlock value={timeLeft.hours} label="ชม." />
            <TimeBlock value={timeLeft.minutes} label="นาที" />
            <TimeBlock value={timeLeft.seconds} label="วินาที" />
          </div>
        )}

        {allReleased && (
          <p className="text-center text-sm text-muted-foreground">
            All clues have been released! 
          </p>
        )}
      </CardContent>
    </Card>
  );
}
