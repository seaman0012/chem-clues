"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  getCluesByStudentId,
  type ClueSearchResult,
} from "@/app/actions/get-clues";
import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FlaskConical,
  Info,
  LoaderCircle,
  Search,
  Square,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ClueCountdown } from "@/components/ui/clue-countdown";

const SEARCH_DEBOUNCE_MS = 650;

type ClueBundle = Extract<
  ClueSearchResult,
  { kind: "ok" }
>["clueBundles"][number];

function getAlertTone(result: ClueSearchResult) {
  if (result.kind === "error") {
    return "destructive" as const;
  }

  return "default" as const;
}

function getAlertTitle(result: ClueSearchResult) {
  switch (result.kind) {
    case "ok":
      return "ผลการค้นหา";
    case "not_found":
      return "ไม่พบข้อมูล";
    case "not_joined":
      return "สถานะกิจกรรม";
    case "not_submitted":
      return "สถานะกิจกรรม";
    case "senior":
      return "ไม่แสดงผล";
    case "error":
      return "เกิดข้อผิดพลาด";
  }
}

function ResultAlert({ result }: { result: ClueSearchResult }) {
  const tone = getAlertTone(result);
  const icon =
    result.kind === "error" ? (
      <CircleAlert className="size-4" data-slot="alert-icon" />
    ) : (
      <Info className="size-4" data-slot="alert-icon" />
    );

  return (
    <Alert variant={tone} className="mt-4 bg-card border-2 border-primary">
      <AlertTitle className="flex flex-row items-center text-sm gap-2">
        {icon}
        {getAlertTitle(result)}
      </AlertTitle>
      <AlertDescription className="font-thai">{result.message}</AlertDescription>
    </Alert>
  );
}

