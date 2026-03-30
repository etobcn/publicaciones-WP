import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { premio, fecha_gala } = await req.json();
    if (!premio) return Response.json({ error: 'Falta el nombre del premio' }, { status: 400 });

    const fechaContexto = fecha_gala
      ? `La gala de este premio tuvo lugar el ${fecha_gala}. Busca ÚNICAMENTE noticias sobre esta edición específica, no ediciones anteriores ni posteriores.`
      : `Busca ÚNICAMENTE noticias sobre la edición más reciente de este premio.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `Busca en internet noticias reales sobre el premio exacto: "${premio}".

${fechaContexto}

REGLAS ESTRICTAS:
1. Solo incluye noticias de esta edición concreta del premio. NO incluyas noticias de ediciones anteriores.
2. Para cada noticia devuelve la URL EXACTA tal como aparece en los resultados de búsqueda. NO construyas ni modifiques URLs. NO inventes URLs.
3. Si no tienes la URL exacta verificada, NO incluyas esa noticia.
4. Solo incluye artículos que realmente existan y sean accesibles (no páginas de archivo o índice genéricas).
5. Máximo 12 noticias, todas con URL diferente.
6. Incluye noticias de cualquier medio (larazon.es, youtube.com, etc.).

Por cada noticia:
- titulo: El titular exacto
- texto: Resumen de 2-3 líneas
- link: URL exacta y completa (https://...)`,
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