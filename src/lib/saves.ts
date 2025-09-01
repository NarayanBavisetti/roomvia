import { supabase } from "@/lib/supabase";
import { getUserFast } from "@/lib/auth";

export type SaveType = "flat" | "person";

export interface SaveItem {
  id: string;
  type: SaveType;
  target_id: string;
  created_at: string;
}

// Simple in-memory dedupe and failure tracking
const pendingKeys = new Map<string, Promise<boolean>>();
const failureCounts = new Map<string, number>();
const blockedKeys = new Set<string>(); // stop calling after 3 failures per key

export const savesApi = {
  async toggleSave(
    type: SaveType,
    targetId: string
  ): Promise<{ saved: boolean; error: Error | null }> {
    try {
      const user = await getUserFast();
      if (!user) return { saved: false, error: new Error("Not authenticated") };

      // Check existing
      const { data: existing, error: selectError } = await supabase
        .from("saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", type)
        .eq("target_id", targetId)
        .limit(1)
        .maybeSingle();

      if (selectError) return { saved: false, error: selectError as Error };

      if (existing) {
        const { error: delError } = await supabase
          .from("saves")
          .delete()
          .eq("id", existing.id);
        return { saved: false, error: delError as Error | null };
      }

      const { error: insError } = await supabase
        .from("saves")
        .insert({ user_id: user.id, type, target_id: targetId });
      return { saved: true, error: insError as Error | null };
    } catch (e) {
      return { saved: false, error: e as Error };
    }
  },

  async listSaves(
    type?: SaveType
  ): Promise<{ items: SaveItem[]; error: Error | null }> {
    try {
      const user = await getUserFast();
      if (!user) return { items: [], error: new Error("Not authenticated") };

      let query = supabase
        .from("saves")
        .select("id,type,target_id,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (type) query = query.eq("type", type);

      const { data, error } = await query;
      return {
        items: (data as SaveItem[]) || [],
        error: error as Error | null,
      };
    } catch (e) {
      return { items: [], error: e as Error };
    }
  },

  async isSaved(type: SaveType, targetId: string): Promise<boolean> {
    try {
      const user = await getUserFast();
      if (!user) return false;
      const key = `${user.id}:${type}:${targetId}`;

      if (blockedKeys.has(key)) return false; // stop retrying this key

      if (pendingKeys.has(key)) {
        return await pendingKeys.get(key)!;
      }

      const promise: Promise<boolean> = (async () => {
        try {
          const { data, error } = await supabase
            .from("saves")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", type)
            .eq("target_id", targetId)
            .limit(1);
          if (error) {
            const count = (failureCounts.get(key) || 0) + 1;
            failureCounts.set(key, count);
            if (count >= 3) blockedKeys.add(key);
            return false;
          }
          return Array.isArray(data) && data.length > 0;
        } finally {
          pendingKeys.delete(key);
        }
      })();

      pendingKeys.set(key, promise);
      return await promise;
    } catch {
      return false;
    }
  },
};
