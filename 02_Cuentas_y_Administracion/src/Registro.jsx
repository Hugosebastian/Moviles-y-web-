import Logo from './Logo';

import React, { useState } from 'react';
import './Registro.css';

export default function Registro({ onClose, onRegistroExitoso }) {

  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correoLocal: '',
    correoDominio: '',
    fechaNacimiento: '',
    runCuerpo: '',
    runDigito: '',
    region: 'Región Metropolitana',
    calle: '',
    numeroCasa: '',
    telefono: '',
    contrasena: '',
    repetirContrasena: '',
    tipoPerfil: ['Cliente'],
    quiereSerAdmin: false
  });

  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false)
  


  const regionesChile = [
    "Arica y Parinacota",
    "Tarapacá",
    "Antofagasta",
    "Atacama",
    "Coquimbo",
    "Valparaíso",
    "Región Metropolitana",
    "O'Higgins",
    "Maule",
    "Ñuble",
    "Biobío",
    "Araucanía",
    "Los Ríos",
    "Los Lagos",
    "Aysén",
    "Magallanes"
  ];

  const hoy = new Date();

  const fechaMax = new Date(
    hoy.getFullYear() - 14,
    hoy.getMonth(),
    hoy.getDate()
  ).toISOString().split("T")[0];

  // ============================================
  // CONFIRMAR CIERRE DEL REGISTRO
  // ============================================

  const handleCloseConfirm = () => {
    if (
      window.confirm(
        "¿estás seguro de dejar el proceso de registro?"
      )
    ) {
      onClose();
    }
  };

  // ============================================
  // CAMBIOS EN EL FORMULARIO
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Solo una palabra sin espacios
    if (
      [
        'nombre',
        'apellidoPaterno',
        'apellidoMaterno',
        'correoLocal',
        'correoDominio'
      ].includes(name)
    ) {
      setFormData({
        ...formData,
        [name]: value.replace(/\s/g, '')
      });
    }

    // RUN: solo números
    else if (name === 'runCuerpo') {
      setFormData({
        ...formData,
        runCuerpo: value
          .replace(/[^0-9]/g, '')
          .slice(0, 9)
      });
    }

    // Dígito verificador
    else if (name === 'runDigito') {
      setFormData({
        ...formData,
        runDigito: value
          .toUpperCase()
          .replace(/[^0-9K]/g, '')
          .slice(0, 1)
      });
    }

    // Teléfono
    else if (name === 'telefono') {
      setFormData({
        ...formData,
        telefono: value.replace(/[^0-9]/g, '')
      });
    }

    // Demás campos
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // ============================================
  // TIPOS DE PERFIL
  // ============================================

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    let nuevosPerfiles = [...formData.tipoPerfil];

    if (checked) {
      nuevosPerfiles.push(value);
    } else {
      if (nuevosPerfiles.length === 1) {
        alert(
          "debes mantener al menos 1 tipo de perfil seleccionado."
        );
        return;
      }

      nuevosPerfiles = nuevosPerfiles.filter(
        p => p !== value
      );
    }

    setFormData({
      ...formData,
      tipoPerfil: nuevosPerfiles
    });
  };

  // ============================================
  // CREAR CUENTA
  // ============================================

  
