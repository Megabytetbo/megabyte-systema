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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalEntrega, setModalEntrega] = useState<any | null>(null);
  const [entregaForm, setEntregaForm] = useState({ costo: '', entrega: '', garantia: '', garantiaCustom: '' });
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showRegistro, setShowRegistro] = useState(false);
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
      else {
        const recordar = localStorage.getItem('megabyte_recordar');
        if (!recordar) await supabase.auth.signOut();
      }
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

  // ── Verificar sesión única cada 30 segundos ───────────────────────────────
  useEffect(() => {
    if (!user || !sessionToken) return;
    const verificarSesion = async () => {
      const { data } = await supabase.from('sesiones_activas')
        .select('session_token').eq('user_id', user.id).single();
      if (data && data.session_token !== sessionToken) {
        alert('Tu sesión fue iniciada en otro dispositivo. Serás desconectado.');
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
    const loadConfig = async () => {
      const { data } = await supabase
        .from('configuracion').select('*').eq('user_id', user.id).single();
      if (data) {
        setConfig(data);
        if (data.is_admin) cargarSuscripciones();
      }
    };
    loadRepairs();
    loadConfig();
    // Verificar suscripcion del usuario
    const verificarAcceso = async () => {
      const { data } = await supabase.from('suscripciones')
        .select('*').eq('email', user.email).single();
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
      await supabase.from('suscripciones').update({ nombre_taller: registroForm.nombre })
        .eq('email', registroForm.email);
      try {
        await supabase.functions.invoke('Bienvenida', {
          body: { email: registroForm.email, nombre_taller: registroForm.nombre },
        });
      } catch (e) { console.error('Email bienvenida error:', e); }
      alert('✅ Cuenta creada. Tenés 10 días de prueba gratis. ¡Bienvenido!');
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
      if (loginForm.recordar) localStorage.setItem('megabyte_recordar', 'true');
      else localStorage.removeItem('megabyte_recordar');
      const token = crypto.randomUUID();
      await supabase.from('sesiones_activas').upsert({
        user_id: data.user.id, session_token: token, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      localStorage.setItem('megabyte_session_token', token);
      setSessionToken(token);
      setUser(data.user);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await supabase.from('sesiones_activas').delete().eq('user_id', user.id);
    }
    await supabase.auth.signOut();
    localStorage.removeItem('megabyte_recordar');
    localStorage.removeItem('megabyte_session_token');
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
    await supabase.from('repairs').update({
      costo, entrega, saldo, estado: 'Entregado', garantia,
    }).eq('id', modalEntrega.id);
    const { data } = await supabase.from('repairs').select('*').order('id', { ascending: false });
    setRepairs(data || []);
    generateTicketEntrega({ ...modalEntrega, costo, entrega, saldo, garantia });
    setModalEntrega(null);
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
          <div class="fila"><span class="label">Fecha:</span><span>${repair.fecha}</span></div>
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
      const numeroOrden = repairs.length + 1;
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
    'Reparado': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    'Entregado': 'bg-green-500/20 text-green-400 border border-green-500/30',
  };

  const estadoSelectColor: any = {
    'Pendiente': 'bg-yellow-500 text-black',
    'En reparación': 'bg-blue-500 text-white',
    'Reparado': 'bg-purple-500 text-white',
    'Entregado': 'bg-green-600 text-white',
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
            <p className="text-zinc-500 text-xs mb-8">Contactá al administrador para activar tu suscripción.</p>
            <button onClick={handleLogout}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-4">
              <span className="text-3xl">🔧</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MegaByte</h1>
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
            <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center text-lg">🔧</div>
            <span className="font-bold text-white text-lg">MegaByte</span>
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-6">
            <span className="text-3xl">🔧</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">El sistema de gestión<br/>para talleres técnicos</h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto">Simple, rápido y desde cualquier dispositivo. Controlá tus reparaciones, clientes y finanzas en un solo lugar.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setShowLanding(false); setShowRegistro(true); }}
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Probá gratis 10 días
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
              <button onClick={() => { setShowLanding(false); setShowRegistro(true); }}
                className="w-full border border-zinc-700 hover:border-zinc-500 text-white py-2.5 rounded-xl text-sm transition-colors">
                Empezar gratis
              </button>
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
              <button onClick={() => { setShowLanding(false); setShowRegistro(true); }}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
                Empezar gratis
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-zinc-500">
            <p>Sin compromisos · Cancelá cuando quieras · 10 días gratis</p>
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-4">
              <span className="text-3xl">🔧</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MegaByte</h1>
            <p className="text-zinc-500 text-sm mt-1">Sistema de gestión técnica</p>
          </div>

          {!showRegistro ? (
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
              <button onClick={() => { setShowRecuperar(true); setRecuperarEnviado(false); setRecuperarEmail(''); }}
                className="w-full text-zinc-500 hover:text-zinc-300 text-xs text-center transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
              <button onClick={() => setShowRegistro(true)}
                className="w-full text-zinc-400 hover:text-white text-sm text-center transition-colors mt-1">
                ¿No tenés cuenta? <span className="text-green-400 font-medium">Probá 10 días gratis</span>
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4">
              <h2 className="text-white font-bold text-lg">Crear cuenta — 10 días gratis</h2>
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
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
    ...(config.is_admin ? [{ id: 'admin', label: 'Admin', icon: '🛡️' }] : []),
  ];

  // ── Días de trial restantes ──────────────────────────────────────────────
  const diasTrialRestantes = (() => {
    if (!suscripcionActual || suscripcionActual.estado !== 'trial' || !suscripcionActual.fecha_vencimiento) return null;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = new Date(suscripcionActual.fecha_vencimiento);
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
      <aside className={`hidden md:flex w-64 ${t.sidebar} border-r flex-col p-5 shrink-0 fixed h-full z-40`}>
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
      </aside>

      {/* Header móvil */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-40 ${t.sidebar} border-b ${t.divider} px-4 py-3 flex items-center justify-between`}
        style={{marginTop: diasTrialRestantes !== null && diasTrialRestantes >= 0 ? '28px' : '0'}}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-sm">🔧</div>
          <span className="font-bold text-white text-sm">MegaByte</span>
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
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-lg shrink-0">🔧</div>
              <div>
                <h1 className="text-lg font-bold text-white leading-none">MegaByte</h1>
                <p className="text-xs text-zinc-500">Sistema técnico</p>
              </div>
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
      <main className="flex-1 overflow-auto p-4 md:p-8 md:ml-64 mt-14 md:mt-0">

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

            {modalEntrega && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className={`${t.card} border rounded-2xl p-6 w-full max-w-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-base font-bold ${t.text}`}>Entregar orden {modalEntrega.orden}</p>
                      <p className={`text-xs ${t.subtext} mt-0.5`}>{modalEntrega.cliente} — {modalEntrega.equipo}</p>
                    </div>
                    <button onClick={() => setModalEntrega(null)} className={`${t.muted} text-xl leading-none`}>×</button>
                  </div>
                  <div className="flex flex-col gap-3">
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
                      const key = `${repair.cliente}||${repair.telefono || ''}`;
                      if (!acc[key]) {
                        acc[key] = { cliente: repair.cliente, telefono: repair.telefono, cantidad: 0, total: 0 };
                      }
                      acc[key].cantidad += 1;
                      acc[key].total += Number(repair.costo || 0);
                      return acc;
                    }, {})
                  ).filter((cliente: any) =>
                    cliente.cliente.toLowerCase().includes(searchClientes.toLowerCase()) ||
                    (cliente.telefono || '').includes(searchClientes)
                  ).map((cliente: any, index: number) => (
                    <tr key={index} className={`border-t ${t.row} transition-colors`}>
                      <td className={`p-4 font-medium ${t.text}`} style={{whiteSpace: 'pre'}}>{cliente.cliente}</td>
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
                        <a href={`https://wa.me/598${(cliente.telefono || '').replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          className="bg-green-500 hover:bg-green-400 px-3 py-1.5 rounded-lg text-black text-sm font-bold transition-colors">
                          WhatsApp
                        </a>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setEditingCliente(cliente);
                            setEditClienteForm({ cliente: cliente.cliente, telefono: (cliente.telefono || '').replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ') });
                          }} className={`${t.badge} px-3 py-1.5 rounded-lg text-sm transition-colors ${t.muted} whitespace-nowrap`}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => {
                            setEditingRepair(null);
                            setForm({ cliente: cliente.cliente, tipo: '', modelo: '', falla: '', telefono: cliente.telefono, contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '', garantia: '', garantiaCustom: '' });
                            setSection('reparaciones');
                            setShowModal(true);
                          }} className="bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-lg text-white text-sm font-bold transition-colors whitespace-nowrap">
                            + Orden
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className={`text-2xl font-bold ${t.text}`}>Panel Admin</h1>
                <p className={`${t.subtext} text-sm mt-1`}>{suscripciones.length} talleres registrados</p>
              </div>
              <button onClick={() => { cargarSuscripciones(); setShowAdminModal({ nombre_taller: '', email: '', plan: 'basic', estado: 'activo', fecha_vencimiento: '' }); }}
                className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-sm">
                + Nuevo taller
              </button>
            </div>
            <div className={`${t.card} border rounded-2xl overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${t.divider}`}>
                    {['Taller', 'Email', 'Plan', 'Vencimiento', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className={`text-left p-4 text-xs ${t.tableHead} font-medium uppercase tracking-wider`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suscripciones.map((sub: any) => (
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
                setForm({ cliente: '', tipo: '', modelo: '', falla: '', telefono: '', contrasena: '', trabajo: '', costo: '', entrega: '', saldo: '', garantia: '', garantiaCustom: '' });
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
                          <td className={`p-4 font-medium ${t.text} whitespace-nowrap`} style={{whiteSpace: 'pre'}}>{repair.cliente}</td>
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
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold border-0 outline-none cursor-pointer ${estadoSelectColor[repair.estado] || 'bg-zinc-700 text-white'}`}>
                              <option>Pendiente</option>
                              <option>En reparación</option>
                              <option>Reparado</option>
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
                                className={`${t.menuBg} border rounded-xl shadow-2xl w-48 overflow-hidden`}>
                                <button onClick={() => { generatePDF(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>📄 Ticket cliente</button>
                                <button onClick={() => { generateTicketInterno(repair); setOpenMenu(null); }} className={`w-full text-left px-3 py-2.5 text-sm ${t.menuItem} transition-colors flex items-center gap-2 ${t.text}`}>🏷️ Ticket interno</button>
                                <button onClick={() => {
                                  setModalEntrega(repair);
                                  setEntregaForm({ costo: repair.costo || '', entrega: repair.entrega || '', garantia: repair.garantia || '', garantiaCustom: '' });
                                  setOpenMenu(null);
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
                          onChange={(e) => setForm({ ...form, cliente: e.target.value })}
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
          </>
        )}
      </main>
    </div>
  );
}
