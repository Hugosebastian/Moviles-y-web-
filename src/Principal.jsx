import React, { useState } from 'react';
import './Principal.css';

export default function Principal({ onNavigate, carrito, setCarrito }) {
  const [busqueda, setBusqueda] = useState('');
  const [verCategorias, setVerCategorias] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState('Tecnología');
  const [verUserMenu, setVerUserMenu] = useState(false);

  // Agregamos 'precioNum' para poder hacer cálculos matemáticos en el carrito
  const productos = [
    { id: 1, titulo: 'Lenovo Pad 11', precioStr: '$109.990', precioNum: 109990, img: '/LenovoPad11Copia.png' },
    { id: 2, titulo: 'Zapato de futbol F50 Messi', precioStr: '$199.990', precioNum: 199990, img: 'https://cdn-icons-png.flaticon.com/512/2589/2589886.png' },
    { id: 3, titulo: 'PC Gamer completo 16 GB Ram', precioStr: '$970.990', precioNum: 970990, img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
    { id: 4, titulo: 'Suscripcion prime video', precioStr: '$10.990', precioNum: 10990, img: 'https://cdn-icons-png.flaticon.com/512/5977/5977544.png' },
    { id: 5, titulo: 'Consola play station 5', precioStr: '$700.000', precioNum: 700000, img: 'https://cdn-icons-png.flaticon.com/512/2972/2972543.png' },
    { id: 6, titulo: 'Cama mascota L', precioStr: '$19.990', precioNum: 19990, img: 'https://cdn-icons-png.flaticon.com/512/2809/2809802.png' },
    { id: 7, titulo: 'Pack sobres album mundial', precioStr: '$55.500', precioNum: 55500, img: 'https://cdn-icons-png.flaticon.com/512/1150/1150626.png' },
    { id: 8, titulo: 'Snack mascota', precioStr: '$2.990', precioNum: 2990, img: 'https://cdn-icons-png.flaticon.com/512/1076/1076826.png' },
  ];

  const agregarAlCarrito = (producto) => {
    // Revisa si ya existe en el carrito
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      // Si existe, le suma 1 a la cantidad
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      // Si no existe, lo agrega con cantidad 1
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    alert(`¡${producto.titulo} agregado al carrito!`);
  };

  return (
    <div className="principal-container">
      {/* NAVBAR SUPERIOR */}
      <nav className="navbar-orange">
        <div className="nav-top-row">
          <button className="btn-back-home" title="Volver">&#8592;</button>

          <div className="logo-home-circle">
            <img src="https://i.ibb.co/krsRTXZ/Frame-2.png" />
          </div>

          <div className="search-container">
            <input 
              type="text" 
              className="search-input"
              placeholder="Buscar productos, marcas y más . . . . ."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button className="search-icon-btn">🔍</button>
          </div>

          <div className="user-actions">
            <span className="icon-heart">♡</span>
            
            <button className="user-menu-trigger" onClick={() => setVerUserMenu(!verUserMenu)}>
              <div className="user-avatar-circle">👤</div>
              <span className="user-arrow">↓</span>
            </button>

            {/* ÍCONO DE CARRITO CON NAVEGACIÓN */}
            <span 
              className="cart-icon" 
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => onNavigate('carrito')}
            >
              🛒
              {/* Globito rojo con la cantidad de items */}
              {carrito.length > 0 && (
                <span className="cart-badge">{carrito.length}</span>
              )}
            </span>

            {verUserMenu && (
              <div className="user-dropdown">
                <button onClick={() => onNavigate('perfil')}>Mi perfil</button>
                <button>Compras</button>
                <button>Historial</button>
                <button>preguntas</button>
                <button className="divider" onClick={() => onNavigate('login')}>Salir</button>
              </div>
            )}
          </div>
        </div>

        {/* ... (EL RESTO DEL NAVBAR QUEDA IGUAL, OMITIDO POR BREVEDAD, DEJA TU CÓDIGO DE CATEGORÍAS AQUÍ) ... */}
        <div className="nav-bottom-row">
           <div className="nav-links">
             <button className="btn-categories" onMouseEnter={() => setVerCategorias(true)} onMouseLeave={() => setVerCategorias(false)}>
               CATEGORIAS ∨
             </button>
             <span>OFERTAS</span>
             <span>VENDER</span>
             <span>AYUDA</span>
           </div>
           <div className="nav-right-links">
             <span>Mis ventas</span>
             <span>MIS COMPRAS</span>
           </div>
        </div>
      </nav>

      {/* PRODUCTOS */}
      <main className="main-content">
        <div className="products-grid">
          {productos
            .filter(p => p.titulo.toLowerCase().includes(busqueda.toLowerCase()))
            .map(item => (
              <div key={item.id} className="product-card">
                {/* BOTÓN AGREGAR AL CARRITO AL LADO IZQUIERDO */}
                <button 
                  className="btn-add-left" 
                  title="Agregar al carrito"
                  onClick={() => agregarAlCarrito(item)}
                >
                  +🛒
                </button>

                <button className="heart-btn">♡</button>
                
                <div className="card-top-row">
                  <img src={item.img} alt={item.titulo} className="product-img" />
                  <div className="product-info">
                    <h3>{item.titulo}</h3>
                    <p className="product-price">{item.precioStr}</p>
                  </div>
                </div>
                <button className="btn-detalle">Detalle</button>
              </div>
          ))}
        </div>
      </main>
    </div>
  );
}