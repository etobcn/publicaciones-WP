Deno.serve(async (req) => {
  try {
    const webhookUrl = Deno.env.get("WEBHOOK_PUBLICACIONES");
    if (!webhookUrl) return Response.json({ error: 'Webhook no configurado' }, { status: 500 });

    const body = await req.json();

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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