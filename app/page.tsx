'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import jsPDF from 'jspdf';

export default function Home() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
const [user, setUser] = useState<any>(null);

const [loginForm, setLoginForm] = useState({
  email: '',
  password: '',
  recordar: false,
});
  const [section, setSection] = useState('reparaciones');

  // EDITAR
  const [editingRepair, setEditingRepair] = useState<any | null>(null);

  const [form, setForm] = useState({
    cliente: '',
    tipo: '',
    modelo: '',
    falla: '',
    telefono: '',
    costo: '',
    sena: '',
    saldo: '',
  });

  useEffect(() => {
    // VERIFICAR SESION
const checkUser = async () => {

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    setUser(session.user);
  }
};

checkUser();
const recordar =
  localStorage.getItem(
    'megabyte_recordar'
  );

if (!recordar) {

  supabase.auth.signOut();

}
// LOGIN
const handleLogin = async () => {

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

  if (error) {
    alert('Usuario o contraseña incorrectos');
    return;
  }

  if (data.user) {
    setUser(data.user);
  }
};

// LOGOUT
const handleLogout = async () => {

  await supabase.auth.signOut();

  setUser(null);
};
    const loadRepairs = async () => {
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .order('id', { ascending: false });

      if (data) {
        setRepairs(data);
      }

      if (error) {
        console.log(error);
      }
    };

    loadRepairs();
  }, []);
  useEffect(() => {

  supabase.auth.onAuthStateChange((event, session) => {

    if (session) {
      setUser(session.user);
    } else {
      setUser(null);
    }

  });

}, []);

  // PDF
 // =============================
// REEMPLAZÁ SOLO ESTA FUNCIÓN
// generatePDF
// =============================

const generatePDF = (repair: any) => {

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160],
  });

  let y = 12;

  // TITULO
  pdf.setFontSize(18);

  pdf.text(
    'MegaByte',
    40,
    y,
    {
      align: 'center',
    }
  );

  y += 6;

  pdf.setFontSize(8);

  pdf.text(
    'Soluciones en Informatica',
    40,
    y,
    {
      align: 'center',
    }
  );

  y += 5;

  pdf.text(
    'WhatsApp: 099 347 478',
    40,
    y,
    {
      align: 'center',
    }
  );

  y += 6;

  pdf.line(5, y, 75, y);

  y += 8;

  // DATOS
  pdf.setFontSize(10);

  pdf.text(
    `Orden: ${repair.orden}`,
    5,
    y
  );

  y += 8;

  pdf.text(
    `Cliente: ${repair.cliente}`,
    5,
    y
  );

  y += 8;

  pdf.text(
    `Equipo: ${repair.equipo}`,
    5,
    y
  );

  y += 8;

  pdf.text(
    'Falla:',
    5,
    y
  );

  y += 5;

  const fallaTexto =
    pdf.splitTextToSize(
      repair.falla || '',
      65
    );

  pdf.text(
    fallaTexto,
    5,
    y
  );

  y += fallaTexto.length * 5 + 8;

  
  pdf.text(
    `Costo: $ ${repair.costo || 0}`,
    5,
    y
  );

  y += 6;

  pdf.text(
    `Entrega: $ ${repair.sena || 0}`,
    5,
    y
  );

  y += 6;

  pdf.text(
    `Saldo: $ ${repair.saldo || 0}`,
    5,
    y
  );

  y += 8;

  pdf.text(
    `Estado: ${repair.estado}`,
    5,
    y
  );

  y += 8;

  pdf.text(
    `${repair.fecha}`,
    5,
    y
  );

  y += 10;

  pdf.line(5, y, 75, y);

  y += 8;

  pdf.setFontSize(8);

  pdf.text(
    'Gracias por confiar en MegaByte',
    40,
    y,
    {
      align: 'center',
    }
  );

  y += 5;

  pdf.text(
    'Conserve este comprobante',
    40,
    y,
    {
      align: 'center',
    }
  );
  // TEXTO LEGAL
y += 12;

pdf.setFontSize(7);

const textoLegal =
  'Pasados los 90 dias la empresa no se responsabiliza por los equipos y se tomaran como abandono, pudiendo disponer de los mismos como forma de pago por el servicio brindado.';

