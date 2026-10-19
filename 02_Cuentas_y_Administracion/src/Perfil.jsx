
import { useEffect, useState } from 'react';
import './Perfil.css';

const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Región Metropolitana',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes'
];

function datosIniciales(usuario = {}) {
  const partes = (usuario.nombreCompleto || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    nombre: usuario.nombre || partes[0] || '',
    apellidoPaterno:
      usuario.apellidoPaterno || partes[1] || '',
    apellidoMaterno:
      usuario.apellidoMaterno ||
      partes.slice(2).join(' ') || '',
    run: usuario.run || '',
    correo: usuario.correo || '',
    telefonoPersonal: (usuario.telefonoPersonal || '')
      .replace(/\D/g, '')
      .replace(/^569/, '')
      .replace(/^9(?=\d{8}$)/, '')
      .slice(-8)
  };
}

function direccionesIniciales(usuario = {}) {
  if (Array.isArray(usuario.direcciones)) {
    return usuario.direcciones;
  }

  if (!usuario.direccion) return [];

  const resultado = usuario.direccion.match(
    /^(.+?),\s*(.+?)\s*#\s*(.+)$/
  );

  return [{
    id: 'registro',
    region: resultado?.[1] || '',
    calle: resultado?.[2] || usuario.direccion,
    numeroCasa: resultado?.[3] || ''
  }];
}

const DIRECCION_VACIA = {
  region: 'Región Metropolitana',
  calle: '',
  numeroCasa: ''
};

