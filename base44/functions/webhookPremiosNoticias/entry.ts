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
      prompt: `Busca en internet noticias reales sobre el premio: "${premio}".

${fechaContexto}

REGLAS CRÍTICAS SOBRE LAS URLs:
1. El link de cada noticia DEBE ser la URL real y final del artículo, por ejemplo: https://www.larazon.es/economia/articulo-ejemplo.html
2. NUNCA uses URLs de vertexaisearch.cloud.google.com, ni redirectores, ni URLs de búsqueda de Google. Solo URLs directas al artículo.
3. Si no tienes la URL directa y real del artículo, NO incluyas esa noticia. Es mejor devolver 3 noticias con URLs reales que 10 con URLs inventadas o de redirectores.
4. Solo incluye artículos de esta edición del premio, no de ediciones anteriores.
5. Verifica mentalmente que cada URL es un enlace directo a la noticia (debe empezar por https:// y apuntar al dominio del medio, no a google ni a vertexai).

Por cada noticia:
- titulo: El titular exacto del artículo
- texto: Resumen de 2-3 líneas
- link: URL directa y real al artículo (https://dominio.com/ruta/articulo)`,
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

    // Filtrar cualquier URL que sea un redirector de Google/Vertex AI
    const noticias = (result?.noticias || []).filter(n => {
      if (!n.link) return false;
      const url = n.link.toLowerCase();
      if (url.includes('vertexaisearch.cloud.google.com')) return false;
      if (url.includes('google.com/search')) return false;
      if (url.includes('googleapis.com')) return false;
      if (!url.startsWith('http')) return false;
      return true;
    });

    return Response.json({ noticias });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});