const textoDividido =
  pdf.splitTextToSize(
    textoLegal,
    65
  );

pdf.text(
  textoDividido,
  5,
  y
);

  // ABRIR
  window.open(
    pdf.output('bloburl'),
    '_blank'
  );
};
  // CREAR / EDITAR
  const addRepair = async () => {
    if (!form.cliente || !form.modelo) return;

    const costo = Number(form.costo || 0);
    const sena = Number(form.sena || 0);
    const saldo = costo - sena;

    // EDITAR
    if (editingRepair) {

      const { error } = await supabase
        .from('repairs')
        .update({
          cliente: form.cliente,
          equipo: `${form.tipo} - ${form.modelo}`,
          falla: form.falla,
          telefono: form.telefono,
          costo,
          sena,
          saldo,
        })
        .eq('id', editingRepair.id);

      if (!error) {

        setRepairs(
          repairs.map((repair) =>
            repair.id === editingRepair.id
              ? {
                  ...repair,
                  cliente: form.cliente,
                  equipo: `${form.tipo} - ${form.modelo}`,
                  falla: form.falla,
                  telefono: form.telefono,
                  costo,
                  sena,
                  saldo,
                }
              : repair
          )
        );
      }

    } else {

      // CREAR
      const numeroOrden = repairs.length + 1;

      const nuevoRepair = {
        orden: `#${numeroOrden.toString().padStart(4, '0')}`,
        cliente: form.cliente,
        equipo: `${form.tipo} - ${form.modelo}`,
        falla: form.falla,
        telefono: form.telefono,
        costo,
        sena,
        saldo,
        estado: 'Pendiente',
        fecha: new Date().toLocaleString('es-UY', {
          hour12: false,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const { data, error } = await supabase
        .from('repairs')
        .insert([nuevoRepair])
        .select();

      if (error) {
        console.log(error);
        return;
      }

      if (data) {
        setRepairs([data[0], ...repairs]);
      }
    }

    setForm({
      cliente: '',
      tipo: '',
      modelo: '',
      falla: '',
      telefono: '',
      costo: '',
      sena: '',
      saldo: '',
    });

    setEditingRepair(null);

    setShowModal(false);
  };

  const deleteRepair = async (id: number) => {
    const { error } = await supabase
      .from('repairs')
      .delete()
      .eq('id', id);

    if (!error) {
      setRepairs(repairs.filter((repair) => repair.id !== id));
    }
  };

  // EDITAR ORDEN
  const editRepair = (repair: any) => {

    const partesEquipo = repair.equipo.split(' - ');

    setForm({
      cliente: repair.cliente || '',
      tipo: partesEquipo[0] || '',
      modelo: partesEquipo[1] || '',
      falla: repair.falla || '',
      telefono: repair.telefono || '',
      costo: String(repair.costo || ''),
      sena: String(repair.sena || ''),
      saldo: String(repair.saldo || ''),
    });

    setEditingRepair(repair);

    setShowModal(true);
  };

  // TOTALES FINANZAS
  const totalCobrado = repairs.reduce(
    (acc, repair) => acc + Number(repair.sena || 0),
    0
  );

  const totalPendiente = repairs.reduce(
    (acc, repair) => acc + Number(repair.saldo || 0),
    0
  );

  const totalTrabajos = repairs.reduce(
    (acc, repair) => acc + Number(repair.costo || 0),
    0
  );
  // EQUIPO MAS REPARADO
const equiposCount: any = {};

repairs.forEach((r: any) => {

  equiposCount[r.equipo] =
    (equiposCount[r.equipo] || 0) + 1;
});

const equipoTop =
  Object.keys(equiposCount)
    .sort(
      (a, b) =>
        equiposCount[b] -
        equiposCount[a]
    )[0] || 'Sin datos';

// CLIENTE VIP
const clientesCount: any = {};

repairs.forEach((r: any) => {

  clientesCount[r.cliente] =
    (clientesCount[r.cliente] || 0) +
    Number(r.costo || 0);
});

const clienteVIP =
  Object.keys(clientesCount)
    .sort(
      (a, b) =>
        clientesCount[b] -
        clientesCount[a]
    )[0] || 'Sin datos';

// PROMEDIO
const promedio =
  repairs.length > 0
    ? Math.round(
        totalTrabajos /
          repairs.length
      )
    : 0;
// CLIENTE NIVEL
const getNivelCliente = (
  cantidad: number
) => {

  if (cantidad >= 5) {
    return {
      texto: 'VIP',
      color:
        'text-yellow-400',
    };
  }

  if (cantidad >= 3) {
    return {
      texto: 'Frecuente',
      color:
        'text-blue-400',
    };
  }

  return {
    texto: 'Normal',
    color:
      'text-zinc-400',
  };
};
// PANTALLA LOGIN
// LOGIN
const handleLogin = async () => {

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

  if (error) {
    alert('Usuario o contraseña incorrectos');
    return;
  }

 if (data.user) {

  if (loginForm.recordar) {

    localStorage.setItem(
      'megabyte_recordar',
      'true'
    );

  } else {

    localStorage.removeItem(
      'megabyte_recordar'
    );
  }

  setUser(data.user);
}
};

// LOGOUT
const handleLogout = async () => {

  await supabase.auth.signOut();

  setUser(null);
};
if (!user) {

  return (

    <div className="min-h-screen bg-black flex items-center justify-center p-6">

      <div className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md">

        <h1 className="text-5xl font-bold text-green-400 mb-2 text-center">
          MegaByte
        </h1>

        <p className="text-zinc-400 text-center mb-8">
          Iniciar sesión
        </p>

        <div className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Correo"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({
                ...loginForm,
                email: e.target.value,
              })
            }
            className="bg-zinc-800 text-white placeholder-zinc-400 p-4 rounded-2xl outline-none border border-zinc-700"
style={{ color: 'white' }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({
                ...loginForm,
                password: e.target.value,
              })
            }
            className="bg-zinc-800 text-white placeholder-zinc-400 p-4 rounded-2xl outline-none border border-zinc-700"
style={{ color: 'white' }}
          />
<label className="flex items-center gap-3 text-zinc-300">

  <input
    type="checkbox"
    checked={loginForm.recordar}
    onChange={(e) =>
      setLoginForm({
        ...loginForm,
        recordar: e.target.checked,
      })
    }
  />

  No cerrar sesión

</label>
          <button
            onClick={handleLogin}
            className="bg-green-500 hover:bg-green-600 text-black font-bold py-4 rounded-2xl"
          >
            Ingresar
          </button>

        </div>

      </div>

    </div>
  );
}
  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* SIDEBAR */}
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800 p-6">

        <h1 className="text-4xl font-bold text-green-400 mb-10">
          MegaByte
        </h1>

        <nav className="flex flex-col gap-4">

          <button
            onClick={() => setSection('dashboard')}
            className={`py-3 rounded-2xl font-bold ${
              section === 'dashboard'
                ? 'bg-green-500 text-black'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setSection('reparaciones')}
            className={`py-3 rounded-2xl font-bold ${
              section === 'reparaciones'
                ? 'bg-green-500 text-black'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Reparaciones
          </button>

          <button
            onClick={() => setSection('finanzas')}
            className={`py-3 rounded-2xl font-bold ${
              section === 'finanzas'
                ? 'bg-green-500 text-black'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Finanzas
          </button>

          <button
            onClick={() => setSection('clientes')}
            className={`py-3 rounded-2xl font-bold ${
              section === 'clientes'
                ? 'bg-green-500 text-black'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Clientes
          </button>

          <button
            onClick={() => setSection('configuracion')}
            className={`py-3 rounded-2xl font-bold ${
              section === 'configuracion'
                ? 'bg-green-500 text-black'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Configuración
          </button>

        </nav>
        <button
  onClick={handleLogout}
  className="mt-10 bg-red-500 hover:bg-red-600 py-3 rounded-2xl font-bold w-full"
>
  Cerrar sesión
</button>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-6">

        {/* DASHBOARD */}
        {section === 'dashboard' && (
          <div>

            <h1 className="text-4xl font-bold text-green-400 mb-8">
              Dashboard
            </h1>

            <div className="grid md:grid-cols-3 gap-6">

              <div className="bg-zinc-900 p-6 rounded-3xl">
                <h2 className="text-zinc-400 mb-2">
                  Reparaciones
                </h2>

                <p className="text-4xl font-bold text-green-400">
                  {repairs.length}
                </p>
              </div><div className="grid md:grid-cols-3 gap-6 mt-6">

  {/* GANANCIAS */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Ganancias Totales
    </h2>

    <p className="text-4xl font-bold text-blue-400">
      $ {totalTrabajos}
    </p>

  </div>

  {/* EQUIPO TOP */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Equipo Más Reparado
    </h2>

    <p className="text-xl font-bold text-green-400">
      {equipoTop}
    </p>

  </div>

  {/* CLIENTE VIP */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Cliente VIP
    </h2>

    <p className="text-xl font-bold text-yellow-400">
      {clienteVIP}
    </p>

  </div>

</div>

<div className="grid md:grid-cols-3 gap-6 mt-6">

  {/* PROMEDIO */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Promedio por reparación
    </h2>

    <p className="text-4xl font-bold text-purple-400">
      $ {promedio}
    </p>

  </div>

</div>

              <div className="bg-zinc-900 p-6 rounded-3xl">
                <h2 className="text-zinc-400 mb-2">
                  Pendientes
                </h2>

                <p className="text-4xl font-bold text-yellow-400">
                  {
                    repairs.filter(
                      (r) => r.estado === 'Pendiente'
                    ).length
                  }
                </p>
              </div>

              <div className="bg-zinc-900 p-6 rounded-3xl">
                <h2 className="text-zinc-400 mb-2">
                  Entregados
                </h2>

                <p className="text-4xl font-bold text-green-500">
                  {
                    repairs.filter(
                      (r) => r.estado === 'Entregado'
                    ).length
                  }
                </p>
              </div>

            </div>
          </div>
        )}

        {/* FINANZAS */}
        {section === 'finanzas' && (
          <div>

            <h1 className="text-4xl font-bold text-green-400 mb-8">
              Finanzas
            </h1>

           <div className="grid md:grid-cols-3 gap-6">

  {/* REPARACIONES */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Reparaciones
    </h2>

    <p className="text-5xl font-bold text-green-400">
      {repairs.length}
    </p>

  </div>

  {/* PENDIENTES */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Pendientes
    </h2>

    <p className="text-5xl font-bold text-yellow-400">
      {
        repairs.filter(
          (r) =>
            r.estado ===
            'Pendiente'
        ).length
      }
    </p>

  </div>

  {/* ENTREGADOS */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Entregados
    </h2>

    <p className="text-5xl font-bold text-green-500">
      {
        repairs.filter(
          (r) =>
            r.estado ===
            'Entregado'
        ).length
      }
    </p>

  </div>

  {/* GANANCIAS */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Ganancias Totales
    </h2>

    <p className="text-5xl font-bold text-blue-400">
      $ {totalTrabajos}
    </p>

  </div>

  {/* EQUIPO TOP */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Equipo Más Reparado
    </h2>

    <p className="text-3xl font-bold text-green-400">
      {equipoTop}
    </p>

  </div>

  {/* CLIENTE VIP */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Cliente VIP
    </h2>

    <p className="text-3xl font-bold text-yellow-400">
      {clienteVIP}
    </p>

  </div>

  {/* PROMEDIO */}
  <div className="bg-zinc-900 p-6 rounded-3xl">

    <h2 className="text-zinc-400 mb-2">
      Promedio por reparación
    </h2>

    <p className="text-5xl font-bold text-purple-400">
      $ {promedio}
    </p>

  </div>

</div>
          </div>
        )}

        {/* CLIENTES */}
{section === 'clientes' && (
  <div>

    <h1 className="text-4xl font-bold text-green-400 mb-8">
      Clientes
    </h1>

    <div className="bg-zinc-900 rounded-3xl overflow-hidden">

      <table className="w-full">

        <thead className="bg-zinc-800">

          <tr>

            <th className="text-left p-4">
              Cliente
            </th>

            <th className="text-left p-4">
              Teléfono
            </th>

            <th className="text-left p-4">
              Reparaciones
            </th>

            <th className="text-left p-4">
              Total Gastado
            </th>
           
            <th className="text-left p-4">
              Nivel
            </th>

            <th className="text-left p-4">
             Historial
            </th>

            <th className="text-left p-4">
              WhatsApp
            </th>

          </tr>

        </thead>

        <tbody>

          {Object.values(

            repairs.reduce(
              (acc: any, repair: any) => {

                if (
                  !acc[
                    repair.telefono
                  ]
                ) {

                  acc[
                    repair.telefono
                  ] = {
                    cliente:
                      repair.cliente,

                    telefono:
                      repair.telefono,

                    cantidad: 0,

                    total: 0,
                  };
                }

                acc[
                  repair.telefono
                ].cantidad += 1;

                acc[
                  repair.telefono
                ].total += Number(
                  repair.costo || 0
                );

                return acc;

              },
              {}
            )

          ).map(
            (
              cliente: any,
              index: number
            ) => (

              <tr
                key={index}
                className="border-t border-zinc-800"
              >

                <td className="p-4">
                  {cliente.cliente}
                </td>

                <td className="p-4">
                  {cliente.telefono}
                </td>

                <td className="p-4 text-green-400 font-bold">
                  {cliente.cantidad}
                </td>

                <td className="p-4 text-blue-400 font-bold">
                  $ {cliente.total}
                </td>
                <td
  className={`p-4 font-bold ${
    getNivelCliente(
      cliente.cantidad
    ).color
  }`}
>
  {
    getNivelCliente(
      cliente.cantidad
    ).texto
  }
</td>

<td className="p-4">

  <button
    onClick={() => {

      const historial =
        repairs.filter(
          (
            r: any
          ) =>
            r.telefono ===
            cliente.telefono
        );

      let texto =
        `Historial de ${cliente.cliente}\n\n`;

      historial.forEach(
        (
          r: any
        ) => {

          texto +=
            `• ${r.equipo}\n`;

          texto +=
            `Estado: ${r.estado}\n`;

          texto +=
            `Costo: $${r.costo}\n`;

          texto +=
            `Fecha: ${r.fecha}\n\n`;
        }
      );

      alert(texto);
    }}
    className="bg-zinc-700 px-4 py-2 rounded-xl font-bold"
  >
    Ver
  </button>

</td>

                <td className="p-4">

                  <a
                    href={`https://wa.me/598${cliente.telefono
                      .replace(
                        /\D/g,
                        ''
                      )
                      .replace(
                        /^0/,
                        ''
                      )}`}
                    target="_blank"
                    className="bg-green-500 px-4 py-2 rounded-xl text-black font-bold"
                  >
                    WhatsApp
                  </a>

                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

    </div>

  </div>
)}

        {/* CONFIGURACIÓN */}
        {section === 'configuracion' && (
          <div>

            <h1 className="text-4xl font-bold text-green-400 mb-8">
              Configuración
            </h1>

            <div className="bg-zinc-900 rounded-3xl p-8 text-zinc-400">
              Configuración del sistema MegaByte.
            </div>

          </div>
        )}

        {/* REPARACIONES */}
        {section === 'reparaciones' && (
          <>

            <div className="flex items-center justify-between mb-8">

              <div>
                <h1 className="text-4xl font-bold text-green-400">
                  Reparaciones
                </h1>

                <p className="text-zinc-400">
                  Gestión de equipos técnicos
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRepair(null);

                  setForm({
                    cliente: '',
                    tipo: '',
                    modelo: '',
                    falla: '',
                    telefono: '',
                    costo: '',
                    sena: '',
                    saldo: '',
                  });

                  setShowModal(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-2xl font-bold"
              >
                + Nueva Orden
              </button>
            </div>

            {/* TABLA */}
            <div className="bg-zinc-900 rounded-3xl overflow-hidden">

              <div className="p-5 border-b border-zinc-800">

                <input
                  type="text"
                  placeholder="Buscar cliente o equipo..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="bg-zinc-800 p-3 rounded-2xl w-full"
                />
              </div>

              <table className="w-full">

                <thead className="bg-zinc-800">
                  <tr>

                    <th className="text-left p-4">
                      Orden
                    </th>

                    <th className="text-left p-4">
                      Cliente
                    </th>

                    <th className="text-left p-4">
                      Equipo
                    </th>

                    <th className="text-left p-4">
                      Falla
                    </th>

                    <th className="text-left p-4">
                      Teléfono
                    </th>

                    <th className="text-left p-4">
                      Costo
                    </th>

                    <th className="text-left p-4">
                      Entrega
                    </th>

                    <th className="text-left p-4">
                      Saldo
                    </th>

                    <th className="text-left p-4">
                      Fecha
                    </th>

                    <th className="text-left p-4">
                      Estado
                    </th>

                    <th className="text-left p-4">
                      Acciones
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {repairs
                    .filter(
                      (repair: any) =>
                        repair.cliente
                          .toLowerCase()
                          .includes(
                            search.toLowerCase()
                          ) ||
                        repair.equipo
                          .toLowerCase()
                          .includes(
                            search.toLowerCase()
                          )
                    )
                    .map(
                      (
                        repair: any,
                        index: number
                      ) => (

                        <tr
                          key={index}
                          className="border-t border-zinc-800"
                        >

                          <td className="p-4 font-bold text-green-400">
                            {repair.orden}
                          </td>

                          <td className="p-4">
                            {repair.cliente}
                          </td>

                          <td className="p-4">
                            {repair.equipo}
                          </td>

                          <td className="p-4">
                            {repair.falla}
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            {repair.telefono}
                          </td>

                          <td className="p-4 text-blue-400 font-semibold">
                            $ {repair.costo || 0}
                          </td>

                          <td className="p-4 text-green-400 font-semibold">
                            $ {repair.sena || 0}
                          </td>

                          <td className="p-4 text-yellow-400 font-semibold">
                            $ {repair.saldo || 0}
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            {repair.fecha}
                          </td>

                          <td className="p-4">

                            <select
                              value={repair.estado}
                              onChange={async (e) => {

  const nuevoEstado =
    e.target.value;

  // ACTUALIZAR SUPABASE
  await supabase
    .from('repairs')
    .update({
      estado: nuevoEstado,
    })
    .eq(
      'id',
      repair.id
    );

  // ACTUALIZAR ESTADO LOCAL
  setRepairs(
    repairs.map(
      (r: any) =>
        r.id === repair.id
          ? {
              ...r,
              estado:
                nuevoEstado,
            }
          : r
    )
  );

  // =====================
  // WHATSAPP AUTOMATICO
  // =====================

  let mensaje = '';

  if (
    nuevoEstado ===
    'En reparación'
  ) {

    mensaje =
      `Hola ${repair.cliente} 👋%0A%0ATu equipo ${repair.equipo} ya ingresó a reparación en MegaByte 🔧`;

  }

  else if (
    nuevoEstado ===
    'Esperando repuesto'
  ) {

    mensaje =
      `Hola ${repair.cliente} 👋%0A%0ATu equipo ${repair.equipo} está esperando repuesto 📦`;

  }

  else if (
    nuevoEstado ===
    'Entregado'
  ) {

    mensaje =
      `Hola ${repair.cliente} 👋%0A%0ATu equipo ${repair.equipo} ya está pronto para retirar ✅%0A%0ASaldo pendiente: $${repair.saldo || 0}%0A%0AGracias por confiar en MegaByte`;

  }

  // ABRIR WHATSAPP
  if (mensaje) {

    const numero =
      repair.telefono
        ?.replace(/\D/g, '')
        ?.replace(/^0/, '');

    window.open(
      `https://wa.me/598${numero}?text=${mensaje}`,
      '_blank'
    );
  }
}}
                              className={`p-2 rounded text-sm font-semibold ${
                                repair.estado ===
                                'Pendiente'
                                  ? 'bg-yellow-500 text-black'
                                  : repair.estado ===
                                    'En reparación'
                                  ? 'bg-blue-500 text-white'
                                  : repair.estado ===
                                    'Esperando repuesto'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-green-600 text-white'
                              }`}
                            >

                              <option>
                                Pendiente
                              </option>

                              <option>
                                En reparación
                              </option>

                              <option>
                                Esperando repuesto
                              </option>

                              <option>
                                Entregado
                              </option>

                            </select>

                          </td>

                          <td className="p-4">

                            <div className="flex flex-col gap-2">

                              <button
                                onClick={() =>
                                  generatePDF(repair)
                                }
                                className="bg-zinc-700 w-28 py-2 rounded-xl text-white font-semibold text-sm"
                              >
                                PDF
                              </button>

                              <button
                                onClick={() =>
                                  editRepair(repair)
                                }
                                className="bg-blue-500 w-28 py-2 rounded-xl text-white font-semibold text-sm"
                              >
                                Editar
                              </button>

                              <a
                                href={`https://wa.me/598${repair.telefono
                                  .replace(
                                    /\D/g,
                                    ''
                                  )
                                  .replace(
                                    /^0/,
                                    ''
                                  )}`}
                                target="_blank"
                                className="bg-green-500 w-28 py-2 rounded-xl text-black font-semibold text-sm text-center"
                              >
                                WhatsApp
                              </a>

                              <button
                                onClick={() =>
                                  deleteRepair(
                                    repair.id
                                  )
                                }
                                className="bg-red-500 w-28 py-2 rounded-xl text-white font-semibold text-sm"
                              >
                                Eliminar
                              </button>

                            </div>
                          </td>

                        </tr>
                      )
                    )}

                </tbody>
              </table>
            </div>

            {/* MODAL */}
            {showModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

                <div className="bg-zinc-900 p-8 rounded-3xl w-[900px] max-h-[90vh] overflow-auto">

                  <div className="flex items-center justify-between mb-6">

                    <h2 className="text-3xl font-bold text-green-400">
                      {editingRepair
                        ? 'Editar Orden'
                        : 'Nueva Orden'}
                    </h2>

                    <button
                      onClick={() => setShowModal(false)}
                      className="text-red-500 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">

                    <input
                      placeholder="Cliente"
                      value={form.cliente}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cliente: e.target.value,
                        })
                      }
                      className="bg-zinc-800 rounded-2xl p-3"
                    />

                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tipo: e.target.value,
                        })
                      }
                      className="bg-zinc-800 rounded-2xl p-3"
                    >
                      <option value="">
                        Tipo de equipo
                      </option>

                      <option value="Celular">
                        Celular
                      </option>

                      <option value="Notebook">
                        Notebook
                      </option>

                      <option value="Consola">
                        Consola
                      </option>

                      <option value="Impresora">
                        Impresora
                      </option>
                    </select>

                    <input
                      placeholder="Modelo"
                      value={form.modelo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          modelo: e.target.value,
                        })
                      }
                      className="bg-zinc-800 rounded-2xl p-3"
                    />

                    <input
                      placeholder="Falla"
                      value={form.falla}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          falla: e.target.value,
                        })
                      }
                      className="bg-zinc-800 rounded-2xl p-3"
                    />

                    <input
                      placeholder="Teléfono"
                      value={form.telefono}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          telefono: e.target.value,
                        })
                      }
                      className="bg-zinc-800 rounded-2xl p-3"
                    />

                    <input
                      type="number"
                      placeholder="Costo total"
                      value={form.costo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          costo: e.target.value,
                        })
                      }
                      className="bg-zinc-800 rounded-2xl p-3"
                    />

                    <input
                      type="number"
                      placeholder="Entrega"
                      value={form.sena}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sena: e.target.value,
                          saldo: String(
                            Number(form.costo || 0) -
                              Number(e.target.value || 0)
                          ),
                        })
                      }
                      className="bg-zinc-800 rounded-2xl p-3"
                    />

                    <input
                      type="number"
                      placeholder="Saldo"
                      value={form.saldo}
                      readOnly
                      className="bg-zinc-700 rounded-2xl p-3"
                    />

                  </div>

                  <div className="flex gap-4 mt-6">

                    <button
                      onClick={addRepair}
                      className="bg-green-500 text-black px-6 py-3 rounded-2xl font-bold"
                    >
                      {editingRepair
                        ? 'Guardar Cambios'
                        : 'Guardar Orden'}
                    </button>

                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"
                    >
                      Cancelar
                    </button>

                  </div>
                </div>
              </div>
            )}

          </>
        )}

      </main>
    </div>
  );
}