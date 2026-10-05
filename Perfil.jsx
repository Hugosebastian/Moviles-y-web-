import React from 'react';
import './Perfil.css';

export default function Perfil({ onNavigate }) {
  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <h2>Mi Perfil</h2>
        
        <div className="perfil-info">
          <div className="perfil-field">
            <label>Nombre Completo:</label>
            <p>Juan Ignacio Pérez Gonzáles</p>
          </div>
          <div className="perfil-field">
            <label>RUN:</label>
            <p>11.111.111-1</p>
          </div>
          <div className="perfil-field">
            <label>Correo Electrónico:</label>
            <p>juanperez@correo.com</p>
          </div>
          <div className="perfil-field">
            <label>Tipo de Perfil:</label>
            <p>Cliente</p>
          </div>
        </div>

        <button className="btn-volver-perfil" onClick={() => onNavigate('principal')}>
          ← Volver al Inicio
        </button>
      </div>
    </div>
  );
}