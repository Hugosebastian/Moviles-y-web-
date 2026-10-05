import React, { useState } from 'react';
import Login from './Login';
import Registro from './Registro';
import Principal from './Principal';
import Perfil from './Perfil';

function App() {
  const [vistaActual, setVistaActual] = useState('login');
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  return (
    <div>
      {/* PANTALLA LOGIN */}
      {vistaActual === 'login' && (
        <Login 
          onOpenRegistro={() => setMostrarRegistro(true)}
          onLoginSuccess={() => setVistaActual('principal')}
        />
      )}

      {/* PANTALLA PRINCIPAL */}
      {vistaActual === 'principal' && (
        <Principal onNavigate={setVistaActual} />
      )}

      {/* PANTALLA PERFIL */}
      {vistaActual === 'perfil' && (
        <Perfil onNavigate={setVistaActual} />
      )}

      {/* MODAL REGISTRO SOBRE LOGIN */}
      {mostrarRegistro && vistaActual === 'login' && (
        <Registro onClose={() => setMostrarRegistro(false)} />
      )}
    </div>
  );
}

export default App;