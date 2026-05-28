import { supabase } from '@/lib/supabase';

/**
 * Ejecuta una query usando Supabase Client
 */
export async function executeSupabaseQuery<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T> {
  const { data, error } = await supabase.rpc('execute_sql', {
    query_text: query,
    query_params: params
  });

  if (error) throw error;
  return data as T;
}

/**
 * Helper para obtener datos de una tabla usando Supabase
 */
export async function getFromTable<T = unknown>(
  tableName: string,
  options?: {
    select?: string;
    filter?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<T[]> {
  let query = supabase.from(tableName).select(options?.select || '*');

  // Aplicar filtros
  if (options?.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  // Aplicar orden
  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? true
    });
  }

  // Aplicar límite
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
}

/**
 * Helper para insertar datos
 */
export async function insertIntoTable<T = unknown>(
  tableName: string,
  data: Record<string, unknown> | Record<string, unknown>[]
): Promise<T[]> {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select();

  if (error) throw error;
  return result as T[];
}

/**
 * Helper para actualizar datos
 */
export async function updateTable<T = unknown>(
  tableName: string,
  data: Record<string, unknown>,
  filter: Record<string, unknown>
): Promise<T[]> {
  let query = supabase.from(tableName).update(data);

  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data: result, error } = await query.select();
  if (error) throw error;
  return result as T[];
}

/**
 * Helper para eliminar datos
 */
export async function deleteFromTable(
  tableName: string,
  filter: Record<string, unknown>
): Promise<void> {
  let query = supabase.from(tableName).delete();

  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { error } = await query;
  if (error) throw error;
}

