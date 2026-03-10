import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const webhookUrl = Deno.env.get("WEBHOOK_PUBLICACIONES");
    if (!webhookUrl) return Response.json({ error: 'Webhook no configurado' }, { status: 500 });

    // Forward the multipart FormData directly to n8n
    const formData = await req.formData();

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: `Error del webhook: ${response.status}`, detail: text }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});