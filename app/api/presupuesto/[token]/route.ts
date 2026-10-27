import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return NextResponse.json({ error: 'Enlace inválido' }, { status: 400 });
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 }); }
  if (body?.decision !== 'aprobado' && body?.decision !== 'rechazado') return NextResponse.json({ error: 'Decisión inválida' }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Servidor no configurado' }, { status: 500 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // Actualización atómica: solo se permite responder una vez a presupuestos publicados y pendientes.
  const { data, error } = await db.from('repairs').update({ presupuesto_estado: body.decision, presupuesto_respondido_en: new Date().toISOString() })
    .eq('seguimiento_token', token).eq('presupuesto_publicado', true).eq('presupuesto_estado', 'pendiente')
    .not('presupuesto_importe', 'is', null).select('presupuesto_estado').maybeSingle();
  if (error) return NextResponse.json({ error: 'No se pudo guardar la respuesta' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Este presupuesto ya fue respondido o dejó de estar disponible. Actualizá la página.' }, { status: 409 });
  return NextResponse.json({ estado: data.presupuesto_estado }, { headers: { 'Cache-Control': 'no-store' } });
}
