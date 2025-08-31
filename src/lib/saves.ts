import { supabase } from "@/lib/supabase";

export type SaveType = "flat" | "person";

export interface SaveItem {
  id: string;
  type: SaveType;
  target_id: string;
  created_at: string;
}

export const savesApi = {
  async toggleSave(
    type: SaveType,
    targetId: string
  ): Promise<{ saved: boolean; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", type)
        .eq("target_id", targetId)
        .limit(1);
      if (error) return false;
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  },
};
