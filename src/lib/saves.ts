import { supabase } from "@/lib/supabase";
import { getUserFast } from "@/lib/auth";

export type SaveType = "flat" | "person";

export interface SaveItem {
  id: string;
  type: SaveType;
  target_id: string;
  created_at: string;
  // Relational data (via FK columns flat_id, person_id)
  listing?: {
    id: string;
    title?: string;
    images?: Array<{ url: string; public_id?: string; is_primary?: boolean }>;
    city?: string;
    state?: string;
    area?: string;
  } | null;
  person?: {
    id: string;
    name?: string;
    image_url?: string;
  } | null;
}

// Narrow type describing the shape returned by the Supabase join
type SaveRowWithRelations = {
  id: string | number;
  type: SaveType;
  target_id: string | number;
  created_at: string | Date;
  listing?:
    | null
    | {
        id: string | number;
        title?: string;
        images?: Array<{
          url: string;
          public_id?: string;
          is_primary?: boolean;
        }>;
        city?: string;
        state?: string;
        area?: string;
      }
    | Array<{
        id: string | number;
        title?: string;
        images?: Array<{
          url: string;
          public_id?: string;
          is_primary?: boolean;
        }>;
        city?: string;
        state?: string;
        area?: string;
      }>;
  person?:
    | null
    | {
        id: string | number;
        name?: string;
        image_url?: string;
      }
    | Array<{
        id: string | number;
        name?: string;
        image_url?: string;
      }>;
};

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
        .select(
          `id,type,target_id,created_at,
           listing:flat_id ( id, title, images, city, state, area ),
           person:person_id ( id, name, image_url )`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (type) query = query.eq("type", type);

      const { data, error } = await query;
      const items: SaveItem[] = Array.isArray(data)
        ? (data as SaveRowWithRelations[]).map((row): SaveItem => {
            const listingRaw = Array.isArray(row.listing)
              ? row.listing[0]
              : row.listing;
            const personRaw = Array.isArray(row.person)
              ? row.person[0]
              : row.person;

            const listing = listingRaw
              ? {
                  id: String(listingRaw.id),
                  title: listingRaw.title ?? undefined,
                  images: listingRaw.images ?? undefined,
                  city: listingRaw.city ?? undefined,
                  state: listingRaw.state ?? undefined,
                  area: listingRaw.area ?? undefined,
                }
              : null;

            const person = personRaw
              ? {
                  id: String(personRaw.id),
                  name: personRaw.name ?? undefined,
                  image_url: personRaw.image_url ?? undefined,
                }
              : null;

            return {
              id: String(row.id),
              type: row.type,
              target_id: String(row.target_id),
              created_at: String(row.created_at),
              listing,
              person,
            };
          })
        : [];

      return {
        items,
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
