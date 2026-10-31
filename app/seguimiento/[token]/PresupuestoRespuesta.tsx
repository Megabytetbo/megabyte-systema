'use client';
import { useState } from 'react';
type Props = { token: string; importe: number; detalle: string; estado: string; fecha?: string | null };
export default function PresupuestoRespuesta({ token, importe, detalle, estado: inicial, fecha }: Props) {
  const [estado, setEstado] = useState(inicial);
  const [confirmacion, setConfirmacion] = useState<'aprobado' | 'rechazado' | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const responder = async () => {
    if (!confirmacion || cargando) return;
    setCargando(true); setError('');
    try {
      const res = await fetch(`/api/presupuesto/${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: confirmacion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la respuesta');
      setEstado(data.estado); setConfirmacion(null);
    } catch (e: any) { setError(e.message || 'Error de conexión'); }
    finally { setCargando(false); }
  };
  return <section className="mt-4 rounded-[10px] border border-[#1e6b42] bg-[#0d211a] px-4 py-4">
    <h2 className="text-[15px] font-bold text-white">💰 Presupuesto de reparación</h2>
    <div className="mt-4 rounded-lg border border-[#2a7650] bg-[#143427] px-3 py-3">
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#72e6a2]">📋 Detalle del presupuesto</p>
      <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-relaxed text-white">{detalle}</p>
    </div>
    <div className="mt-3 text-[25px] font-extrabold text-[#41e17b]">$ {Number(importe).toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} UYU</div>
    {estado === 'pendiente' ? <>
      <p className="mt-2 text-[12px] text-[#afc4b8]">¿Autorizás este presupuesto?</p>
      {!confirmacion ? <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setConfirmacion('aprobado')} className="rounded-lg bg-[#16803c] px-2 py-3 text-sm font-bold text-white">✓ Aprobar</button><button onClick={() => setConfirmacion('rechazado')} className="rounded-lg border border-red-500 px-2 py-3 text-sm font-bold text-red-300">✕ Rechazar</button></div> : <div className="mt-3 rounded-lg border border-yellow-700 p-3"><p className="text-sm">¿Confirmás que querés {confirmacion === 'aprobado' ? 'APROBAR' : 'RECHAZAR'} este presupuesto?</p><div className="mt-3 flex gap-2"><button disabled={cargando} onClick={responder} className="rounded-lg bg-green-700 px-3 py-2 text-sm font-bold disabled:opacity-50">{cargando ? 'Guardando…' : 'Sí, confirmar'}</button><button disabled={cargando} onClick={() => setConfirmacion(null)} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button></div></div>}
    </> : <p className={`mt-3 rounded-lg px-3 py-3 text-sm font-bold ${estado === 'aprobado' ? 'bg-green-900 text-green-200' : 'bg-red-950 text-red-200'}`}>{estado === 'aprobado' ? '✓ Presupuesto aprobado' : '✕ Presupuesto rechazado'}{fecha ? ` · ${new Date(fecha).toLocaleString('es-UY')}` : ''}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    <p className="mt-3 text-[11px] text-[#9bb4a8]">La respuesta queda registrada en el taller.</p>
  </section>;
}
