import type { AnswerEvaluation } from "../types/questions";
import { normalizeAnswer } from "./localEvaluator";

/**
 * Local evaluation cache: identical (question, normalised answer) pairs
 * reuse the stored result instead of re-charging the free-tier API.
 * LRU with a bounded size, persisted to localStorage.
 */

export const CACHE_STORAGE_KEY = "netsnake:evalcache:v1";
export const MAX_CACHE_ENTRIES = 200;

type CacheEntry = {
  k: string; // hash key
  e: AnswerEvaluation;
  t: number; // last-used timestamp (LRU)
};

/** djb2 string hash — stable, tiny, good enough for cache keys. */
export function hashKey(questionId: string, playerAnswer: string): string {
  const input = `${questionId}|${normalizeAnswer(playerAnswer)}`;
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return `${questionId}:${(h >>> 0).toString(36)}`;
}

type Store = { get(k: string): string | null; set(k: string, v: string): void };

function defaultStore(): Store {
  try {
    return {
      get: (k) => window.localStorage.getItem(k),
      set: (k, v) => window.localStorage.setItem(k, v),
    };
  } catch {
    const mem = new Map<string, string>();
    return { get: (k) => mem.get(k) ?? null, set: (k, v) => void mem.set(k, v) };
  }
}

export class EvaluationCache {
  private entries: CacheEntry[] = [];
  private store: Store;
  /** Monotonic LRU counter — Date.now() alone can't order same-ms writes. */
  private seq = 0;

  constructor(store?: Store, private maxEntries = MAX_CACHE_ENTRIES) {
    this.store = store ?? defaultStore();
    try {
      const raw = this.store.get(CACHE_STORAGE_KEY);
      if (raw) this.entries = JSON.parse(raw) as CacheEntry[];
      if (!Array.isArray(this.entries)) this.entries = [];
    } catch {
      this.entries = [];
    }
    this.seq = this.entries.reduce((m, e) => Math.max(m, e.t), 0);
  }

  get(questionId: string, playerAnswer: string): AnswerEvaluation | null {
    const k = hashKey(questionId, playerAnswer);
    const entry = this.entries.find((e) => e.k === k);
    if (!entry) return null;
    entry.t = ++this.seq;
    this.persist();
    return { ...entry.e, evaluatedBy: "cache" };
  }

  set(questionId: string, playerAnswer: string, evaluation: AnswerEvaluation) {
    const k = hashKey(questionId, playerAnswer);
    // Strip transient fields before storing.
    const { notice: _notice, ...clean } = evaluation;
    this.entries = this.entries.filter((e) => e.k !== k);
    this.entries.push({ k, e: clean, t: ++this.seq });
    // Evict oldest (least recently used) beyond the cap.
    if (this.entries.length > this.maxEntries) {
      this.entries.sort((a, b) => b.t - a.t);
      this.entries = this.entries.slice(0, this.maxEntries);
    }
    this.persist();
  }

  get size(): number {
    return this.entries.length;
  }

  private persist() {
    try {
      this.store.set(CACHE_STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      /* storage full — cache stays in memory */
    }
  }
}
