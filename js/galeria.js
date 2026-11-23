'use strict';

// Fotografía 1, 2, 3... sin límite máximo.
// Se detiene cuando encuentra el primer número ausente.
// Cada número puede ser JPG, JPEG o PNG (mayúsculas incluidas).
const carpeta = 'fotos/';
const extensiones = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
const galeria = document.querySelector('#galeria');

async function existe(url) {
  try {
    const respuesta = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return respuesta.ok;
  } catch {
    return false;
  }
}

async function buscarFoto(numero) {
  // Revisa formatos en paralelo, pero se queda con el primer formato válido.
  const rutas = extensiones.map(ext => `${carpeta}${numero}.${ext}`);
  const resultados = await Promise.all(rutas.map(existe));
  const posicion = resultados.indexOf(true);
  return posicion === -1 ? null : rutas[posicion];
}

async function cargarGaleria() {
  let numero = 1;
  // Se exploran pequeñas tandas en paralelo para no ralentizar la galería.
  const tamanoTanda = 8;
  while (true) {
    const numeros = Array.from({ length: tamanoTanda }, (_, i) => numero + i);
    const rutas = await Promise.all(numeros.map(buscarFoto));
    for (let i = 0; i < rutas.length; i++) {
      if (!rutas[i]) return; // Fotos numeradas consecutivamente desde 1.
      const figura = document.createElement('figure');
      figura.className = 'foto';
      const imagen = document.createElement('img');
      imagen.src = rutas[i];
      imagen.alt = `Fotografía ${numeros[i]}`;
      imagen.loading = numeros[i] <= 3 ? 'eager' : 'lazy';
      imagen.decoding = 'async';
      figura.append(imagen);
      galeria.append(figura);
    }
    numero += tamanoTanda;
  }
}

cargarGaleria();
