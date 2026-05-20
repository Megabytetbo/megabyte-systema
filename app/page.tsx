'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [repairs, setRepairs] = useState(() => {
    const saved = typeof window !== "undefined"? localStorage.getItem("megabyte_repairs"): null;

    if (saved) {
      return JSON.parse(saved);
    }

    return [];
  });

  const [form, setForm] = useState({
    cliente: '',
    equipo: '',
    falla: '',
    telefono: '',
  });

  useEffect(() => {
    localStorage.setItem('megabyte_repairs', JSON.stringify(repairs));
  }, [repairs]);

  const addRepair = () => {
    if (!form.cliente || !form.equipo) return;

    setRepairs([
      {
        ...form,
        estado: 'Recibido',
      },
      ...repairs,
    ]);

    setForm({
      cliente: '',
      equipo: '',
      falla: '',
      telefono: '',
    });
  };

  const deleteRepair = (index: number) => {
    const updated = repairs.filter((_: any, i: number) => i !== index);
    setRepairs(updated);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-400">
              MegaByte
            </h1>

            <p className="text-gray-400">
              Sistema de Reparaciones
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-4">
            Nueva Orden
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <input
              placeholder="Cliente"
              value={form.cliente}
              onChange={(e) =>
                setForm({ ...form, cliente: e.target.value })
              }
              className="bg-zinc-800 rounded-2xl p-3"
            />

            <input
              placeholder="Equipo"
              value={form.equipo}
              onChange={(e) =>
                setForm({ ...form, equipo: e.target.value })
              }
              className="bg-zinc-800 rounded-2xl p-3"
            />

            <input
              placeholder="Falla"
              value={form.falla}
              onChange={(e) =>
                setForm({ ...form, falla: e.target.value })
              }
              className="bg-zinc-800 rounded-2xl p-3"
            />

            <input
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) =>
                setForm({ ...form, telefono: e.target.value })
              }
              className="bg-zinc-800 rounded-2xl p-3"
            />
          </div>

          <button
            onClick={addRepair}
            className="mt-4 bg-green-500 text-black px-6 py-3 rounded-2xl font-bold"
          >
            Guardar Orden
          </button>
        </div>

        <div className="bg-zinc-900 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="text-2xl font-bold text-green-400">
              Reparaciones
            </h2>
          </div>

          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">Equipo</th>
                <th className="p-4 text-left">Falla</th>
                <th className="p-4 text-left">Estado</th>
                <th className="p-4 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {repairs.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="border-t border-zinc-800"
                >
                  <td className="p-4">{item.cliente}</td>
                  <td className="p-4">{item.equipo}</td>
                  <td className="p-4">{item.falla}</td>
                  <td className="p-4">{item.estado}</td>

                  <td className="p-4">
                    <button
                      onClick={() => deleteRepair(index)}
                      className="bg-red-500 px-4 py-2 rounded-xl text-black font-bold"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}