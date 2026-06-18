"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

type ClueItem = {
  clueNumber: number;
  clueText: string;
};

type ClueBundle = {
  bundleNumber: number;
  clues: ClueItem[];
};

export type ClueSearchResult =
  | {
      kind: "not_found";
      message: string;
    }
  | {
      kind: "not_joined";
      message: string;
    }
  | {
      kind: "not_submitted";
      message: string;
    }
  | {
      kind: "senior";
      message: string;
    }
  | {
      kind: "ok";
      message: string;
      clueBundles: ClueBundle[];
    }
  | {
      kind: "error";
      message: string;
    };

function normalizeStudentId(value: string) {
  return value.trim();
}

function isReleased(releaseDate: unknown) {
  if (typeof releaseDate !== "string") {
    return false;
  }

  const releaseTime = Date.parse(releaseDate);

  return !Number.isNaN(releaseTime) && releaseTime <= Date.now();
}

function toClueItems(clues: unknown): ClueItem[] {
  if (!Array.isArray(clues)) {
    return [];
  }

  return clues
    .flatMap((clue) => {
      if (!clue || typeof clue !== "object") {
        return [];
      }

      const clueRow = clue as {
        clue_number?: unknown;
        clue_text?: unknown;
        clue_timelines?:
          | { release_date?: unknown }
          | Array<{ release_date?: unknown }>;
      };

      const releaseDate = Array.isArray(clueRow.clue_timelines)
        ? clueRow.clue_timelines[0]?.release_date
        : clueRow.clue_timelines?.release_date;
      if (!isReleased(releaseDate)) {
        return [];
      }

      if (typeof clueRow.clue_number !== "number" || typeof clueRow.clue_text !== "string") {
        return [];
      }

      return [
        {
          clueNumber: clueRow.clue_number,
          clueText: clueRow.clue_text,
        },
      ];
    })
    .sort((left, right) => left.clueNumber - right.clueNumber);
}

function groupCluesByStudentId(
  clues: Array<{
    student_id?: bigint | number | string;
    clue_number?: number;
    clue_text?: string;
    clue_timelines?: { release_date?: unknown } | Array<{ release_date?: unknown }>;
  }>,
  seniorIds: Array<string | number>,
): ClueBundle[] {
  const cluesByStudentId = new Map<string, ClueItem[]>();

  clues.forEach((clue) => {
    const studentId = String(clue.student_id ?? "");
    if (!studentId) {
      return;
    }

    const clueItems = toClueItems([clue]);
    if (clueItems.length === 0) {
      return;
    }

    const existing = cluesByStudentId.get(studentId) ?? [];
    cluesByStudentId.set(studentId, [...existing, ...clueItems]);
  });

  const bundles: ClueBundle[] = [];

  seniorIds.forEach((seniorId) => {
    const clueItems = cluesByStudentId.get(String(seniorId)) ?? [];
    if (clueItems.length === 0) {
      return;
    }

    bundles.push({
      bundleNumber: bundles.length + 1,
      clues: clueItems.sort((left, right) => left.clueNumber - right.clueNumber),
    });
  });

  return bundles;
}

export async function getCluesByStudentId(
  studentIdInput: string,
): Promise<ClueSearchResult> {
  const studentId = normalizeStudentId(studentIdInput);

  if (!studentId) {
    return {
      kind: "error",
      message: "กรุณากรอกรหัสนักศึกษา",
    };
  }

  const juniorConnectionQuery = await supabaseAdmin
    .from("buddy_connections")
    .select("senior_id")
    .eq("junior_id", studentId)
    .order("created_at", { ascending: true });

  if (juniorConnectionQuery.error) {
    return {
      kind: "error",
      message: "ระบบค้นหามีปัญหา กรุณาลองใหม่อีกครั้ง",
    };
  }

  const seniorConnectionQuery = await supabaseAdmin
    .from("buddy_connections")
    .select("id")
    .eq("senior_id", studentId)
    .limit(1);

  if (seniorConnectionQuery.error) {
    return {
      kind: "error",
      message: "ระบบค้นหามีปัญหา กรุณาลองใหม่อีกครั้ง",
    };
  }

  const studentQuery = await supabaseAdmin
    .from("students")
    .select("status")
    .eq("student_id", studentId)
    .maybeSingle();

  if (studentQuery.error) {
    return {
      kind: "error",
      message: "ระบบค้นหามีปัญหา กรุณาลองใหม่อีกครั้ง",
    };
  }

  if (!studentQuery.data) {
    return {
      kind: "not_found",
      message: "ไม่พบรหัสนักศึกษาในระบบ",
    };
  }

  if ((seniorConnectionQuery.data ?? []).length > 0) {
    return {
      kind: "senior",
      message: "รหัสนี้เป็น senior จึงไม่แสดงคำใบ้",
    };
  }

  if (studentQuery.data.status === "ไม่สนใจ") {
    return {
      kind: "not_joined",
      message: "รุ่นพี่ท่านนี้ไม่ได้เข้าร่วมกิจกรรม",
    };
  }

  if (studentQuery.data.status === "ยังไม่กรอก") {
    return {
      kind: "not_submitted",
      message: "รุ่นพี่เข้าร่วมกิจกรรม แต่ยังไม่ได้กรอกคำใบ้",
    };
  }

  const juniorConnections = (juniorConnectionQuery.data ?? []) as Array<{
    senior_id?: bigint | number | string;
  }>;

  if (juniorConnections.length === 0) {
    return {
      kind: "senior",
      message: "รหัสนี้เป็น senior จึงไม่แสดงคำใบ้",
    };
  }

  const seniorIds = juniorConnections
    .map((connection) => String(connection.senior_id ?? ""))
    .filter(Boolean);

  const clueQuery = await supabaseAdmin
    .from("clues")
    .select("student_id, clue_number, clue_text, clue_timelines!inner(release_date)")
    .in("student_id", seniorIds)
    .order("student_id", { ascending: true })
    .order("clue_number", { ascending: true });

  if (clueQuery.error) {
    return {
      kind: "error",
      message: "ไม่สามารถดึงคำใบ้ได้ในขณะนี้ กรุณาลองใหม่",
    };
  }

  const clueBundles = groupCluesByStudentId(
    (clueQuery.data ?? []) as Array<{
      student_id?: bigint | number | string;
      clue_number?: number;
      clue_text?: string;
      clue_timelines?: { release_date?: unknown } | Array<{ release_date?: unknown }>;
    }>,
    seniorIds,
  );

  if (clueBundles.length === 0) {
    return {
      kind: "ok",
      message: "ยังไม่มีคำใบ้ที่ปล่อยแล้วในตอนนี้",
      clueBundles: [],
    };
  }

  return {
    kind: "ok",
    message: `พบคำใบ้ ${clueBundles.reduce((total, bundle) => total + bundle.clues.length, 0)} รายการ จาก ${clueBundles.length} ชุด`,
    clueBundles,
  };
}
