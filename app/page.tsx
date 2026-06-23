'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export default function Home() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchClientes, setSearchClientes] = useState('');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState(() => {
    if (typeof window === 'undefined') return { email: '', password: '', recordar: false };
    const recordar = localStorage.getItem('megabyte_recordar') === 'true';
    const email = recordar ? (localStorage.getItem('megabyte_email') || '') : '';
    const password = recordar ? (localStorage.getItem('megabyte_password') || '') : '';
    return { email, password, recordar };
  });
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
    garantia: '', garantiaCustom: '',
  });
  const [config, setConfig] = useState<any>({
    nombre_negocio: 'MegaByte', direccion: '', telefono: '', logo_url: '',
    msg_en_reparacion: 'Hola {cliente} \u{1F44B}\n\nTu equipo {equipo} ya ingresó a reparación en MegaByte \u{1F527}',
    msg_reparado: 'Hola {cliente} \u{1F44B}\n\nTu equipo {equipo} ya está reparado y listo para retirar \u2705',
    msg_entregado: 'Hola {cliente} \u{1F44B}\n\nTu equipo {equipo} ya está pronto para retirar \u2705\n\nSaldo pendiente: ${saldo}\n\nGracias por confiar en MegaByte',
    switch_en_reparacion: true, switch_reparado: true, switch_entregado: true,
  });
  const [configGuardando, setConfigGuardando] = useState(false);
  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [showAdminModal, setShowAdminModal] = useState<any | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFiltro, setAdminFiltro] = useState('todos');
  const [adminOrden, setAdminOrden] = useState('vencimiento');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalEntrega, setModalEntrega] = useState<any | null>(null);
  const [entregaForm, setEntregaForm] = useState({ costo: '', entrega: '', garantia: '', garantiaCustom: '', seReparo: true });
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showRegistro, setShowRegistro] = useState(false);
  // ── Punto de ventas ──────────────────────────────────────────────────────
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busquedaPdv, setBusquedaPdv] = useState('');
  const [showAddProducto, setShowAddProducto] = useState(false);
  const [productoForm, setProductoForm] = useState({ nombre: '', precio: '', stock: '', codigo_barras: '' });
  const [formaPagoPdv, setFormaPagoPdv] = useState('Efectivo');
  const [ticketVenta, setTicketVenta] = useState<any | null>(null);
  const [editingProducto, setEditingProducto] = useState<any | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [nuevaPasswordConfirm, setNuevaPasswordConfirm] = useState('');
  const [showRecuperar, setShowRecuperar] = useState(false);
  const [recuperarEmail, setRecuperarEmail] = useState('');
  const [recuperarEnviado, setRecuperarEnviado] = useState(false);
  const [registroForm, setRegistroForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [registrando, setRegistrando] = useState(false);
  const [suscripcionActual, setSuscripcionActual] = useState<any | null>(null);
  const [accesoVerificado, setAccesoVerificado] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any | null>(null);
  const [editClienteForm, setEditClienteForm] = useState({ cliente: '', telefono: '' });

  // ── Estado calculadoras ───────────────────────────────────────────────────
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpr, setCalcExpr] = useState('');
  const [calcVal, setCalcVal] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOper, setCalcOper] = useState<string | null>(null);
  const [calcNewNum, setCalcNewNum] = useState(false);
  const [pCosto, setPCosto] = useState('');
  const [pMano, setPMano] = useState('');
  const [pGanancia, setPGanancia] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('calc_ganancia') || '30') : '30');
  const [pDescuento, setPDescuento] = useState('');
  const [pEntrega, setPEntrega] = useState('');
  const [ivaBase, setIvaBase] = useState('');
  const [ivaFinal, setIvaFinal] = useState('');
  const [ivaPais, setIvaPais] = useState('22');
  const [ivaCustom, setIvaCustom] = useState('');
  const [calcFocused, setCalcFocused] = useState(false);
  const calcValRef = useRef('0');

  // ── Detectar reset de contraseña ─────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setShowNuevaPassword(true);
      setShowLanding(false);
    }
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };
    checkUser();
    const storedToken = localStorage.getItem('megabyte_session_token');
    if (storedToken) setSessionToken(storedToken);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowNuevaPassword(true);
        setShowLanding(false);
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Verificar sesión activa cada 30 segundos ──────────────────────────────
  useEffect(() => {
    if (!user || !sessionToken) return;
    if (localStorage.getItem('megabyte_is_admin') === 'true') return;
    const verificarSesion = async () => {
      if (localStorage.getItem('megabyte_is_admin') === 'true') return;
      const { data } = await supabase.from('sesiones_activas')
        .select('session_token').eq('user_id', user.id);
      const tokens = (data || []).map((s: any) => s.session_token);
      if (tokens.length > 0 && !tokens.includes(sessionToken)) {
        alert('Tu sesión fue cerrada porque se alcanzó el límite de dispositivos conectados.');
        await supabase.auth.signOut();
        localStorage.removeItem('megabyte_recordar');
        localStorage.removeItem('megabyte_session_token');
        setUser(null);
        setSessionToken(null);
      }
    };
    verificarSesion();
    const interval = setInterval(verificarSesion, 30000);
    return () => clearInterval(interval);
  }, [user, sessionToken]);

  // ── Cargar reparaciones y configuracion ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const loadRepairs = async () => {
      const { data, error } = await supabase
        .from('repairs').select('*').order('id', { ascending: false });
      if (data) setRepairs(data);
      if (error) console.error(error);
    };
    const loadClientes = async () => {
      const { data, error } = await supabase
        .from('clientes').select('*').order('id', { ascending: false });
      if (data) setClientes(data);
      if (error) console.error(error);
    };
    const loadConfig = async () => {
      const { data } = await supabase
        .from('configuracion').select('*').eq('user_id', user.id).single();
      if (data) {
        setConfig(data);
        if (data.is_admin) {
          cargarSuscripciones();
          localStorage.setItem('megabyte_is_admin', 'true');
        } else {
          localStorage.removeItem('megabyte_is_admin');
        }
      }
    };
    loadRepairs();
    loadClientes();
    loadConfig();
    const loadProductos = async () => {
      const { data } = await supabase.from('productos').select('*').order('nombre');
      if (data) setProductos(data);
    };
    loadProductos();
    // Verificar suscripcion del usuario
    const verificarAcceso = async () => {
      const { data } = await supabase.from('suscripciones')
        .select('*').eq('email', user.email).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setSuscripcionActual(data || null);
      setAccesoVerificado(true);
    };
    verificarAcceso();
  }, [user]);

  // ── Login / Logout ────────────────────────────────────────────────────────
  const handleRegistro = async () => {
    if (!registroForm.nombre.trim()) { alert('Ingresá el nombre de tu taller'); return; }
    if (!registroForm.email.trim()) { alert('Ingresá tu email'); return; }
    if (registroForm.password.length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return; }
    if (registroForm.password !== registroForm.confirmar) { alert('Las contraseñas no coinciden'); return; }
    setRegistrando(true);
    const { data, error } = await supabase.auth.signUp({
      email: registroForm.email,
      password: registroForm.password,
    });
    if (error) { alert('Error: ' + error.message); setRegistrando(false); return; }
    if (data.user) {
      // Verificar si ya existe antes de insertar
      const { data: existente } = await supabase.from('suscripciones')
        .select('id').eq('email', registroForm.email).maybeSingle();
      if (!existente) {
        await supabase.from('suscripciones').insert({
          user_id: data.user.id,
          email: registroForm.email,
          nombre_taller: registroForm.nombre,
          plan: 'basic',
          estado: 'trial',
          // fecha_vencimiento se calcula en Supabase: CURRENT_DATE + 5 days
        });
      }
      try {
        await supabase.functions.invoke('Bienvenida', {
          body: { email: registroForm.email, nombre_taller: registroForm.nombre },
        });
      } catch (e) { console.error('Email bienvenida error:', e); }
      alert('✅ Cuenta creada. Tenés 5 días de prueba gratis. ¡Bienvenido!');
      setShowRegistro(false);
      setRegistroForm({ nombre: '', email: '', password: '', confirmar: '' });
    }
    setRegistrando(false);
  };

  const handleRecuperar = async () => {
    if (!recuperarEmail.trim()) { alert('Ingresá tu email'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(recuperarEmail, {
      redirectTo: window.location.origin,
    });
    if (error) { alert('Error: ' + error.message); return; }
    setRecuperarEnviado(true);
  };

  const handleNuevaPassword = async () => {
    if (nuevaPassword.length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return; }
    if (nuevaPassword !== nuevaPasswordConfirm) { alert('Las contraseñas no coinciden'); return; }
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) { alert('Error: ' + error.message); return; }
    alert('✅ Contraseña actualizada correctamente');
    setShowNuevaPassword(false);
    setNuevaPassword('');
    setNuevaPasswordConfirm('');
    window.location.hash = '';
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    if (error) { alert('Usuario o contraseña incorrectos'); return; }
    if (data.user) {
      if (loginForm.recordar) {
        localStorage.setItem('megabyte_recordar', 'true');
        localStorage.setItem('megabyte_email', loginForm.email);
        localStorage.setItem('megabyte_password', loginForm.password);
      } else {
        localStorage.removeItem('megabyte_recordar');
        localStorage.removeItem('megabyte_email');
        localStorage.removeItem('megabyte_password');
      }

      // Verificar plan del usuario para definir el límite de sesiones simultáneas
      const { data: configData } = await supabase.from('configuracion')
        .select('is_admin').eq('user_id', data.user.id).single();
      const esAdmin = configData?.is_admin === true;

      let limiteSesiones = 1;
      if (!esAdmin) {
        const { data: subData } = await supabase.from('suscripciones')
          .select('plan').eq('email', data.user.email).order('created_at', { ascending: false }).limit(1).maybeSingle();
        limiteSesiones = subData?.plan === 'pro' ? 3 : 1;
      } else {
        limiteSesiones = 999;
      }

      const token = crypto.randomUUID();

      // Traer sesiones activas actuales del usuario, ordenadas por más reciente
      const { data: sesionesExistentes } = await supabase.from('sesiones_activas')
        .select('id, session_token, updated_at')
        .eq('user_id', data.user.id)
        .order('updated_at', { ascending: false });

      const sesiones = sesionesExistentes || [];
      // Si ya alcanzó el límite, eliminar las más antiguas para dejar lugar a la nueva
      if (sesiones.length >= limiteSesiones) {
        const aEliminar = sesiones.slice(limiteSesiones - 1);
        for (const s of aEliminar) {
          await supabase.from('sesiones_activas').delete().eq('id', s.id);
        }
      }

      await supabase.from('sesiones_activas').insert({
        user_id: data.user.id, session_token: token, updated_at: new Date().toISOString()
      });

      localStorage.setItem('megabyte_session_token', token);
      setSessionToken(token);
      setUser(data.user);
    }
  };

  const handleLogout = async () => {
    if (user && sessionToken) {
      await supabase.from('sesiones_activas').delete()
        .eq('user_id', user.id).eq('session_token', sessionToken);
    }
    await supabase.auth.signOut();
    localStorage.removeItem('megabyte_recordar');
    localStorage.removeItem('megabyte_email');
    localStorage.removeItem('megabyte_password');
    localStorage.removeItem('megabyte_session_token');
    localStorage.removeItem('megabyte_is_admin');
    setUser(null);
    setSessionToken(null);
  };

  const guardarEdicionCliente = async () => {
    if (!editingCliente) return;
    const telOriginal = (editingCliente.telefono || '').replace(/\D/g, '');
    const repsAEditar = repairs.filter((r: any) =>
      r.cliente === editingCliente.cliente &&
      (r.telefono || '').replace(/\D/g, '') === telOriginal
    );
    for (const r of repsAEditar) {
      await supabase.from('repairs')
        .update({ cliente: editClienteForm.cliente, telefono: editClienteForm.telefono || null })
        .eq('id', r.id);
    }
    const { data } = await supabase.from('repairs').select('*').order('id', { ascending: false });
    setRepairs(data || []);

    // Actualizar también la tabla persistente de clientes
    const { data: actualizado, error: errUpdate } = await supabase
      .from('clientes')
      .update({ cliente: editClienteForm.cliente, telefono: editClienteForm.telefono || null })
      .eq('user_id', user.id)
      .eq('cliente', editingCliente.cliente)
      .select();
    if (!errUpdate && (!actualizado || actualizado.length === 0)) {
      // El cliente no existía aún en la tabla persistente (datos viejos): lo creamos
      await supabase.from('clientes').upsert(
        { user_id: user.id, cliente: editClienteForm.cliente, telefono: editClienteForm.telefono || null },
        { onConflict: 'user_id,cliente' }
      );
    }
    const { data: clientesData } = await supabase.from('clientes').select('*').order('id', { ascending: false });
    setClientes(clientesData || []);

    setEditingCliente(null);
  };

  const cargarSuscripciones = async () => {
    const { data } = await supabase.from('suscripciones').select('*').order('created_at', { ascending: false });
    setSuscripciones(data || []);
  };

  const toggleEstado = async (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    await supabase.from('suscripciones').update({ estado: nuevoEstado }).eq('id', id);
    await cargarSuscripciones();
  };

  const guardarSuscripcion = async (sub: any) => {
    if (sub.id) {
      await supabase.from('suscripciones').update({
        nombre_taller: sub.nombre_taller, email: sub.email,
        plan: sub.plan, estado: sub.estado, fecha_vencimiento: sub.fecha_vencimiento,
      }).eq('id', sub.id);
    } else {
      await supabase.from('suscripciones').insert({
        nombre_taller: sub.nombre_taller, email: sub.email,
        plan: sub.plan, estado: sub.estado, fecha_vencimiento: sub.fecha_vencimiento,
      });
    }
    await cargarSuscripciones();
    setShowAdminModal(null);
  };

  const confirmarEntrega = async () => {
    if (!modalEntrega) return;
    const costo = Number(entregaForm.costo || 0);
    const entrega = Number(entregaForm.entrega || 0);
    const saldo = costo - entrega;
    const garantia = entregaForm.garantia === 'otro' ? entregaForm.garantiaCustom : entregaForm.garantia;
    const fecha_entrega = new Date().toLocaleString('es-UY', {
      hour12: false, day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    await supabase.from('repairs').update({
      costo, entrega, saldo, estado: 'Entregado', garantia, fecha_entrega, se_reparo: entregaForm.seReparo,
    }).eq('id', modalEntrega.id);
    const { data } = await supabase.from('repairs').select('*').order('id', { ascending: false });
    setRepairs(data || []);
    generateTicketEntrega({ ...modalEntrega, costo, entrega, saldo, garantia, fecha_entrega });
    setModalEntrega(null);
  };

  const exportarReparacionesPDF = () => {
    const nombre = config.nombre_negocio || 'Mi Taller';
    const fecha = new Date().toLocaleDateString('es-UY');
    const totalCobrado = repairs.reduce((acc: number, r: any) => acc + Number(r.entrega || 0), 0);
    const filas = repairs.map((r: any) => `
      <tr>
        <td>${r.orden || '-'}</td>
        <td>${r.fecha ? r.fecha.split(',')[0] : '-'}</td>
        <td>${r.cliente || '-'}</td>
        <td>${r.equipo || '-'}</td>
        <td>${r.estado || '-'}</td>
        <td>$ ${r.costo || 0}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reparaciones</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}h1{font-size:18px;margin:0 0 4px}.sub{color:#666;font-size:12px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#111;color:white;padding:6px 8px;text-align:left;font-size:10px}td{padding:5px 8px;border-bottom:1px solid #eee}tr:nth-child(even)td{background:#f9f9f9}.res{margin-top:16px;padding:10px;background:#f3f4f6;border-radius:6px;font-size:12px}@media print{@page{margin:15mm}}</style>
      </head><body>
      <h1>${nombre}</h1><div class="sub">Reparaciones exportadas — ${fecha}</div>
      <table><thead><tr><th>Orden</th><th>Fecha</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th>Costo</th></tr></thead>
      <tbody>${filas}</tbody></table>
      <div class="res"><strong>Total:</strong> ${repairs.length} reparaciones &nbsp;|&nbsp; <strong>Cobrado:</strong> $ ${totalCobrado}</div>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
      </body></html>`;
    const v = window.open('', '_blank', 'width=900,height=700');
    if (v) { v.document.write(html); v.document.close(); }
  };

  const exportarClientesPDF = () => {
    const nombre = config.nombre_negocio || 'Mi Taller';
    const fecha = new Date().toLocaleDateString('es-UY');
    const clientesMap: any = {};
    repairs.forEach((r: any) => {
      const key = `${r.cliente}||${r.telefono || ''}`;
      if (!clientesMap[key]) clientesMap[key] = { cliente: r.cliente, telefono: r.telefono, cantidad: 0, total: 0 };
      clientesMap[key].cantidad += 1;
      clientesMap[key].total += Number(r.costo || 0);
    });
    const clientes = Object.values(clientesMap);
    const filas = clientes.map((c: any) => `
      <tr>
        <td>${c.cliente || '-'}</td>
        <td>${(c.telefono || '').replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')}</td>
        <td>${c.cantidad}</td>
        <td>$ ${c.total}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Clientes</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}h1{font-size:18px;margin:0 0 4px}.sub{color:#666;font-size:12px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#111;color:white;padding:6px 8px;text-align:left;font-size:10px}td{padding:5px 8px;border-bottom:1px solid #eee}tr:nth-child(even)td{background:#f9f9f9}.res{margin-top:16px;padding:10px;background:#f3f4f6;border-radius:6px;font-size:12px}@media print{@page{margin:15mm}}</style>
      </head><body>
      <h1>${nombre}</h1><div class="sub">Directorio de clientes — ${fecha}</div>
      <table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Reparaciones</th><th>Total</th></tr></thead>
      <tbody>${filas}</tbody></table>
      <div class="res"><strong>Total clientes:</strong> ${clientes.length}</div>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
      </body></html>`;
    const v = window.open('', '_blank', 'width=900,height=700');
    if (v) { v.document.write(html); v.document.close(); }
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
        msg_en_reparacion: config.msg_en_reparacion,
        msg_reparado: config.msg_reparado,
        msg_entregado: config.msg_entregado,
        switch_en_reparacion: config.switch_en_reparacion,
        switch_reparado: config.switch_reparado,
        switch_entregado: config.switch_entregado,
      }).eq('user_id', user.id);
    } else {
      await supabase.from('configuracion').insert({
        user_id: user.id,
        nombre_negocio: config.nombre_negocio,
        direccion: config.direccion,
        telefono: config.telefono,
        logo_url: config.logo_url,
        msg_en_reparacion: config.msg_en_reparacion,
        msg_reparado: config.msg_reparado,
        msg_entregado: config.msg_entregado,
        switch_en_reparacion: config.switch_en_reparacion,
        switch_reparado: config.switch_reparado,
        switch_entregado: config.switch_entregado,
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
    input: 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 focus:border-green-500',
    text: 'text-white', subtext: 'text-zinc-500', muted: 'text-zinc-400',
    row: 'border-zinc-800 hover:bg-zinc-800/40', navHover: 'hover:text-white hover:bg-zinc-800',
    navActive: 'bg-green-500/10 text-green-400', divider: 'border-zinc-800',
    modal: 'bg-zinc-900 border-zinc-800', menuBg: 'bg-zinc-800 border-zinc-700',
    menuItem: 'hover:bg-zinc-700', badge: 'bg-zinc-800', select: 'bg-zinc-800 border-zinc-700 text-white',
    tableHead: 'text-zinc-500',
  } : {
    bg: 'bg-slate-100', sidebar: 'bg-white border-slate-200', card: 'bg-white border-slate-200',
    input: 'bg-slate-50 border-slate-200 text-gray-900 placeholder-slate-400 focus:border-green-500',
    text: 'text-gray-900', subtext: 'text-slate-400', muted: 'text-slate-500',
    row: 'border-slate-100 hover:bg-slate-50', navHover: 'hover:text-gray-900 hover:bg-slate-100',
    navActive: 'bg-green-500/10 text-green-600', divider: 'border-slate-200',
    modal: 'bg-white border-slate-200', menuBg: 'bg-white border-slate-200',
    menuItem: 'hover:bg-slate-100', badge: 'bg-slate-100', select: 'bg-slate-50 border-slate-200 text-gray-900',
    tableHead: 'text-slate-400',
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

  // ── TICKET ENTREGA 80mm ──────────────────────────────────────────────────
  const generateTicketEntrega = (repair: any) => {
    const nombre = config.nombre_negocio || 'MegaByte';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Entrega ${repair.orden}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            width: 72mm;
            padding: 3mm 4mm;
            color: #000;
            position: relative;
          }
          .titulo { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 2px; letter-spacing: 1px; }
          .subtitulo { font-size: 11px; text-align: center; margin-bottom: 1px; }
          .linea { border-top: 1.5px solid #000; margin: 5px 0; }
          .fila { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
          .label { font-weight: bold; }
          .bloque { margin-bottom: 3px; }
          .footer { text-align: center; font-size: 11px; margin-top: 3px; font-weight: bold; }
          .sello {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            text-align: center;
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 4px;
            padding: 4px 0;
            margin-top: 4px;
          }
          @media print {
            body { width: 72mm; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        
        ${config.logo_url ? `<div style="text-align:center;margin-bottom:4px"><img src="${config.logo_url}" style="max-width:50mm;max-height:20mm;object-fit:contain"/></div>` : `<div class="titulo">${nombre}</div>`}
        ${config.direccion ? `<div class="subtitulo">${config.direccion}</div>` : ""}
        ${config.telefono ? `<div class="subtitulo">Tel: ${config.telefono}</div>` : ""}
        <div class="linea"></div>

        <div class="bloque">
          <div class="fila"><span class="label">Orden:</span><span>${repair.orden}</span></div>
          <div class="fila"><span class="label">Cliente:</span><span>${repair.cliente}</span></div>
          <div class="fila"><span class="label">Equipo:</span><span>${repair.equipo}</span></div>
        </div>
        <div class="linea"></div>

        <div class="bloque">
          <div class="fila"><span class="label">Costo total:</span><span>$ ${repair.costo || 0}</span></div>
        </div>
        <div class="linea"></div>

        <div class="bloque">
          <div class="fila"><span class="label">Entrega:</span><span>${repair.fecha_entrega || repair.fecha}</span></div>
          ${repair.garantia ? `<div class="fila"><span class="label">Garantía:</span><span>${repair.garantia}</span></div>` : ''}
        </div>
        <div class="linea"></div>

        <div class="sello">ENTREGADO</div>
        <div class="footer">Gracias por confiar en ${nombre}</div>

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
      const numerosExistentes = repairs
        .map((r: any) => parseInt((r.orden || '').replace('#', ''), 10))
        .filter((n: number) => !isNaN(n));
      const numeroOrden = numerosExistentes.length > 0 ? Math.max(...numerosExistentes) + 1 : 1;
      const nuevoRepair = {
        orden: `#${numeroOrden.toString().padStart(4, '0')}`,
        cliente: form.cliente, equipo: `${form.tipo} - ${form.modelo}`,
        falla: form.falla, telefono: form.telefono,
        contrasena: form.contrasena, trabajo: form.trabajo,
        costo, entrega, saldo, estado: 'Pendiente',
        user_id: user.id,
        garantia: form.garantia === 'otro' ? form.garantiaCustom : form.garantia,
        fecha: new Date().toLocaleString('es-UY', {
          hour12: false, day: '2-digit', month: '2-digit',
          year: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
      };
      const { data, error } = await supabase.from('repairs').insert([nuevoRepair]).select();
      if (error) { console.error(error); alert(error.message); return; }
      if (data) setRepairs([data[0], ...repairs]);

      // Guardar/actualizar cliente en tabla persistente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .upsert(
          { user_id: user.id, cliente: form.cliente, telefono: form.telefono || null },
          { onConflict: 'user_id,cliente' }
        )
        .select();
      if (!clienteError && clienteData && clienteData[0]) {
        const yaExiste = clientes.some((c: any) => c.id === clienteData[0].id);
        setClientes(yaExiste
          ? clientes.map((c: any) => c.id === clienteData[0].id ? clienteData[0] : c)
          : [clienteData[0], ...clientes]);
      }
    }

    setForm({ cliente: '', tipo: '', modelo: '', falla: '', telefono: '', contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '', garantia: '', garantiaCustom: '' });
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
      garantia: repair.garantia || '', garantiaCustom: '',
      costo: String(repair.costo || ''), entrega: String(repair.entrega || ''), saldo: String(repair.saldo || ''),
    });
    setEditingRepair(repair);
    setShowModal(true);
  };

  // ── Teclado calculadora ─────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'calculadora') return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); document.querySelector<HTMLButtonElement>(`button[data-calc="num:${e.key}"]`)?.click(); }
      else if (e.key === '+') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-calc="op:+"]')?.click(); }
      else if (e.key === '-') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-calc="op:-"]')?.click(); }
      else if (e.key === '*') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-calc="op:*"]')?.click(); }
      else if (e.key === '/') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-calc="op:/"]')?.click(); }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-calc="equals"]')?.click(); }
      else if (e.key === 'Backspace') {
        e.preventDefault();
        const cv = calcValRef.current;
        const nv = cv.length > 1 ? cv.slice(0, -1) : '0';
        calcValRef.current = nv;
        setCalcVal(nv);
        setCalcDisplay(nv === '0' ? '0' : parseFloat(nv).toLocaleString('es-UY', { maximumFractionDigits: 8 }));
      }
      else if (e.key === '.') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-calc="dot"]')?.click(); }
      else if (e.key === '%') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-calc="percent"]')?.click(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [section]);

  // ── Gráficas de finanzas ─────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'finanzas') return;
    const loadCharts = () => {
      if (typeof window === 'undefined') return;
      const win = window as any;
      const renderCharts = () => {
        const Chart = win.Chart;
        if (!Chart) return;
        ['chartMeses','chartEstados','chartEquipos'].forEach(id => {
          const existing = Chart.getChart(id);
          if (existing) existing.destroy();
        });
        const isDark = document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
        const tickColor = isDark ? '#888' : '#aaa';

        const mesesLabelsL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const ing = Array(12).fill(0);
        const cob = Array(12).fill(0);
        repairs.forEach((r: any) => {
          if (r.fecha) {
            const parts = r.fecha.split('/');
            const mes = parts.length === 3 ? parseInt(parts[1]) - 1 : new Date(r.fecha).getMonth();
            if (mes >= 0 && mes < 12) {
              ing[mes] += Number(r.costo || 0);
              cob[mes] += Number(r.entrega || 0);
            }
          }
        });
        const mesesFiltrados = mesesLabelsL.map((l, i) => ({ label: l, facturado: ing[i], cobrado: cob[i] }))
          .filter(m => m.facturado > 0 || m.cobrado > 0);

        const estadosList = [
          { label: 'Pendiente', count: repairs.filter((r: any) => r.estado === 'Pendiente').length, color: '#EF9F27' },
          { label: 'En reparación', count: repairs.filter((r: any) => r.estado === 'En reparación').length, color: '#378ADD' },
          { label: 'Reparado', count: repairs.filter((r: any) => r.estado === 'Reparado').length, color: '#639922' },
          { label: 'Entregado', count: repairs.filter((r: any) => r.estado === 'Entregado').length, color: '#888780' },
        ].filter(e => e.count > 0);

        const eqCount: any = {};
        repairs.forEach((r: any) => { eqCount[r.equipo] = (eqCount[r.equipo] || 0) + 1; });
        const equiposList = Object.entries(eqCount).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

        const c1 = document.getElementById('chartMeses');
        if (c1) new Chart(c1, {
          type: 'bar',
          data: {
            labels: mesesFiltrados.map((m: any) => m.label),
            datasets: [
              { label: 'Facturado', data: mesesFiltrados.map((m: any) => m.facturado), backgroundColor: '#378ADD', borderRadius: 4 },
              { label: 'Cobrado', data: mesesFiltrados.map((m: any) => m.cobrado), backgroundColor: '#639922', borderRadius: 4 },
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: tickColor, font: { size: 11 } }, grid: { color: gridColor }, border: { display: false } },
                      y: { ticks: { color: tickColor, font: { size: 11 }, callback: (v: any) => '$' + v }, grid: { color: gridColor }, border: { display: false } } } }
        });

        const c2 = document.getElementById('chartEstados');
        if (c2) new Chart(c2, {
          type: 'doughnut',
          data: { labels: estadosList.map((e: any) => e.label), datasets: [{ data: estadosList.map((e: any) => e.count), backgroundColor: estadosList.map((e: any) => e.color), borderWidth: 0, hoverOffset: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }
        });

        const c3 = document.getElementById('chartEquipos');
        if (c3) new Chart(c3, {
          type: 'bar',
          data: { labels: equiposList.map((e: any) => e[0]), datasets: [{ data: equiposList.map((e: any) => e[1]), backgroundColor: '#534AB7', borderRadius: 4 }] },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: tickColor, font: { size: 11 } }, grid: { color: gridColor }, border: { display: false } },
                      y: { ticks: { color: tickColor, font: { size: 11 } }, grid: { display: false }, border: { display: false } } } }
        });
      };

      if (win.Chart) {
        setTimeout(renderCharts, 50);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
        script.onload = () => setTimeout(renderCharts, 50);
        document.head.appendChild(script);
      }
    };
    const timer = setTimeout(loadCharts, 100);
    return () => clearTimeout(timer);
  }, [section, repairs]);

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

  // ── Datos para gráficas de finanzas ─────────────────────────────────────
  const mesesLabels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const ingresosPorMes = Array(12).fill(0);
  const cobradoPorMes = Array(12).fill(0);
  repairs.forEach((r) => {
    if (r.fecha) {
      const parts = r.fecha.split('/');
      const mes = parts.length === 3 ? parseInt(parts[1]) - 1 : new Date(r.fecha).getMonth();
      if (mes >= 0 && mes < 12) {
        ingresosPorMes[mes] += Number(r.costo || 0);
        cobradoPorMes[mes] += Number(r.entrega || 0);
      }
    }
  });
  const mesesConDatos = mesesLabels.map((l, i) => ({ label: l, facturado: ingresosPorMes[i], cobrado: cobradoPorMes[i] }))
    .filter(m => m.facturado > 0 || m.cobrado > 0);
  const estadosData = [
    { label: 'Pendiente', count: repairs.filter(r => r.estado === 'Pendiente').length, color: '#EF9F27' },
    { label: 'En reparación', count: repairs.filter(r => r.estado === 'En reparación').length, color: '#378ADD' },
    { label: 'Reparado', count: repairs.filter(r => r.estado === 'Reparado').length, color: '#639922' },
    { label: 'Entregado', count: repairs.filter(r => r.estado === 'Entregado').length, color: '#888780' },
  ].filter(e => e.count > 0);
  const equiposData = Object.entries(equiposCount)
    .sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

  const getNivelCliente = (cantidad: number) => {
    if (cantidad >= 5) return { texto: 'VIP ⭐', color: 'text-yellow-400' };
    if (cantidad >= 3) return { texto: 'Frecuente', color: 'text-blue-400' };
    return { texto: 'Normal', color: 'text-zinc-400' };
  };

  const estadoColor: any = {
    'Pendiente': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'En reparación': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'Reparado': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    'Entregado': 'bg-green-500/20 text-green-400 border border-green-500/30',
  };

  const estadoSelectColor: any = darkMode ? {
    'Pendiente': 'bg-yellow-500/20 text-yellow-400',
    'En reparación': 'bg-blue-500/20 text-blue-400',
    'Reparado': 'bg-purple-500/20 text-purple-400',
    'Entregado': 'bg-green-500/20 text-green-400',
  } : {
    'Pendiente': 'bg-amber-100 text-amber-800',
    'En reparación': 'bg-blue-100 text-blue-800',
    'Reparado': 'bg-purple-100 text-purple-800',
    'Entregado': 'bg-green-100 text-green-800',
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  // ── Verificar acceso por suscripcion ────────────────────────────────────
  if (user && accesoVerificado && !config.is_admin && suscripcionActual) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = suscripcionActual.fecha_vencimiento ? new Date(suscripcionActual.fecha_vencimiento) : null;
    const vencido = vencimiento ? vencimiento < hoy : false;
    const inactivo = suscripcionActual.estado === 'inactivo';
    const esTrial = suscripcionActual.estado === 'trial';
    const diasRestantes = vencimiento ? Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null;

    if (inactivo || (esTrial && vencido) || (suscripcionActual.estado === 'activo' && vencido)) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 mb-6">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Acceso bloqueado</h1>
            <p className="text-zinc-400 text-sm mb-2">
              {inactivo ? 'Tu cuenta está inactiva.' : 'Tu período de prueba ha vencido.'}
            </p>
            <p className="text-zinc-500 text-xs mb-6">Elegí un plan para continuar usando MegaTallerPro.</p>
            <div className="flex flex-col gap-3 mb-4">
              <a href="https://megatallerpro.lemonsqueezy.com/checkout/buy/b2721abc-1fff-4b32-a8a4-aecf84944aa7"
                target="_blank"
                className="w-full border border-zinc-700 hover:border-green-500 text-white font-bold py-3 rounded-xl transition-colors text-sm text-center">
                Plan Basic — $15/mes
              </a>
              <a href="https://megatallerpro.lemonsqueezy.com/checkout/buy/33d3e500-c3e3-443f-8d92-8773e19f3081"
                target="_blank"
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-colors text-sm text-center">
                Plan Pro — $22/mes ⭐
              </a>
            </div>
            <button onClick={handleLogout}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl transition-colors text-xs">
              Cerrar sesión
            </button>
          </div>
        </div>
      );
    }
  }

  if (showNuevaPassword) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img src={darkMode ? "/logo_nuevo_transparente.png" : "/logo_nuevo_claro_transparente.png"} alt="MegaTallerPro" className="h-20 w-auto object-contain" />
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4">
            <h2 className="text-white font-bold text-lg">Nueva contraseña</h2>
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1 block">Nueva contraseña</label>
              <input type="password" placeholder="Mínimo 6 caracteres" value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1 block">Confirmar contraseña</label>
              <input type="password" placeholder="Repetí la contraseña" value={nuevaPasswordConfirm}
                onChange={e => setNuevaPasswordConfirm(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
            </div>
            <button onClick={handleNuevaPassword}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-colors text-sm mt-2">
              Guardar contraseña
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user && showLanding) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white overflow-y-auto">
        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={darkMode ? "/logo_nuevo_transparente.png" : "/logo_nuevo_claro_transparente.png"} alt="MegaTallerPro" className="h-16 w-auto object-contain" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowLanding(false); setShowRegistro(false); }}
              className="text-zinc-400 hover:text-white text-sm px-4 py-2 transition-colors">
              Iniciar sesión
            </button>
            <button onClick={() => { setShowLanding(false); setShowRegistro(true); }}
              className="bg-green-500 hover:bg-green-400 text-black text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              Registrarse
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center px-6 py-16">
          <div className="flex justify-center mb-8">
            <img src={darkMode ? "/logo_nuevo_transparente.png" : "/logo_nuevo_claro_transparente.png"} alt="MegaTallerPro" className="h-44 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">El sistema de gestión<br/>para talleres técnicos</h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto">Simple, rápido y desde cualquier dispositivo. Controlá tus reparaciones, clientes y finanzas en un solo lugar.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setShowLanding(false); setShowRegistro(true); }}
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Probá gratis 5 días
            </button>
            <button onClick={() => { setShowLanding(false); setShowRegistro(false); }}
              className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-6 py-3 rounded-xl transition-colors text-sm">
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 pb-12 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
            {[
              ['📋', 'Reparaciones', 'Seguí cada orden de trabajo'],
              ['👥', 'Clientes', 'Directorio con historial completo'],
              ['🖨️', 'Tickets', 'Imprimí con un click'],
              ['💬', 'WhatsApp', 'Avisos automáticos de estado'],
              ['💰', 'Finanzas', 'Control de ingresos y saldos'],
              ['📱', 'Mobile', 'Funciona en cualquier dispositivo'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-sm font-medium text-white mb-1">{title}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>

          {/* Planes */}
          <h2 className="text-xl font-bold text-white text-center mb-6">Elegí tu plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Basic</p>
              <p className="text-3xl font-bold text-white mb-1">$15 <span className="text-base font-normal text-zinc-400">/ mes</span></p>
              <p className="text-sm text-zinc-500 mb-4">1 taller</p>
              <div className="flex flex-col gap-2 mb-6">
                {['Reparaciones ilimitadas', 'Clientes y tickets', 'WhatsApp automático', 'Finanzas'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-green-400">✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="https://megatallerpro.lemonsqueezy.com/checkout/buy/b2721abc-1fff-4b32-a8a4-aecf84944aa7"
                target="_blank"
                className="w-full border border-zinc-700 hover:border-green-500 text-white py-2.5 rounded-xl text-sm transition-colors text-center block">
                Suscribirse — $15/mes
              </a>
            </div>

            <div className="bg-zinc-900 border-2 border-green-500 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Más popular</div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Pro</p>
              <p className="text-3xl font-bold text-white mb-1">$22 <span className="text-base font-normal text-zinc-400">/ mes</span></p>
              <p className="text-sm text-zinc-500 mb-4">Hasta 3 talleres</p>
              <div className="flex flex-col gap-2 mb-6">
                {['Todo lo del plan Basic', 'Hasta 3 talleres', 'Soporte prioritario'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-green-400">✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="https://megatallerpro.lemonsqueezy.com/checkout/buy/33d3e500-c3e3-443f-8d92-8773e19f3081"
                target="_blank"
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors text-center block">
                Suscribirse — $22/mes
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-zinc-500">
            <p>Sin compromisos · Cancelá cuando quieras · 5 días gratis</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <img src={darkMode ? "/logo_nuevo_transparente.png" : "/logo_nuevo_claro_transparente.png"} alt="MegaTallerPro" className="h-24 w-auto object-contain" />
            </div>
            <p className="text-zinc-500 text-sm mt-1">Sistema de gestión técnica</p>
          </div>

          {!showRegistro ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1 block">Correo electrónico</label>
                <input type="email" placeholder="ejemplo@correo.com" value={loginForm.email}
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
              <button onClick={() => { setShowRecuperar(true); setRecuperarEnviado(false); setRecuperarEmail(''); }}
                className="w-full text-zinc-500 hover:text-zinc-300 text-xs text-center transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
              <button onClick={() => setShowRegistro(true)}
                className="w-full text-zinc-400 hover:text-white text-sm text-center transition-colors mt-1">
                ¿No tenés cuenta? <span className="text-green-400 font-medium">Probá 5 días gratis</span>
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4">
              <h2 className="text-white font-bold text-lg">Crear cuenta — 5 días gratis</h2>
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1 block">Nombre del taller</label>
                <input type="text" placeholder="Ej: TechRepair Montevideo" value={registroForm.nombre}
                  onChange={(e) => setRegistroForm({ ...registroForm, nombre: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1 block">Correo electrónico</label>
                <input type="email" placeholder="correo@ejemplo.com" value={registroForm.email}
                  onChange={(e) => setRegistroForm({ ...registroForm, email: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1 block">Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={registroForm.password}
                  onChange={(e) => setRegistroForm({ ...registroForm, password: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1 block">Confirmar contraseña</label>
                <input type="password" placeholder="Repetí la contraseña" value={registroForm.confirmar}
                  onChange={(e) => setRegistroForm({ ...registroForm, confirmar: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm" />
              </div>
              <button onClick={handleRegistro} disabled={registrando}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-colors text-sm mt-2">
                {registrando ? 'Creando cuenta...' : 'Crear cuenta gratis'}
              </button>
              <button onClick={() => setShowRegistro(false)}
                className="w-full text-zinc-400 hover:text-white text-sm text-center transition-colors">
                ← Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {showRecuperar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
            {!recuperarEnviado ? (
              <>
                <h2 className="text-white font-bold text-lg mb-2">Recuperar contraseña</h2>
                <p className="text-zinc-400 text-sm mb-4">Ingresá tu email y te enviaremos un link para restablecerla.</p>
                <input type="email" placeholder="correo@ejemplo.com" value={recuperarEmail}
                  onChange={e => setRecuperarEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-xl outline-none focus:border-green-500 transition-colors text-sm mb-4" />
                <div className="flex gap-2">
                  <button onClick={() => setShowRecuperar(false)}
                    className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 rounded-xl text-sm">Cancelar</button>
                  <button onClick={handleRecuperar}
                    className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl text-sm">Enviar</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">📧</div>
                  <h2 className="text-white font-bold text-lg mb-2">Email enviado</h2>
                  <p className="text-zinc-400 text-sm">Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.</p>
                </div>
                <button onClick={() => setShowRecuperar(false)}
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl text-sm">Entendido</button>
              </>
            )}
          </div>
        </div>
      )}
      </>
    );
  }

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'reparaciones', label: 'Reparaciones', icon: '🔧' },
    { id: 'finanzas', label: 'Finanzas', icon: '💰' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    ...((config.is_admin || (typeof window !== 'undefined' && localStorage.getItem('megabyte_is_admin') === 'true') || suscripcionActual?.plan === 'pro') ? [{ id: 'ventas', label: 'Ventas', icon: '🛒' }] : []),
    { id: 'calculadora', label: 'Calculadora', icon: '🧮' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
    ...(config.is_admin ? [{ id: 'admin', label: 'Admin', icon: '🛡️' }] : []),
  ];

  // ── Días de trial restantes ──────────────────────────────────────────────
  const diasTrialRestantes = (() => {
    if (!suscripcionActual || suscripcionActual.estado !== 'trial' || !suscripcionActual.fecha_vencimiento) return null;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    // Parsear fecha como local (no UTC) para evitar desfase de zona horaria
    const [y, m, d] = suscripcionActual.fecha_vencimiento.split('-').map(Number);
    const venc = new Date(y, m - 1, d);
    return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  })();

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex`}>
      {diasTrialRestantes !== null && diasTrialRestantes >= 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center text-xs font-bold py-1.5">
          ⏳ Período de prueba — {diasTrialRestantes} día{diasTrialRestantes !== 1 ? 's' : ''} restante{diasTrialRestantes !== 1 ? 's' : ''}
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className={`hidden md:flex w-60 ${t.sidebar} border-r flex-col py-5 px-3 shrink-0 fixed h-full z-40`}>
        <div className="flex items-center justify-center px-2 mb-6 pb-5 border-b border-zinc-800">
          <img src={darkMode ? "/logo_nuevo_transparente.png" : "/logo_nuevo_claro_transparente.png"} alt="MegaTallerPro" className="w-44 h-auto object-contain" />
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                section === item.id ? t.navActive : `${t.muted} ${t.navHover}`
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className={`border-t ${t.divider} pt-4 mt-4`}>
          <div className="px-3 py-2 mb-1">
            <p className={`text-xs ${t.subtext} mb-0.5`}>Conectado como</p>
            <p className={`text-xs font-medium truncate ${t.muted}`}>{user.email}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Header móvil */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-40 ${t.sidebar} border-b ${t.divider} px-4 py-3 flex items-center justify-between`}
        style={{marginTop: diasTrialRestantes !== null && diasTrialRestantes >= 0 ? '28px' : '0'}}>
        <div className="flex items-center gap-2">
          <img src={darkMode ? "/logo_nuevo_transparente.png" : "/logo_nuevo_claro_transparente.png"} alt="MegaTallerPro" className="h-8 w-auto object-contain" />
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2 rounded-xl ${t.badge} text-lg`}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Menu móvil overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div className={`${t.sidebar} w-64 h-full p-5 flex flex-col`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-8">
              <img src={darkMode ? "/logo_nuevo_transparente.png" : "/logo_nuevo_claro_transparente.png"} alt="MegaTallerPro" className="w-48 h-auto object-contain" />
            </div>
            <nav className="flex flex-col gap-1 flex-1">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => { setSection(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    section === item.id ? t.navActive : `${t.muted} ${t.navHover}`
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
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 md:ml-60 mt-14 md:mt-0">

        {/* ── Dashboard ── */}
        {section === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${t.text}`}>Dashboard</h1>
              <p className={`${t.subtext} text-sm mt-1`}>Resumen general del taller</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total reparaciones', value: repairs.length, color: 'text-green-400', accent: 'bg-green-500/10' },
                { label: 'Pendientes', value: repairs.filter(r => r.estado === 'Pendiente').length, color: 'text-yellow-400', accent: 'bg-yellow-500/10' },
                { label: 'En reparación', value: repairs.filter(r => r.estado === 'En reparación').length, color: 'text-blue-400', accent: 'bg-blue-500/10' },
                { label: 'Entregados', value: repairs.filter(r => r.estado === 'Entregado').length, color: 'text-green-500', accent: 'bg-green-500/10' },
              ].map((stat) => (
                <div key={stat.label} className={`${t.card} border rounded-2xl p-5`}>
                  <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>{stat.label}</p>
                  <p className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[
                { label: 'Facturación total', value: `$ ${totalTrabajos}`, color: 'text-blue-400' },
                { label: 'Cobrado', value: `$ ${totalCobrado}`, color: 'text-green-400' },
                { label: 'Saldo pendiente', value: `$ ${totalPendiente}`, color: 'text-red-400' },
                { label: 'Promedio por reparación', value: `$ ${promedio}`, color: 'text-purple-400' },
                { label: 'Equipo más reparado', value: equipoTop, color: 'text-green-400', small: true },
                { label: 'Cliente VIP', value: clienteVIP, color: 'text-yellow-400', small: true },
              ].map((stat) => (
                <div key={stat.label} className={`${t.card} border rounded-2xl p-5`}>
                  <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>{stat.label}</p>
                  <p className={`font-semibold ${stat.color} ${stat.small ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: 'Reparaciones totales', value: repairs.length, color: 'text-green-400' },
                { label: 'Pendientes', value: repairs.filter(r => r.estado === 'Pendiente').length, color: 'text-yellow-400' },
                { label: 'Entregados', value: repairs.filter(r => r.estado === 'Entregado').length, color: 'text-green-500' },
                { label: 'Facturación total', value: `$ ${totalTrabajos}`, color: 'text-blue-400' },
                { label: 'Total cobrado', value: `$ ${totalCobrado}`, color: 'text-green-400' },
                { label: 'Saldo pendiente', value: `$ ${totalPendiente}`, color: 'text-red-400' },
                { label: 'Promedio por reparación', value: `$ ${promedio}`, color: 'text-purple-400' },
                { label: 'Equipo más reparado', value: equipoTop, color: 'text-green-400', small: true },
                { label: 'Cliente VIP', value: clienteVIP, color: 'text-yellow-400', small: true },
              ].map((stat) => (
                <div key={stat.label} className={`${t.card} border rounded-2xl p-5`}>
                  <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>{stat.label}</p>
                  <p className={`font-semibold ${stat.color} ${stat.small ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              {/* Ingresos por mes */}
              <div className={`${t.card} border rounded-2xl p-5`}>
                <p className={`text-xs ${t.subtext} font-medium mb-1 uppercase tracking-wider`}>Ingresos por mes</p>
                <div className="flex gap-4 mb-3">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400"></span>Facturado</span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500"></span>Cobrado</span>
                </div>
                <div style={{position:'relative', height:'180px'}}>
                  <canvas id="chartMeses"></canvas>
                </div>
              </div>
              {/* Estado de reparaciones */}
              <div className={`${t.card} border rounded-2xl p-5`}>
                <p className={`text-xs ${t.subtext} font-medium mb-1 uppercase tracking-wider`}>Estado de reparaciones</p>
                <div className="flex flex-wrap gap-3 mb-3">
                  {estadosData.map(e => (
                    <span key={e.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{backgroundColor: e.color}}></span>
                      {e.label} {e.count}
                    </span>
                  ))}
                </div>
                <div style={{position:'relative', height:'180px'}}>
                  <canvas id="chartEstados"></canvas>
                </div>
              </div>
            </div>
            {/* Equipos más reparados */}
            <div className={`${t.card} border rounded-2xl p-5 mt-4`}>
              <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>Equipos más reparados</p>
              <div style={{position:'relative', height: `${Math.max(equiposData.length * 40 + 20, 100)}px`}}>
                <canvas id="chartEquipos"></canvas>
              </div>
            </div>

            {/* ── Finanzas Pro ── */}
            {(() => {
              const esPro = config.is_admin || (typeof window !== 'undefined' && localStorage.getItem('megabyte_is_admin') === 'true') || suscripcionActual?.plan === 'pro';
              if (!esPro) return (
                <div className={`${t.card} border border-dashed rounded-2xl p-6 mt-4 text-center`}>
                  <p className="text-2xl mb-2">⭐</p>
                  <p className={`font-semibold ${t.text} mb-1`}>Análisis avanzado disponible en Plan Pro</p>
                  <p className={`text-sm ${t.subtext} mb-4`}>Comparativa vs mes anterior, proyección de ingresos, ranking de clientes y exportación PDF.</p>
                  <a href="https://megatallerpro.lemonsqueezy.com/checkout/buy/33d3e500-c3e3-443f-8d92-8773e19f3081"
                    target="_blank" className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                    Actualizar a Pro — $22/mes
                  </a>
                </div>
              );

              // Cálculos Pro
              const hoy = new Date();
              const mesActual = hoy.getMonth();
              const anioActual = hoy.getFullYear();
              const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
              const anioAnterior = mesActual === 0 ? anioActual - 1 : anioActual;

              const parseFecha = (f: string) => {
                if (!f) return null;
                const parts = f.split('/');
                if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
                return new Date(f);
              };

              const repsMesActual = repairs.filter((r: any) => {
                const d = parseFecha(r.fecha); if (!d) return false;
                return d.getMonth() === mesActual && d.getFullYear() === anioActual;
              });
              const repsMesAnterior = repairs.filter((r: any) => {
                const d = parseFecha(r.fecha); if (!d) return false;
                return d.getMonth() === mesAnterior && d.getFullYear() === anioAnterior;
              });

              const ingresoActual = repsMesActual.reduce((a: number, r: any) => a + Number(r.costo||0), 0);
              const ingresoAnterior = repsMesAnterior.reduce((a: number, r: any) => a + Number(r.costo||0), 0);
              const varIngreso = ingresoAnterior > 0 ? Math.round(((ingresoActual - ingresoAnterior) / ingresoAnterior) * 100) : 0;
              const varOrdenes = repsMesActual.length - repsMesAnterior.length;
              const ticketActual = repsMesActual.length > 0 ? Math.round(ingresoActual / repsMesActual.length) : 0;
              const ticketAnterior = repsMesAnterior.length > 0 ? Math.round(ingresoAnterior / repsMesAnterior.length) : 0;
              const varTicket = ticketAnterior > 0 ? Math.round(((ticketActual - ticketAnterior) / ticketAnterior) * 100) : 0;

              // Ranking clientes
              const clienteRanking: any = {};
              repairs.forEach((r: any) => {
                if (!r.cliente) return;
                clienteRanking[r.cliente] = (clienteRanking[r.cliente] || 0) + Number(r.costo||0);
              });
              const topClientes = Object.entries(clienteRanking)
                .sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

              const mesesNombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

              // Tasa de reparación
              const repsEntregadas = repairs.filter((r: any) => r.estado === 'Entregado');
              const repsReparadas = repsEntregadas.filter((r: any) => r.se_reparo !== false).length;
              const repsNoReparadas = repsEntregadas.length - repsReparadas;
              const tasaReparacion = repsEntregadas.length > 0 ? Math.round((repsReparadas / repsEntregadas.length) * 100) : 0;

              // Saldo pendiente por cliente
              const saldoMap: any = {};
              repairs.forEach((r: any) => {
                if (Number(r.saldo || 0) > 0 && r.cliente) {
                  saldoMap[r.cliente] = (saldoMap[r.cliente] || 0) + Number(r.saldo);
                }
              });
              const topSaldos = Object.entries(saldoMap).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
              const totalSaldoPendiente = (Object.values(saldoMap) as number[]).reduce((a, b) => a + b, 0);

              // Ingresos por tipo de equipo
              const equipoIngresosMap: any = {};
              repairs.forEach((r: any) => {
                const tipo = (r.equipo || 'Otro').split(' - ')[0];
                equipoIngresosMap[tipo] = (equipoIngresosMap[tipo] || 0) + Number(r.costo || 0);
              });
              const equipoIngresosList = Object.entries(equipoIngresosMap).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 5);

              return (
                <div className="mt-4 flex flex-col gap-4">
                  <div className={`${t.card} border rounded-2xl p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <p className={`text-xs ${t.subtext} font-medium uppercase tracking-wider`}>Análisis Pro — comparativa vs mes anterior</p>
                      <span className="text-xs bg-green-500/15 text-green-400 px-2.5 py-1 rounded-lg font-semibold">⭐ Pro</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {([
                        { label: 'Ingresos', value: `$${ingresoActual.toLocaleString('es-UY')}`, varN: varIngreso, unit: '%', showVar: true, sub: '' },
                        { label: 'Órdenes completadas', value: String(repsMesActual.length), varN: varOrdenes, unit: '', showVar: true, sub: '' },
                        { label: 'Ticket promedio', value: `$${ticketActual.toLocaleString('es-UY')}`, varN: varTicket, unit: '%', showVar: true, sub: '' },
                        { label: 'Tasa de reparación', value: `${tasaReparacion}%`, varN: 0, unit: '', showVar: false, sub: `${repsReparadas} reparados / ${repsNoReparadas} no reparados` },
                      ] as {label:string,value:string,varN:number,unit:string,showVar:boolean,sub:string}[]).map(stat => (
                        <div key={stat.label} className={`${darkMode ? 'bg-zinc-800' : 'bg-slate-50'} rounded-xl p-4`}>
                          <p className={`text-xs ${t.subtext} mb-2`}>{stat.label}</p>
                          <p className={`text-xl font-semibold ${t.text}`}>{stat.value}</p>
                          {stat.showVar ? (
                            <p className={`text-xs mt-1 ${stat.varN >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stat.varN >= 0 ? '↑' : '↓'} {Math.abs(stat.varN)}{stat.unit} vs mes anterior
                            </p>
                          ) : (
                            <p className={`text-xs mt-1 ${t.subtext}`}>{stat.sub}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`${t.card} border rounded-2xl p-5`}>
                      <p className={`text-xs ${t.subtext} font-medium mb-4 uppercase tracking-wider`}>Ranking de clientes</p>
                      {topClientes.length === 0 ? (
                        <p className={`text-sm ${t.subtext}`}>Sin datos suficientes</p>
                      ) : (
                        <div className="flex flex-col">
                          {topClientes.map(([nombre, total]: any, i) => (
                            <div key={nombre} className="flex justify-between items-center py-2 border-b last:border-0" style={{borderColor:'var(--color-border-tertiary)'}}>
                              <span className={`text-sm ${t.text}`}>{i+1}. {nombre}</span>
                              <span className={`text-sm font-semibold ${t.text}`}>${Number(total).toLocaleString('es-UY')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`${t.card} border rounded-2xl p-5`}>
                      <p className={`text-xs ${t.subtext} font-medium mb-4 uppercase tracking-wider`}>Saldo pendiente por cliente</p>
                      {topSaldos.length === 0 ? (
                        <p className={`text-sm ${t.subtext}`}>Sin saldos pendientes</p>
                      ) : (
                        <div className="flex flex-col">
                          {topSaldos.map(([nombre, saldo]: any) => (
                            <div key={nombre} className="flex justify-between items-center py-2 border-b last:border-0" style={{borderColor:'var(--color-border-tertiary)'}}>
                              <span className={`text-sm ${t.text}`}>{nombre}</span>
                              <span className="text-sm font-semibold text-red-400">${Number(saldo).toLocaleString('es-UY')}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-2 mt-1">
                            <span className={`text-xs font-medium ${t.subtext}`}>Total pendiente</span>
                            <span className="text-sm font-semibold text-red-400">${Number(totalSaldoPendiente).toLocaleString('es-UY')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${t.card} border rounded-2xl p-5`}>
                    <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>Ingresos por tipo de equipo</p>
                    <div style={{position:'relative', height:`${Math.max(equipoIngresosList.length * 40 + 20, 80)}px`}}>
                      <canvas id="chartEquiposIngresosP"></canvas>
                    </div>
                    {typeof window !== 'undefined' && (() => {
                      setTimeout(() => {
                        const win = window as any;
                        if (!win.Chart) return;
                        const existing = win.Chart.getChart('chartEquiposIngresosP');
                        if (existing) existing.destroy();
                        const c = document.getElementById('chartEquiposIngresosP');
                        if (!c) return;
                        const isDarkM = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
                        const gridC = isDarkM ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
                        const tickC = isDarkM ? '#888' : '#aaa';
                        const eColors = ['#378ADD','#534AB7','#639922','#EF9F27','#888780'];
                        new win.Chart(c, {
                          type: 'bar',
                          data: {
                            labels: equipoIngresosList.map((e: any) => e[0]),
                            datasets: [{ data: equipoIngresosList.map((e: any) => e[1]), backgroundColor: eColors.slice(0, equipoIngresosList.length), borderRadius: 4 }]
                          },
                          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { ticks: { color: tickC, font: { size: 11 }, callback: (v: any) => '$' + Number(v).toLocaleString('es-UY') }, grid: { color: gridC }, border: { display: false } },
                              y: { ticks: { color: tickC, font: { size: 11 } }, grid: { display: false }, border: { display: false } }
                            }
                          }
                        });
                      }, 200);
                      return null;
                    })()}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`${t.card} border rounded-2xl p-5`}>
                      <p className={`text-xs ${t.subtext} font-medium mb-2 uppercase tracking-wider`}>Proyección próximo mes</p>
                      <p className={`text-3xl font-semibold ${t.text} mb-1`}>
                        ${ingresoActual > 0 ? Math.round(ingresoActual * 1.05).toLocaleString('es-UY') : '—'}
                      </p>
                      <p className={`text-xs ${t.subtext}`}>Estimación basada en tendencia actual (+5%)</p>
                    </div>
                    <div className={`${t.card} border rounded-2xl p-5 flex items-center justify-center`}>
                      <button
                        onClick={() => {
                          const sep = '\t';
                          const nl = '\n';
                          const rows = repairs.map((r: any) => [r.orden||'', r.cliente||'', r.equipo||'', r.estado||'', r.costo||0, r.entrega||0, r.fecha||''].join(sep)).join(nl);
                          const exportContent = ['Orden','Cliente','Equipo','Estado','Costo','Cobrado','Fecha'].join(sep) + nl + rows;
                          const blob = new Blob([exportContent], { type: 'text/tab-separated-values' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = 'reporte-finanzas-megatallerpro.tsv'; a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full border rounded-xl py-2.5 text-sm font-medium hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                        style={{borderColor:'var(--color-border-tertiary)', color:'var(--color-text-primary)'}}>
                        📥 Exportar datos (Excel)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

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
            <div className={`rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${t.divider} ${t.card}`}>
                <input type="text" placeholder="🔍  Buscar por nombre o teléfono..."
                  value={searchClientes} onChange={(e) => setSearchClientes(e.target.value)}
                  className={`border ${t.input} p-3 rounded-xl w-full outline-none transition-colors text-sm`} />
              </div>
              <div className={`overflow-x-auto ${t.bg}`}>
              <table className="w-full border-separate border-spacing-y-0.5">
                <thead>
                  <tr>
                    {['Cliente', 'Teléfono', 'Reparaciones', 'Total gastado', 'Nivel', 'Historial', 'WhatsApp', 'Nueva orden'].map(h => (
                      <th key={h} className={`text-left px-3 py-2 text-xs ${t.tableHead} font-medium uppercase tracking-wider whitespace-nowrap`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const statsMap: any = {};
                    repairs.forEach((repair: any) => {
                      const key = repair.cliente;
                      if (!statsMap[key]) statsMap[key] = { cantidad: 0, total: 0, telefono: repair.telefono };
                      statsMap[key].cantidad += 1;
                      statsMap[key].total += Number(repair.costo || 0);
                      if (!statsMap[key].telefono && repair.telefono) statsMap[key].telefono = repair.telefono;
                    });
                    const vistos = new Set<string>();
                    const lista: any[] = [];
                    clientes.forEach((c: any) => {
                      const stats = statsMap[c.cliente] || { cantidad: 0, total: 0, telefono: c.telefono };
                      lista.push({ cliente: c.cliente, telefono: c.telefono || stats.telefono, cantidad: stats.cantidad, total: stats.total });
                      vistos.add(c.cliente);
                    });
                    // Incluir clientes que aún no estén en la tabla persistente (datos antiguos)
                    Object.keys(statsMap).forEach((nombre) => {
                      if (!vistos.has(nombre)) {
                        lista.push({ cliente: nombre, telefono: statsMap[nombre].telefono, cantidad: statsMap[nombre].cantidad, total: statsMap[nombre].total });
                      }
                    });
                    return lista;
                  })().filter((cliente: any) =>
                    cliente.cliente.toLowerCase().includes(searchClientes.toLowerCase()) ||
                    (cliente.telefono || '').includes(searchClientes)
                  ).map((cliente: any, index: number) => (
                    <tr key={index} className={`${t.card} transition-colors ${darkMode ? "hover:bg-zinc-800" : "hover:bg-slate-50"}`}>
                      <td className={`px-3 py-2.5 text-xs font-medium ${t.text} rounded-l-xl border-l border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`} style={{whiteSpace: 'pre'}}>{cliente.cliente}</td>
                      <td className={`px-3 py-2.5 text-xs ${t.muted} border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>{cliente.telefono?.replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')}</td>
                      <td className={`px-3 py-2.5 border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-lg text-xs font-bold">
                          {cliente.cantidad}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 text-xs text-blue-400 font-bold border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>$ {cliente.total}</td>
                      <td className={`px-3 py-2.5 font-bold text-xs ${getNivelCliente(cliente.cantidad).color} border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                        {getNivelCliente(cliente.cantidad).texto}
                      </td>
                      <td className={`px-3 py-2.5 border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                        <button onClick={() => {
                          const historial = repairs.filter((r: any) => r.cliente === cliente.cliente);
                          let texto = `Historial de ${cliente.cliente}\n\n`;
                          historial.forEach((r: any) => {
                            texto += `• ${r.equipo}\nEstado: ${r.estado}\nCosto: $${r.costo}\nFecha: ${r.fecha}\n\n`;
                          });
                          alert(texto);
                        }} className={`${t.badge} hover:bg-zinc-600 px-3 py-1.5 rounded-lg text-xs transition-colors ${t.muted}`}>
                          Ver historial
                        </button>
                      </td>
                      <td className={`px-3 py-2.5 border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                        <a href={`https://wa.me/598${(cliente.telefono || '').replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          className="bg-green-500 hover:bg-green-400 px-3 py-1.5 rounded-lg text-black text-xs font-bold transition-colors">
                          WhatsApp
                        </a>
                      </td>
                      <td className={`px-3 py-2.5 rounded-r-xl border-r border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setEditingCliente(cliente);
                            setEditClienteForm({ cliente: cliente.cliente, telefono: (cliente.telefono || '').replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ') });
                          }} className={`${t.badge} px-3 py-1.5 rounded-lg text-xs transition-colors ${t.muted} whitespace-nowrap`}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => {
                            setEditingRepair(null);
                            setForm({ cliente: cliente.cliente, tipo: '', modelo: '', falla: '', telefono: cliente.telefono, contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '', garantia: '', garantiaCustom: '' });
                            setSection('reparaciones');
                            setShowModal(true);
                          }} className="bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-colors whitespace-nowrap">
                            + Orden
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {editingCliente && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className={`${t.card} border rounded-2xl p-6 w-full max-w-sm`}>
                  <h2 className={`text-lg font-bold ${t.text} mb-4`}>Editar cliente</h2>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Nombre</label>
                      <input value={editClienteForm.cliente}
                        onChange={e => setEditClienteForm({...editClienteForm, cliente: e.target.value})}
                        className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`} />
                    </div>
                    <div>
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Teléfono</label>
                      <input value={editClienteForm.telefono}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '');
                          const formatted = digits.replace(/(\d{3})(?=\d)/g, '$1 ');
                          setEditClienteForm({...editClienteForm, telefono: formatted});
                        }}
                        placeholder="09X XXX XXX"
                        className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingCliente(null)}
                        className={`flex-1 ${t.badge} border ${t.divider} py-2 rounded-xl text-sm ${t.muted}`}>Cancelar</button>
                      <button onClick={guardarEdicionCliente}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-black py-2 rounded-xl text-sm font-bold">Guardar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Admin ── */}
        {section === 'admin' && config.is_admin && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-2xl font-bold ${t.text}`}>Panel Admin</h1>
                <p className={`${t.subtext} text-sm mt-1`}>{suscripciones.length} talleres registrados</p>
              </div>
              <button onClick={() => { cargarSuscripciones(); setShowAdminModal({ nombre_taller: '', email: '', plan: 'basic', estado: 'activo', fecha_vencimiento: '' }); }}
                className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-sm">
                + Nuevo taller
              </button>
            </div>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {(() => {
                const hoy = new Date(); hoy.setHours(0,0,0,0);
                const activos = suscripciones.filter((s: any) => s.estado === 'activo').length;
                const trials = suscripciones.filter((s: any) => s.estado === 'trial').length;
                const inactivos = suscripciones.filter((s: any) => s.estado === 'inactivo').length;
                const ingresosBasic = suscripciones.filter((s: any) => s.estado === 'activo' && s.plan === 'basic').length * 15;
                const ingresosPro = suscripciones.filter((s: any) => s.estado === 'activo' && s.plan === 'pro').length * 22;
                const ingresosMes = ingresosBasic + ingresosPro;
                return [
                  { label: 'Activos', value: activos, color: 'text-green-400' },
                  { label: 'En trial', value: trials, color: 'text-amber-400' },
                  { label: 'Inactivos', value: inactivos, color: 'text-red-400' },
                  { label: 'Ingresos est. mes', value: `$ ${ingresosMes}`, color: 'text-blue-400' },
                ].map(stat => (
                  <div key={stat.label} className={`${t.card} border rounded-2xl p-5`}>
                    <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>{stat.label}</p>
                    <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
                  </div>
                ));
              })()}
            </div>

            <div className={`${t.card} border rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${t.divider} flex flex-wrap gap-3`}>
                <input type="text" placeholder="🔍 Buscar por nombre o email..."
                  value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                  className={`flex-1 min-w-[180px] border ${t.input} p-2.5 rounded-xl outline-none text-sm`} />
                <select value={adminFiltro} onChange={e => setAdminFiltro(e.target.value)}
                  className={`border ${t.select} p-2.5 rounded-xl outline-none text-sm`}>
                  <option value="todos">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="trial">En trial</option>
                  <option value="inactivo">Inactivos</option>
                </select>
                <select value={adminOrden} onChange={e => setAdminOrden(e.target.value)}
                  className={`border ${t.select} p-2.5 rounded-xl outline-none text-sm`}>
                  <option value="vencimiento">Por vencimiento</option>
                  <option value="nombre">Por nombre</option>
                  <option value="estado">Por estado</option>
                </select>
              </div>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${t.divider}`}>
                    {['Taller', 'Email', 'Plan', 'Vencimiento', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className={`text-left p-4 text-xs ${t.tableHead} font-medium uppercase tracking-wider`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suscripciones
                    .filter((sub: any) => {
                      const matchSearch = adminSearch === '' ||
                        sub.nombre_taller?.toLowerCase().includes(adminSearch.toLowerCase()) ||
                        sub.email?.toLowerCase().includes(adminSearch.toLowerCase());
                      const matchFiltro = adminFiltro === 'todos' || sub.estado === adminFiltro;
                      return matchSearch && matchFiltro;
                    })
                    .sort((a: any, b: any) => {
                      if (adminOrden === 'nombre') return (a.nombre_taller || '').localeCompare(b.nombre_taller || '');
                      if (adminOrden === 'estado') return (a.estado || '').localeCompare(b.estado || '');
                      if (adminOrden === 'vencimiento') {
                        if (!a.fecha_vencimiento) return 1;
                        if (!b.fecha_vencimiento) return -1;
                        return new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime();
                      }
                      return 0;
                    })
                    .map((sub: any) => (
                    <tr key={sub.id} className={`border-t ${t.row} transition-colors`}>
                      <td className={`p-4 font-medium ${t.text}`}>{sub.nombre_taller}</td>
                      <td className={`p-4 ${t.muted} text-sm`}>{sub.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${sub.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                          {sub.plan?.toUpperCase()}
                        </span>
                      </td>
                      <td className={`p-4 ${t.muted} text-sm`}>
                        {sub.fecha_vencimiento ? new Date(sub.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${sub.estado === 'activo' ? 'bg-green-500/20 text-green-400' : sub.estado === 'trial' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {sub.estado === 'activo' ? '✅ Activo' : sub.estado === 'trial' ? '⏳ En prueba' : '⛔ Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => setShowAdminModal({...sub})}
                            className={`${t.badge} px-3 py-1.5 rounded-lg text-sm ${t.muted}`}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => toggleEstado(sub.id, sub.estado)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold ${sub.estado === 'activo' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {sub.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {suscripciones.length === 0 && (
                    <tr><td colSpan={6} className={`p-8 text-center ${t.subtext} text-sm`}>Sin talleres registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {showAdminModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className={`${t.card} border rounded-2xl p-6 w-full max-w-sm`}>
                  <h2 className={`text-lg font-bold ${t.text} mb-4`}>{showAdminModal.id ? 'Editar taller' : 'Nuevo taller'}</h2>
                  <div className="flex flex-col gap-3">
                    {[
                      { key: 'nombre_taller', label: 'Nombre del taller', placeholder: 'Ej: TechRepair' },
                      { key: 'email', label: 'Email', placeholder: 'correo@ejemplo.com' },

                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>{label}</label>
                        <input value={showAdminModal[key] || ''} placeholder={placeholder}
                          onChange={e => setShowAdminModal({...showAdminModal, [key]: e.target.value})}
                          className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`} />
                      </div>
                    ))}
                    <div>
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Vencimiento</label>
                      <input type="date" value={showAdminModal.fecha_vencimiento || ''}
                        onChange={e => setShowAdminModal({...showAdminModal, fecha_vencimiento: e.target.value})}
                        className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`} />
                    </div>
                    <div>
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Plan</label>
                      <select value={showAdminModal.plan || 'basic'}
                        onChange={e => setShowAdminModal({...showAdminModal, plan: e.target.value})}
                        className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`}>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Estado</label>
                      <select value={showAdminModal.estado || 'activo'}
                        onChange={e => setShowAdminModal({...showAdminModal, estado: e.target.value})}
                        className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`}>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setShowAdminModal(null)}
                        className={`flex-1 ${t.badge} border ${t.divider} py-2 rounded-xl text-sm ${t.muted}`}>Cancelar</button>
                      <button onClick={() => guardarSuscripcion(showAdminModal)}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-black py-2 rounded-xl text-sm font-bold">Guardar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Punto de Ventas ── */}
        {section === 'ventas' && (() => {
          const esPro = config.is_admin || (typeof window !== 'undefined' && localStorage.getItem('megabyte_is_admin') === 'true') || suscripcionActual?.plan === 'pro';

          const productosFiltrados = productos.filter((p: any) =>
            p.nombre.toLowerCase().includes(busquedaPdv.toLowerCase()) ||
            (p.codigo_barras && p.codigo_barras.includes(busquedaPdv))
          );

          const agregarAlCarrito = (producto: any) => {
            setCarrito(prev => {
              const existente = prev.find((i: any) => i.id === producto.id);
              if (existente) return prev.map((i: any) => i.id === producto.id ? {...i, cantidad: i.cantidad + 1} : i);
              return [...prev, {...producto, cantidad: 1}];
            });
            setBusquedaPdv('');
          };

          const cambiarCantidad = (id: number, delta: number) => {
            setCarrito(prev => prev.map((i: any) => i.id === id ? {...i, cantidad: Math.max(1, i.cantidad + delta)} : i));
          };

          const quitarDelCarrito = (id: number) => setCarrito(prev => prev.filter((i: any) => i.id !== id));

          const totalCarrito = carrito.reduce((a: number, i: any) => a + (Number(i.precio) * i.cantidad), 0);

          const confirmarVenta = async () => {
            if (carrito.length === 0) return;
            const { data: ventas } = await supabase.from('ventas').select('numero_venta').eq('user_id', user.id).order('id', { ascending: false }).limit(1).maybeSingle();
            const nro = ventas ? parseInt((ventas.numero_venta || '0').replace(/\D/g,'')) + 1 : 1;
            const numero = `#${String(nro).padStart(4,'0')}`;
            const items = carrito.map((i: any) => ({ id: i.id, nombre: i.nombre, precio: Number(i.precio), cantidad: i.cantidad }));
            await supabase.from('ventas').insert({ user_id: user.id, numero_venta: numero, total: totalCarrito, forma_pago: formaPagoPdv, items });
            for (const item of carrito) {
              await supabase.from('productos').update({ stock: Math.max(0, (item.stock || 0) - item.cantidad) }).eq('id', item.id);
            }
            const { data: prodsActualizados } = await supabase.from('productos').select('*').order('nombre');
            if (prodsActualizados) setProductos(prodsActualizados);
            const fecha = new Date().toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
            setTicketVenta({ numero, total: totalCarrito, items, formaPago: formaPagoPdv, fecha });
            setCarrito([]);
          };

          const guardarProducto = async () => {
            if (!productoForm.nombre || !productoForm.precio) return;
            if (editingProducto) {
              await supabase.from('productos').update({
                nombre: productoForm.nombre, precio: Number(productoForm.precio),
                stock: Number(productoForm.stock || 0), codigo_barras: productoForm.codigo_barras || null
              }).eq('id', editingProducto.id);
            } else {
              await supabase.from('productos').insert({
                user_id: user.id, nombre: productoForm.nombre, precio: Number(productoForm.precio),
                stock: Number(productoForm.stock || 0), codigo_barras: productoForm.codigo_barras || null
              });
            }
            const { data } = await supabase.from('productos').select('*').order('nombre');
            if (data) setProductos(data);
            setProductoForm({ nombre: '', precio: '', stock: '', codigo_barras: '' });
            setShowAddProducto(false);
            setEditingProducto(null);
          };

          const eliminarProducto = async (id: number) => {
            if (!confirm('¿Eliminar este producto?')) return;
            await supabase.from('productos').delete().eq('id', id);
            setProductos(prev => prev.filter((p: any) => p.id !== id));
          };

          const imprimirTicket = () => {
            if (!ticketVenta) return;
            const w = window.open('', '_blank', 'width=400,height=600');
            if (!w) return;
            const nombreLocal = config.nombre_negocio || 'MegaTallerPro';
            const encabezado = config.logo_url
              ? `<div style="text-align:center;margin-bottom:4px"><img src="${config.logo_url}" style="max-width:50mm;max-height:20mm;object-fit:contain"/></div>`
              : `<h2>${nombreLocal}</h2>`;
            const direccion = config.direccion ? `<p style="font-size:11px;color:#000">${config.direccion}</p>` : '';
            const telefono = config.telefono ? `<p style="font-size:11px;color:#000">Tel: ${config.telefono}</p>` : '';
            const lineas = ticketVenta.items.map((i: any) => `<p style="margin:2px 0">${i.nombre} x${i.cantidad} .......... $${(i.precio * i.cantidad).toLocaleString('es-UY')}</p>`).join('');
            w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket</title>
              <style>body{font-family:monospace;font-size:13px;padding:20px;max-width:300px}
              h2,p{text-align:center;margin:4px 0}.linea{border-top:1px dashed #000;margin:8px 0}
              .total{font-size:15px;font-weight:bold}</style></head><body>
              ${encabezado}${direccion}${telefono}
              <p>Ticket de venta ${ticketVenta.numero}</p>
              <p style="font-size:11px;color:#000">${ticketVenta.fecha}</p>
              <div class="linea"></div>${lineas}<div class="linea"></div>
              <p class="total">TOTAL: $${ticketVenta.total.toLocaleString('es-UY')}</p>
              <p>Pago: ${ticketVenta.formaPago}</p>
              <div class="linea"></div><p>Gracias por su compra</p>
              <script>window.print();window.close();</script></body></html>`);
          };

          if (!esPro) return (
            <div>
              <div className={`${t.card} border border-dashed rounded-2xl p-6 text-center`}>
                <p className="text-2xl mb-2">🛒</p>
                <p className={`font-semibold ${t.text} mb-1`}>Punto de ventas disponible en Plan Pro</p>
                <p className={`text-sm ${t.subtext} mb-4`}>Vendé productos, manejá tu inventario y generá tickets.</p>
                <a href="https://megatallerpro.lemonsqueezy.com/checkout/buy/33d3e500-c3e3-443f-8d92-8773e19f3081"
                  target="_blank" className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                  Actualizar a Pro — $22/mes
                </a>
              </div>
            </div>
          );

          return (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className={`text-2xl font-bold ${t.text}`}>Punto de ventas</h1>
                  <p className={`${t.subtext} text-sm mt-1`}>Vendé productos y generá tickets</p>
                </div>
                <span className="text-xs bg-green-500/15 text-green-400 px-2.5 py-1 rounded-lg font-semibold">⭐ Pro</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Columna izquierda */}
                <div className="flex flex-col gap-4">
                  {/* Buscador */}
                  <div className={`${t.card} border rounded-2xl p-5`}>
                    <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>Escanear / buscar producto</p>
                    <input type="text" value={busquedaPdv} autoFocus
                      placeholder="Escanear código de barras o buscar por nombre..."
                      onChange={e => setBusquedaPdv(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const match = productos.find((p: any) => p.codigo_barras === busquedaPdv || p.nombre.toLowerCase() === busquedaPdv.toLowerCase());
                          if (match) agregarAlCarrito(match);
                        }
                      }}
                      className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm focus:border-green-500`} />
                    <p className={`text-xs ${t.subtext} mt-2`}>El lector ingresa el código automáticamente. Presioná Enter para agregar.</p>
                    {busquedaPdv && productosFiltrados.length > 0 && (
                      <div className={`mt-2 border ${t.divider} rounded-xl overflow-hidden`}>
                        {productosFiltrados.slice(0, 5).map((p: any) => (
                          <button key={p.id} onClick={() => agregarAlCarrito(p)}
                            className={`w-full text-left px-4 py-2.5 text-sm ${t.text} hover:bg-green-500/10 flex justify-between items-center border-b last:border-0`} style={{borderColor:'var(--color-border-tertiary)'}}>
                            <span>{p.nombre}</span>
                            <span className="font-medium">${Number(p.precio).toLocaleString('es-UY')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inventario */}
                  <div className={`${t.card} border rounded-2xl p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-xs ${t.subtext} font-medium uppercase tracking-wider`}>Inventario ({productos.length})</p>
                      <button onClick={() => { setShowAddProducto(true); setEditingProducto(null); setProductoForm({ nombre: '', precio: '', stock: '', codigo_barras: '' }); }}
                        className="text-xs bg-green-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-green-400 transition-colors">+ Agregar</button>
                    </div>
                    {productos.length === 0 ? (
                      <p className={`text-sm ${t.subtext}`}>Sin productos. Agregá el primero.</p>
                    ) : (
                      <div className="flex flex-col">
                        {productos.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{borderColor:'var(--color-border-tertiary)'}}>
                            <div className="flex-1 min-w-0 mr-3">
                              <p className={`text-sm font-medium ${t.text} truncate`}>{p.nombre}</p>
                              <p className={`text-xs ${t.subtext}`}>{p.codigo_barras || 'Sin código'}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className={`text-sm font-semibold ${t.text}`}>${Number(p.precio).toLocaleString('es-UY')}</p>
                                <p className={`text-xs ${p.stock <= 2 ? 'text-yellow-400' : 'text-green-400'}`}>Stock: {p.stock}</p>
                              </div>
                              <button onClick={() => agregarAlCarrito(p)} className="text-xs bg-green-500/15 text-green-400 px-2 py-1 rounded-lg hover:bg-green-500/25">+</button>
                              <button onClick={() => { setEditingProducto(p); setProductoForm({ nombre: p.nombre, precio: String(p.precio), stock: String(p.stock), codigo_barras: p.codigo_barras || '' }); setShowAddProducto(true); }}
                                className={`text-xs ${t.muted} hover:opacity-70`}>✏️</button>
                              <button onClick={() => eliminarProducto(p.id)} className="text-xs text-red-400 hover:opacity-70">🗑️</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="flex flex-col gap-4">
                  {/* Carrito */}
                  <div className={`${t.card} border rounded-2xl p-5`}>
                    <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>Carrito de venta</p>
                    {carrito.length === 0 ? (
                      <p className={`text-sm ${t.subtext}`}>Escaneá o seleccioná productos para agregar al carrito.</p>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          {carrito.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-2 py-2.5 border-b last:border-0" style={{borderColor:'var(--color-border-tertiary)'}}>
                              <span className={`text-sm ${t.text} flex-1 truncate`}>{item.nombre}</span>
                              <button onClick={() => cambiarCantidad(item.id, -1)} className={`w-7 h-7 rounded-lg ${t.badge} border text-sm flex items-center justify-center`} style={{borderColor:'var(--color-border-tertiary)'}}>−</button>
                              <span className={`text-sm font-medium ${t.text} w-5 text-center`}>{item.cantidad}</span>
                              <button onClick={() => cambiarCantidad(item.id, 1)} className={`w-7 h-7 rounded-lg ${t.badge} border text-sm flex items-center justify-center`} style={{borderColor:'var(--color-border-tertiary)'}}>+</button>
                              <span className={`text-sm font-semibold ${t.text} w-20 text-right`}>${(Number(item.precio) * item.cantidad).toLocaleString('es-UY')}</span>
                              <button onClick={() => quitarDelCarrito(item.id)} className="text-red-400 text-sm">✕</button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{borderColor:'var(--color-border-tertiary)'}}>
                          <span className={`text-sm ${t.subtext}`}>Total</span>
                          <span className={`text-2xl font-semibold ${t.text}`}>${totalCarrito.toLocaleString('es-UY')}</span>
                        </div>
                        <div className="mt-3">
                          <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Forma de pago</label>
                          <select value={formaPagoPdv} onChange={e => setFormaPagoPdv(e.target.value)}
                            className={`w-full border ${t.select} p-2.5 rounded-xl outline-none text-sm mb-3`}>
                            <option>Efectivo</option>
                            <option>Tarjeta</option>
                            <option>Transferencia</option>
                          </select>
                        </div>
                        <button onClick={confirmarVenta}
                          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl text-sm transition-colors">
                          🧾 Confirmar venta y generar ticket
                        </button>
                        <button onClick={() => setCarrito([])} className={`w-full mt-2 text-xs ${t.subtext} hover:opacity-70`}>Vaciar carrito</button>
                      </>
                    )}
                  </div>

                  {/* Ticket */}
                  {ticketVenta && (
                    <div className={`${t.card} border rounded-2xl p-5`}>
                      <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>Ticket — {ticketVenta.numero}</p>
                      <div className={`${darkMode ? 'bg-zinc-800' : 'bg-slate-50'} rounded-xl p-4 font-mono text-xs`}>
                        {config.logo_url ? (
                          <img src={config.logo_url} alt="logo" className="mx-auto mb-2" style={{maxWidth:'120px', maxHeight:'48px', objectFit:'contain'}} />
                        ) : (
                          <p className={`text-center font-bold ${t.text} mb-1`}>{config.nombre_negocio || 'MegaTallerPro'}</p>
                        )}
                        {config.direccion && <p className={`text-center ${t.subtext} mb-1`}>{config.direccion}</p>}
                        {config.telefono && <p className={`text-center ${t.subtext} mb-1`}>Tel: {config.telefono}</p>}
                        <p className={`text-center ${t.subtext} mb-2`}>Ticket de venta {ticketVenta.numero}</p>
                        <p className={`${t.subtext} mb-2`}>{ticketVenta.fecha}</p>
                        <div className={`border-t border-dashed mb-2`} style={{borderColor:'var(--color-border-tertiary)'}}></div>
                        {ticketVenta.items.map((item: any, i: number) => (
                          <p key={i} className={`${t.text} mb-1`}>{item.nombre} x{item.cantidad} ... ${(item.precio * item.cantidad).toLocaleString('es-UY')}</p>
                        ))}
                        <div className={`border-t border-dashed my-2`} style={{borderColor:'var(--color-border-tertiary)'}}></div>
                        <p className={`font-bold ${t.text}`}>TOTAL: ${ticketVenta.total.toLocaleString('es-UY')}</p>
                        <p className={`${t.subtext}`}>Pago: {ticketVenta.formaPago}</p>
                        <div className={`border-t border-dashed my-2`} style={{borderColor:'var(--color-border-tertiary)'}}></div>
                        <p className={`text-center ${t.subtext}`}>Gracias por su compra</p>
                      </div>
                      <button onClick={imprimirTicket}
                        className={`mt-3 w-full border rounded-xl py-2.5 text-sm font-medium hover:opacity-80 transition-opacity flex items-center justify-center gap-2`}
                        style={{borderColor:'var(--color-border-tertiary)', color:'var(--color-text-primary)'}}>
                        🖨️ Imprimir ticket
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal agregar/editar producto */}
              {showAddProducto && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                  <div className={`${t.card} border rounded-2xl p-6 w-full max-w-sm`}>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`font-semibold ${t.text}`}>{editingProducto ? 'Editar producto' : 'Agregar producto'}</h2>
                      <button onClick={() => { setShowAddProducto(false); setEditingProducto(null); }} className={`${t.muted} text-xl`}>×</button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Nombre', key: 'nombre', placeholder: 'Ej: Funda iPhone 15' },
                        { label: 'Precio ($)', key: 'precio', placeholder: '0' },
                        { label: 'Stock', key: 'stock', placeholder: '0' },
                        { label: 'Código de barras (opcional)', key: 'codigo_barras', placeholder: 'Escanear o dejar vacío' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>{f.label}</label>
                          <input type={f.key === 'precio' || f.key === 'stock' ? 'number' : 'text'}
                            value={(productoForm as any)[f.key]} placeholder={f.placeholder}
                            onChange={e => setProductoForm({...productoForm, [f.key]: e.target.value})}
                            className={`w-full border ${t.input} p-2.5 rounded-xl outline-none text-sm`} />
                        </div>
                      ))}
                    </div>
                    <button onClick={guardarProducto}
                      className="mt-4 w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl text-sm">
                      {editingProducto ? 'Guardar cambios' : 'Agregar producto'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Calculadora ── */}
        {section === 'calculadora' && (() => {
          const fmt = (v: number) => '$ ' + v.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const tasaIva = ivaPais !== '0' ? parseFloat(ivaPais) : (parseFloat(ivaCustom) || 0);
          const presSubtotal = (parseFloat(pCosto)||0) + (parseFloat(pMano)||0);
          const presConG = presSubtotal * (1 + (parseFloat(pGanancia)||0) / 100);
          const presConD = presConG * (1 - (parseFloat(pDescuento)||0) / 100);
          const presSaldo = Math.max(0, presConD - (parseFloat(pEntrega)||0));
          const ivaBaseN = parseFloat(ivaBase) || 0;
          const ivaFinalN = parseFloat(ivaFinal) || 0;
          const ivaMonto = ivaBaseN ? ivaBaseN * (tasaIva / 100) : 0;
          const ivaFinalCalc = ivaBaseN ? ivaBaseN + ivaMonto : 0;
          const ivaBaseCalc = ivaFinalN ? ivaFinalN / (1 + tasaIva / 100) : 0;
          const ivaMontoDesde = ivaFinalN ? ivaFinalN - ivaBaseCalc : 0;

          const doCalcBtn = (action: string) => {
            const sym: any = {'+':'+','-':'−','*':'×','/':'÷'};
            if (action === 'clear') {
              calcValRef.current = '0';
              setCalcVal('0'); setCalcPrev(null); setCalcOper(null); setCalcNewNum(false);
              setCalcDisplay('0'); setCalcExpr('');
            } else if (action === 'backspace') {
              if (calcNewNum) return;
              const nv = calcVal.length > 1 ? calcVal.slice(0, -1) : '0';
              setCalcVal(nv);
              setCalcDisplay(nv === '0' ? '0' : parseFloat(nv).toLocaleString('es-UY', { maximumFractionDigits: 8 }));
            } else if (action === 'sign') {
              const v = String(-parseFloat(calcVal));
              setCalcVal(v); setCalcDisplay(v);
            } else if (action === 'percent') {
              const v = String(parseFloat(calcVal) / 100);
              setCalcVal(v); setCalcDisplay(v);
            } else if (action === 'dot') {
              if (calcNewNum) { setCalcVal('0.'); setCalcNewNum(false); setCalcDisplay('0.'); }
              else if (!calcVal.includes('.')) { setCalcVal(calcVal + '.'); setCalcDisplay(calcVal + '.'); }
            } else if (action.startsWith('num:')) {
              const n = action.split(':')[1];
              const nv = calcNewNum ? n : (calcVal === '0' ? n : calcVal + n);
              calcValRef.current = nv;
              setCalcVal(nv); setCalcNewNum(false);
              setCalcDisplay(parseFloat(nv).toLocaleString('es-UY', { maximumFractionDigits: 8 }));
              if (calcNewNum && calcOper === null && calcExpr.includes('=')) setCalcExpr('');
            } else if (action.startsWith('op:')) {
              const op = action.split(':')[1];
              let prev = calcPrev;
              let cv = calcVal;
              if (prev !== null && !calcNewNum) {
                const cur = parseFloat(cv);
                let res = op === '+' ? prev+cur : op === '-' ? prev-cur : op === '*' ? prev*cur : cur !== 0 ? prev/cur : NaN;
                cv = isNaN(res) ? 'NaN' : String(+res.toFixed(10));
                setCalcVal(cv);
                setCalcDisplay(isNaN(parseFloat(cv)) ? 'Error' : parseFloat(cv).toLocaleString('es-UY', {maximumFractionDigits:8}));
                prev = parseFloat(cv);
              } else {
                prev = parseFloat(cv);
              }
              setCalcPrev(prev); setCalcOper(op); setCalcNewNum(true);
              setCalcExpr(prev!.toLocaleString('es-UY') + ' ' + sym[op]);
            } else if (action === 'equals') {
              if (calcPrev === null || calcOper === null) return;
              const cur = parseFloat(calcVal);
              let res: number;
              if (calcOper==='+') res=calcPrev+cur;
              else if (calcOper==='-') res=calcPrev-cur;
              else if (calcOper==='*') res=calcPrev*cur;
              else res = cur !== 0 ? calcPrev/cur : NaN;
              const rv = isNaN(res) ? 'NaN' : String(+res.toFixed(10));
              setCalcExpr(`${calcPrev.toLocaleString('es-UY')} ${sym[calcOper]} ${cur.toLocaleString('es-UY')} =`);
              setCalcVal(rv); setCalcNewNum(true); setCalcPrev(null); setCalcOper(null);
              setCalcDisplay(isNaN(parseFloat(rv)) ? 'Error' : parseFloat(rv).toLocaleString('es-UY', {maximumFractionDigits:8}));
            }
          };

          return (
          <div>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${t.text}`}>Calculadora</h1>
              <p className={`${t.subtext} text-sm mt-1`}>Herramientas de cálculo para el taller</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Calculadora básica */}
              <div tabIndex={0} onFocus={() => setCalcFocused(true)} onBlur={() => setCalcFocused(false)} className={`${t.card} border rounded-2xl p-5 outline-none`}>
                <p className={`text-xs ${t.subtext} font-medium mb-3 uppercase tracking-wider`}>Calculadora</p>
                <div className={`${darkMode ? 'bg-zinc-800' : 'bg-slate-100'} rounded-xl p-4 mb-3 border-2 transition-colors ${calcFocused ? 'border-green-500' : 'border-transparent'}`}>
                  <div className={`text-xs ${t.subtext} min-h-[18px] text-right mb-1`}>{calcExpr}</div>
                  <div className={`text-3xl font-mono font-semibold ${t.text} text-right`}>
                    {calcDisplay}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'C', action: 'clear', cls: 'text-red-400' },
                    { label: '+/-', action: 'sign', cls: 'text-blue-400' },
                    { label: '%', action: 'percent', cls: 'text-blue-400' },
                    { label: '÷', action: 'op:/', cls: 'text-blue-400' },
                    { label: '7', action: 'num:7', cls: '' },
                    { label: '8', action: 'num:8', cls: '' },
                    { label: '9', action: 'num:9', cls: '' },
                    { label: '×', action: 'op:*', cls: 'text-blue-400' },
                    { label: '4', action: 'num:4', cls: '' },
                    { label: '5', action: 'num:5', cls: '' },
                    { label: '6', action: 'num:6', cls: '' },
                    { label: '−', action: 'op:-', cls: 'text-blue-400' },
                    { label: '1', action: 'num:1', cls: '' },
                    { label: '2', action: 'num:2', cls: '' },
                    { label: '3', action: 'num:3', cls: '' },
                    { label: '+', action: 'op:+', cls: 'text-blue-400' },
                    { label: '0', action: 'num:0', cls: 'col-span-2' },
                    { label: '.', action: 'dot', cls: '' },
                    { label: '=', action: 'equals', cls: 'bg-green-500 !text-black font-bold border-green-500' },
                  ].map((btn) => (
                    <button key={btn.action}
                      data-calc={btn.action}
                      onClick={() => doCalcBtn(btn.action)}
                      className={`${btn.cls} ${btn.action === 'num:0' ? 'col-span-2' : ''} ${t.card} border rounded-xl py-3 text-sm font-medium hover:opacity-80 transition-opacity`}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculadora de presupuesto */}
              <div className={`${t.card} border rounded-2xl p-5`}>
                <p className={`text-xs ${t.subtext} font-medium mb-4 uppercase tracking-wider`}>Presupuesto de reparación</p>
                <div className="flex flex-col gap-3">
                  {([
                    { label: 'Costo de piezas ($)', val: pCosto, set: setPCosto },
                    { label: 'Mano de obra ($)', val: pMano, set: setPMano },
                    { label: 'Ganancia (%)', val: pGanancia, set: setPGanancia },
                    { label: 'Descuento (%)', val: pDescuento, set: setPDescuento },
                    { label: 'Entrega / seña ($)', val: pEntrega, set: setPEntrega },
                  ] as any[]).map((f: any) => (
                    <div key={f.label}>
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>{f.label}</label>
                      <input type="number" min="0" value={f.val} placeholder="0"
                        onChange={e => { f.set(e.target.value); if (f.label === 'Ganancia (%)') localStorage.setItem('calc_ganancia', e.target.value); }}
                        className={`w-full border ${t.input} p-2.5 rounded-xl outline-none text-sm`} />
                    </div>
                  ))}
                </div>
                <div className={`${darkMode ? 'bg-zinc-800' : 'bg-slate-100'} rounded-xl p-4 mt-4 flex flex-col gap-2`}>
                  {[
                    { label: 'Subtotal', val: fmt(presSubtotal), color: t.subtext },
                    { label: 'Con ganancia', val: fmt(presConG), color: 'text-blue-400' },
                    { label: 'Con descuento', val: fmt(presConD), color: 'text-green-400' },
                    { label: 'Saldo pendiente', val: fmt(presSaldo), color: 'text-red-400', big: true },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className={`text-xs ${r.color}`}>{r.label}</span>
                      <span className={`font-semibold ${r.color} ${r.big ? 'text-lg' : 'text-sm'}`}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculadora IVA */}
              <div className={`${t.card} border rounded-2xl p-5`}>
                <p className={`text-xs ${t.subtext} font-medium mb-4 uppercase tracking-wider`}>Calculadora de IVA</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>País</label>
                    <select value={ivaPais} onChange={e => setIvaPais(e.target.value)}
                      className={`w-full border ${t.select} p-2.5 rounded-xl outline-none text-sm`}>
                      <option value="22">Uruguay — 22%</option>
                      <option value="21">Argentina — 21%</option>
                      <option value="19">Chile — 19%</option>
                      <option value="19">Colombia — 19%</option>
                      <option value="16">México — 16%</option>
                      <option value="12">Ecuador — 12%</option>
                      <option value="18">Perú — 18%</option>
                      <option value="13">Bolivia — 13%</option>
                      <option value="10">Paraguay — 10%</option>
                      <option value="21">España — 21%</option>
                      <option value="0">Personalizado</option>
                    </select>
                  </div>
                  {ivaPais === '0' && (
                    <div>
                      <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Tasa personalizada (%)</label>
                      <input type="number" min="0" max="100" value={ivaCustom} placeholder="0"
                        onChange={e => setIvaCustom(e.target.value)}
                        className={`w-full border ${t.input} p-2.5 rounded-xl outline-none text-sm`} />
                    </div>
                  )}
                  <div>
                    <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Precio base (sin IVA)</label>
                    <input type="number" min="0" value={ivaBase} placeholder="0"
                      onChange={e => { setIvaBase(e.target.value); setIvaFinal(''); }}
                      className={`w-full border ${t.input} p-2.5 rounded-xl outline-none text-sm`} />
                  </div>
                  <div>
                    <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Precio final (con IVA)</label>
                    <input type="number" min="0" value={ivaFinal} placeholder="0"
                      onChange={e => { setIvaFinal(e.target.value); setIvaBase(''); }}
                      className={`w-full border ${t.input} p-2.5 rounded-xl outline-none text-sm`} />
                  </div>
                </div>
                <div className={`${darkMode ? 'bg-zinc-800' : 'bg-slate-100'} rounded-xl p-4 mt-4 flex flex-col gap-2`}>
                  {[
                    { label: 'Tasa aplicada', val: tasaIva + '%', color: t.subtext },
                    { label: 'Precio sin IVA', val: ivaBaseN ? fmt(ivaBaseN) : ivaFinalN ? fmt(ivaBaseCalc) : '—', color: 'text-blue-400', big: true },
                    { label: 'Monto de IVA', val: ivaBaseN ? fmt(ivaMonto) : ivaFinalN ? fmt(ivaMontoDesde) : '—', color: 'text-yellow-400' },
                    { label: 'Precio con IVA', val: ivaBaseN ? fmt(ivaFinalCalc) : ivaFinalN ? fmt(ivaFinalN) : '—', color: 'text-green-400', big: true },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className={`text-xs ${r.color}`}>{r.label}</span>
                      <span className={`font-semibold ${r.color} ${r.big ? 'text-lg' : 'text-sm'}`}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          );
        })()}

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

                {/* Mensajes automáticos */}
                <div className={`border-t ${t.divider} pt-6`}>
                  <h3 className={`text-sm font-bold ${t.text} mb-1`}>Mensajes automáticos de WhatsApp</h3>
                  <p className={`text-xs ${t.subtext} mb-4`}>Variables disponibles: <code className="bg-zinc-700 text-green-400 px-1 rounded">{"{cliente}"}</code> <code className="bg-zinc-700 text-green-400 px-1 rounded">{"{equipo}"}</code> <code className="bg-zinc-700 text-green-400 px-1 rounded">{"{saldo}"}</code></p>
                  <div className="space-y-4">
                    {[
                      { key: 'en_reparacion', label: 'EN REPARACIÓN', msgKey: 'msg_en_reparacion', switchKey: 'switch_en_reparacion' },
                      { key: 'reparado', label: 'REPARADO', msgKey: 'msg_reparado', switchKey: 'switch_reparado' },
                      { key: 'entregado', label: 'ENTREGADO', msgKey: 'msg_entregado', switchKey: 'switch_entregado' },
                    ].map(({ label, msgKey, switchKey }) => (
                      <div key={msgKey} className={`border ${t.divider} rounded-xl p-3`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-xs ${t.subtext} font-medium`}>{label}</label>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${config[switchKey] ? 'text-green-400' : t.subtext}`}>
                              {config[switchKey] ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                              onClick={() => setConfig({...config, [switchKey]: !config[switchKey]})}
                              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${config[switchKey] ? 'bg-green-500' : 'bg-zinc-600'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${config[switchKey] ? 'left-[18px]' : 'left-0.5'}`} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={config[msgKey] || ''}
                          onChange={e => setConfig({...config, [msgKey]: e.target.value})}
                          disabled={!config[switchKey]}
                          className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm min-h-[80px] resize-none ${!config[switchKey] ? 'opacity-40 cursor-not-allowed' : ''}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exportar datos */}
                <div className={`border-t ${t.divider} pt-6`}>
                  <h3 className={`text-sm font-bold ${t.text} mb-1`}>Exportar datos</h3>
                  <p className={`text-xs ${t.subtext} mb-4`}>Descargá un respaldo de tus datos en PDF</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={exportarReparacionesPDF}
                      className={`w-full flex items-center gap-3 border ${t.divider} ${t.badge} py-3 px-4 rounded-xl text-sm font-medium ${t.muted} hover:border-green-500 transition-colors`}>
                      <span className="text-lg">📄</span>
                      <div className="text-left">
                        <p className={`font-medium ${t.text}`}>Exportar reparaciones</p>
                        <p className={`text-xs ${t.subtext}`}>Lista completa de órdenes</p>
                      </div>
                    </button>
                    <button onClick={exportarClientesPDF}
                      className={`w-full flex items-center gap-3 border ${t.divider} ${t.badge} py-3 px-4 rounded-xl text-sm font-medium ${t.muted} hover:border-green-500 transition-colors`}>
                      <span className="text-lg">👥</span>
                      <div className="text-left">
                        <p className={`font-medium ${t.text}`}>Exportar clientes</p>
                        <p className={`text-xs ${t.subtext}`}>Directorio con historial</p>
                      </div>
                    </button>
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
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className={`text-2xl font-bold ${t.text}`}>Reparaciones</h1>
                <p className={`${t.subtext} text-sm mt-1`}>{repairs.length} órdenes en total</p>
              </div>
              <button onClick={() => {
                setEditingRepair(null);
                setForm({ cliente: '', tipo: '', modelo: '', falla: '', telefono: '', contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '', garantia: '', garantiaCustom: '' });
                setShowModal(true);
              }} className="bg-green-500 hover:bg-green-400 text-black px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
                + Nueva Orden
              </button>
            </div>

            <div className={`rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${t.divider} ${t.card}`}>
                <input type="text" placeholder="🔍  Buscar por cliente, equipo o número de orden..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className={`border ${t.input} p-3 rounded-xl w-full outline-none transition-colors text-sm`} />
              </div>

              <div className={`overflow-x-auto ${t.bg}`}>
                <table className="w-full border-separate border-spacing-y-0.5">
                  <thead>
                    <tr>
                      {['Orden', 'Cliente', 'Equipo', 'Falla', 'Costo', 'Entrega', 'Saldo', 'Fecha', 'Estado', ''].map(h => (
                        <th key={h} className={`text-left px-4 py-2 text-xs ${t.tableHead} font-medium uppercase tracking-wider whitespace-nowrap`}>{h}</th>
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
                        <tr key={index} className={`${t.card} transition-colors ${darkMode ? "hover:bg-zinc-800" : "hover:bg-slate-50"}`}>
                          <td className={`px-3 py-2.5 text-xs font-bold text-green-400 whitespace-nowrap rounded-l-xl border-l border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>{repair.orden}</td>
                          <td className={`px-3 py-2.5 text-xs font-medium ${t.text} whitespace-nowrap border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`} style={{whiteSpace: 'pre'}}>{repair.cliente}</td>
                          <td className={`px-3 py-2.5 text-xs ${darkMode ? 'text-zinc-300' : 'text-gray-600'} whitespace-nowrap border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>{repair.equipo}</td>
                          <td className={`px-3 py-2.5 text-xs ${t.muted} max-w-[160px] truncate border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>{repair.falla}</td>
                          <td className={`px-3 py-2.5 text-xs text-blue-400 font-semibold whitespace-nowrap border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>$ {repair.costo || 0}</td>
                          <td className={`px-3 py-2.5 text-xs text-green-400 font-semibold whitespace-nowrap border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>$ {repair.entrega || 0}</td>
                          <td className={`px-3 py-2.5 text-xs text-yellow-400 font-semibold whitespace-nowrap border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>$ {repair.saldo || 0}</td>
                          <td className={`px-3 py-2.5 ${t.subtext} text-xs whitespace-nowrap border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>{repair.fecha}</td>
                          <td className={`px-3 py-2.5 border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                            <select value={repair.estado}
                              onChange={async (e) => {
                                const nuevoEstado = e.target.value;
                                await supabase.from('repairs').update({ estado: nuevoEstado }).eq('id', repair.id);
                                setRepairs(repairs.map((r: any) => r.id === repair.id ? { ...r, estado: nuevoEstado } : r));

                                const buildMsg = (template: string) =>
                                  encodeURIComponent(
                                    template
                                      .replace(/{cliente}/g, repair.cliente)
                                      .replace(/{equipo}/g, repair.equipo)
                                      .replace(/{saldo}/g, repair.saldo || '0')
                                  );
                                let mensaje = '';
                                if (nuevoEstado === 'En reparación' && config.switch_en_reparacion !== false)
                                  mensaje = buildMsg(config.msg_en_reparacion || 'Hola {cliente} 👋\n\nTu equipo {equipo} ya ingresó a reparación 🔧');
                                else if (nuevoEstado === 'Reparado' && config.switch_reparado !== false)
                                  mensaje = buildMsg(config.msg_reparado || 'Hola {cliente} 👋\n\nTu equipo {equipo} ya está reparado y listo para retirar ✅');
                                else if (nuevoEstado === 'Entregado' && config.switch_entregado !== false)
                                  mensaje = buildMsg(config.msg_entregado || 'Hola {cliente} 👋\n\nTu equipo {equipo} ya está pronto para retirar ✅\n\nSaldo pendiente: ${saldo}\n\nGracias por confiar en MegaByte');

                                if (mensaje) {
                                  const numero = repair.telefono?.replace(/\D/g, '')?.replace(/^0/, '');
                                  window.open(`https://wa.me/598${numero}?text=${mensaje}`, '_blank');
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 outline-none cursor-pointer min-w-[110px] ${estadoSelectColor[repair.estado] || (darkMode ? 'bg-zinc-700 text-white' : 'bg-slate-100 text-slate-700')}`}>
                              <option>Pendiente</option>
                              <option>En reparación</option>
                              <option>Reparado</option>
                              <option value="Entregado">Entregado {repair.se_reparo === false ? '❌' : '✅'}</option>
                            </select>
                          </td>
                          <td className={`px-3 py-2.5 relative rounded-r-xl border-r border-t border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
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
                                className={`${t.menuBg} border rounded-xl shadow-2xl w-48 overflow-hidden`}>
                                <button onClick={() => { generatePDF(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>📄 Ticket cliente</button>
                                <button onClick={() => { generateTicketInterno(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>🏷️ Ticket interno</button>
                                <button onClick={() => {
                                  setOpenMenu(null);
                                  setTimeout(() => {
                                    setEntregaForm({ costo: repair.costo || '', entrega: repair.entrega || '', garantia: repair.garantia || '', garantiaCustom: '', seReparo: repair.se_reparo !== false });
                                    setModalEntrega(repair);
                                  }, 50);
                                }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>✅ Ticket entrega</button>
                                <button onClick={() => { editRepair(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>✏️ Editar</button>
                                <a href={`https://wa.me/598${(repair.telefono || '').replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" onClick={() => setOpenMenu(null)} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 block ${t.text}`}>💬 WhatsApp</a>
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
                      {/* Fila 1: Cliente - Teléfono */}
                      <div>
                        <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Cliente</label>
                        <input placeholder="Nombre del cliente" value={form.cliente}
                          autoCapitalize="words"
                          onChange={(e) => {
                            const val = e.target.value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
                            setForm({ ...form, cliente: val });
                          }}
                          className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                      </div>
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
                      {/* Fila 2: Tipo de equipo - Modelo */}
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
                      <div>
                        <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Modelo</label>
                        <input placeholder="Ej: iPhone 13, Lenovo V15" value={form.modelo}
                          onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                          className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                      </div>
                      {/* Fila 3: Falla - Contraseña */}
                      {[
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
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Garantía</label>
                        <select value={(form as any).garantia || ''} onChange={e => setForm({...form, garantia: e.target.value} as any)}
                          className={`w-full border ${t.select} p-3 rounded-xl outline-none transition-colors text-sm`}>
                          <option value="">Sin garantía</option>
                          <option value="30 días">30 días</option>
                          <option value="3 meses">3 meses</option>
                          <option value="otro">Otro...</option>
                        </select>
                      </div>
                      {(form as any).garantia === 'otro' && (
                        <div>
                          <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Especificar garantía</label>
                          <input placeholder="Ej: 6 meses, 1 año..." value={(form as any).garantiaCustom || ''}
                            onChange={e => setForm({...form, garantiaCustom: e.target.value} as any)}
                            className={`w-full border ${t.input} p-3 rounded-xl outline-none transition-colors text-sm`} />
                        </div>
                      )}
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
          </div>
        )}
      </main>

      {/* Modal entrega - nivel global */}
      {modalEntrega && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className={`${t.card} border rounded-2xl p-6 w-full max-w-sm`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-base font-bold ${t.text}`}>Entregar orden {modalEntrega.orden}</p>
                <p className={`text-xs ${t.subtext} mt-0.5`}>{modalEntrega.cliente} — {modalEntrega.equipo}</p>
              </div>
              <button onClick={() => setModalEntrega(null)} className={`${t.muted} text-xl leading-none`}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>¿Se reparó el equipo?</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEntregaForm({...entregaForm, seReparo: true})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${entregaForm.seReparo ? 'bg-green-500/15 border-green-500 text-green-400' : `${t.badge} border ${t.divider} ${t.muted}`}`}>
                    ✅ Reparado
                  </button>
                  <button type="button" onClick={() => setEntregaForm({...entregaForm, seReparo: false})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${!entregaForm.seReparo ? 'bg-red-500/15 border-red-500 text-red-400' : `${t.badge} border ${t.divider} ${t.muted}`}`}>
                    ❌ No reparado
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Costo total ($)</label>
                  <input type="number" value={entregaForm.costo}
                    onChange={e => setEntregaForm({...entregaForm, costo: e.target.value})}
                    className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`} />
                </div>
                <div>
                  <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Entrega ($)</label>
                  <input type="number" value={entregaForm.entrega}
                    onChange={e => setEntregaForm({...entregaForm, entrega: e.target.value})}
                    className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`} />
                </div>
              </div>
              <div className={`${t.badge} rounded-xl p-3 flex justify-between items-center`}>
                <span className={`text-sm ${t.subtext}`}>Saldo pendiente</span>
                <span className={`text-base font-bold ${t.text}`}>$ {Math.max(0, Number(entregaForm.costo || 0) - Number(entregaForm.entrega || 0))}</span>
              </div>
              <div>
                <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Garantía</label>
                <select value={entregaForm.garantia}
                  onChange={e => setEntregaForm({...entregaForm, garantia: e.target.value})}
                  className={`w-full border ${t.select} p-3 rounded-xl outline-none text-sm`}>
                  <option value="">Sin garantía</option>
                  <option value="30 días">30 días</option>
                  <option value="3 meses">3 meses</option>
                  <option value="otro">Otro...</option>
                </select>
              </div>
              {entregaForm.garantia === 'otro' && (
                <div>
                  <label className={`text-xs ${t.subtext} font-medium mb-1 block`}>Especificar garantía</label>
                  <input placeholder="Ej: 6 meses, 1 año..." value={entregaForm.garantiaCustom}
                    onChange={e => setEntregaForm({...entregaForm, garantiaCustom: e.target.value})}
                    className={`w-full border ${t.input} p-3 rounded-xl outline-none text-sm`} />
                </div>
              )}
              <div className="flex gap-2 mt-1">
                <button onClick={() => setModalEntrega(null)}
                  className={`flex-1 ${t.badge} border ${t.divider} py-2.5 rounded-xl text-sm ${t.muted}`}>Cancelar</button>
                <button onClick={confirmarEntrega}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-black py-2.5 rounded-xl text-sm font-bold">
                  Confirmar entrega
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
