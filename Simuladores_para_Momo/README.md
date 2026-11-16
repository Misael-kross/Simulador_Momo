# Simuladores para Momo

Versión independiente y ligera de simuladores de opción múltiple para Medicina. Inspirada visualmente en el PDF «Almidon_estilo_aminoacidos(1).pdf» (fondos blancos, rosa pastel, detalles delicados y un lazo ilustrado). **No contiene logos, Django, Docker, servidor ni base de datos.**

## 1. Probar la plataforma

**Recomendado (Windows, PowerShell):** abre una terminal dentro de la carpeta `Simuladores_para_Momo` y ejecuta:

```powershell
python -m http.server 8000
```

Si `python` no existe pero tienes instalado Python Launcher, usa `py -m http.server 8000`. Abre **http://localhost:8000/** en tu navegador. Detén el servidor con `Ctrl + C`.

También funciona con extensiones tipo Live Server de VS Code o en GitHub Pages. Si abres `index.html` directamente con doble clic, los navegadores suelen impedir la lectura automática de JSON por seguridad. En ese caso, entra a una materia y usa el botón **Abrir un JSON de mi dispositivo**.

## 2. Organización

```
Simuladores_para_Momo/
├── index.html
├── css/estilos.css
├── js/catalogo.js                <-- Aquí se agregan materias y exámenes
├── js/app.js                     <-- Motor del examen (no editar normalmente)
└── examenes/
    ├── primer_ano/
    │   ├── anatomia/examen_demo.json
    │   ├── bioquimica/
    │   └── embriologia/
    ├── segundo_ano/
    │   ├── fisiologia/
    │   ├── microbiologia/
    │   └── farmacologia/
    └── tercer_ano/
        ├── patologia/
        ├── propedeutica/
        └── medicina_interna/
```

**Importante:** las materias incluidas son **provisionales**, no un plan oficial de Medicina. Cámbialas o añade las que realmente cursa Momo en `js/catalogo.js`.

## 3. Agregar un examen

1. Coloca el archivo de preguntas, por ejemplo, `examenes/primer_ano/bioquimica/parcial_1.json`.
2. Abre `js/catalogo.js` y encuentra `{ id: 'bioquimica', nombre: 'Bioquímica', examenes: [] }`.
3. Sustituye `examenes: []` por:

```js
examenes: [
  {
    id: 'parcial_1',
    nombre: 'Primer parcial',
    descripcion: 'Temas 1–4',
    archivo: 'examenes/primer_ano/bioquimica/parcial_1.json'
  }
]
```

4. Guarda y actualiza la página. Se pueden agregar tantos exámenes y materias como quieras siguiendo el mismo patrón.

## 4. JSON aceptado

Usa la estructura JSON de **Simulador ELITE original** con campos `nombre`, `configuracion` y `preguntas`, como `examenes/primer_ano/anatomia/examen_demo.json`. Cada pregunta necesita:

- `pregunta`: objeto con `contenido`, y opcionalmente `imagen`.
- `opciones`: arreglo con objetos `{ "inciso": "A", "texto": "...", "imagen": null }`.
- `respuesta_correcta`: letra del inciso correcto (`"A"`, `"B"`, etc.).
- `explicacion`: opcional; se muestra al finalizar el examen.

Las imágenes pueden agregarse como archivos dentro del proyecto usando rutas **relativas a `index.html`**, por ejemplo `imagenes/bioquimica/pregunta_1.png`. No admite rutas privadas del disco. El texto acepta formato HTML sencillo (negritas, párrafos, listas, superíndices); **no incluye un motor de LaTeX** para mantener el tamaño reducido.

## 5. Funciones

- Organización Año → Materia → Examen.
- Navegación entre preguntas, selección y avance visual.
- Tiempo configurable, finalización automática opcional, confirmación antes de abandonar.
- Resultado en porcentaje y escala 0–10, respuestas correctas y explicaciones.
- Botón para reintentar y lector manual de JSON (sin servidor).
- El **último resultado** se almacena únicamente en el navegador, no en un servidor. No hay registro de usuarios ni sincronización entre dispositivos.

## 6. Publicar en GitHub Pages

Sube el **contenido** de esta carpeta a un repositorio nuevo (separado de Simulador ELITE), activa GitHub Pages en la rama y carpeta raíz (`main` / `/root`) y espera la publicación que informa GitHub. No se necesita configurar Django ni una base de datos.

## Aviso

El examen de Anatomía incluido es **solo una demostración técnica**, no un examen validado ni representativo de la dificultad de Medicina. Puedes sustituirlo por exámenes reales. Esta herramienta es educativa y no sustituye fuentes oficiales ni valoración médica.


## Examen 1: Epidemiología (tercer año)

Incluido en `examenes/tercer_ano/epidemiologia/examen_01_epidemiologia.json` y registrado en `js/catalogo.js` para aparecer como: **Tercer año → Epidemiología → Examen 1**. Son **50 reactivos de opción múltiple, una sola correcta**, con casos clínicos, conceptos, interpretación y cálculos. Incluye explicación al final del intento. Configuración predeterminada: **90 minutos**.

La plantilla `PLANTILLA_EXAMEN.json` muestra el esquema mínimo para otros exámenes. El archivo del examen contiene campos extra `tema`, `tipo_reactivo` y `fuente_paginas_pdf`, que sirven para organizar y auditar la autoría, aunque la interfaz los ignora sin problemas. Los casos y datos numéricos son ejemplos didácticos originales, no casos reales ni recomendaciones médicas. El tiempo puede ajustarse en `configuracion.duracion_minutos`.
