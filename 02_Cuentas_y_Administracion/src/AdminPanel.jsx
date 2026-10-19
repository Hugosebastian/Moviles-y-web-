import { useEffect, useMemo, useState } from 'react';
import './AdminPanel.css';

const normalizar = valor => String(valor ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es-CL')
  .trim();

const runNormalizado = run => String(run ?? '')
  .replace(/\./g, '').replace(/\s/g, '').toUpperCase();

const rolesDe = usuario => Array.isArray(usuario?.tipoPerfil)
  ? usuario.tipoPerfil : [];

const esServicio = item => normalizar(item?.tipo) === 'servicio';

const precioDe = item => {
  const numero = Number(item?.precioNum);
  return Number.isFinite(numero)
    ? `$${numero.toLocaleString('es-CL')}`
    : item?.precioStr || 'sin precio';
};

const nombresSeccion = {
  resumen: 'resumen general',
  solicitudes: 'solicitudes de administrador',
  usuarios: 'gestionar usuarios',
  productos: 'gestionar productos',
  servicios: 'gestionar servicios',
  empresas: 'gestionar empresas'
};

export default function AdminPanel({
  onNavigate,
  usuarios = [],
  setUsuarios,
  publicaciones = [],
  setPublicaciones,
  empresasRegistradas = [],
  setEmpresasRegistradas,
  usuarioActivo,
  seccion = 'resumen',
  onCambiarSeccion,
  onAdminCargar,
  onAdminAccion
}) {
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);
  const [formEdicion, setFormEdicion] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    onAdminCargar?.().catch(e => setMensaje(e.message));
  }, [onAdminCargar]);

  const ejecutar = async (ruta, metodo, datos, mensajeExito) => {
    setCargando(true);
    try {
      await onAdminAccion(ruta, metodo, datos);
      await onAdminCargar();
      setMensaje(mensajeExito);
      return true;
    } catch (e) {
      setMensaje(e.message);
      return false;
    } finally {
      setCargando(false);
    }
  };

  const aprobado = rolesDe(usuarioActivo).includes('Administrador') &&
    usuarioActivo?.estadoAdmin === 'Aprobado' &&
    usuarioActivo?.estadoCuenta !== 'Bloqueada';

  const solicitudes = useMemo(() => usuarios.filter(usuario =>
    usuario.estadoAdmin === 'Pendiente'
  ), [usuarios]);

  const productos = useMemo(() => publicaciones.filter(item =>
    !esServicio(item)
  ), [publicaciones]);

  const servicios = useMemo(() => publicaciones.filter(esServicio), [publicaciones]);

  const irSeccion = destino => {
    setBusqueda('');
    setMensaje('');
    setEditando(null);
    setFormEdicion(null);
    onCambiarSeccion?.(destino);
  };

  const contiene = (...valores) => {
    if (!busqueda.trim()) return true;
    const texto = normalizar(valores.filter(Boolean).join(' '));
    return normalizar(busqueda).split(/\s+/).every(palabra => texto.includes(palabra));
  };

  const decidirSolicitud = async (usuario, aceptar) => {
    if (!window.confirm(`¿${aceptar ? 'Aprobar' : 'Rechazar'} solicitud de ${usuario.nombreCompleto}?`)) return;
    await ejecutar(`/api/admin/usuarios/${usuario.id}/solicitud`, 'PATCH',
      { estado: aceptar ? 'Aprobada' : 'Rechazada' }, 'Solicitud actualizada en PostgreSQL.');
  };

  const cambiarEstadoUsuario = async usuario => {
    if (String(usuario.id) === String(usuarioActivo?.id)) return setMensaje('No puedes bloquear tu propia cuenta.');
    const estado = usuario.estadoCuenta === 'Bloqueada' ? 'Activa' : 'Bloqueada';
    if (!window.confirm(`¿Cambiar la cuenta a ${estado}?`)) return;
    await ejecutar(`/api/admin/usuarios/${usuario.id}/estado`, 'PATCH', { estado }, 'Cuenta actualizada en PostgreSQL.');
  };

  // En lugar de borrar usuarios con pedidos históricos, se desactiva su acceso.
  const eliminarUsuario = async usuario => {
    if (String(usuario.id) === String(usuarioActivo?.id)) return setMensaje('No puedes desactivar tu cuenta.');
    if (!window.confirm(`¿Desactivar a ${usuario.nombreCompleto}? No se perderán sus pedidos históricos.`)) return;
    await ejecutar(`/api/admin/usuarios/${usuario.id}/estado`, 'PATCH', { estado: 'Bloqueada' }, 'Cuenta desactivada.');
  };

  const eliminarPublicacion = async item => {
    if (!window.confirm(`¿Retirar «${item.titulo}» del catálogo?`)) return;
    await ejecutar(`/api/admin/publicaciones/${item.id}/estado`, 'PATCH', { activa: false }, 'Publicación retirada del catálogo.');
  };

  const editarPublicacion = item => {
    setEditando(String(item.id));
    setFormEdicion({
      titulo: String(item.titulo || ''),
      categoria: String(item.categoria || ''),
      precioNum: String(item.precioNum ?? ''),
      stock: String(Number.parseInt(String(item.stock ?? '0'), 10) || 0)
    });
    setMensaje('');
  };

  const guardarPublicacion = async item => {
    if (!formEdicion?.titulo.trim() || !Number.isSafeInteger(Number(formEdicion.precioNum)) || Number(formEdicion.precioNum) <= 0 ||
        !Number.isSafeInteger(Number(formEdicion.stock)) || Number(formEdicion.stock) < 0) {
      setMensaje('Revisa título, precio positivo y stock.'); return;
    }
    const ok = await ejecutar(`/api/admin/publicaciones/${item.id}`, 'PATCH', {
      titulo: formEdicion.titulo.trim(), categoria: formEdicion.categoria.trim(),
      precioNum: Number(formEdicion.precioNum), stock: Number(formEdicion.stock)
    }, 'Publicación actualizada en PostgreSQL.');
    if (ok) { setEditando(null); setFormEdicion(null); }
  };

  const eliminarEmpresa = async empresa => {
    const activa = empresa.activa === false;
    if (!window.confirm(`¿${activa ? 'Reactivar' : 'Desactivar'} la empresa «${empresa.nombreEmpresa}»?`)) return;
    await ejecutar(`/api/admin/empresas/${empresa.id}/estado`, 'PATCH', { activa }, 'Estado de empresa guardado en PostgreSQL.');
  };

  if (!aprobado) {
    return (
      <main className="cvadmin-pagina">
        <section className="cvadmin-tarjeta">
          <h1>acceso restringido</h1>
          <p>solo los administradores aprobados pueden ingresar a este panel.</p>
          <button type="button" className="cvadmin-boton" onClick={() => onNavigate?.('principal')}>
            volver al inicio
          </button>
        </section>
      </main>
    );
  }

  const tarjetas = [
    ['👥', 'usuarios registrados', usuarios.length, 'usuarios'],
    ['📦', 'productos publicados', productos.length, 'productos'],
    ['🛠️', 'servicios publicados', servicios.length, 'servicios'],
    ['🏬', 'empresas registradas', empresasRegistradas.length, 'empresas']
  ];

  const publicacionesActuales = seccion === 'servicios' ? servicios : productos;

  return (
    <main className="cvadmin-pagina">
      <div className="cvadmin-contenedor">
        <header className="cvadmin-encabezado">
          <div>
            <span className="cvadmin-eyebrow">administración de compra y venta</span>
            <h1>panel de administrador</h1>
            <p>gestiona solicitudes, usuarios, empresas y publicaciones.</p>
          </div>
          <button type="button" className="cvadmin-boton cvadmin-boton-claro" onClick={() => onNavigate?.('principal')}>
            ← volver al inicio
          </button>
        </header>

        <nav className="cvadmin-navegacion" aria-label="secciones del administrador">
          {Object.entries(nombresSeccion).map(([clave, nombre]) => (
            <button
              key={clave}
              type="button"
              className={seccion === clave ? 'activo' : ''}
              onClick={() => irSeccion(clave)}
            >
              {nombre}
              {clave === 'solicitudes' && solicitudes.length > 0 && (
                <span className="cvadmin-contador">{solicitudes.length}</span>
              )}
            </button>
          ))}
        </nav>

        <button type="button" className="cvadmin-boton cvadmin-boton-claro" onClick={() => onAdminCargar?.().catch(e => setMensaje(e.message))}>↻ Actualizar desde PostgreSQL</button>
        {cargando && <p role="status">Guardando en PostgreSQL...</p>}
        {mensaje && <p className="cvadmin-mensaje" role="status">{mensaje}</p>}

        {seccion === 'resumen' && (
          <>
            <section className="cvadmin-estadisticas">
              {tarjetas.map(([icono, nombre, cantidad, destino]) => (
                <button key={destino} type="button" className="cvadmin-estadistica" onClick={() => irSeccion(destino)}>
                  <span>{icono}</span>
                  <small>{nombre}</small>
                  <strong>{cantidad}</strong>
                </button>
              ))}
            </section>
            <section className="cvadmin-tarjeta cvadmin-aviso">
              <div>
                <h2>🔔 solicitudes de administrador</h2>
                <p>{solicitudes.length === 0
                  ? 'no tienes solicitudes pendientes por revisar.'
                  : `tienes ${solicitudes.length} solicitud(es) pendiente(s) por revisar.`}</p>
                <p>aprobar una solicitud agrega el rol de administrador sin quitar cliente ni emprendedor.</p>
              </div>
              <button type="button" className="cvadmin-boton" onClick={() => irSeccion('solicitudes')}>
                revisar solicitudes {solicitudes.length > 0 ? `(${solicitudes.length})` : ''}
              </button>
            </section>
          </>
        )}

        {seccion === 'solicitudes' && (
          <section className="cvadmin-tarjeta">
            <h2>solicitudes pendientes</h2>
            <p className="cvadmin-descripcion">
              estas solicitudes vienen del formulario de registro cuando alguien marca
              «solicitar rol de administrador». el permiso solo se concede al aprobar.
            </p>
            {solicitudes.length === 0 ? (
              <div className="cvadmin-vacio">no hay solicitudes pendientes.</div>
            ) : (
              <div className="cvadmin-solicitudes">
                {solicitudes.map(usuario => (
                  <article key={usuario.run} className="cvadmin-solicitud">
                    <div>
                      <h3>{usuario.nombreCompleto}</h3>
                      <p>{usuario.correo} · run: {usuario.run}</p>
                      <div className="cvadmin-roles">
                        {rolesDe(usuario).filter(rol => rol !== 'Administrador').map(rol => (
                          <span key={rol}>{rol.toLowerCase()}</span>
                        ))}
                        <span className="cvadmin-pendiente">admin pendiente</span>
                      </div>
                    </div>
                    <div className="cvadmin-acciones">
                      <button type="button" className="cvadmin-boton cvadmin-boton-claro" onClick={() => decidirSolicitud(usuario, false)}>
                        rechazar
                      </button>
                      <button type="button" className="cvadmin-boton" onClick={() => decidirSolicitud(usuario, true)}>
                        aprobar administrador
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {seccion === 'usuarios' && (
          <section className="cvadmin-tarjeta">
            <h2>usuarios registrados</h2>
            <input
              className="cvadmin-busqueda"
              type="search"
              placeholder="buscar por nombre, run o correo..."
              value={busqueda}
              onChange={evento => setBusqueda(evento.target.value)}
            />
            <div className="cvadmin-tabla-scroll">
              <table className="cvadmin-tabla">
                <thead><tr><th>usuario</th><th>perfiles</th><th>solicitud admin</th><th>estado</th><th>acciones</th></tr></thead>
                <tbody>
                  {usuarios.filter(usuario => contiene(usuario.nombreCompleto, usuario.run, usuario.correo)).map(usuario => (
                    <tr key={usuario.run}>
                      <td><strong>{usuario.nombreCompleto}</strong><small>{usuario.correo}</small><small>{usuario.run}</small></td>
                      <td><div className="cvadmin-roles">{rolesDe(usuario).map(rol => <span key={rol}>{rol.toLowerCase()}</span>)}</div></td>
                      <td>{usuario.estadoAdmin === 'Pendiente' ? (
                        <button type="button" className="cvadmin-enlace" onClick={() => irSeccion('solicitudes')}>pendiente de revisión →</button>
                      ) : normalizar(usuario.estadoAdmin || 'sin solicitud')}</td>
                      <td>{usuario.estadoCuenta === 'Bloqueada' ? 'bloqueada' : 'activa'}</td>
                      <td><div className="cvadmin-acciones">
                        <button type="button" className="cvadmin-boton cvadmin-boton-claro" onClick={() => cambiarEstadoUsuario(usuario)}>
                          {usuario.estadoCuenta === 'Bloqueada' ? 'reactivar' : 'bloquear'}
                        </button>
                        <button type="button" className="cvadmin-boton cvadmin-peligro" onClick={() => eliminarUsuario(usuario)}>
                          eliminar
                        </button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {(seccion === 'productos' || seccion === 'servicios') && (
          <section className="cvadmin-tarjeta">
            <h2>{nombresSeccion[seccion]}</h2>
            <input
              className="cvadmin-busqueda"
              type="search"
              placeholder={`buscar ${seccion}...`}
              value={busqueda}
              onChange={evento => setBusqueda(evento.target.value)}
            />
            <div className="cvadmin-tabla-scroll">
              <table className="cvadmin-tabla">
                <thead><tr><th>publicación</th><th>categoría</th><th>precio</th><th>stock / cupos</th><th>acciones</th></tr></thead>
                <tbody>
                  {publicacionesActuales.filter(item => contiene(item.titulo, item.categoria, item.empresaNombre)).map(item => (
                    <tr key={item.id}>
                      {editando === String(item.id) ? (
                        <>
                          <td><input aria-label="nombre de la publicación" value={formEdicion.titulo} onChange={e => setFormEdicion(actual => ({ ...actual, titulo: e.target.value }))} /></td>
                          <td><input aria-label="categoría" value={formEdicion.categoria} onChange={e => setFormEdicion(actual => ({ ...actual, categoria: e.target.value }))} /></td>
                          <td><input aria-label="precio" type="number" min="0" value={formEdicion.precioNum} onChange={e => setFormEdicion(actual => ({ ...actual, precioNum: e.target.value }))} /></td>
                          <td><input aria-label="stock o cupos" type="number" min="0" step="1" value={formEdicion.stock} onChange={e => setFormEdicion(actual => ({ ...actual, stock: e.target.value }))} /></td>
                          <td><div className="cvadmin-acciones">
                            <button type="button" className="cvadmin-boton" onClick={() => guardarPublicacion(item)}>guardar</button>
                            <button type="button" className="cvadmin-boton cvadmin-boton-claro" onClick={() => { setEditando(null); setFormEdicion(null); }}>cancelar</button>
                          </div></td>
                        </>
                      ) : (
                        <>
                          <td><strong>{item.titulo}</strong><small>{item.empresaNombre || item.vendedor || 'sin empresa asociada'}</small></td>
                          <td>{item.categoria || item.seccion || 'sin categoría'}</td>
                          <td>{precioDe(item)}</td>
                          <td>{String(item.stock ?? 'no indicado')}</td>
                          <td><div className="cvadmin-acciones">
                            <button type="button" className="cvadmin-boton cvadmin-boton-claro" onClick={() => editarPublicacion(item)}>editar</button>
                            <button type="button" className="cvadmin-boton cvadmin-peligro" onClick={() => eliminarPublicacion(item)}>eliminar</button>
                          </div></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {seccion === 'empresas' && (
          <section className="cvadmin-tarjeta">
            <h2>empresas registradas</h2>
            <input
              className="cvadmin-busqueda"
              type="search"
              placeholder="buscar empresa, rut o propietario..."
              value={busqueda}
              onChange={evento => setBusqueda(evento.target.value)}
            />
            <div className="cvadmin-tabla-scroll">
              <table className="cvadmin-tabla">
                <thead><tr><th>empresa</th><th>rut</th><th>propietario</th><th>contacto</th><th>acciones</th></tr></thead>
                <tbody>
                  {empresasRegistradas.filter(empresa => contiene(empresa.nombreEmpresa, empresa.runEmpresa, empresa.propietarioRun)).map(empresa => (
                    <tr key={empresa.id}>
                      <td><strong>{empresa.nombreEmpresa}</strong></td>
                      <td>{empresa.runEmpresa}</td>
                      <td>{usuarios.find(u => runNormalizado(u.run) === runNormalizado(empresa.propietarioRun))?.nombreCompleto || empresa.propietarioRun}</td>
                      <td>{empresa.correo || 'sin correo'}</td>
                      <td><button type="button" className="cvadmin-boton cvadmin-peligro" onClick={() => eliminarEmpresa(empresa)}>{empresa.activa === false ? 'reactivar' : 'desactivar'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
