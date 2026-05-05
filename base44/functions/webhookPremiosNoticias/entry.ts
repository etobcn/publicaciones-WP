import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { premio, fecha_gala } = await req.json();
    if (!premio) return Response.json({ error: 'Falta el nombre del premio' }, { status: 400 });

    const fechaContexto = fecha_gala
      ? `La gala tuvo lugar el ${fecha_gala}. Busca ÚNICAMENTE noticias de esta edición concreta, no de ediciones anteriores.`
      : `Busca ÚNICAMENTE noticias de la edición más reciente de este premio.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `Busca en internet TODAS las noticias reales que encuentres sobre el premio: "${premio}".

${fechaContexto}

Devuelve hasta 12 resultados. Cuantos más resultados relevantes encuentres, mejor.

Por cada noticia incluye:
- titulo: El titular exacto del artículo
- texto: Resumen breve de 2-3 líneas con los datos clave (galardonados, categorías, etc.)
- link: La URL del artículo tal como aparece en los resultados de búsqueda (puede ser una URL directa al medio o una URL de redirección de Google/Vertex; ambas son válidas)

IMPORTANTE:
- Solo incluye artículos de esta edición concreta del premio, no de ediciones anteriores.
- No inventes URLs. Si no estás seguro de una URL, no la incluyas.
- Prioriza artículos de medios como larazon.es y sus suplementos regionales, así como medios económicos y locales que cubrieron el evento.`,
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

    // Solo descartamos URLs claramente inválidas (no http) o búsquedas genéricas de Google.
    // Los redirectores de vertexaisearch SÍ funcionan al hacer clic, no se filtran.
    const noticias = (result?.noticias || []).filter(n => {
      if (!n.link || typeof n.link !== 'string') return false;
      const url = n.link.toLowerCase().trim();
      if (!url.startsWith('http')) return false;
      if (url.includes('google.com/search')) return false;
      return true;
    });

    return Response.json({ noticias });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});