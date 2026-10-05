import React, { useState } from 'react';
import './Principal.css';

export default function Principal({ onNavigate }) {
  const [busqueda, setBusqueda] = useState('');
  const [verCategorias, setVerCategorias] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState('Tecnología');
  const [verUserMenu, setVerUserMenu] = useState(false);

  // Lista de productos de ejemplo
  const productos = [
    { id: 1, titulo: 'Lenovo Pad 11', precio: '$109.990', img: 'https://cdn-icons-png.flaticon.com/512/689/689307.png' },
    { id: 2, titulo: 'Zapato de futbol F50 Messi', precio: '$199.990', img: 'https://cdn-icons-png.flaticon.com/512/2589/2589886.png' },
    { id: 3, titulo: 'PC Gamer completo 16 GB Ram', precio: '$970.990', img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
    { id: 4, titulo: 'Suscripcion prime video', precio: '$10.990', img: 'https://cdn-icons-png.flaticon.com/512/5977/5977544.png' },
    { id: 5, titulo: 'Consola play station 5', precio: '$700.000', img: 'https://cdn-icons-png.flaticon.com/512/2972/2972543.png' },
    { id: 6, titulo: 'Cama mascota L', precio: '$19.990', img: 'https://cdn-icons-png.flaticon.com/512/2809/2809802.png' },
    { id: 7, titulo: 'Pack sobres album mundial', precio: '$55.500', img: 'https://cdn-icons-png.flaticon.com/512/1150/1150626.png' },
    { id: 8, titulo: 'Snack mascota', precio: '$2.990', img: 'https://cdn-icons-png.flaticon.com/512/1076/1076826.png' },
  ];

  return (
    <div className="principal-container">
      {/* NAVBAR SUPERIOR */}
      <nav className="navbar-orange">
        <div className="nav-top-row">

          <div className="logo-home-circle">
            <img src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png" alt="Logo" />
          </div>

          {/* BARRA DE BÚSQUEDA INTERACTIVA */}
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

          {/* MENÚ DE USUARIO */}
          <div className="user-actions">
            <span className="icon-heart">♡</span>
            
            <button 
              className="user-menu-trigger" 
              onClick={() => setVerUserMenu(!verUserMenu)}
            >
              <div className="user-avatar-circle">👤</div>
              <span className="user-arrow">↓</span>
            </button>

            <span className="cart-icon">🛒</span>

            {/* DESPLEGABLE DE USUARIO */}
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

        {/* BARRA DE NAVEGACIÓN Y CATEGORÍAS */}
        <div className="nav-bottom-row">
          <div className="nav-links">
            
            {/* HOVER EN CATEGORÍAS */}
            <div 
              className="category-dropdown-container"
              onMouseEnter={() => setVerCategorias(true)}
              onMouseLeave={() => setVerCategorias(false)}
            >
              <button className="btn-categories">CATEGORIAS ∨</button>

              {/* MEGAMENÚ DESPLEGABLE */}
              {verCategorias && (
                <div className="megamenu">
                  <div className="megamenu-left">
                    <div 
                      className={`menu-cat-item ${categoriaActiva === 'Tecnología' ? 'active' : ''}`}
                      onMouseEnter={() => setCategoriaActiva('Tecnología')}
                    >
                      📱 Tecnología <span>&gt;</span>
                    </div>
                    <div 
                      className={`menu-cat-item ${categoriaActiva === 'Videojuegos' ? 'active' : ''}`}
                      onMouseEnter={() => setCategoriaActiva('Videojuegos')}
                    >
                      🎮 Videojuegos
                    </div>
                    <div 
                      className={`menu-cat-item ${categoriaActiva === 'Ropa' ? 'active' : ''}`}
                      onMouseEnter={() => setCategoriaActiva('Ropa')}
                    >
                      👕 Ropa
                    </div>
                  </div>

                  <div className="megamenu-right">
                    <h3>{categoriaActiva}</h3>
                    <div className="subcat-grid">
                      <div className="subcat-block">
                        <h4>Celulares y Telefonía</h4>
                        <p>Celulares y Smartphones</p>
                        <p>Accesorios para Celulares</p>
                        <p>Repuestos para Celulares</p>
                      </div>
                      <div className="subcat-block">
                        <h4>Cámaras y Accesorios</h4>
                        <p>Accesorios para Cámaras</p>
                        <p>Cámaras</p>
                        <p>Filmadoras y Cámaras de Acción</p>
                      </div>
                      <div className="subcat-block">
                        <h4>Consolas y Videojuegos</h4>
                        <p>Consolas</p>
                        <p>Videojuegos</p>
                        <p>Para Nintendo</p>
                      </div>
                      <div className="subcat-block">
                        <h4>Computación</h4>
                        <p>Notebooks</p>
                        <p>Tablets</p>
                        <p>Accesorios para Notebooks</p>
                      </div>
                      <div className="subcat-block">
                        <h4>Electrónica, Audio y Video</h4>
                        <p>Televisores</p>
                        <p>Accesorios para Audio y Video</p>
                        <p>Audio</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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

      {/* CONTENIDO PRINCIPAL: PRODUCTOS */}
      <main className="main-content">
        <div className="products-grid">
          {productos
            .filter(p => p.titulo.toLowerCase().includes(busqueda.toLowerCase()))
            .map(item => (
              <div key={item.id} className="product-card">
                <button className="heart-btn">♡</button>
                <div className="card-top-row">
                  <img src={item.img} alt={item.titulo} className="product-img" />
                  <div className="product-info">
                    <h3>{item.titulo}</h3>
                    <p className="product-price">{item.precio}</p>
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