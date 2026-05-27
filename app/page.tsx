'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function Home() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchClientes, setSearchClientes] = useState('');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', recordar: false });
  const [section, setSection] = useState('reparaciones');
  const [editingRepair, setEditingRepair] = useState<any | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('megabyte_theme') !== 'light';
    }
    return true;
  });
  const [form, setForm] = useState({
    cliente: '', tipo: '', modelo: '', falla: '',
    telefono: '', contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '',
  });
  const [config, setConfig] = useState<any>({
    nombre_negocio: 'MegaByte', direccion: '', telefono: '', logo_url: '',
  });
  const [configGuardando, setConfigGuardando] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
      else {
        const recordar = localStorage.getItem('megabyte_recordar');
        if (!recordar) await supabase.auth.signOut();
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Cargar reparaciones y configuracion ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const loadRepairs = async () => {
      const { data, error } = await supabase
        .from('repairs').select('*').order('id', { ascending: false });
      if (data) setRepairs(data);
      if (error) console.error(error);
    };
    const loadConfig = async () => {
      const { data } = await supabase
        .from('configuracion').select('*').eq('user_id', user.id).single();
      if (data) setConfig(data);
    };
    loadRepairs();
    loadConfig();
  }, [user]);

  // ── Login / Logout ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    if (error) { alert('Usuario o contraseña incorrectos'); return; }
    if (data.user) {
      if (loginForm.recordar) localStorage.setItem('megabyte_recordar', 'true');
      else localStorage.removeItem('megabyte_recordar');
      setUser(data.user);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('megabyte_recordar');
    setUser(null);
  };

  const guardarConfig = async () => {
    setConfigGuardando(true);
    const { data: existing } = await supabase
      .from('configuracion').select('id').eq('user_id', user.id).single();
    if (existing) {
      await supabase.from('configuracion').update({
        nombre_negocio: config.nombre_negocio,
        direccion: config.direccion,
        telefono: config.telefono,
        logo_url: config.logo_url,
      }).eq('user_id', user.id);
    } else {
      await supabase.from('configuracion').insert({
        user_id: user.id,
        nombre_negocio: config.nombre_negocio,
        direccion: config.direccion,
        telefono: config.telefono,
        logo_url: config.logo_url,
      });
    }
    setConfigGuardando(false);
    alert('Configuración guardada!');
  };

  const subirLogo = async (file: File) => {
    const ext = file.name.split('.').pop();
    const nombre = `logo-${user.id}.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(nombre, file, { upsert: true });
    if (error) { alert('Error al subir logo: ' + error.message); return; }
    const { data } = supabase.storage.from('logos').getPublicUrl(nombre);
    setConfig({ ...config, logo_url: data.publicUrl });
  };

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('megabyte_theme', next ? 'dark' : 'light');
  };

  // Clases dinámicas según tema
  const t = darkMode ? {
    bg: 'bg-zinc-950', sidebar: 'bg-zinc-900 border-zinc-800', card: 'bg-zinc-900 border-zinc-800',
    input: 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-green-500',
    text: 'text-white', subtext: 'text-zinc-500', muted: 'text-zinc-400',
    row: 'border-zinc-800 hover:bg-zinc-800/40', navHover: 'hover:text-white hover:bg-zinc-800',
    navActive: 'bg-green-500 text-black', divider: 'border-zinc-800',
    modal: 'bg-zinc-900 border-zinc-800', menuBg: 'bg-zinc-800 border-zinc-700',
    menuItem: 'hover:bg-zinc-700', badge: 'bg-zinc-800', select: 'bg-zinc-800 border-zinc-700 text-white',
    tableHead: 'text-zinc-500',
  } : {
    bg: 'bg-gray-100', sidebar: 'bg-white border-gray-200', card: 'bg-white border-gray-200',
    input: 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500',
    text: 'text-gray-900', subtext: 'text-gray-500', muted: 'text-gray-500',
    row: 'border-gray-200 hover:bg-gray-50', navHover: 'hover:text-gray-900 hover:bg-gray-100',
    navActive: 'bg-green-500 text-black', divider: 'border-gray-200',
    modal: 'bg-white border-gray-200', menuBg: 'bg-white border-gray-200',
    menuItem: 'hover:bg-gray-100', badge: 'bg-gray-100', select: 'bg-gray-50 border-gray-300 text-gray-900',
    tableHead: 'text-gray-500',
  };

  // ── TICKET HTML para impresora térmica 80mm ──────────────────────────────
  const generatePDF = (repair: any) => {
    const nombre = config.nombre_negocio || 'MegaByte';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Ticket ${repair.orden}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            width: 72mm;
            padding: 3mm 4mm;
            color: #000;
          }
          .titulo { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 2px; letter-spacing: 1px; }
          .subtitulo { font-size: 11px; text-align: center; margin-bottom: 1px; }
          .linea { border-top: 1.5px solid #000; margin: 5px 0; }
          .fila { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
          .label { font-weight: bold; }
          .bloque { margin-bottom: 3px; }
          .legal { font-size: 10px; text-align: left; margin-top: 4px; line-height: 1.4; }
          .footer { text-align: center; font-size: 11px; margin-top: 3px; font-weight: bold; }
          @media print {
            body { width: 72mm; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        ${config.logo_url ? `<div style="text-align:center;margin-bottom:4px"><img src="${config.logo_url}" style="max-width:50mm;max-height:20mm;object-fit:contain"/></div>` : `<div class="titulo">${nombre}</div>`}
        ${config.direccion ? `<div class="subtitulo">${config.direccion}</div>` : ''}
        ${config.telefono ? `<div class="subtitulo">Tel: ${config.telefono}</div>` : ''}
        <div class="linea"></div>

        <div class="bloque">
          <div class="fila"><span class="label">Orden:</span><span>${repair.orden}</span></div>
          <div class="fila"><span class="label">Cliente:</span><span>${repair.cliente}</span></div>
          <div class="fila"><span class="label">Equipo:</span><span>${repair.equipo}</span></div>
          <div class="fila"><span class="label">Teléfono:</span><span>${repair.telefono || '-'}</span></div>
        </div>
        <div class="linea"></div>

        <div class="bloque">
          <div class="label">Falla:</div>
          <div style="margin-top:2px">${repair.falla}</div>
        </div>

        ${repair.trabajo ? `
        <div class="linea"></div>
        <div class="bloque">
          <div class="label">Trabajo realizado:</div>
          <div style="margin-top:2px">${repair.trabajo}</div>
        </div>` : ''}

        <div class="linea"></div>
        <div class="bloque">
          <div class="fila"><span class="label">Costo total:</span><span>$ ${repair.costo || 0}</span></div>
          <div class="fila"><span class="label">Entrega:</span><span>$ ${repair.entrega || 0}</span></div>
          <div class="fila label"><span>Saldo:</span><span>$ ${repair.saldo || 0}</span></div>
        </div>
        <div class="linea"></div>

        <div class="bloque">
          <div class="fila"><span class="label">Estado:</span><span>${repair.estado}</span></div>
          <div class="fila"><span class="label">Fecha:</span><span>${repair.fecha}</span></div>
        </div>
        <div class="linea"></div>

        <div class="footer">Gracias por confiar en ${nombre}</div>
        <div class="footer">Conserve este comprobante</div>
        <div class="linea"></div>
        <div class="legal">Pasados los 90 dias la empresa no se responsabiliza por los equipos y se tomaran como abandono, pudiendo disponer de los mismos como forma de pago por el servicio brindado.</div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;
    const ventana = window.open('', '_blank', 'width=400,height=600');
    if (ventana) { ventana.document.write(html); ventana.document.close(); }
  };

  // ── TICKET INTERNO 80x45mm ────────────────────────────────────────────────
  const generateTicketInterno = (repair: any) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Interno ${repair.orden}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            width: 72mm;
            padding: 2mm 4mm;
            color: #000;
          }
          .linea { border-top: 1.5px solid #000; margin: 4px 0; }
          .orden { font-size: 26px; font-weight: 900; text-align: center; letter-spacing: 2px; margin: 4px 0; }
          .fila { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 12px; }
          .label { font-weight: bold; }
          .falla-label { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
          @media print {
            body { width: 72mm; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="linea"></div>
        <div class="orden">${repair.orden}</div>
        <div class="linea"></div>
        <div class="fila"><span class="label">Cliente:</span><span>${repair.cliente}</span></div>
        <div class="fila"><span class="label">Tel:</span><span>${repair.telefono || '-'}</span></div>
        <div class="linea"></div>
        <div class="falla-label">Falla:</div>
        <div style="font-size:11px">${repair.falla}</div>
        <div class="linea"></div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;
    const ventana = window.open('', '_blank', 'width=380,height=300');
    if (ventana) { ventana.document.write(html); ventana.document.close(); }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addRepair = async () => {
    if (!form.cliente) { alert('Falta cliente'); return; }
    const costo = Number(form.costo || 0);
    const entrega = Number(form.entrega || 0);
    const saldo = costo - entrega;

    if (editingRepair) {
      const { error } = await supabase.from('repairs').update({
        cliente: form.cliente, equipo: `${form.tipo} - ${form.modelo}`,
        falla: form.falla, telefono: form.telefono,
        contrasena: form.contrasena, trabajo: form.trabajo,
        costo, entrega, saldo,
      }).eq('id', editingRepair.id);

      if (!error) {
        setRepairs(repairs.map((r) => r.id === editingRepair.id
          ? { ...r, cliente: form.cliente, equipo: `${form.tipo} - ${form.modelo}`, falla: form.falla, telefono: form.telefono, contrasena: form.contrasena, trabajo: form.trabajo, costo, entrega, saldo }
          : r));
      }
    } else {
      const numeroOrden = repairs.length + 1;
      const nuevoRepair = {
        orden: `#${numeroOrden.toString().padStart(4, '0')}`,
        cliente: form.cliente, equipo: `${form.tipo} - ${form.modelo}`,
        falla: form.falla, telefono: form.telefono,
        contrasena: form.contrasena, trabajo: form.trabajo,
        costo, entrega, saldo, estado: 'Pendiente',
        fecha: new Date().toLocaleString('es-UY', {
          hour12: false, day: '2-digit', month: '2-digit',
          year: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
      };
      const { data, error } = await supabase.from('repairs').insert([nuevoRepair]).select();
      if (error) { console.error(error); alert(error.message); return; }
      if (data) setRepairs([data[0], ...repairs]);
    }

    setForm({ cliente: '', tipo: '', modelo: '', falla: '', telefono: '', contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '' });
    setEditingRepair(null);
    setShowModal(false);
  };

  const deleteRepair = async (id: number) => {
    if (!confirm('¿Eliminar esta orden?')) return;
    const { error } = await supabase.from('repairs').delete().eq('id', id);
    if (!error) setRepairs(repairs.filter((r) => r.id !== id));
  };

  const editRepair = (repair: any) => {
    const partes = repair.equipo.split(' - ');
    setForm({
      cliente: repair.cliente || '', tipo: partes[0] || '', modelo: partes[1] || '',
      falla: repair.falla || '', telefono: repair.telefono || '',
      contrasena: repair.contrasena || '', trabajo: repair.trabajo || '',
      costo: String(repair.costo || ''), entrega: String(repair.entrega || ''), saldo: String(repair.saldo || ''),
    });
    setEditingRepair(repair);
    setShowModal(true);
  };

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const totalCobrado = repairs.reduce((acc, r) => acc + Number(r.entrega || 0), 0);
  const totalPendiente = repairs.reduce((acc, r) => acc + Number(r.saldo || 0), 0);
  const totalTrabajos = repairs.reduce((acc, r) => acc + Number(r.costo || 0), 0);
  const promedio = repairs.length > 0 ? Math.round(totalTrabajos / repairs.length) : 0;

  const equiposCount: any = {};
  repairs.forEach((r) => { equiposCount[r.equipo] = (equiposCount[r.equipo] || 0) + 1; });
  const equipoTop = Object.keys(equiposCount).sort((a, b) => equiposCount[b] - equiposCount[a])[0] || 'Sin datos';

  const clientesCount: any = {};
  repairs.forEach((r) => { clientesCount[r.cliente] = (clientesCount[r.cliente] || 0) + Number(r.costo || 0); });
  const clienteVIP = Object.keys(clientesCount).sort((a, b) => clientesCount[b] - clientesCount[a])[0] || 'Sin datos';

  const getNivelCliente = (cantidad: number) => {
    if (cantidad >= 5) return { texto: 'VIP ⭐', color: 'text-yellow-400' };
    if (cantidad >= 3) return { texto: 'Frecuente', color: 'text-blue-400' };
    return { texto: 'Normal', color: 'text-zinc-400' };
  };

  const estadoColor: any = {
    'Pendiente': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'En reparación': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'Esperando repuesto': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'Entregado': 'bg-green-500/20 text-green-400 border border-green-500/30',
  };

  const estadoSelectColor: any = {
    'Pendiente': 'bg-yellow-500 text-black',
    'En reparación': 'bg-blue-500 text-white',
    'Esperando repuesto': 'bg-orange-500 text-white',
    'Entregado': 'bg-green-600 text-white',
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-4">
              <span className="text-3xl">🔧</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MegaByte</h1>
            <p className="text-zinc-500 text-sm mt-1">Sistema de gestión técnica</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1 block">Correo electrónico</label>
              <input type="email" placeholder="admin@megabyte.com" value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1 block">Contraseña</label>
              <input type="password" placeholder="••••••••" value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={loginForm.recordar}
                onChange={(e) => setLoginForm({ ...loginForm, recordar: e.target.checked })}
                className="accent-green-500 w-4 h-4" />
              Mantener sesión iniciada
            </label>
            <button onClick={handleLogin}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-colors text-sm mt-2">
              Ingresar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'reparaciones', label: 'Reparaciones', icon: '🔧' },
    { id: 'finanzas', label: 'Finanzas', icon: '💰' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
  ];

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex`}>

      {/* Sidebar */}
      <aside className={`w-64 ${t.sidebar} border-r flex flex-col p-5 shrink-0`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-lg shrink-0">🔧</div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">MegaByte</h1>
            <p className="text-xs text-zinc-500">Sistema técnico</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                section === item.id
                  ? t.navActive
                  : `${t.muted} ${t.navHover}`
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`border-t ${t.divider} pt-4 mt-4`}>
          <div className="px-3 py-2 mb-2">
            <p className={`text-xs ${t.subtext}`}>Conectado como</p>
            <p className={`text-xs ${t.muted} font-medium truncate`}>{user.email}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">

        {/* ── Dashboard ── */}
        {section === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${t.text}`}>Dashboard</h1>
              <p className={`${t.subtext} text-sm mt-1`}>Resumen general del taller</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total reparaciones', value: repairs.length, color: 'text-green-400', icon: '🔧' },
                { label: 'Pendientes', value: repairs.filter(r => r.estado === 'Pendiente').length, color: 'text-yellow-400', icon: '⏳' },
                { label: 'En reparación', value: repairs.filter(r => r.estado === 'En reparación').length, color: 'text-blue-400', icon: '⚙️' },
                { label: 'Entregados', value: repairs.filter(r => r.estado === 'Entregado').length, color: 'text-green-500', icon: '✅' },
              ].map((stat) => (
                <div key={stat.label} className={`${t.card} border rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs ${t.subtext} font-medium`}>{stat.label}</p>
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { label: 'Facturación total', value: `$ ${totalTrabajos}`, color: 'text-blue-400', icon: '💵' },
                { label: 'Cobrado', value: `$ ${totalCobrado}`, color: 'text-green-400', icon: '✅' },
                { label: 'Saldo pendiente', value: `$ ${totalPendiente}`, color: 'text-red-400', icon: '⏳' },
                { label: 'Promedio por reparación', value: `$ ${promedio}`, color: 'text-purple-400', icon: '📈' },
                { label: 'Equipo más reparado', value: equipoTop, color: 'text-green-400', icon: '📱', small: true },
                { label: 'Cliente VIP', value: clienteVIP, color: 'text-yellow-400', icon: '⭐', small: true },
              ].map((stat) => (
                <div key={stat.label} className={`${t.card} border rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs ${t.subtext} font-medium`}>{stat.label}</p>
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                  <p className={`font-bold ${stat.color} ${stat.small ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Finanzas ── */}
        {section === 'finanzas' && (
          <div>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${t.text}`}>Finanzas</h1>
              <p className={`${t.subtext} text-sm mt-1`}>Estado financiero del taller</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Reparaciones totales', value: repairs.length, color: 'text-green-400', icon: '🔧' },
                { label: 'Pendientes', value: repairs.filter(r => r.estado === 'Pendiente').length, color: 'text-yellow-400', icon: '⏳' },
                { label: 'Entregados', value: repairs.filter(r => r.estado === 'Entregado').length, color: 'text-green-500', icon: '✅' },
                { label: 'Facturación total', value: `$ ${totalTrabajos}`, color: 'text-blue-400', icon: '💵' },
                { label: 'Total cobrado', value: `$ ${totalCobrado}`, color: 'text-green-400', icon: '💳' },
                { label: 'Saldo pendiente', value: `$ ${totalPendiente}`, color: 'text-red-400', icon: '⚠️' },
                { label: 'Promedio por reparación', value: `$ ${promedio}`, color: 'text-purple-400', icon: '📈' },
                { label: 'Equipo más reparado', value: equipoTop, color: 'text-green-400', icon: '📱', small: true },
                { label: 'Cliente VIP', value: clienteVIP, color: 'text-yellow-400', icon: '⭐', small: true },
              ].map((stat) => (
                <div key={stat.label} className={`${t.card} border rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs ${t.subtext} font-medium`}>{stat.label}</p>
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                  <p className={`font-bold ${stat.color} ${stat.small ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Clientes ── */}
        {section === 'clientes' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className={`text-2xl font-bold ${t.text}`}>Clientes</h1>
                <p className={`${t.subtext} text-sm mt-1`}>Directorio de clientes</p>
              </div>
            </div>
            <div className={`${t.card} border rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${t.divider}`}>
                <input type="text" placeholder="🔍  Buscar por nombre o teléfono..."
                  value={searchClientes} onChange={(e) => setSearchClientes(e.target.value)}
                  className={`border ${t.input} p-3 rounded-xl w-full outline-none transition-colors text-sm`} />
              </div>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${t.divider}`}>
                    {['Cliente', 'Teléfono', 'Reparaciones', 'Total gastado', 'Nivel', 'Historial', 'WhatsApp', 'Nueva orden'].map(h => (
                      <th key={h} className={`text-left p-4 text-xs ${t.tableHead} font-medium uppercase tracking-wider`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(
                    repairs.reduce((acc: any, repair: any) => {
                      if (!acc[repair.telefono]) {
                        acc[repair.telefono] = { cliente: repair.cliente, telefono: repair.telefono, cantidad: 0, total: 0 };
                      }
                      acc[repair.telefono].cantidad += 1;
                      acc[repair.telefono].total += Number(repair.costo || 0);
                      return acc;
                    }, {})
                  ).filter((cliente: any) =>
                    cliente.cliente.toLowerCase().includes(searchClientes.toLowerCase()) ||
                    cliente.telefono.includes(searchClientes)
                  ).map((cliente: any, index: number) => (
                    <tr key={index} className={`border-t ${t.row} transition-colors`}>
                      <td className={`p-4 font-medium ${t.text}`}>{cliente.cliente}</td>
                      <td className={`p-4 ${t.muted}`}>{cliente.telefono?.replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')}</td>
                      <td className="p-4">
                        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-lg text-sm font-bold">
                          {cliente.cantidad}
                        </span>
                      </td>
                      <td className="p-4 text-blue-400 font-bold">$ {cliente.total}</td>
                      <td className={`p-4 font-bold text-sm ${getNivelCliente(cliente.cantidad).color}`}>
                        {getNivelCliente(cliente.cantidad).texto}
                      </td>
                      <td className="p-4">
                        <button onClick={() => {
                          const historial = repairs.filter((r: any) => r.telefono === cliente.telefono);
                          let texto = `Historial de ${cliente.cliente}\n\n`;
                          historial.forEach((r: any) => {
                            texto += `• ${r.equipo}\nEstado: ${r.estado}\nCosto: $${r.costo}\nFecha: ${r.fecha}\n\n`;
                          });
                          alert(texto);
                        }} className={`${t.badge} hover:bg-zinc-600 px-3 py-1.5 rounded-lg text-sm transition-colors ${t.muted}`}>
                          Ver historial
                        </button>
                      </td>
                      <td className="p-4">
                        <a href={`https://wa.me/598${cliente.telefono.replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          className="bg-green-500 hover:bg-green-400 px-3 py-1.5 rounded-lg text-black text-sm font-bold transition-colors">
                          WhatsApp
                        </a>
                      </td>
                      <td className="p-4">
                        <button onClick={() => {
                          setEditingRepair(null);
                          setForm({ cliente: cliente.cliente, tipo: '', modelo: '', falla: '', telefono: cliente.telefono, contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '' });
                          setSection('reparaciones');
                          setShowModal(true);
                        }} className="bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-lg text-white text-sm font-bold transition-colors whitespace-nowrap">
                          + Orden
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Configuración ── */}
        {section === 'configuracion' && (
          <div>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${t.text}`}>Configuración</h1>
              <p className={`${t.subtext} text-sm mt-1`}>Personalizá tu negocio</p>
            </div>
            <div className="flex flex-col gap-5 max-w-lg">

              {/* Apariencia */}
              <div className={`${t.card} border rounded-2xl p-6`}>
                <h2 className={`text-base font-semibold ${t.text} mb-1`}>Apariencia</h2>
                <p className={`text-sm ${t.subtext} mb-5`}>Cambiá el tema visual de la aplicación</p>
                <div className={`flex items-center justify-between p-4 rounded-xl border ${t.divider} ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
                    <div>
                      <p className={`text-sm font-medium ${t.text}`}>{darkMode ? 'Tema oscuro' : 'Tema claro'}</p>
                      <p className={`text-xs ${t.subtext}`}>{darkMode ? 'Fondo oscuro, ideal para poca luz' : 'Fondo claro, ideal para el día'}</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Datos del negocio */}
              <div className={`${t.card} border rounded-2xl p-6`}>
                <h2 className={`text-base font-semibold ${t.text} mb-1`}>Datos del negocio</h2>
                <p className={`text-sm ${t.subtext} mb-5`}>Se muestran en el ticket de impresión</p>

                {/* Logo */}
                <div className="mb-5">
                  <label className={`text-xs ${t.subtext} font-medium mb-2 block`}>LOGO DEL NEGOCIO</label>
                  {config.logo_url && (
                    <div className={`mb-3 p-3 ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'} rounded-xl inline-block`}>
                      <img src={config.logo_url} alt="Logo" className="max-h-20 max-w-full object-contain" />
                    </div>
                  )}
                  <input type="file" accept="image/*"
                    onChange={(e) => { if (e.target.files?.[0]) subirLogo(e.target.files[0]); }}
                    className={`w-full border ${t.input} p-3 rounded-xl text-sm file:mr-3 file:bg-green-500 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-black file:font-bold file:cursor-pointer`} />
                  <p className={`text-xs ${t.subtext} mt-1`}>PNG, JPG. Se mostrará en el ticket de impresión.</p>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>NOMBRE DEL NEGOCIO</label>
                    <input value={config.nombre_negocio || ''} onChange={e => setConfig({...config, nombre_negocio: e.target.value})}
                      placeholder="Ej: MegaByte"
                      className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                  </div>
                  <div>
                    <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>DIRECCIÓN</label>
                    <input value={config.direccion || ''} onChange={e => setConfig({...config, direccion: e.target.value})}
                      placeholder="Ej: Gral. Flores 287"
                      className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                  </div>
                  <div>
                    <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>TELÉFONO</label>
                    <input value={config.telefono || ''} onChange={e => setConfig({...config, telefono: e.target.value})}
                      placeholder="Ej: 099 347 478"
                      className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                  </div>
                </div>

                <button onClick={guardarConfig} disabled={configGuardando}
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-colors text-sm">
                  {configGuardando ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Reparaciones ── */}
        {section === 'reparaciones' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className={`text-2xl font-bold ${t.text}`}>Reparaciones</h1>
                <p className={`${t.subtext} text-sm mt-1`}>{repairs.length} órdenes en total</p>
              </div>
              <button onClick={() => {
                setEditingRepair(null);
                setForm({ cliente: '', tipo: '', modelo: '', falla: '', telefono: '', contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '' });
                setShowModal(true);
              }} className="bg-green-500 hover:bg-green-400 text-black px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
                + Nueva Orden
              </button>
            </div>

            <div className={`${t.card} border rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${t.divider}`}>
                <input type="text" placeholder="🔍  Buscar por cliente, equipo o número de orden..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className={`border ${t.input} p-3 rounded-xl w-full outline-none transition-colors text-sm`} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${t.divider}`}>
                      {['Orden', 'Cliente', 'Equipo', 'Falla', 'Costo', 'Entrega', 'Saldo', 'Fecha', 'Estado', ''].map(h => (
                        <th key={h} className={`text-left p-4 text-xs ${t.tableHead} font-medium uppercase tracking-wider whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {repairs
                      .filter((repair: any) =>
                        repair.cliente.toLowerCase().includes(search.toLowerCase()) ||
                        repair.equipo.toLowerCase().includes(search.toLowerCase()) ||
                        String(repair.orden).replace('#', '').includes(search)
                      )
                      .map((repair: any, index: number) => (
                        <tr key={index} className={`border-t ${t.row} transition-colors`}>
                          <td className="p-4 font-bold text-green-400 whitespace-nowrap">{repair.orden}</td>
                          <td className={`p-4 font-medium ${t.text} whitespace-nowrap`}>{repair.cliente}</td>
                          <td className={`p-4 ${darkMode ? 'text-zinc-300' : 'text-gray-600'} whitespace-nowrap`}>{repair.equipo}</td>
                          <td className={`p-4 ${t.muted} max-w-[160px] truncate`}>{repair.falla}</td>
                          <td className="p-4 text-blue-400 font-semibold whitespace-nowrap">$ {repair.costo || 0}</td>
                          <td className="p-4 text-green-400 font-semibold whitespace-nowrap">$ {repair.entrega || 0}</td>
                          <td className="p-4 text-yellow-400 font-semibold whitespace-nowrap">$ {repair.saldo || 0}</td>
                          <td className={`p-4 ${t.subtext} text-sm whitespace-nowrap`}>{repair.fecha}</td>
                          <td className="p-4">
                            <select value={repair.estado}
                              onChange={async (e) => {
                                const nuevoEstado = e.target.value;
                                await supabase.from('repairs').update({ estado: nuevoEstado }).eq('id', repair.id);
                                setRepairs(repairs.map((r: any) => r.id === repair.id ? { ...r, estado: nuevoEstado } : r));

                                let mensaje = '';
                                if (nuevoEstado === 'En reparación')
                                  mensaje = `Hola ${repair.cliente} 👋%0A%0ATu equipo ${repair.equipo} ya ingresó a reparación en MegaByte 🔧`;
                                else if (nuevoEstado === 'Esperando repuesto')
                                  mensaje = `Hola ${repair.cliente} 👋%0A%0ATu equipo ${repair.equipo} está esperando repuesto 📦`;
                                else if (nuevoEstado === 'Entregado')
                                  mensaje = `Hola ${repair.cliente} 👋%0A%0ATu equipo ${repair.equipo} ya está pronto para retirar ✅%0A%0ASaldo pendiente: $${repair.saldo || 0}%0A%0AGracias por confiar en MegaByte`;

                                if (mensaje) {
                                  const numero = repair.telefono?.replace(/\D/g, '')?.replace(/^0/, '');
                                  window.open(`https://wa.me/598${numero}?text=${mensaje}`, '_blank');
                                }
                              }}
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold border-0 outline-none cursor-pointer ${estadoSelectColor[repair.estado] || 'bg-zinc-700 text-white'}`}>
                              <option>Pendiente</option>
                              <option>En reparación</option>
                              <option>Esperando repuesto</option>
                              <option>Entregado</option>
                            </select>
                          </td>
                          <td className="p-4 relative">
                            {openMenu === repair.id && (
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                            )}
                            <button onClick={(e) => {
                              if (openMenu === repair.id) { setOpenMenu(null); return; }
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const menuH = 210;
                              const menuW = 160;
                              const top = rect.bottom + menuH > window.innerHeight ? rect.top - menuH : rect.bottom + 4;
                              const left = Math.min(rect.right - menuW, window.innerWidth - menuW - 8);
                              setMenuPos({ top, left });
                              setOpenMenu(repair.id);
                            }} className={`${t.badge} hover:bg-zinc-600 w-8 h-8 rounded-lg text-sm font-bold transition-colors ${t.muted}`}>⋮</button>
                            {openMenu === repair.id && (
                              <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
                                className={`${t.menuBg} border rounded-xl shadow-2xl w-40 overflow-hidden`}>
                                <button onClick={() => { generatePDF(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>📄 Ticket cliente</button>
                                <button onClick={() => { generateTicketInterno(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>🏷️ Ticket interno</button>
                                <button onClick={() => { editRepair(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>✏️ Editar</button>
                                <a href={`https://wa.me/598${repair.telefono.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" onClick={() => setOpenMenu(null)} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 block ${t.text}`}>💬 WhatsApp</a>
                                <button onClick={() => { deleteRepair(repair.id); setOpenMenu(null); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-2">🗑️ Eliminar</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className={`${t.modal} border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto`}>
                  <div className={`flex items-center justify-between p-6 border-b ${t.divider}`}>
                    <h2 className={`text-xl font-bold ${t.text}`}>
                      {editingRepair ? '✏️ Editar Orden' : '➕ Nueva Orden'}
                    </h2>
                    <button onClick={() => setShowModal(false)} className={`${t.subtext} hover:${t.text} text-xl transition-colors`}>✕</button>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'cliente', label: 'Cliente', placeholder: 'Nombre del cliente' },
                        { key: 'modelo', label: 'Modelo', placeholder: 'Ej: iPhone 13, Lenovo V15' },
                        { key: 'falla', label: 'Falla', placeholder: 'Descripción del problema' },
                        { key: 'contrasena', label: 'Contraseña', placeholder: 'Contraseña del equipo' },
                        { key: 'costo', label: 'Costo total ($)', placeholder: '0' },
                        { key: 'entrega', label: 'Entrega ($)', placeholder: '0' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>{label}</label>
                          <input placeholder={placeholder} value={(form as any)[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                        </div>
                      ))}
                      <div>
                        <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Teléfono</label>
                        <input placeholder="09X XXX XXX" value={form.telefono}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            const formatted = digits.replace(/(\d{3})(?=\d)/g, '$1 ');
                            setForm({ ...form, telefono: formatted });
                          }}
                          className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                      </div>
                      <div>
                        <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Tipo de equipo</label>
                        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                          className={`w-full border ${t.select} p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm`}>
                          <option value="">Seleccionar tipo</option>
                          <option value="Celular">Celular</option>
                          <option value="Notebook">Notebook</option>
                          <option value="Tablet">Tablet</option>
                          <option value="PC">PC</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Trabajo realizado</label>
                      <textarea placeholder="Descripción detallada del trabajo..." value={form.trabajo}
                        onChange={(e) => setForm({ ...form, trabajo: e.target.value })}
                        className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm min-h-[100px] resize-none`} />
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button onClick={addRepair}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-colors text-sm">
                        {editingRepair ? 'Guardar cambios' : 'Crear orden'}
                      </button>
                      <button onClick={() => setShowModal(false)}
                        className={`px-6 ${t.badge} hover:bg-zinc-700 ${t.text} font-bold py-3 rounded-xl transition-colors text-sm`}>
                        Cancelar
                      </button>
                    </div>
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
