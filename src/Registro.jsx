import React, { useState } from 'react';
import './Registro.css';

// Recibimos 'onClose' para cerrar el modal
export default function Registro({ onClose }) {
  
  // Guardamos todos los valores del formulario en un estado centralizado
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    run: '',
    correo: '',
    telefonoPersonal: '',
    contrasena: '',
    telefonoRespaldo: '',
    confirmarContrasena: '',
    fechaNacimiento: '',
    tipoPerfil: 'Cliente' // Selección por defecto
  });

  // Manejador genérico para actualizar el estado
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Al presionar el botón "Registrar datos"
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos enviados:', formData);
    alert('¡Registro exitoso!');
    onClose(); // Cierra la ventana emergente al enviar
  };

  return (
    // 'modal-overlay' oscurece el fondo. Hacer clic aquí afuera también cierra el modal.
    <div className="modal-overlay" onClick={onClose}>
      
      {/* 'e.stopPropagation()' evita que hacer clic dentro del formulario cierre el modal */}
      <div className="registro-card" onClick={(e) => e.stopPropagation()}>
        
        {/* CABECERA NARANJA */}
        <div className="registro-header">
          {/* Botón superior izquierdo para cerrar */}
          <button 
            className="close-button-registro" 
            onClick={onClose}
            title="Cerrar modal"
          >
            &#8592;
          </button>
          
          <div className="header-logo-circle">
            <img 
              src="https://i.ibb.co/krsRTXZ/Frame-2.png" 
              alt="Logo Compras" 
              className="header-logo-icon"
            />
          </div>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div className="registro-body">
          <h1 className="registro-title">Registro</h1>
          <p className="registro-subtitle">Rellena con tus datos</p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              
              {/* COLUMNA IZQUIERDA */}
              <div className="form-column">
                <div className="field-group">
                  <label htmlFor="nombreCompleto">Nombre completo</label>
                  <input
                    id="nombreCompleto"
                    type="text"
                    name="nombreCompleto"
                    placeholder="EJ: Juan Ignacio Perez Gonzales"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="correo">correo electrónico</label>
                  <input
                    id="correo"
                    type="email"
                    name="correo"
                    placeholder="EJ: juanperez@correo.com"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="contrasena">Contraseña</label>
                  <input
                    id="contrasena"
                    type="password"
                    name="contrasena"
                    placeholder="Introduce tu contraseña"
                    value={formData.contrasena}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
                  <input
                    id="confirmarContrasena"
                    type="password"
                    name="confirmarContrasena"
                    placeholder="Introduce tu contraseña"
                    value={formData.confirmarContrasena}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* TIPO DE PERFIL (RADIO BUTTONS) */}
                <div className="field-group">
                  <label>Tipo de perfil</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="tipoPerfil"
                        value="Cliente"
                        checked={formData.tipoPerfil === 'Cliente'}
                        onChange={handleChange}
                      />
                      Cliente
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="tipoPerfil"
                        value="Emprendedor"
                        checked={formData.tipoPerfil === 'Emprendedor'}
                        onChange={handleChange}
                      />
                      Emprendedor
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="tipoPerfil"
                        value="Administrador"
                        checked={formData.tipoPerfil === 'Administrador'}
                        onChange={handleChange}
                      />
                      Administrador
                    </label>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA */}
              <div className="form-column">
                <div className="field-group">
                  <label htmlFor="run">RUN</label>
                  <input
                    id="run"
                    type="text"
                    name="run"
                    placeholder="EJ: 11.111.111-1"
                    value={formData.run}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="telefonoPersonal">Telefono personal</label>
                  <input
                    id="telefonoPersonal"
                    type="tel"
                    name="telefonoPersonal"
                    placeholder="EJ: +56 9 1111 1111"
                    value={formData.telefonoPersonal}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="telefonoRespaldo">Telefono respaldo</label>
                  <input
                    id="telefonoRespaldo"
                    type="tel"
                    name="telefonoRespaldo"
                    placeholder="EJ: +56 9 1111 1111"
                    value={formData.telefonoRespaldo}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
                  <input
                    id="fechaNacimiento"
                    type="text"
                    name="fechaNacimiento"
                    placeholder="DD / MM / AAAA"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* BOTÓN REGISTRAR DATOS */}
                <div className="submit-container">
                  <button type="submit" className="btn-registrar">
                    Registrar datos
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>

      </div>
    </div>
  );
}