function LoadingResults() {
  return (
    <div className="flex flex-col gap-4 pt-4">
      {[0, 1].map((item) => (
        <Card key={item} className="bg-card border-2 border-primary-20">
          <CardHeader className="*:bg-foreground/20">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 *:bg-foreground/20">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
          <CardFooter className="flex items-center justify-between *:bg-foreground/20">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function ClueBundleCard({
  bundle,
  isOpen,
  onToggle,
}: {
  bundle: ClueBundle;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      id={`bundle-${bundle.bundleNumber}`}
      className="gap-4 pt-0 pb-0 bg-card border-2 border-primary scroll-mt-24"
    >
      <CardHeader
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isOpen}
        className="flex flex-row py-4 bg-card2 border-b border-primary items-center justify-between cursor-pointer select-none"
      >
        <p className="w-fit text-sm font-medium hover:none">
          พี่รหัสคนที่ {bundle.bundleNumber}
        </p>
        {isOpen ? (
          <ChevronUp className="size-4 text-foreground" />
        ) : (
          <ChevronDown className="size-4 text-foreground" />
        )}
      </CardHeader>
      {isOpen && (
        <>
          <CardContent className="rounded-none flex flex-col gap-3">
            {bundle.clues.map((clue, index) => (
              <div
                key={`${bundle.bundleNumber}-${clue.clueNumber}`}
                className="rounded-none border border-b-3 border-r-3 border-border p-3 hover:border-primary transition-colors duration-200"
              >
                <p className="text-xs font-thai font-medium text-muted-foreground uppercase tracking-wider">
                  คำใบ้ที่ {index + 1}
                </p>
                <p className="mt-1 text-sm text-foreground">{clue.clueText}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Badge variant="default" className="py-3 bg-primary text-secondary text-sm">
              {bundle.clues.length} คำใบ้
            </Badge>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default function HomePage() {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<ClueSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openBundles, setOpenBundles] = useState<Record<number, boolean>>({});

  const canSearch = studentId.trim().length > 0 && !isPending;

  const toggleBundle = (bundleNumber: number) => {
    setOpenBundles((prev) => ({
      ...prev,
      [bundleNumber]: !(prev[bundleNumber] ?? true),
    }));
  };

  const jumpToBundle = (bundleNumber: number) => {
    setOpenBundles((prev) => ({ ...prev, [bundleNumber]: true }));
    requestAnimationFrame(() => {
      document
        .getElementById(`bundle-${bundleNumber}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const runSearch = () => {
    const sanitized = studentId.trim();

    if (!sanitized) {
      setResult({ kind: "error", message: "กรุณากรอกรหัสนักศึกษา" });
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const actionResult = await getCluesByStudentId(sanitized);
        setResult(actionResult);
        setOpenBundles({});
      });
    }, SEARCH_DEBOUNCE_MS);
  };

  const clueCount =
    result?.kind === "ok"
      ? result.clueBundles.reduce(
          (total, bundle) => total + bundle.clues.length,
          0,
        )
      : 0;
  const bundleCount = result?.kind === "ok" ? result.clueBundles.length : 0;

  return (
    <div className="relative flex flex-col">
      <div className="flex relative z-10 mx-auto w-full max-w-3xl flex-col">
        <div className="flex flex-row justify-between items-center gap-4 pb-4 mb-8 border-b-2 border-primary/80">
          <div className="flex flex-row flex-1 min-w-0 gap-4 items-center">
            <Image
              src="/apple-touch-icon.png"
              alt="Chemistry Logo"
              width={48}
              height={48}
            />
            <p className="font-thai text-sm font-bold truncate w-full md:text-sm uppercase wrap-break-word text-foreground">
              สายรหัสเคมีอุตสาหกรรม
            </p>
          </div>
          <div className="shrink-0 flex flex-row gap-2 items-center">
            <div className="flex shrink-0 py-1 px-2 gap-2 h-6 items-center bg-primary-foreground border-foreground border">
              <Square
                className="size-2 animate-pulse fill-current text-accent"
                fill="text-green-600"
              />
              <p className="text-xs font-heading sm:text-sm uppercase text-nowrap text-primary">
                Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-row items-center justify-between px-4 py-2 bg-foreground text-surface text-xs font-heading">
            INDUSTRIAL CHEMISTRY 45 | KMITL
            <X className="size-4 text-surface" />
          </div>

          <Card className="relative overflow-visible bg-card border-2 border-primary px-6 pt-6">
            {/* <div
              className="stamp animate-slam absolute top-6 right-6 z-20 w-36 pointer-events-none select-none"
              aria-hidden="true"
            >
              <div className="flex whitespace-nowrap overflow-hidden">
                <span className="px-2 text-xs md:text-base">Top Secret</span>
              </div>
            </div> */}
            <CardHeader>
              <CardTitle className="text-xl uppercase font-thai">
                ถึงเวลาตามหาพี่รหัสแล้ว!!!
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="student-id"
                  className="text-sm font-thai font-medium text-muted-foreground uppercase"
                >
                  รหัสนักศึกษา
                </label>
                <Input
                  id="student-id"
                  name="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="E.G. 6905xxxx"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="student id"
                  className="px-0 h-12 font-code bg-none text-base dark:bg-transparent md:text-xl placeholder:px-2 placeholder:text-xl placeholder:text-muted-foreground border-0 border-b-2 border-primary outline-none focus-visible:ring-0 focus-visible:border-accent"
                />
                <Button
                  type="button"
                  onClick={runSearch}
                  disabled={!canSearch}
                  className="w-full py-6 bg-accent hover:bg-accent hover:translate-y-0.5 font-heading font-light tracking-wider text-base md:text-xl text-primary-foreground border border-primary"
                >
                  {isPending ? (
                    <LoaderCircle
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Search
                      data-icon="inline-start"
                      className="size-4 md:size-6"
                    />
                  )}
                  {isPending ? "SEARCHING..." : "FIND CLUES"}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
              <ClueCountdown />
            </CardFooter>
          </Card>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          {isPending && <LoadingResults />}

          {!isPending && result && <ResultAlert result={result} />}

          {result?.kind === "ok" && !isPending && clueCount > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-start">
                <div className="flex flex-row gap-2 items-center">
                  <Badge
                    variant="secondary"
                    className="py-4 bg-background border-2 border-b-3 border-r-3 border-primary text-sm"
                  >
                    {bundleCount} พี่รหัส
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="py-4 bg-background border-2 border-b-3 border-r-3 border-primary text-sm text-primary"
                  >
                    {clueCount} คำใบ้
                  </Badge>
                </div>
                <div className="flex flex-row gap-2 items-center">
                  {bundleCount > 0 &&
                    result.clueBundles.map((bundle) => (
                      <Button
                        key={bundle.bundleNumber}
                        type="button"
                        variant="outline"
                        size="sm"
                        data-icon="inline-start"
                        onClick={() => jumpToBundle(bundle.bundleNumber)}
                        className="h-auto py-1.5 px-3 bg-accent hover:bg-accent/80 border-2 border-b-3 border-r-3 border-primary text-sm text-secondary hover:translate-y-0.5 hover:text-secondary/40 font-medium normal-case"
                      >
                        พี่คนที่ {bundle.bundleNumber}
                      </Button>
                    ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {result.clueBundles.map((bundle) => (
                  <ClueBundleCard
                    key={bundle.bundleNumber}
                    bundle={bundle}
                    isOpen={openBundles[bundle.bundleNumber] ?? true}
                    onToggle={() => toggleBundle(bundle.bundleNumber)}
                  />
                ))}
              </div>
            </div>
          )}

          {result?.kind === "ok" && clueCount === 0 && (
            <Card className="bg-card border-2 border-primary">
              <CardHeader>
                <CardTitle className="font-thai">ยังไม่มีคำใบ้ที่เปิดให้ดูในตอนนี้</CardTitle>
                <CardDescription>
                  ระบบยังไม่พบคำใบ้ที่ปล่อยแล้วสำหรับรหัสนี้
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
