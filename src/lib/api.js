import { supabase } from './supabase';
import { STORAGE_BUCKET, ENVIOS_TABLE } from './config';

// Sube un archivo a Supabase Storage y devuelve su URL pública.
// Reemplaza a base44.integrations.Core.UploadFile.
export async function uploadFile(file) {
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`Error al subir ${file.name}: ${error.message}`);
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Llama a un webhook n8n. Devuelve { data } con el JSON de respuesta si lo hay.
// Reemplaza a base44.functions.invoke.
export async function invokeWebhook(url, payload, { timeout = 120000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null; // n8n puede responder texto plano ("Workflow got started.")
    }
    if (!res.ok) {
      throw new Error(data?.error || `Error del webhook: ${res.status}`);
    }
    return { data };
  } finally {
    clearTimeout(timer);
  }
}

// Inserta un registro de envío. Reemplaza a base44.entities.Envio.create.
export async function crearEnvio(record) {
  const { error } = await supabase.from(ENVIOS_TABLE).insert(record);
  if (error) throw new Error(error.message);
}

// Lista los envíos ordenados por fecha de envío desc. Reemplaza a base44.entities.Envio.list.
export async function listarEnvios(limit = 100) {
  const { data, error } = await supabase
    .from(ENVIOS_TABLE)
    .select('*')
    .order('fecha_envio', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}
