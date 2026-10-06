import React, { useState } from 'react';
import './Perfil.css';

export default function Perfil({ onNavigate }) {
  // 1. ESTADOS DE DATOS PERSONALES FIJOS
  const [datos, setDatos] = useState({
    nombre: 'Juan Ignacio Perez Gonzales',
    correo: 'juanperez@correo.com',
    run: '11.111.111-1',
    fechaNacimiento: '15 / 08 / 1995'
  });

  // Controla qué campo personal se está editando
  const [editandoDatos, setEditandoDatos] = useState({
    nombre: false, correo: false, run: false, fechaNacimiento: false
  });

  // 2. ESTADOS DINÁMICOS (Teléfonos y Direcciones)
  const [telefonos, setTelefonos] = useState([
    { id: 1, valor: '+56 9 1111 1111', editable: false }
  ]);

  const [direcciones, setDirecciones] = useState([
    { id: 1, valor: 'Tomas roa y alarcon, 463', editable: false }
  ]);

  // 3. ESTADOS DEL MODAL DE CONTRASEÑA
  const [mostrarModal, setMostrarModal] = useState(false);
  const [password, setPassword] = useState('');

  // ================= LÓGICA DATOS PERSONALES =================
  const handleDatosChange = (campo, valor) => {
    setDatos({ ...datos, [campo]: valor });
  };

  const toggleEditDatos = (campo) => {
    setEditandoDatos({ ...editandoDatos, [campo]: !editandoDatos[campo] });
  };

  // ================= LÓGICA DINÁMICA (ARRAYS) =================
  // Agregar un nuevo campo vacío
  const agregarCampo = (tipo) => {
    const nuevoElemento = { id: Date.now(), valor: '', editable: true };
    if (tipo === 'telefono') setTelefonos([...telefonos, nuevoElemento]);
    if (tipo === 'direccion') setDirecciones([...direcciones, nuevoElemento]);
  };

  // Eliminar un campo adicional
  const eliminarCampo = (tipo, id) => {
    if (tipo === 'telefono') setTelefonos(telefonos.filter(t => t.id !== id));
    if (tipo === 'direccion') setDirecciones(direcciones.filter(d => d.id !== id));
  };

  // Actualizar el texto mientras se escribe
  const actualizarCampo = (tipo, id, nuevoValor) => {
    if (tipo === 'telefono') {
      setTelefonos(telefonos.map(t => t.id === id ? { ...t, valor: nuevoValor } : t));
    } else {
      setDirecciones(direcciones.map(d => d.id === id ? { ...d, valor: nuevoValor } : d));
    }
  };

  // Habilitar/Deshabilitar edición
  const toggleEditDinamico = (tipo, id) => {
    if (tipo === 'telefono') {
      setTelefonos(telefonos.map(t => t.id === id ? { ...t, editable: !t.editable } : t));
    } else {
      setDirecciones(direcciones.map(d => d.id === id ? { ...d, editable: !d.editable } : d));
    }
  };

  // ================= LÓGICA DEL GUARDADO =================
  const iniciarGuardado = () => {
    setMostrarModal(true);
    setPassword('');
  };

  const confirmarCambios = () => {
    if (password === '1234') {
      
      // 👇 NUEVO: console.log requerido para ver los datos capturados (CRUD Perfil)
      const datosCapturados = {
        personales: datos,
        telefonos: telefonos.map(t => t.valor),
        direcciones: direcciones.map(d => d.valor)
      };
      console.log('Objeto actualizado del Perfil:', datosCapturados);
      // 👆 FIN DE LO NUEVO

      alert('¡Cambios guardados exitosamente!');
      
      // Desactiva todos los modos de edición
      setEditandoDatos({ nombre: false, correo: false, run: false, fechaNacimiento: false });
      setTelefonos(telefonos.map(t => ({ ...t, editable: false })));
      setDirecciones(direcciones.map(d => ({ ...d, editable: false })));
      
      setMostrarModal(false);
    } else {
      alert('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="perfil-page">
      {/* NAVBAR SUPERIOR SIMPLIFICADO */}
      <nav className="navbar-orange">
        <button className="btn-back-home" onClick={() => onNavigate('principal')} title="Volver al inicio">
          &#8592;
        </button>
        <div className="logo-home-circle">
          <img src="https://i.ibb.co/krsRTXZ/Frame-2.png" alt="Logo" />
        </div>
      </nav>

      {/* CONTENIDO DEL PERFIL */}
      <div className="perfil-content">
        <div className="perfil-card">
          <h2 className="perfil-header-name">{datos.nombre}</h2>

          <div className="perfil-grid">
            {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
            <div className="perfil-col">
              <h3 className="col-title">DATOS PERSONALES</h3>

              <div className="perfil-field">
                <label>Nombre completo</label>
                <div className="input-row">
                  <input 
                    type="text" 
                    className="perfil-input" 
                    value={datos.nombre} 
                    disabled={!editandoDatos.nombre}
                    onChange={(e) => handleDatosChange('nombre', e.target.value)}
                  />
                  <button className="action-btn" onClick={() => toggleEditDatos('nombre')}>✎</button>
                </div>
              </div>

              <div className="perfil-field">
                <label>correo electrónico</label>
                <div className="input-row">
                  <input 
                    type="email" 
                    className="perfil-input" 
                    value={datos.correo} 
                    disabled={!editandoDatos.correo}
                    onChange={(e) => handleDatosChange('correo', e.target.value)}
                  />
                  <button className="action-btn" onClick={() => toggleEditDatos('correo')}>✎</button>
                </div>
              </div>

              <div className="perfil-field">
                <label>RUN</label>
                <div className="input-row">
                  <input type="text" className="perfil-input" value={datos.run} disabled />
                  {/* El RUN normalmente no se edita, por eso no tiene lápiz */}
                </div>
              </div>

              <div className="perfil-field">
                <label>Fecha de nacimiento</label>
                <div className="input-row">
                  <input type="text" className="perfil-input" value={datos.fechaNacimiento} disabled />
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: CONTACTO Y DIRECCIONES */}
            <div className="perfil-col">
              <h3 className="col-title">CONTACTO Y DIRECCIONES</h3>

              {/* LISTA DINÁMICA DE TELÉFONOS */}
              <div className="perfil-field">
                <label>Teléfonos</label>
                {telefonos.map((tel, index) => (
                  <div className="input-row" style={{ marginBottom: '10px' }} key={tel.id}>
                    <input 
                      type="text" 
                      className="perfil-input" 
                      placeholder="EJ: +56 9 1111 1111"
                      value={tel.valor}
                      disabled={!tel.editable}
                      onChange={(e) => actualizarCampo('telefono', tel.id, e.target.value)}
                    />
                    <button className="action-btn" onClick={() => toggleEditDinamico('telefono', tel.id)}>✎</button>
                    
                    {/* Botón de eliminar solo para los agregados adicionales */}
                    {index > 0 && (
                      <button className="action-btn btn-delete" onClick={() => eliminarCampo('telefono', tel.id)}>🗑</button>
                    )}
                    
                    {/* Botón de agregar solo en el último elemento */}
                    {index === telefonos.length - 1 && (
                      <button className="action-btn" onClick={() => agregarCampo('telefono')}>+</button>
                    )}
                  </div>
                ))}
              </div>

              {/* LISTA DINÁMICA DE DIRECCIONES */}
              <div className="perfil-field">
                <label>Direcciones</label>
                {direcciones.map((dir, index) => (
                  <div className="input-row" style={{ marginBottom: '10px' }} key={dir.id}>
                    <input 
                      type="text" 
                      className="perfil-input"
                      placeholder="Calle, Número, Comuna"
                      value={dir.valor}
                      disabled={!dir.editable}
                      onChange={(e) => actualizarCampo('direccion', dir.id, e.target.value)}
                    />
                    <button className="action-btn" onClick={() => toggleEditDinamico('direccion', dir.id)}>✎</button>
                    
                    {index > 0 && (
                      <button className="action-btn btn-delete" onClick={() => eliminarCampo('direccion', dir.id)}>🗑</button>
                    )}
                    
                    {index === direcciones.length - 1 && (
                      <button className="action-btn" onClick={() => agregarCampo('direccion')}>+</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="save-container">
            <button className="btn-guardar" onClick={iniciarGuardado}>guardar cambios</button>
          </div>
        </div>
      </div>

      {/* MODAL EMERGENTE DE CONTRASEÑA */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="password-modal">
            <h3>Confirmar Cambios</h3>
            <p style={{ fontSize: '12px', marginBottom: '15px' }}>Ingresa tu contraseña para guardar los cambios en tu perfil.</p>
            
            <input 
              type="password" 
              placeholder="Contraseña (usa 1234 para probar)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn-confirmar" onClick={confirmarCambios}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}