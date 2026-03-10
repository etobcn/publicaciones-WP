import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const webhookUrl = Deno.env.get("WEBHOOK_PREMIOS_NOTICIAS");
    if (!webhookUrl) return Response.json({ error: 'Webhook no configurado' }, { status: 500 });

    const { premio } = await req.json();

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ premio }),
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: `Error del webhook: ${response.status}`, detail: text }, { status: 502 });
    }

    // The webhook returns HTML/text for the news editor
    const html = await response.text();
    return Response.json({ html });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});