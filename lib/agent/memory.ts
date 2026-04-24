import type { MemoryEntry, MemoryType } from "@/lib/types";
import { saveMemoryEntry, loadMemoryEntries } from "@/lib/db/memory";

export class MemoryManager {
  private shortTerm: Map<string, unknown> = new Map();
  private longTermCache: MemoryEntry[] = [];
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async init(): Promise<void> {
    try {
      this.longTermCache = await loadMemoryEntries(this.userId, "long_term");
      const patterns = await loadMemoryEntries(this.userId, "pattern");
      this.longTermCache.push(...patterns);
    } catch {
      // Non-fatal — memory unavailable
    }
  }

  setShortTerm(key: string, value: unknown): void {
    this.shortTerm.set(key, value);
  }

  getShortTerm<T = unknown>(key: string): T | undefined {
    return this.shortTerm.get(key) as T | undefined;
  }

  async saveLongTerm(key: string, value: unknown, relevance = 0.8): Promise<void> {
    const entry: MemoryEntry = { type: "long_term", key, value, relevance };
    try {
      await saveMemoryEntry(this.userId, entry);
    } catch {
      // Non-fatal
    }
    this.longTermCache = this.longTermCache.filter((e) => !(e.key === key && e.type === "long_term"));
    this.longTermCache.push(entry);
  }

  async savePattern(key: string, pattern: unknown): Promise<void> {
    const entry: MemoryEntry = { type: "pattern", key, value: pattern, relevance: 1.0 };
    try {
      await saveMemoryEntry(this.userId, entry);
    } catch {
      // Non-fatal
    }
    this.longTermCache = this.longTermCache.filter((e) => !(e.key === key && e.type === "pattern"));
    this.longTermCache.push(entry);
  }

  getLongTerm(key?: string): MemoryEntry[] {
    const lt = this.longTermCache.filter((e) => e.type === "long_term");
    return key ? lt.filter((e) => e.key === key) : lt;
  }

  getPatterns(): MemoryEntry[] {
    return this.longTermCache.filter((e) => e.type === "pattern");
  }

  snapshot(): { shortTerm: Record<string, unknown>; longTerm: MemoryEntry[] } {
    return {
      shortTerm: Object.fromEntries(this.shortTerm),
      longTerm: this.longTermCache,
    };
  }
}