export default function Perfil({
  onNavigate,
  usuarioActivo,
  onActualizarUsuario,
  onEliminarCuenta
}) {
  const [seccion, setSeccion] = useState('datos');

  const [datos, setDatos] = useState(
    () => datosIniciales(usuarioActivo)
  );

  const [telefonoEditable, setTelefonoEditable] =
    useState(false);

  const [direcciones, setDirecciones] = useState(
    () => direccionesIniciales(usuarioActivo)
  );

  const [agregandoDireccion, setAgregandoDireccion] =
    useState(false);

  const [direccionNueva, setDireccionNueva] =
    useState(DIRECCION_VACIA);

  const [tarjeta, setTarjeta] = useState({
    numero: '',
    vencimiento: '',
    cvv: ''
  });

  const [tarjetas, setTarjetas] = useState(
    usuarioActivo?.tarjetasResumen || []
  );

  const [clave, setClave] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  const [claveEliminar, setClaveEliminar] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] =
    useState(false);

  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setDatos(datosIniciales(usuarioActivo));
    setDirecciones(direccionesIniciales(usuarioActivo));
    setTarjetas(usuarioActivo?.tarjetasResumen || []);
    setTelefonoEditable(false);
  }, [usuarioActivo]);

  // Cargar datos reales desde PostgreSQL.
  useEffect(() => {
    if (!usuarioActivo?.id) return;

    let cancelado = false;

    fetch('http://localhost:3000/api/perfil', {
      credentials: 'include'
    })
      .then(async respuesta => {
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.error || 'no se pudo cargar el perfil.'
          );
        }

        return resultado;
      })
      .then(resultado => {
        if (cancelado) return;

        setDatos(datosIniciales(resultado.usuario));
        setDirecciones(resultado.direcciones || []);
      })
      .catch(error => {
        if (!cancelado) setMensaje(error.message);
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioActivo?.id]);

  async function solicitarApi(ruta, metodo, contenido) {
    const respuesta = await fetch(
      `http://localhost:3000${ruta}`,
      {
        method: metodo,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        ...(contenido
          ? { body: JSON.stringify(contenido) }
          : {})
      }
    );

    const datosRespuesta = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datosRespuesta.error || 'no se pudo guardar.'
      );
    }

    return datosRespuesta;
  }

  const mostrarMensaje = texto => setMensaje(texto);

  // Guardar datos personales.
  const guardarDatos = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (!/^\d{8}$/.test(datos.telefonoPersonal)) {
      return mostrarMensaje(
        'el celular debe tener exactamente 8 dígitos después de +56 9.'
      );
    }

    const nombreCompleto = [
      datos.nombre,
      datos.apellidoPaterno,
      datos.apellidoMaterno
    ]
      .map(x => String(x || '').trim())
      .filter(Boolean)
      .join(' ');

    if (
      nombreCompleto.length < 3 ||
      nombreCompleto.length > 150
    ) {
      return mostrarMensaje(
        'ingresa un nombre completo válido.'
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)
    ) {
      return mostrarMensaje(
        'ingresa un correo válido.'
      );
    }

    setEnviando(true);

    try {
      const respuesta = await solicitarApi(
        '/api/perfil',
        'PATCH',
        {
          telefonoPersonal: datos.telefonoPersonal,
          nombreCompleto,
          correo: datos.correo
        }
      );

      onActualizarUsuario?.({
        ...usuarioActivo,
        ...respuesta.usuario,
        direcciones
      });

      setTelefonoEditable(false);

      mostrarMensaje(
        'datos actualizados en PostgreSQL.'
      );

    } catch (error) {
      mostrarMensaje(error.message);

    } finally {
      setEnviando(false);
    }
  };

  // Agregar una dirección.
  const agregarDireccion = async (e) => {
    e.preventDefault();
    if (enviando) return;

    const region = direccionNueva.region.trim();
    const calle = direccionNueva.calle.trim();
    const numeroCasa = direccionNueva.numeroCasa.trim();

    if (!region || !calle || !numeroCasa) {
      return mostrarMensaje(
        'completa la región, la calle y el número.'
      );
    }

    setEnviando(true);

    try {
      const respuesta = await solicitarApi(
        '/api/perfil/direcciones',
        'POST',
        { region, calle, numeroCasa }
      );

      const nuevas = respuesta.direcciones;

      setDirecciones(nuevas);

      onActualizarUsuario?.({
        ...usuarioActivo,
        direcciones: nuevas
      });

      setAgregandoDireccion(false);
      setDireccionNueva(DIRECCION_VACIA);

      mostrarMensaje(
        'dirección guardada en PostgreSQL.'
      );

    } catch (error) {
      mostrarMensaje(error.message);

    } finally {
      setEnviando(false);
    }
  };

  // Formato de tarjetas de demostración.
  const formatearTarjeta = valor =>
    valor
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ');

  const formatearVencimiento = valor => {
    const digitos = valor
      .replace(/\D/g, '')
      .slice(0, 4);

    return digitos.length > 2
      ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
      : digitos;
  };

  const agregarTarjeta = (e) => {
    e.preventDefault();

    const numero = tarjeta.numero.replace(/\s/g, '');

    const [mesTexto, anioTexto] =
      tarjeta.vencimiento.split('/');

    const mes = Number(mesTexto);
    const anio = Number(anioTexto);
    const ahora = new Date();

    const vencida =
      !anioTexto ||
      2000 + anio < ahora.getFullYear() ||
      (
        2000 + anio === ahora.getFullYear() &&
        mes < ahora.getMonth() + 1
      );

    if (!/^\d{16}$/.test(numero)) {
      return mostrarMensaje(
        'La tarjeta debe tener 16 números.'
      );
    }

    if (
      !/^\d{2}\/\d{2}$/.test(tarjeta.vencimiento) ||
      mes < 1 ||
      mes > 12 ||
      vencida
    ) {
      return mostrarMensaje(
        'Ingresa una fecha válida y no vencida con formato MM/AA.'
      );
    }

    if (!/^\d{3}$/.test(tarjeta.cvv)) {
      return mostrarMensaje(
        'El código de seguridad debe tener exactamente 3 dígitos.'
      );
    }

    // Nunca conservar el número completo ni el CVV.
    const resumen = {
      id: `tarjeta-${Date.now()}`,
      ultimos4: numero.slice(-4),
      vencimiento: tarjeta.vencimiento
    };

    const nuevas = [...tarjetas, resumen];

    setTarjetas(nuevas);

    onActualizarUsuario?.({
      ...usuarioActivo,
      tarjetasResumen: nuevas
    });

    setTarjeta({
      numero: '',
      vencimiento: '',
      cvv: ''
    });

    mostrarMensaje(
      'Tarjeta de demostración agregada (solo últimos 4 dígitos).'
    );
  };

  // Cambiar contraseña.
  const cambiarContrasena = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (
      clave.nueva.length < 8 ||
      new TextEncoder().encode(clave.nueva).length > 72
    ) {
      return mostrarMensaje(
        'la contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
      );
    }

    if (clave.nueva !== clave.confirmar) {
      return mostrarMensaje(
        'las contraseñas nuevas no coinciden.'
      );
    }

    setEnviando(true);

    try {
      await solicitarApi(
        '/api/perfil/contrasena',
        'PATCH',
        {
          actual: clave.actual,
          nueva: clave.nueva
        }
      );

      setClave({
        actual: '',
        nueva: '',
        confirmar: ''
      });

      mostrarMensaje(
        'contraseña actualizada correctamente en PostgreSQL.'
      );

    } catch (error) {
      mostrarMensaje(error.message);

    } finally {
      setEnviando(false);
    }
  };

  // Eliminar cuenta.
  const eliminarCuenta = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (
      !window.confirm(
        '¿eliminar tu cuenta permanentemente de PostgreSQL?'
      )
    ) {
      return;
    }

    setEnviando(true);

    try {
      await solicitarApi(
        '/api/perfil',
        'DELETE',
        { contrasena: claveEliminar }
      );

      onEliminarCuenta?.();

    } catch (error) {
      mostrarMensaje(error.message);

    } finally {
      setEnviando(false);
    }
  };

  const cambiarSeccion = (id) => {
    setSeccion(id);
    setMensaje('');
    setAgregandoDireccion(false);
    setConfirmarEliminar(false);
  };

  const opcion = (id, icono, titulo) => (
    <button
      type="button"
      className={`pf-opcion ${
        seccion === id ? 'pf-activa' : ''
      }`}
      onClick={() => cambiarSeccion(id)}
    >
      <span className="pf-opcion-icono" aria-hidden="true">
        {icono}
      </span>

      <span>{titulo}</span>

      <span className="pf-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );

  const campoEditable = (campo, titulo, tipo = 'text') => (
    <div className="pf-campo">
      <label htmlFor={`pf-${campo}`}>
        {titulo}
      </label>

      <input
        id={`pf-${campo}`}
        type={tipo}
        value={datos[campo]}
        maxLength={campo === 'correo' ? 150 : 80}
        onChange={e =>
          setDatos(actual => ({
            ...actual,
            [campo]: e.target.value
          }))
        }
      />
    </div>
  );

  const campoFijo = (titulo, valor) => (
    <div className="pf-campo">
      <label>{titulo}</label>

      <div className="pf-valor">
        {valor || 'No registrado'}
      </div>
    </div>
  );

  return (
    <div className="pf-pagina">

      <header className="pf-navbar">
        <button
          type="button"
          className="pf-volver"
          onClick={() => onNavigate('principal')}
          aria-label="Volver"
        >
          ←
        </button>

        <button
          type="button"
          className="pf-logo"
          onClick={() => onNavigate('principal')}
          title="Inicio"
        >
          🛍️
        </button>

        <button
          type="button"
          className="pf-menu"
          onClick={() => onNavigate('principal')}
        >
          ☰ &nbsp;Menú
        </button>

        <button
          type="button"
          className="pf-buscador"
          onClick={() => onNavigate('principal')}
        >
          Buscar productos, marcas y más...
          <span>🔍</span>
        </button>

        <div className="pf-nav-derecha">
          <button
            type="button"
            onClick={() => onNavigate('deseos')}
            aria-label="Favoritos"
          >
            ♡
          </button>

          <button
            type="button"
            onClick={() => onNavigate('carrito')}
            aria-label="Carrito"
          >
            🛒
          </button>

          <button
            type="button"
            className="pf-perfil-activo"
            title="Mi perfil"
          >
            👤
          </button>
        </div>
      </header>

      <div className="pf-contenedor">
        <h1>
          Hola, {
            [
              datos.nombre,
              datos.apellidoPaterno,
              datos.apellidoMaterno
            ].filter(Boolean).join(' ') || 'bienvenido'
          }
        </h1>

        <div className="pf-grid">

          <aside className="pf-lateral">
            <h2>Información personal</h2>

            <div className="pf-menu-caja">
              {opcion('datos', '◉', 'Datos personales')}
              {opcion('direcciones', '⌂', 'Direcciones')}
              {opcion('pagos', '▣', 'Medios de pago')}
            </div>

            <h2>Seguridad</h2>

            <div className="pf-menu-caja">
              {opcion(
                'seguridad',
                '♙',
                'Configurar mi cuenta'
              )}
            </div>
          </aside>

          <section className="pf-panel">
            {mensaje && (
              <p className="pf-mensaje" role="status">
                {mensaje}
              </p>
            )}

            {seccion === 'datos' && (
              <>
                <h2>Datos personales</h2>

                <form
                  onSubmit={guardarDatos}
                  className="pf-formulario"
                >
                  {campoEditable('nombre', 'Nombre')}

                  {campoEditable(
                    'apellidoPaterno',
                    'Apellido paterno'
                  )}

                  {campoEditable(
                    'apellidoMaterno',
                    'Apellido materno'
                  )}

                  {campoFijo('RUT', datos.run)}

                  <div className="pf-campo">
                    <label htmlFor="pf-telefono">
                      Celular
                    </label>

                    <div className="pf-telefono-fila">
                      <span className="pf-prefijo">
                        +56 9
                      </span>

                      <input
                        id="pf-telefono"
                        type="tel"
                        inputMode="numeric"
                        maxLength={8}
                        value={datos.telefonoPersonal}
                        readOnly={!telefonoEditable}
                        onChange={e =>
                          setDatos(actual => ({
                            ...actual,
                            telefonoPersonal: e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 8)
                          }))
                        }
                      />

                      <button
                        type="button"
                        className="pf-lapiz"
                        title="Editar celular"
                        aria-label="Editar celular"
                        onClick={() =>
                          setTelefonoEditable(true)
                        }
                      >
                        ✎
                      </button>
                    </div>
                  </div>

                  {campoEditable(
                    'correo',
                    'Correo electrónico',
                    'email'
                  )}

                  <div className="pf-acciones">
                    <button
                      className="pf-primario"
                      type="submit"
                      disabled={enviando}
                    >
                      {enviando ? 'guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {seccion === 'direcciones' && (
              <>
                <h2>Mis direcciones</h2>

                {direcciones.length === 0 && (
                  <p className="pf-ayuda">
                    Todavía no tienes direcciones registradas.
                  </p>
                )}

                <div className="pf-direcciones">
                  {direcciones.map((dir, i) => (
                    <div
                      className="pf-direccion"
                      key={dir.id || i}
                    >
                      <span>⌂</span>

                      <div>
                        <strong>
                          {i === 0
                            ? 'Dirección principal'
                            : `Dirección ${i + 1}`}
                        </strong>

                        <p>
                          {[
                            dir.region,
                            `${dir.calle || ''}${
                              dir.numeroCasa
                                ? ` #${dir.numeroCasa}`
                                : ''
                            }`
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {!agregandoDireccion ? (
                  <button
                    type="button"
                    className="pf-primario"
                    onClick={() =>
                      setAgregandoDireccion(true)
                    }
                  >
                    + Agregar dirección
                  </button>
                ) : (
                  <form
                    className="pf-formulario"
                    onSubmit={agregarDireccion}
                  >
                    <h3>Nueva dirección</h3>

                    <div className="pf-campo">
                      <label htmlFor="pf-region">
                        Región
                      </label>

                      <select
                        id="pf-region"
                        value={direccionNueva.region}
                        onChange={e =>
                          setDireccionNueva(a => ({
                            ...a,
                            region: e.target.value
                          }))
                        }
                      >
                        {REGIONES.map(r => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pf-campo">
                      <label htmlFor="pf-calle">
                        Calle o avenida
                      </label>

                      <input
                        id="pf-calle"
                        required
                        value={direccionNueva.calle}
                        onChange={e =>
                          setDireccionNueva(a => ({
                            ...a,
                            calle: e.target.value
                          }))
                        }
                        placeholder="Ej. Avenida Principal"
                      />
                    </div>

                    <div className="pf-campo">
                      <label htmlFor="pf-numero">
                        Número
                      </label>

                      <input
                        id="pf-numero"
                        required
                        value={direccionNueva.numeroCasa}
                        onChange={e =>
                          setDireccionNueva(a => ({
                            ...a,
                            numeroCasa: e.target.value
                          }))
                        }
                        placeholder="Ej. 742"
                      />
                    </div>

                    <div className="pf-acciones">
                      <button
                        type="button"
                        className="pf-secundario"
                        onClick={() =>
                          setAgregandoDireccion(false)
                        }
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="pf-primario"
                        disabled={enviando}
                      >
                        {enviando
                          ? 'guardando...'
                          : 'Guardar dirección'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {seccion === 'pagos' && (
              <>
                <h2>Medios de pago</h2>

                <p className="pf-ayuda">
                  Formulario de demostración. No ingreses
                  datos de una tarjeta real hasta integrar
                  un proveedor de pagos.
                </p>

                {tarjetas.map(t => (
                  <div
                    className="pf-direccion"
                    key={t.id}
                  >
                    <span>▣</span>

                    <div>
                      <strong>
                        Tarjeta •••• {t.ultimos4}
                      </strong>
                      <p>Vence {t.vencimiento}</p>
                    </div>
                  </div>
                ))}

                <h3>Agregar tarjeta</h3>

                <form
                  className="pf-formulario"
                  onSubmit={agregarTarjeta}
                  autoComplete="off"
                >
                  <div className="pf-campo">
                    <label htmlFor="pf-numero-tarjeta">
                      Número de tarjeta
                    </label>

                    <input
                      id="pf-numero-tarjeta"
                      inputMode="numeric"
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      required
                      value={tarjeta.numero}
                      onChange={e =>
                        setTarjeta(a => ({
                          ...a,
                          numero: formatearTarjeta(
                            e.target.value
                          )
                        }))
                      }
                    />
                  </div>

                  <div className="pf-dos-columnas">
                    <div className="pf-campo">
                      <label htmlFor="pf-vencimiento">
                        Vencimiento (MM/AA)
                      </label>

                      <input
                        id="pf-vencimiento"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="11/28"
                        required
                        value={tarjeta.vencimiento}
                        onChange={e =>
                          setTarjeta(a => ({
                            ...a,
                            vencimiento:
                              formatearVencimiento(
                                e.target.value
                              )
                          }))
                        }
                      />
                    </div>

                    <div className="pf-campo">
                      <label htmlFor="pf-cvv">
                        Código de seguridad
                      </label>

                      <input
                        id="pf-cvv"
                        type="password"
                        inputMode="numeric"
                        maxLength={3}
                        placeholder="123"
                        required
                        value={tarjeta.cvv}
                        onChange={e =>
                          setTarjeta(a => ({
                            ...a,
                            cvv: e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 3)
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="pf-acciones">
                    <button
                      type="submit"
                      className="pf-primario"
                    >
                      Agregar tarjeta de prueba
                    </button>
                  </div>
                </form>
              </>
            )}

            {seccion === 'seguridad' && (
              <>
                <h2>Configurar mi cuenta</h2>
                <h3>Cambiar contraseña</h3>

                <form
                  className="pf-formulario"
                  onSubmit={cambiarContrasena}
                >
                  <div className="pf-campo">
                    <label htmlFor="pf-clave-actual">
                      Contraseña actual
                    </label>

                    <input
                      id="pf-clave-actual"
                      type="password"
                      required
                      value={clave.actual}
                      onChange={e =>
                        setClave(a => ({
                          ...a,
                          actual: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="pf-campo">
                    <label htmlFor="pf-clave-nueva">
                      Nueva contraseña (mínimo 8 caracteres)
                    </label>

                    <input
                      id="pf-clave-nueva"
                      type="password"
                      required
                      minLength={8}
                      value={clave.nueva}
                      onChange={e =>
                        setClave(a => ({
                          ...a,
                          nueva: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="pf-campo">
                    <label htmlFor="pf-clave-confirmar">
                      Repetir nueva contraseña
                    </label>

                    <input
                      id="pf-clave-confirmar"
                      type="password"
                      required
                      value={clave.confirmar}
                      onChange={e =>
                        setClave(a => ({
                          ...a,
                          confirmar: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="pf-acciones">
                    <button
                      type="submit"
                      className="pf-primario"
                      disabled={enviando}
                    >
                      {enviando
                        ? 'actualizando...'
                        : 'Cambiar contraseña'}
                    </button>
                  </div>
                </form>

                <div className="pf-peligro">
                  <h3>Eliminar cuenta</h3>

                  <p>
                    Esta opción elimina tu cuenta de PostgreSQL.
                    Se necesita confirmar tu contraseña.
                  </p>

                  {!confirmarEliminar ? (
                    <button
                      type="button"
                      className="pf-eliminar"
                      onClick={() =>
                        setConfirmarEliminar(true)
                      }
                    >
                      Eliminar mi cuenta
                    </button>
                  ) : (
                    <form
                      onSubmit={eliminarCuenta}
                      className="pf-formulario"
                    >
                      <label htmlFor="pf-clave-eliminar">
                        Confirma tu contraseña
                      </label>

                      <input
                        id="pf-clave-eliminar"
                        type="password"
                        required
                        value={claveEliminar}
                        onChange={e =>
                          setClaveEliminar(e.target.value)
                        }
                      />

                      <div className="pf-acciones">
                        <button
                          type="button"
                          className="pf-secundario"
                          onClick={() =>
                            setConfirmarEliminar(false)
                          }
                        >
                          Cancelar
                        </button>

                        <button
                          type="submit"
                          className="pf-eliminar"
                          disabled={enviando}
                        >
                          {enviando
                            ? 'eliminando...'
                            : 'Confirmar eliminación'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
