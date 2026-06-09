import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.LEMON_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  // Verificar firma
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  if (digest !== signature) {
    return new Response('Firma inválida', { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;
  const data = payload.data?.attributes;
  const email = data?.user_email;

  if (!email) {
    return new Response('Sin email', { status: 400 });
  }

  // Determinar plan según variant_id
  const variantId = data?.variant_id;
  let plan = 'basic';
  if (variantId === 1765677) plan = 'pro';

  // Calcular fecha vencimiento (1 mes)
  const fechaVenc = new Date();
  fechaVenc.setMonth(fechaVenc.getMonth() + 1);
  const fechaStr = fechaVenc.toISOString().split('T')[0];

  if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
    await supabaseAdmin
      .from('suscripciones')
      .update({
        estado: 'activo',
        plan,
        fecha_vencimiento: fechaStr,
      })
      .eq('email', email);
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    await supabaseAdmin
      .from('suscripciones')
      .update({ estado: 'inactivo' })
      .eq('email', email);
  }

  if (eventName === 'subscription_updated') {
    await supabaseAdmin
      .from('suscripciones')
      .update({
        plan,
        fecha_vencimiento: fechaStr,
      })
      .eq('email', email);
  }

  return new Response('OK', { status: 200 });
}
