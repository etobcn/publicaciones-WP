import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { premio } = await req.json();
    if (!premio) return Response.json({ error: 'Falta el nombre del premio' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `Realiza una búsqueda en internet sobre "${premio}" y devuelve hasta 12 noticias reales.

INSTRUCCIONES CRÍTICAS:
1. Usa la búsqueda web para encontrar noticias reales publicadas en internet sobre este premio.
2. Para cada noticia, devuelve ÚNICAMENTE la URL exacta tal como aparece en los resultados de búsqueda. NO construyas ni modifiques URLs. NO inventes URLs. Copia la URL exacta del resultado de búsqueda.
3. Si no tienes la URL exacta de una noticia, NO la incluyas.
4. Incluye noticias de cualquier medio (larazon.es, antena3.com, youtube.com, etc.), no solo de La Razón.
5. Cada noticia debe ser un artículo diferente con URL diferente.

Para cada noticia real encontrada extrae:
- titulo: El titular exacto de la noticia
- texto: Resumen breve de 2-3 líneas
- link: La URL exacta y completa tal como aparece en los resultados de búsqueda (https://...)`,
      response_json_schema: {
        type: 'object',
        properties: {
          noticias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                titulo: { type: 'string' },
                texto: { type: 'string' },
                link: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const noticias = result?.noticias || [];
    return Response.json({ noticias });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});