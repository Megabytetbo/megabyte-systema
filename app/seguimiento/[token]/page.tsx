import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
type Props = { params: Promise<{ token: string }> };

const PASOS = [
  { nombre: 'Equipo recibido', detalle: 'Se recibió el equipo en el taller.' },
  { nombre: 'En diagnóstico', detalle: 'Estamos revisando el equipo.' },
  { nombre: 'En reparación', detalle: 'Se está trabajando en la reparación.' },
  { nombre: 'Listo para retirar', detalle: 'Tu equipo está listo para retirar.' },
  { nombre: 'Entregado', detalle: 'El equipo fue entregado.' },
];

function progreso(estado: string) {
  const e = (estado || '').toLocaleLowerCase('es-UY').trim();
  if (e === 'entregado') return 4;
  if (e === 'reparado' || e.includes('listo')) return 3;
  if (e.includes('reparaci')) return 2;
  if (e.includes('diagn')) return 1;
  return 0; // Pendiente = recibido
}

function MobileIcon() {
  return <svg viewBox="0 0 86 112" aria-hidden="true" className="w-[72px] h-[96px]">
    <rect x="17" y="3" width="54" height="105" rx="9" fill="#1d2734" stroke="#62738a" strokeWidth="2" />
    <rect x="22" y="12" width="44" height="85" rx="4" fill="#172b59" />
    <path d="M22 72 C34 42 50 39 66 21 L66 97 H22Z" fill="#2d5aab" />
    <path d="M22 89 C39 44 55 52 66 39 L66 97 H22Z" fill="#8a63bf" opacity=".85" />
    <rect x="37" y="6" width="16" height="3" rx="2" fill="#080c10" />
    <circle cx="44" cy="102" r="2" fill="#6d7888" />
  </svg>;
}

export default async function SeguimientoPage({ params }: Props) {
  const { token } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) notFound();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Falta configurar el acceso de seguimiento en el servidor');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: r, error } = await db.from('repairs')
    .select('orden,equipo,falla,estado,fecha,comentario_publico,user_id')
    .eq('seguimiento_token', token).maybeSingle();
  if (error) throw new Error('Error al consultar la reparación');
  if (!r) notFound();
  const { data: cfg } = await db.from('configuracion')
    .select('nombre_negocio,logo_url').eq('user_id', r.user_id).maybeSingle();
  const nombre = cfg?.nombre_negocio || 'MegaByte';
  const estado = r.estado || 'Pendiente';
  const actual = progreso(estado);
  const fecha = r.fecha || '—';
  return <main className="min-h-screen bg-[#050809] px-3 py-5 sm:py-9 text-[#f2f5f7]" style={{fontFamily:'Arial, Helvetica, sans-serif'}}>
    <div className="mx-auto max-w-[430px] overflow-hidden rounded-[19px] border border-[#1c2a2e] bg-[#090e12] shadow-[0_22px_75px_rgba(0,0,0,.65)]">
      <header className="bg-black px-5 pt-5 pb-4 text-center">
        {cfg?.logo_url ? <img src={cfg.logo_url} alt={nombre} className="mx-auto h-auto max-h-[90px] max-w-[270px] object-contain" /> :
          <div><div className="font-serif text-[39px] leading-none font-bold text-[#00b83b]">{nombre}</div><div className="mt-1 text-[10px] tracking-[.22em]">SOLUCIONES EN INFORMÁTICA</div></div>}
      </header>
      <div className="px-3 pb-4">
        <section className="rounded-[13px] border border-[#17252d] bg-[#111920] px-3 py-3">
          <div className="mb-2 text-[10px] font-semibold tracking-[.08em] text-[#99a7b6]">SEGUIMIENTO DE REPARACIÓN</div>
          <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#293946] bg-[#17232d] px-3 py-3">
            <h1 className="min-w-0 text-[21px] font-extrabold tracking-[-.035em]">Orden {r.orden}</h1>
            <span className="max-w-[135px] shrink-0 rounded-[3px] bg-[#00c347] px-2 py-[6px] text-center text-[11px] font-bold leading-tight text-[#001d0a]">{estado}</span>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="flex w-[83px] shrink-0 items-center justify-center rounded-[7px] border border-[#2a3b49] bg-[#0a121b]"><MobileIcon /></div>
            <div className="min-w-0 flex-1">
              <h2 className="mb-3 break-words text-[16px] font-bold leading-snug">{r.equipo || 'Equipo sin especificar'}</h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-[6px] text-[12px] leading-snug">
                <span className="text-[#a7b5c6]">Falla:</span><span className="break-words">{r.falla || 'Sin especificar'}</span>
                <span className="text-[#a7b5c6]">Fecha de ingreso:</span><span>{fecha}</span>
                <span className="text-[#a7b5c6]">Accesorios:</span><span>No registrados</span>
              </div>
            </div>
          </div>
          <ol className="mt-6">
            {PASOS.map((paso,i) => {
              const completado = i < actual;
              const activo = i === actual;
              const hecho = i <= actual;
              return <li key={paso.nombre} className="relative grid grid-cols-[31px_minmax(0,1fr)] gap-x-2 min-h-[70px] last:min-h-0">
                {i !== PASOS.length-1 && <span className={`absolute left-[14px] top-[27px] bottom-0 w-[2px] ${i < actual ? 'bg-[#00b845]' : 'bg-[#46515e]'}`} />}
                <span className={`relative z-10 flex h-[29px] w-[29px] items-center justify-center rounded-full border-[2px] text-[16px] font-bold ${completado ? 'border-[#00c34b] bg-[#00c34b] text-black' : activo ? 'border-[#00c34b] bg-[#073d22] text-[#00d75a] shadow-[0_0_0_4px_rgba(0,195,75,.10)]' : 'border-[#687485] bg-[#101820] text-[#687485]'}`}>{completado ? '✓' : activo ? '●' : ''}</span>
                <div className="flex min-w-0 flex-col gap-[5px] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                  <div className="min-w-0 sm:w-[43%]"><div className={`text-[13px] font-semibold leading-snug ${activo ? 'text-[#00d957]' : hecho ? 'text-white' : 'text-[#8794a5]'}`}>{paso.nombre}</div></div>
                  {hecho && <div className={`min-w-0 flex-1 rounded-[7px] px-[9px] py-[9px] text-[11px] leading-[1.4] ${activo ? 'border border-[#08733a] bg-[#09291d] text-[#e5fff0]' : 'bg-[#1b2832] text-[#e3eaf1]'}`}>{paso.detalle}</div>}
                </div>
              </li>;
            })}
          </ol>
          <section className="mt-4 rounded-[10px] border border-[#253641] bg-[#101a23] px-3 py-3">
            <div className="flex items-center gap-2 text-[13px] font-bold"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#b8c9db" strokeWidth="1.7" aria-hidden="true"><path d="M4 4h16v13H9l-5 4V4Z"/><path d="M7 9h10M7 13h7"/></svg>Comentarios del taller</div>
            <p className="mt-3 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#b4c3d4]">{r.comentario_publico?.trim() || 'Todavía no hay novedades adicionales para esta reparación.'}</p>
          </section>
        </section>
        <p className="pt-4 text-center text-[11px] text-[#7d909d]">Gracias por confiar en {nombre}</p>
        <p className="pt-1 text-center text-[10px] text-[#60717e]">Actualizá la página para consultar novedades.</p>
      </div>
    </div>
  </main>;
}
