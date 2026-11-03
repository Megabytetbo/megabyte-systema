type Props = { token: string; importe: number; detalle: string; estado: string; fecha?: string | null };

// Tarjeta informativa de seguimiento. No permite aprobar ni rechazar desde el QR.
export default function PresupuestoRespuesta({ importe, detalle, estado, fecha }: Props) {
  const esReparacion = estado === 'reparacion';
  return <section className="mt-4 rounded-[10px] border border-[#1e6b42] bg-[#0d211a] px-4 py-4">
    <h2 className="text-[15px] font-bold text-white">💰 {esReparacion ? 'Precio de reparación' : 'Presupuesto de reparación'}</h2>
    <div className="mt-4 rounded-lg border border-[#2a7650] bg-[#143427] px-3 py-3">
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#72e6a2]">📋 {esReparacion ? 'Detalle del trabajo' : 'Detalle del presupuesto'}</p>
      <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-relaxed text-white">{detalle.trim() || 'Sin detalle cargado.'}</p>
    </div>
    <div className="mt-3 text-[25px] font-extrabold text-[#41e17b]">$ {Number(importe).toLocaleString('es-UY', { minimumFractionDigits: 2 })} UYU</div>
    {!esReparacion && <>
      {estado === 'aprobado' ? <p className="mt-3 rounded-lg bg-green-900 px-3 py-3 text-sm font-bold text-green-200">✓ Presupuesto aprobado{fecha ? ` · ${new Date(fecha).toLocaleString('es-UY')}` : ''}</p>
        : estado === 'rechazado' ? <p className="mt-3 rounded-lg bg-red-950 px-3 py-3 text-sm font-bold text-red-200">✕ Presupuesto rechazado{fecha ? ` · ${new Date(fecha).toLocaleString('es-UY')}` : ''}</p>
        : <p className="mt-3 rounded-lg border border-[#2a7650] bg-[#143427] px-3 py-3 text-sm font-bold text-[#b6e8c9]">⏳ Presupuesto pendiente</p>}
      <p className="mt-3 text-[11px] text-[#9bb4a8]">La respuesta queda registrada en el taller.</p>
    </>}
  </section>;
}
