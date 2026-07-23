// Constantes de la app. Los webhooks n8n no son secretos (no requieren auth),
// pero se pueden sobreescribir por entorno si cambian.
const N8N_BASE = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n-n8n.fo86cl.easypanel.host';

export const WEBHOOKS = {
  publicaciones: `${N8N_BASE}/webhook/nueva-publicacion`,
  publicacionesEuropa: `${N8N_BASE}/webhook/nueva-publicacion-europa`,
  premiosPublicar: `${N8N_BASE}/webhook/publicar-premio-wp`,
  premiosNoticias: import.meta.env.VITE_WEBHOOK_PREMIOS_NOTICIAS || `${N8N_BASE}/webhook/buscar-noticias-premio`,
};

export const STORAGE_BUCKET = 'publicaciones-wp';

export const ENVIOS_TABLE = 'datos_publicaciones_WP';
