import { useEffect, useRef, useState, useCallback } from "react";
import { Region, ScoringSettings } from "@/types";
import { SEED_WIN_RATES } from "@/lib/seedStats";

export interface MCResult {
  key: string;
  avgScore: number;
  avgPlace: number;
  winPct: number;
}

interface MCEntry {
  key: string;
  picks: Record<string, string>;
}

export function useMonteCarlo(
  entries: MCEntry[],
  results: Record<string, string>,
  hypo: Record<string, string>,
  regions: Region[],
  scoring: ScoringSettings | undefined,
) {
  const [mcResults, setMcResults] = useState<MCResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    if (!entries.length || !regions.length || !scoring) return;
    // Terminate previous worker
    workerRef.current?.terminate();
    setRunning(true);
    setProgress(0);

    const teamSeeds: Record<string, number> = {};
    for (const r of regions) for (const t of r.teams) teamSeeds[`${r.name}-${t.seed}`] = t.seed;

    const worker = new Worker(new URL("../lib/monteCarloWorker.ts", import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (e) => {
      if (e.data.type === "progress") setProgress(e.data.progress);
      else if (e.data.type === "done") {
        setMcResults(e.data.results);
        setProgress(10000);
        setRunning(false);
      }
    };
    worker.postMessage({
      entries: entries.map((e) => ({ key: e.key, picks: e.picks })),
      results,
      hypo,
      regionNames: regions.map((r) => r.name),
      teamSeeds,
      scoring,
      seedWinRates: SEED_WIN_RATES,
      totalSims: 10000,
    });
  }, [entries, results, hypo, regions, scoring]);

  // Debounce 500ms on hypo changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(run, 500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [run]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  return { mcResults, progress, running };
}
