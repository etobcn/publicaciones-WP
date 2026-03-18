import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { premio } = await req.json();
    if (!premio) return Response.json({ error: 'Falta el nombre del premio' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `Busca en internet noticias reales y recientes sobre los premios "${premio}" organizados o otorgados por el periódico La Razón.
Busca específicamente ceremonias de entrega de premios, ganadores, actos de gala y cobertura mediática de estos premios en La Razón y otros medios.
Encuentra hasta 6 noticias distintas. Para cada una extrae exactamente:
- titulo: El titular de la noticia
- texto: Un resumen muy breve (2-3 líneas máximo)
- link: La URL real y directa de la noticia

Si encuentras menos de 6 noticias, devuelve solo las que encuentres.`,
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