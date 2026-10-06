import React, { useState } from 'react';
import './Carrito.css';

export default function Carrito({ onNavigate, carrito, setCarrito }) {
  // Regiones de Chile con su respectivo costo de envío (Simulando distancias)
  const regiones = [
    { nombre: "Seleccione una región...", costo: 0 },
    { nombre: "Región Metropolitana", costo: 3000 },
    { nombre: "Valparaíso", costo: 4000 },
    { nombre: "O'Higgins", costo: 4500 },
    { nombre: "Maule", costo: 5000 },
    { nombre: "Coquimbo", costo: 5500 },
    { nombre: "Biobío", costo: 6000 },
    { nombre: "Araucanía", costo: 6500 },
    { nombre: "Los Ríos", costo: 7000 },
    { nombre: "Los Lagos", costo: 7500 },
    { nombre: "Atacama", costo: 7500 },
    { nombre: "Antofagasta", costo: 8500 },
    { nombre: "Tarapacá", costo: 9500 },
    { nombre: "Arica y Parinacota", costo: 10500 },
    { nombre: "Aysén", costo: 12000 },
    { nombre: "Magallanes", costo: 14000 }
  ];

  const [regionSeleccionada, setRegionSeleccionada] = useState(0);
  const [medioPago, setMedioPago] = useState("Tarjeta de Crédito");

  // Lógica para aumentar o disminuir cantidad
  const cambiarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + delta;
        return { ...item, cantidad: nuevaCantidad > 0 ? nuevaCantidad : 1 };
      }
      return item;
    }));
  };

  // Eliminar producto del carrito
  const eliminarProducto = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  // CÁLCULOS MATEMÁTICOS
  const totalProductosNum = carrito.reduce((acc, item) => acc + (item.precioNum * item.cantidad), 0);
  const costoEnvioNum = regiones[regionSeleccionada].costo;
  const descuentoNum = 0; // 0% como se solicitó
  const totalFinalNum = totalProductosNum + costoEnvioNum - descuentoNum; // Sin IVA

  // Formateador de moneda para mostrar bonito (ej: $10.990)
  const formatoDinero = (numero) => {
    return "$" + numero.toLocaleString('es-CL');
  };

  // Evento al presionar el botón azul "COMPRAR"
  const handleComprar = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }
    if (regionSeleccionada === 0) {
      alert("Por favor seleccione una ubicación de despacho.");
      return;
    }

    // CONSOLE.LOG OBLIGATORIO DE INTERACTIVIDAD (Envío de Datos)
    const datosCompra = {
      productos: carrito,
      subtotal: totalProductosNum,
      costoEnvio: costoEnvioNum,
      descuento: descuentoNum,
      totalPagado: totalFinalNum,
      ubicacionDespacho: regiones[regionSeleccionada].nombre,
      metodoPago: medioPago,
      fecha: new Date().toLocaleString()
    };
    
    console.log("=== DATOS DE LA COMPRA REGISTRADA ===", datosCompra);
    alert("¡Compra procesada con éxito! Revisa la consola para ver los datos.");
    
    // Vaciar el carrito y volver al inicio
    setCarrito([]);
    onNavigate('principal');
  };

  return (
    <div className="carrito-page">
      {/* NAVBAR BÁSICO SIMULADO */}
      <nav className="navbar-orange" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
        <button className="btn-back-home" onClick={() => onNavigate('principal')} style={{ marginRight: '15px' }}>
          &#8592;
        </button>
        <div className="logo-home-circle">
          <img src="https://i.ibb.co/krsRTXZ/Frame-2.png" alt="Logo" style={{ width: '35px' }}/>
        </div>
      </nav>

      <div className="carrito-content">
        {/* LADO IZQUIERDO: LISTA DE PRODUCTOS */}
        <div className="carrito-left">
          <div className="c-header">
            ✓ Todos los productos
          </div>

          <div className="c-list-container">
            <h3 className="c-list-title">Productos</h3>
            
            {carrito.length === 0 ? (
              <p>No tienes productos en tu carrito.</p>
            ) : (
              carrito.map(item => (
                <div className="c-item" key={item.id}>
                  <div className="c-item-left">
                    <img src={item.img} alt={item.titulo} className="c-item-img" />
                    <div className="c-item-info">
                      <h4>{item.titulo}</h4>
                      <div className="c-quantity-controls">
                        <button className="c-btn-qty" onClick={() => cambiarCantidad(item.id, -1)}>−</button>
                        <span>{item.cantidad}</span>
                        <button className="c-btn-qty" onClick={() => cambiarCantidad(item.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="c-item-right">
                    <span className="c-item-price">{formatoDinero(item.precioNum * item.cantidad)}</span>
                    <button className="c-btn-remove" onClick={() => eliminarProducto(item.id)} title="Eliminar producto">
                      ⊘
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LADO DERECHO: RESUMEN DE COMPRA */}
        <div className="carrito-right">
          <div className="resumen-box">
            <h3 className="resumen-title">Resumen de compra</h3>

            <div className="resumen-row">
              <span>Productos ({carrito.length})</span>
              <span>{formatoDinero(totalProductosNum)}</span>
            </div>
            
            <div className="resumen-row">
              <span>Descuento de productos</span>
              <span>0%</span>
            </div>

            {/* SELECCIÓN DE REGIÓN (Calcula costo dinámicamente) */}
            <select 
              className="resumen-select" 
              value={regionSeleccionada} 
              onChange={(e) => setRegionSeleccionada(Number(e.target.value))}
            >
              <option value="0" disabled>Eliga ubicacion despacho ∨</option>
              {regiones.map((reg, index) => {
                if(index === 0) return null;
                return <option key={index} value={index}>{reg.nombre}</option>
              })}
            </select>

            <div className="resumen-row">
              <span>Costo envio</span>
              <span>{regionSeleccionada === 0 ? "$0" : formatoDinero(costoEnvioNum)}</span>
            </div>

            <div className="resumen-total">
              <span>Total</span>
              <span>{formatoDinero(totalFinalNum)}</span>
            </div>

            <select 
              className="resumen-select"
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
            >
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Débito / Redcompra">Débito / Redcompra</option>
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
            </select>

            <button className="btn-comprar" onClick={handleComprar}>
              COMPRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}