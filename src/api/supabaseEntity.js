import { supabase } from "@/api/supabase";

/** Entity adapter backed by a Supabase table, scoped to the signed-in user by RLS. */
export function createSupabaseEntity(table, userId) {
  const scoped = () => supabase.from(table).select("*").eq("user_id", userId);

  return {
    async list(sortField) {
      let query = scoped();
      if (sortField) {
        const desc = sortField.startsWith("-");
        query = query.order(desc ? sortField.slice(1) : sortField, {
          ascending: !desc,
        });
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },

    async create(values) {
      const { data, error } = await supabase
        .from(table)
        .insert({ ...values, user_id: userId })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async update(id, values) {
      const { data, error } = await supabase
        .from(table)
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
  };
}
