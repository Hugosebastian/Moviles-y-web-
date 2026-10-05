import React, { useState } from 'react';
import './Login.css';

// Recibimos 'onOpenRegistro' desde App.jsx para abrir el modal
export default function Login({ onOpenRegistro, onLoginSuccess }) {
  const [run, setRun] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);

  

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Iniciar sesión con:', { run, contrasena });
    if (onLoginSuccess){
        onLoginSuccess();

    }
  };

  return (
    <div className="login-container">
      

      {/* Lado Izquierdo (Panel Naranja) */}
      <div className="left-panel">
        <div className="logo-circle">
          <img 
            src="https://i.ibb.co/BHMXmkj7/Frame-2.png" 
            alt="Logo Compras" 
            className="logo-icon"
          />
        </div>
      </div>

      {/* Lado Derecho (Formulario Login) */}
      <div className="right-panel">
        <div className="form-wrapper">
          <h1 className="title">iniciar sesión</h1>
          <p className="subtitle"></p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="run">RUN</label>
              <input
                id="run"
                type="text"
                placeholder="11.111.111-1"
                value={run}
                onChange={(e) => setRun(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="contrasena">contraseña</label>
              <div className="password-input-container">
                <input
                  id="contrasena"
                  type={verContrasena ? 'text' : 'password'}
                  placeholder="Introduce contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setVerContrasena(!verContrasena)}
                >
                  {verContrasena ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div className="forgot-password">
              <a href="#olvido">¿has olvidado la contraseña?</a>
            </div>

            <button type="submit" className="submit-btn">
              Ingresar
            </button>
          </form>

          {/* AQUÍ ESTÁ EL BOTÓN QUE ABRE EL REGISTRO */}
          <p className="register-text">
            ¿No tienes cuenta?{' '}
            <button 
              type="button" 
              className="link-btn" 
              onClick={onOpenRegistro}
            >
              Registrate
            </button>
          </p>

          <div className="bottom-widget">
            <div className="avatar-circle">🐊</div>
          </div>
        </div>
      </div>
    </div>
  );
}