"use client";

import { useRef, useState, useTransition } from "react";
import {
  getCluesByStudentId,
  type ClueSearchResult,
} from "@/app/actions/get-clues";
import { CircleAlert, Dot, Info, LoaderCircle, Search } from "lucide-react";
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
import { HyperText } from "@/components/ui/hyper-text";
import Typewriter from "@/components/fancy/text/typewriter";

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
      <CircleAlert data-slot="alert-icon" />
    ) : (
      <Info data-slot="alert-icon" />
    );

  return (
    <Alert variant={tone}>
      {icon}
      <AlertTitle>{getAlertTitle(result)}</AlertTitle>
      <AlertDescription>{result.message}</AlertDescription>
    </Alert>
  );
}

function LoadingResults() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1].map((item) => (
        <Card key={item}>
          <CardHeader>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function ClueBundleCard({ bundle }: { bundle: ClueBundle }) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          พี่รหัสคนที่ {bundle.bundleNumber}
        </Badge>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {bundle.clues.map((clue) => (
          <div
            key={`${bundle.bundleNumber}-${clue.clueNumber}`}
            className="rounded-lg border border-border/70 bg-muted/30 p-3"
          >
            <p className="text-xs font-medium text-muted-foreground">
              คำใบ้ที่ {clue.clueNumber}
            </p>
            <p className="mt-1 text-sm text-foreground">{clue.clueText}</p>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Badge variant="outline">{bundle.clues.length} คำใบ้</Badge>
      </CardFooter>
    </Card>
  );
}

export default function HomePage() {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<ClueSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSearch = studentId.trim().length > 0 && !isPending;

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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 gap-16 justify-betweensm:px-6 sm:py-10">
      <div className="flex flex-col justify-center items-center">
        <HyperText className="font-heading text-3xl lg:text-4xl text-primary">
        CHEM BONDING
      </HyperText>
       <HyperText className="font-heading text-3xl lg:text-4xl text-kmitl">
        KMITL 2569
      </HyperText>
      </div>
      <div className="flex-1 flex-col gap-8 mt-4 justify-center">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit mb-2 text-green-600 dark:text-green-400">
              <Dot className="animate-ping text-green-600 dark:text-green-400" />
              Online
            </Badge>
            <CardTitle className="text-2xl">
              Find your hint
            </CardTitle>
            <CardDescription>
              Only unlocked hints will be displayed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <label
                htmlFor="student-id"
                className="text-sm font-medium text-foreground"
              >
                Student ID
              </label>
              <Input
                id="student-id"
                name="studentId"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder="Enter your Student ID (e.g., 6905xxxx)"
                inputMode="numeric"
                autoComplete="off"
                aria-label="student id"
              />
              <Button
                type="button"
                onClick={runSearch}
                disabled={!canSearch}
                className="w-full"
              >
                {isPending ? (
                  <LoaderCircle
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <Search data-icon="inline-start" />
                )}
                {isPending ? "Searching..." : "Find Hints"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">Next hint will be available soon </p>
          </CardFooter>
        </Card>

        <Separator />

        <div className="flex flex-col gap-4">
          {isPending && <LoadingResults />}

          {result && <ResultAlert result={result} />}

          {result?.kind === "ok" && clueCount > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{bundleCount} ชุด</Badge>
                <Badge variant="secondary">{clueCount} คำใบ้</Badge>
              </div>
              <div className="flex flex-col gap-4">
                {result.clueBundles.map((bundle) => (
                  <ClueBundleCard key={bundle.bundleNumber} bundle={bundle} />
                ))}
              </div>
            </div>
          )}

          {result?.kind === "ok" && clueCount === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>ยังไม่มีคำใบ้ที่เปิดให้ดูในตอนนี้</CardTitle>
                <CardDescription>
                  ระบบยังไม่พบคำใบ้ที่ปล่อยแล้วสำหรับรหัสนี้
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>

      <footer className="bg-neutral-primary-soft">
        <div className="mx-auto w-full max-w-7xl p-4 py-6 lg:py-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <span className="text-muted-foreground text-sm text-body sm:text-center">
              Made by{" "}
              <a
                href="https://github.com/seaman0012"
                className="hover:underline"
              >
                seaman0012
              </a>
            </span>
            <div className="flex mt-4 sm:justify-start sm:mt-0">
              <a
                href="https://github.com/seaman0012"
                className="text-body hover:text-heading"
              >
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="sr-only">GitHub account</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
