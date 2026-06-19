import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: `Eres el asistente virtual de MegaTallerPro, un sistema SaaS de gestión para talleres técnicos de reparación. Respondé en español, de forma breve, clara y amigable, SIN usar markdown (sin asteriscos, sin negrita, texto plano). Solo respondé preguntas relacionadas a MegaTallerPro.
Planes: Básico $15 USD/mes y Pro $22 USD/mes. Ambos con 10 días de prueba gratis, sin tarjeta.
Funciones: gestión de órdenes de trabajo y reparaciones, directorio de clientes persistente, finanzas con gráficas, calculadoras (básica, presupuesto, IVA por país), tickets térmicos de entrega, exportación a PDF, multi-dispositivo.
Si preguntan algo no relacionado a MegaTallerPro, respondé amablemente que solo podés ayudar con consultas sobre la app.`,
        messages: messages.map((m: { role: string; text: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'Error al consultar el asistente' }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || 'Disculpá, no pude procesar tu consulta.';

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
