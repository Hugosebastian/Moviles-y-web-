import Logo from './Logo';

import React, { useState } from 'react';
import './Login.css';

export default function Login({
  onOpenRegistro,
  onLoginSuccess
}) {
  const [run, setRun] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handleChangeRun = (e) => {
    let valor = e.target.value
      .toUpperCase()
      .replace(/[^0-9K]/g, '');

    if (valor.length > 9) {
      valor = valor.slice(0, 9);
    }

    if (valor.length > 1) {
      const cuerpo = valor.slice(0, -1);
      const digito = valor.slice(-1);

      setRun(`${cuerpo}-${digito}`);
    } else {
      setRun(valor);
    }

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (enviando) return;

    setError('');

    const runNormalizado = run.trim().toUpperCase();

    if (!/^[0-9]{1,8}-[0-9K]$/.test(runNormalizado)) {
      setError('ingresa un run completo.');
      return;
    }

    if (!contrasena) {
      setError('ingresa tu contraseña.');
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch(
        'http://localhost:3000/api/login',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            run: runNormalizado,
            contrasena
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error || 'no se pudo iniciar sesión.'
        );
        return;
      }

      if (!datos.usuario) {
        setError(
          'el servidor no devolvió los datos del usuario.'
        );
        return;
      }

      if (typeof onLoginSuccess !== 'function') {
        setError(
          'no está configurada la conexión con App.jsx.'
        );
        return;
      }

      onLoginSuccess(datos.usuario);

    } catch (err) {
      console.error('error al iniciar sesión:', err);

      setError(
        'no se pudo comunicar con el backend. revisa que Node.js esté encendido.'
      );

    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-container">

      <button
        type="button"
        className="back-button"
        title="volver"
      >
        &#8592;
      </button>

      <div className="left-panel">
        <div className="logo-circle">
          <Logo
            alt="logo"
            className="logo-icon"
          />
        </div>
      </div>

      <div className="right-panel">
        <div className="form-wrapper">

          <h1 className="title">
            iniciar sesión
          </h1>

          <p className="subtitle">
            iniciar sesión con cuenta
          </p>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label htmlFor="run">
                run
              </label>

              <input
                id="run"
                type="text"
                placeholder="11111111-k"
                value={run}
                onChange={handleChangeRun}
                required
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="contrasena">
                contraseña
              </label>

              <div className="password-input-container">
                <input
                  id="contrasena"
                  type={verContrasena ? 'text' : 'password'}
                  placeholder="introduce contraseña"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    setError('');
                  }}
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setVerContrasena(!verContrasena)
                  }
                  aria-label={
                    verContrasena
                      ? 'ocultar contraseña'
                      : 'mostrar contraseña'
                  }
                >
                  {verContrasena ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div className="forgot-password">
              <a href="#olvido">
                ¿has olvidado la contraseña?
              </a>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: '#c62828',
                  fontSize: '14px',
                  marginTop: '12px',
                  marginBottom: '12px'
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={enviando}
            >
              {enviando
                ? 'ingresando...'
                : 'ingresar'}
            </button>

          </form>

          <p className="register-text">
            ¿no tienes cuenta?{' '}

            <button
              type="button"
              className="link-btn"
              onClick={onOpenRegistro}
            >
              regístrate
            </button>
          </p>

          <div className="bottom-widget">
            <div className="avatar-circle">
              🐊
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
