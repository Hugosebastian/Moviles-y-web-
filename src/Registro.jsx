import React, { useState } from 'react';
import './Registro.css';

export default function Registro({ onClose }) {

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    run: '',
    correo: '',
    telefonoPersonal: '',
    contrasena: '',
    telefonoRespaldo: '',
    confirmarContrasena: '',
    fechaNacimiento: '',
    tipoPerfil: 'Cliente'
  });

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [error, setError] = useState('');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);


  // =========================================================
  // FORMATEAR RUN
  // Ejemplo:
  // 202343562 -> 20.234.356-2
  // =========================================================

  const formatearRun = (valor) => {

    let numeros = valor.replace(/\D/g, '');

    numeros = numeros.slice(0, 9);

    if (numeros.length === 0) {
      return '';
    }

    if (numeros.length === 1) {
      return numeros;
    }

    const cuerpo = numeros.slice(0, -1);
    const dv = numeros.slice(-1);

    const cuerpoFormateado = cuerpo.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      '.'
    );

    return `${cuerpoFormateado}-${dv}`;
  };


  // =========================================================
  // VALIDAR RUN CHILENO
  // =========================================================

  const validarRun = (run) => {

    const limpio = run
      .replace(/\./g, '')
      .replace('-', '');

    if (!/^\d{7,9}$/.test(limpio)) {
      return false;
    }

    const cuerpo = limpio.slice(0, -1);
    const dvIngresado = limpio.slice(-1).toUpperCase();

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {

      suma += parseInt(cuerpo[i], 10) * multiplicador;

      multiplicador++;

      if (multiplicador > 7) {
        multiplicador = 2;
      }
    }

    const resto = 11 - (suma % 11);

    let dvCalculado;

    if (resto === 11) {
      dvCalculado = '0';
    } else if (resto === 10) {
      dvCalculado = 'K';
    } else {
      dvCalculado = resto.toString();
    }

    return dvIngresado === dvCalculado;
  };


  // =========================================================
  // CAMBIOS EN LOS CAMPOS
  // =========================================================

  const handleChange = (e) => {

    const { name, value } = e.target;


    // RUN
    if (name === 'run') {

      const runFormateado = formatearRun(value);

      setFormData({
        ...formData,
        run: runFormateado
      });

      setError('');

      return;
    }


    // NOMBRE
    if (name === 'nombreCompleto') {

      const soloLetras = value.replace(
        /[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g,
        ''
      );

      setFormData({
        ...formData,
        nombreCompleto: soloLetras
      });

      setError('');

      return;
    }


    // TELÉFONO PERSONAL
    if (name === 'telefonoPersonal') {

      const soloNumeros = value
        .replace(/\D/g, '')
        .slice(0, 11);

      setFormData({
        ...formData,
        telefonoPersonal: soloNumeros
      });

      setError('');

      return;
    }


    // TELÉFONO RESPALDO
    if (name === 'telefonoRespaldo') {

      const soloNumeros = value
        .replace(/\D/g, '')
        .slice(0, 11);

      setFormData({
        ...formData,
        telefonoRespaldo: soloNumeros
      });

      setError('');

      return;
    }


    // OTROS CAMPOS
    setFormData({
      ...formData,
      [name]: value
    });

    setError('');
  };


  // =========================================================
  // VALIDAR FORMULARIO
  // =========================================================

  const validarFormulario = () => {

    if (!formData.nombreCompleto.trim()) {
      setError('ingresa tu nombre completo.');
      return false;
    }

    if (formData.nombreCompleto.trim().length < 3) {
      setError('el nombre debe tener al menos 3 caracteres.');
      return false;
    }


    if (!formData.run) {
      setError('ingresa tu run.');
      return false;
    }

    if (!validarRun(formData.run)) {
      setError('el run ingresado no es válido.');
      return false;
    }


    if (!formData.correo) {
      setError('ingresa tu correo electrónico.');
      return false;
    }

    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.correo
      );

    if (!correoValido) {
      setError('ingresa un correo electrónico válido.');
      return false;
    }


    if (!formData.telefonoPersonal) {
      setError('ingresa tu teléfono personal.');
      return false;
    }

    if (formData.telefonoPersonal.length < 9) {
      setError(
        'el teléfono personal debe tener al menos 9 números.'
      );
      return false;
    }


    if (!formData.contrasena) {
      setError('ingresa una contraseña.');
      return false;
    }

    if (formData.contrasena.length < 8) {
      setError(
        'la contraseña debe tener al menos 8 caracteres.'
      );
      return false;
    }


    if (!formData.confirmarContrasena) {
      setError('confirma tu contraseña.');
      return false;
    }

    if (
      formData.contrasena !==
      formData.confirmarContrasena
    ) {
      setError('las contraseñas no coinciden.');
      return false;
    }


    if (
      formData.telefonoRespaldo &&
      formData.telefonoRespaldo.length < 9
    ) {
      setError(
        'el teléfono de respaldo debe tener al menos 9 números.'
      );
      return false;
    }


    if (!formData.fechaNacimiento) {
      setError(
        'selecciona tu fecha de nacimiento.'
      );
      return false;
    }


    return true;
  };


  // =========================================================
  // REGISTRAR
  // =========================================================

  const handleSubmit = (e) => {

    e.preventDefault();

    setError('');

    if (!validarFormulario()) {
      return;
    }

    setMostrarConfirmacion(true);
  };


  // =========================================================
  // CONFIRMAR REGISTRO
  // =========================================================

  const confirmarRegistro = () => {

    console.log(
      'datos registrados:',
      formData
    );

    setMostrarConfirmacion(false);

    setMostrarExito(true);
  };


  // =========================================================
  // CERRAR MENSAJE DE ÉXITO
  // =========================================================

  const cerrarExito = () => {

    setMostrarExito(false);

    if (onClose) {
      onClose();
    }
  };


  return (

    <div
      className="modal-overlay"
      onClick={onClose}
    >

      {/* =====================================================
          TARJETA PRINCIPAL
      ====================================================== */}

      <div
        className="registro-card"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* CABECERA */}

        <div className="registro-header">

          <button
            type="button"
            className="close-button-registro"
            onClick={onClose}
            title="cerrar"
          >
            &#8592;
          </button>


          <div className="header-logo-circle">

            <img
              src="https://i.ibb.co/krsRTXZ/Frame-2.png"
              alt="logo compras"
              className="header-logo-icon"
            />

          </div>

        </div>


        {/* CUERPO */}

        <div className="registro-body">

          <h1 className="registro-title">
            registro
          </h1>

          <p className="registro-subtitle">
            rellena con tus datos
          </p>


          {/* ERROR */}

          {error && (

            <div className="error-message">
              {error}
            </div>

          )}


          <form onSubmit={handleSubmit}>

            <div className="form-grid">


              {/* =================================================
                  COLUMNA IZQUIERDA
              ================================================== */}

              <div className="form-column">


                {/* NOMBRE */}

                <div className="field-group">

                  <label htmlFor="nombreCompleto">
                    nombre completo
                  </label>

                  <input
                    id="nombreCompleto"
                    type="text"
                    name="nombreCompleto"
                    placeholder="ej: juan ignacio perez gonzales"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />

                </div>


                {/* CORREO */}

                <div className="field-group">

                  <label htmlFor="correo">
                    correo electrónico
                  </label>

                  <input
                    id="correo"
                    type="email"
                    name="correo"
                    placeholder="ej: juanperez@correo.com"
                    value={formData.correo}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />

                </div>


                {/* CONTRASEÑA */}

                <div className="field-group">

                  <label htmlFor="contrasena">
                    contraseña
                  </label>

                  <div className="password-container">

                    <input
                      id="contrasena"
                      type={
                        mostrarContrasena
                          ? 'text'
                          : 'password'
                      }
                      name="contrasena"
                      placeholder="introduce tu contraseña"
                      value={formData.contrasena}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="eye-button"
                      onClick={() =>
                        setMostrarContrasena(
                          !mostrarContrasena
                        )
                      }
                      title={
                        mostrarContrasena
                          ? 'ocultar contraseña'
                          : 'mostrar contraseña'
                      }
                    >
                      {mostrarContrasena
                        ? '🙈'
                        : '👁️'}
                    </button>

                  </div>

                </div>


                {/* CONFIRMAR CONTRASEÑA */}

                <div className="field-group">

                  <label htmlFor="confirmarContrasena">
                    confirmar contraseña
                  </label>

                  <div className="password-container">

                    <input
                      id="confirmarContrasena"
                      type={
                        mostrarConfirmar
                          ? 'text'
                          : 'password'
                      }
                      name="confirmarContrasena"
                      placeholder="repite tu contraseña"
                      value={
                        formData.confirmarContrasena
                      }
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="eye-button"
                      onClick={() =>
                        setMostrarConfirmar(
                          !mostrarConfirmar
                        )
                      }
                      title={
                        mostrarConfirmar
                          ? 'ocultar contraseña'
                          : 'mostrar contraseña'
                      }
                    >
                      {mostrarConfirmar
                        ? '🙈'
                        : '👁️'}
                    </button>

                  </div>

                </div>


                {/* TIPO DE PERFIL */}

                <div className="field-group">

                  <label htmlFor="tipoPerfil">
                    tipo de perfil
                  </label>

                  <select
                    id="tipoPerfil"
                    name="tipoPerfil"
                    value={formData.tipoPerfil}
                    onChange={handleChange}
                    required
                  >

                    <option value="Cliente">
                      cliente
                    </option>

                    <option value="Emprendedor">
                      emprendedor
                    </option>

                    <option value="Administrador">
                      administrador
                    </option>

                  </select>

                </div>

              </div>


              {/* =================================================
                  COLUMNA DERECHA
              ================================================== */}

              <div className="form-column">


                {/* RUN */}

                <div className="field-group">

                  <label htmlFor="run">
                    run
                  </label>

                  <input
                    id="run"
                    type="text"
                    name="run"
                    placeholder="ej: 20.234.356-2"
                    value={formData.run}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength="12"
                    autoComplete="off"
                    required
                  />

                  <small className="field-help">
                    ingresa solo números
                  </small>

                </div>


                {/* TELÉFONO PERSONAL */}

                <div className="field-group">

                  <label htmlFor="telefonoPersonal">
                    teléfono personal
                  </label>

                  <input
                    id="telefonoPersonal"
                    type="tel"
                    name="telefonoPersonal"
                    placeholder="ej: 912345678"
                    value={
                      formData.telefonoPersonal
                    }
                    onChange={handleChange}
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                  />

                </div>


                {/* TELÉFONO RESPALDO */}

                <div className="field-group">

                  <label htmlFor="telefonoRespaldo">
                    teléfono respaldo
                  </label>

                  <input
                    id="telefonoRespaldo"
                    type="tel"
                    name="telefonoRespaldo"
                    placeholder="ej: 912345678"
                    value={
                      formData.telefonoRespaldo
                    }
                    onChange={handleChange}
                    inputMode="numeric"
                    autoComplete="tel"
                  />

                </div>


                {/* FECHA */}

                <div className="field-group">

                  <label htmlFor="fechaNacimiento">
                    fecha de nacimiento
                  </label>

                  <div className="date-container">

                    <input
                      id="fechaNacimiento"
                      type="date"
                      name="fechaNacimiento"
                      value={
                        formData.fechaNacimiento
                      }
                      onChange={handleChange}
                      required
                    />

                  </div>

                </div>


                {/* BOTÓN */}

                <div className="submit-container">

                  <button
                    type="submit"
                    className="btn-registrar"
                  >
                    registrar datos
                  </button>

                </div>

              </div>

            </div>

          </form>

        </div>

      </div>


      {/* =======================================================
          CONFIRMACIÓN
      ======================================================== */}

      {mostrarConfirmacion && (

        <div
          className="confirmation-overlay"
          onClick={() =>
            setMostrarConfirmacion(false)
          }
        >

          <div
            className="confirmation-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="confirmation-icon">
              ?
            </div>

            <h2>
              ¿estás seguro?
            </h2>

            <p>
              revisa tus datos antes de confirmar
              el registro.
            </p>

            <div className="confirmation-buttons">

              <button
                type="button"
                className="btn-cancelar"
                onClick={() =>
                  setMostrarConfirmacion(false)
                }
              >
                cancelar
              </button>

              <button
                type="button"
                className="btn-confirmar"
                onClick={confirmarRegistro}
              >
                confirmar
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =======================================================
          ÉXITO
      ======================================================== */}

      {mostrarExito && (

        <div className="confirmation-overlay">

          <div
            className="success-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="success-icon">
              ✓
            </div>

            <h2>
              ¡registro exitoso!
            </h2>

            <p>
              tus datos fueron registrados
              correctamente.
            </p>

            <button
              type="button"
              className="btn-exito"
              onClick={cerrarExito}
            >
              aceptar
            </button>

          </div>

        </div>

      )}

    </div>
  );
}