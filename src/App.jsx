import React, { useState } from 'react';
import Login from './Login';
import Registro from './Registro';
import Principal from './Principal';
import Perfil from './Perfil';
import Carrito from './Carrito'; // NUEVO COMPONENTE

function App() {
  const [vistaActual, setVistaActual] = useState('login');
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  
  // ESTADO GLOBAL DEL CARRITO
  const [carrito, setCarrito] = useState([]);

  return (
    <div>
      {vistaActual === 'login' && (
        <Login 
          onOpenRegistro={() => setMostrarRegistro(true)}
          onLoginSuccess={() => setVistaActual('principal')}
        />
      )}

      {vistaActual === 'principal' && (
        <Principal 
          onNavigate={setVistaActual} 
          carrito={carrito} 
          setCarrito={setCarrito} 
        />
      )}

      {vistaActual === 'perfil' && (
        <Perfil onNavigate={setVistaActual} />
      )}

      {/* NUEVA VISTA DE CARRITO */}
      {vistaActual === 'carrito' && (
        <Carrito 
          onNavigate={setVistaActual} 
          carrito={carrito} 
          setCarrito={setCarrito} 
        />
      )}

      {mostrarRegistro && vistaActual === 'login' && (
        <Registro onClose={() => setMostrarRegistro(false)} />
      )}
    </div>
  );
}

export default App;