const handleSubmit = async (e) => {
  e.preventDefault();

  if (enviando) return;

  // Validar RUN completo.
  if (!formData.runCuerpo || !formData.runDigito) {
    alert('el run está incompleto.');
    return;
  }

  // Validar correo.
  if (!formData.correoLocal || !formData.correoDominio) {
    alert('el correo electrónico está incompleto.');
    return;
  }

  // Validar teléfono.
  if (formData.telefono.length !== 8) {
    alert('el teléfono personal debe tener exactamente 8 números.');
    return;
  }

  // Validar contraseña.
  if (formData.contrasena.length < 8) {
    alert('la contraseña debe tener al menos 8 caracteres.');
    return;
  }

  if (formData.contrasena !== formData.repetirContrasena) {
    alert('las contraseñas no coinciden.');
    return;
  }

  // Validar edad.
  const fechaNac = new Date(
    `${formData.fechaNacimiento}T12:00:00`
  );

  if (Number.isNaN(fechaNac.getTime())) {
    alert('ingresa una fecha de nacimiento válida.');
    return;
  }

  let edad = hoy.getFullYear() - fechaNac.getFullYear();

  const mes = hoy.getMonth() - fechaNac.getMonth();

  if (
    mes < 0 ||
    (mes === 0 && hoy.getDate() < fechaNac.getDate())
  ) {
    edad--;
  }

  if (edad < 14) {
    alert('debes tener al menos 14 años para registrarte.');
    return;
  }

  // Preparar datos para Node.js.
  const runCompleto =
    `${formData.runCuerpo}-${formData.runDigito}`;

  const correoCompleto =
    `${formData.correoLocal}@${formData.correoDominio}`;

  const perfilesFinales = [
    ...new Set(formData.tipoPerfil)
  ];

  const nuevoUsuario = {
    nombreCompleto: [
      formData.nombre,
      formData.apellidoPaterno,
      formData.apellidoMaterno
    ].filter(Boolean).join(' '),

    run: runCompleto,
    correo: correoCompleto,
    fechaNacimiento: formData.fechaNacimiento,
    telefonoPersonal: formData.telefono,
    contrasena: formData.contrasena,
    tipoPerfil: perfilesFinales,

    region: formData.region,
    calle: formData.calle,
    numeroCasa: formData.numeroCasa,
    quiereSerAdmin: formData.quiereSerAdmin
  };

  // Enviar al backend y esperar el resultado.
  setEnviando(true);

  try {
    const resultado = await onRegistroExitoso(nuevoUsuario);

    if (!resultado?.ok) {
      alert(
        resultado?.error ||
        'no se pudo crear la cuenta.'
      );
      return;
    }

    alert(
      formData.quiereSerAdmin
        ? 'cuenta creada. tu solicitud de administrador quedó pendiente de revisión.'
        : 'cuenta creada con éxito.'
    );

    onClose();

  } catch (error) {
    alert('ocurrió un error al registrar la cuenta.');

  } finally {
    setEnviando(false);
  }
};


  // ============================================
  // INTERFAZ DEL REGISTRO
  // ============================================

  return (
    <div
      className="modal-overlay"
      onClick={handleCloseConfirm}
    >
      <div
        className="registro-card"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ENCABEZADO */}

        <div className="registro-header">
          <button
            className="close-button-registro"
            onClick={handleCloseConfirm}
            title="volver"
          >
            &#8592;
          </button>

          <div className="header-logo-circle">
            <Logo
              alt="logo"
              className="header-logo-icon"
            />
          </div>
        </div>

        <div className="registro-body">

          {/* TÍTULO */}

          <div className="registro-title-container">
            <h1 className="registro-title">
              registro
            </h1>

            <p className="registro-subtitle">
              rellena con tus datos
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="form-layout"
          >

            {/* ============================== */}
            {/* COLUMNA IZQUIERDA              */}
            {/* ============================== */}

            <div className="col-left">

              <div className="field-group">
                <label>nombre</label>

                <input
                  type="text"
                  name="nombre"
                  placeholder="ej.: juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label>apellido paterno</label>

                <input
                  type="text"
                  name="apellidoPaterno"
                  placeholder="ej.: pérez"
                  value={formData.apellidoPaterno}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label>apellido materno</label>

                <input
                  type="text"
                  name="apellidoMaterno"
                  placeholder="ej.: gonzález"
                  value={formData.apellidoMaterno}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label>correo electrónico</label>

                <div className="input-compuesto">
                  <input
                    type="text"
                    name="correoLocal"
                    className="input-correo-local"
                    placeholder="juanperez"
                    value={formData.correoLocal}
                    onChange={handleChange}
                    required
                  />

                  <span className="dibujo dibujo-arroba">
                    @
                  </span>

                  <input
                    type="text"
                    name="correoDominio"
                    className="input-correo-dominio"
                    placeholder="correo.com"
                    value={formData.correoDominio}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>fecha de nacimiento</label>

                <input
                  type="date"
                  name="fechaNacimiento"
                  max={fechaMax}
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* TIPOS DE PERFIL */}

              <div className="perfil-container">
                <label>
                  tipo de perfil (puedes elegir ambos)
                </label>

                <div className="checkbox-group">

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      value="Cliente"
                      checked={
                        formData.tipoPerfil.includes(
                          'Cliente'
                        )
                      }
                      onChange={handleCheckboxChange}
                    />
                    {' '}cliente
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      value="Emprendedor"
                      checked={
                        formData.tipoPerfil.includes(
                          'Emprendedor'
                        )
                      }
                      onChange={handleCheckboxChange}
                    />
                    {' '}emprendedor
                  </label>

                  <label
                    className="checkbox-label"
                    style={{
                      color: '#ff6600',
                      marginTop: '6px',
                      background: '#fff3ec',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ffccaa'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        formData.quiereSerAdmin
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quiereSerAdmin:
                            e.target.checked
                        })
                      }
                    />
                    {' '}solicitar rol de administrador (requiere aprobación)
                  </label>

                </div>
              </div>

            </div>

            {/* ============================== */}
            {/* COLUMNA DERECHA                */}
            {/* ============================== */}

            <div className="col-right">

              <div className="field-group">
                <label>run</label>

                <div className="input-compuesto">
                  <input
                    type="text"
                    name="runCuerpo"
                    className="input-run-cuerpo"
                    placeholder="11111111"
                    maxLength={9}
                    value={formData.runCuerpo}
                    onChange={handleChange}
                    required
                  />

                  <span className="dibujo dibujo-guion">
                    -
                  </span>

                  <input
                    type="text"
                    name="runDigito"
                    className="input-run-dv"
                    placeholder="k"
                    maxLength={1}
                    value={formData.runDigito}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>dirección</label>

                <div className="input-compuesto">
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    style={{
                      maxWidth: '140px',
                      borderRight: '1px solid #ccc'
                    }}
                    required
                  >
                    {regionesChile.map(reg => (
                      <option
                        key={reg}
                        value={reg}
                      >
                        {reg.toLocaleLowerCase('es-CL')}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    name="calle"
                    className="input-calle"
                    placeholder="avenida siempre viva"
                    value={formData.calle}
                    onChange={handleChange}
                    required
                  />

                  <span className="dibujo dibujo-gato">
                    #
                  </span>

                  <input
                    type="text"
                    name="numeroCasa"
                    className="input-numero"
                    placeholder="742"
                    value={formData.numeroCasa}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>teléfono personal</label>

                <div className="input-compuesto">
                  <span className="phone-prefix">
                    cl +56 9
                  </span>

                  <input
                    type="text"
                    name="telefono"
                    placeholder="11111111"
                    value={formData.telefono}
                    onChange={handleChange}
                    maxLength="8"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>contraseña</label>

                <div className="password-input-container-reg">
                  <input
                    type={
                      verContrasena
                        ? 'text'
                        : 'password'
                    }
                    name="contrasena"
                    placeholder="introduce tu contraseña"
                    maxLength={20}
                    value={formData.contrasena}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="toggle-password-reg"
                    onClick={() =>
                      setVerContrasena(
                        !verContrasena
                      )
                    }
                  >
                    {verContrasena
                      ? '👁️'
                      : '🙈'}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label>confirmar contraseña</label>

                <div className="password-input-container-reg">
                  <input
                    type={
                      verConfirmar
                        ? 'text'
                        : 'password'
                    }
                    name="repetirContrasena"
                    placeholder="confirma tu contraseña"
                    maxLength={20}
                    value={
                      formData.repetirContrasena
                    }
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="toggle-password-reg"
                    onClick={() =>
                      setVerConfirmar(
                        !verConfirmar
                      )
                    }
                  >
                    {verConfirmar
                      ? '👁️'
                      : '🙈'}
                  </button>
                </div>
              </div>

              {/* BOTÓN CREAR CUENTA */}

              <div className="submit-container">
                <button
                  type="submit"
                  className="btn-registrar"
                  disabled={enviando}
                >
                  {enviando ? 'registrando...' : 'crear cuenta'}
                </button>
              </div>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
