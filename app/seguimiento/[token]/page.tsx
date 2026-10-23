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

function EquipoIcon({ equipo }: { equipo: string }) {
  const tipo = (equipo || '').toLocaleLowerCase('es-UY');
  if (/notebook|laptop|portátil|portatil|macbook|chromebook|netbook/.test(tipo)) return <svg viewBox="0 0 100 112" aria-hidden="true" className="w-[78px] h-[96px]">
    <rect x="9" y="23" width="82" height="57" rx="5" fill="#1d2734" stroke="#62738a" strokeWidth="2"/><rect x="14" y="28" width="72" height="47" rx="2" fill="#172b59"/><path d="M14 65 48 28H86V75H14Z" fill="#2d5aab"/><path d="M38 75 74 28H86V75Z" fill="#8a63bf" opacity=".8"/><path d="M4 82H96L88 89H12Z" fill="#62738a"/><path d="M4 82H96L91 86H9Z" fill="#344356"/><rect x="43" y="83" width="14" height="2" rx="1" fill="#a4b2c4"/>
  </svg>;
  if (/tablet|ipad|tab\b/.test(tipo)) return <svg viewBox="0 0 86 112" aria-hidden="true" className="w-[72px] h-[96px]">
    <rect x="7" y="8" width="72" height="96" rx="8" fill="#1d2734" stroke="#62738a" strokeWidth="2"/><rect x="12" y="14" width="62" height="84" rx="3" fill="#172b59"/><path d="M12 83 58 14H74V98H12Z" fill="#2d5aab"/><path d="M37 98 74 40V98Z" fill="#8a63bf" opacity=".85"/><circle cx="43" cy="101" r="1.7" fill="#6d7888"/>
  </svg>;
  if (/playstation|ps[345]|xbox|nintendo|switch|consola|wii/.test(tipo)) return <svg viewBox="0 0 100 112" aria-hidden="true" className="w-[78px] h-[96px]">
    <rect x="30" y="10" width="40" height="67" rx="5" fill="#1d2734" stroke="#62738a" strokeWidth="2"/><path d="M49 13H66V74H49Z" fill="#172b59"/><path d="M51 14 66 29V74H51Z" fill="#2d5aab"/><rect x="46" y="17" width="2" height="54" rx="1" fill="#8a63bf"/><path d="M19 75C12 76 8 84 8 92c0 8 6 11 12 7l13-8h34l13 8c6 4 12 1 12-7 0-8-4-16-11-17l-18-4H37Z" fill="#344356" stroke="#62738a" strokeWidth="2"/><path d="M25 80v13M19 86h12" stroke="#b2c1d3" strokeWidth="3" strokeLinecap="round"/><circle cx="72" cy="83" r="3" fill="#8a63bf"/><circle cx="79" cy="89" r="3" fill="#2d5aab"/>
  </svg>;
  if (/impresora|printer|epson|brother|laserjet|deskjet|pixma/.test(tipo)) return <svg viewBox="0 0 100 112" aria-hidden="true" className="w-[78px] h-[96px]">
    <rect x="25" y="8" width="50" height="38" rx="3" fill="#d8e2ec"/><path d="M31 18H69M31 25H64" stroke="#8a9bb0" strokeWidth="2"/><rect x="10" y="36" width="80" height="55" rx="8" fill="#1d2734" stroke="#62738a" strokeWidth="2"/><rect x="16" y="46" width="68" height="23" rx="3" fill="#344356"/><rect x="24" y="64" width="52" height="37" rx="3" fill="#d8e2ec"/><path d="M32 76H68M32 83H62M32 90H65" stroke="#8a9bb0" strokeWidth="2"/><circle cx="78" cy="43" r="3" fill="#00c347"/>
  </svg>;
  if (/pc|desktop|computadora|monitor|all.in.one|gabinete|torre/.test(tipo)) return <svg viewBox="0 0 100 112" aria-hidden="true" className="w-[78px] h-[96px]">
    <rect x="7" y="16" width="86" height="66" rx="5" fill="#1d2734" stroke="#62738a" strokeWidth="2"/><rect x="12" y="21" width="76" height="55" rx="2" fill="#172b59"/><path d="M12 68 55 21H88V76H12Z" fill="#2d5aab"/><path d="M40 76 88 35V76Z" fill="#8a63bf" opacity=".8"/><path d="M45 82V94M55 82V94" stroke="#62738a" strokeWidth="4"/><rect x="29" y="94" width="42" height="5" rx="2" fill="#62738a"/>
  </svg>;
  if (/celular|telefono|teléfono|iphone|samsung|xiaomi|redmi|motorola|huawei|smartphone|poco\b|oppo|realme/.test(tipo)) return <MobileIcon />;
  return <svg viewBox="0 0 100 112" aria-hidden="true" className="w-[78px] h-[96px]">
    <rect x="12" y="24" width="76" height="66" rx="10" fill="#1d2734" stroke="#62738a" strokeWidth="2"/><rect x="19" y="31" width="62" height="48" rx="5" fill="#172b59"/><path d="M19 69 59 31H81V79H19Z" fill="#2d5aab"/><path d="M47 79 81 47V79Z" fill="#8a63bf" opacity=".8"/><circle cx="50" cy="85" r="2" fill="#a4b2c4"/>
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
            <span className="max-w-[135px] shrink-0 rounded-[3px] bg-[#00c347] px-2 py-[6px] text-center text-[11px] font-bold leading-tight text-[#001d0a]">{estado === 'Reparado' ? 'Listo para retirar' : estado === 'Pendiente' ? 'Equipo recibido' : estado}</span>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="flex w-[83px] shrink-0 items-center justify-center rounded-[7px] border border-[#2a3b49] bg-[#0a121b]"><EquipoIcon equipo={r.equipo || ''} /></div>
            <div className="min-w-0 flex-1">
              <h2 className="mb-3 break-words text-[16px] font-bold leading-snug">{r.equipo || 'Equipo sin especificar'}</h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-[6px] text-[12px] leading-snug">
                <span className="text-[#a7b5c6]">Falla:</span><span className="break-words">{r.falla || 'Sin especificar'}</span>
                <span className="text-[#a7b5c6]">Fecha de ingreso:</span><span>{fecha}</span>
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
