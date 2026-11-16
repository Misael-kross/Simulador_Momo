/* EDITA ESTE ARCHIVO PARA AGREGAR MATERIAS Y EXÁMENES.
   No es necesario modificar app.js ni index.html.
   Cada examen lleva la ruta relativa a su archivo .json.
   Los nombres de las materias son PROVISIONALES hasta confirmar el plan de estudios.
*/
window.MOMO_CATALOGO = [
  {
    id: 'primer_ano',
    titulo: 'Primer año',
    subtitulo: 'Los primeros pasos',
    descripcion: 'Fundamentos para comprender el cuerpo humano.',
    materias: [
      { id: 'anatomia', nombre: 'Anatomía', examenes: [
        { id: 'demo_anatomia', nombre: 'Examen de demostración', descripcion: '5 preguntas de prueba para conocer la plataforma', archivo: 'examenes/primer_ano/anatomia/examen_demo.json' }
      ] },
      { id: 'bioquimica', nombre: 'Bioquímica', examenes: [] },
      { id: 'embriologia', nombre: 'Embriología', examenes: [] }
    ]
  },
  {
    id: 'segundo_ano',
    titulo: 'Segundo año',
    subtitulo: 'Conectar lo aprendido',
    descripcion: 'Procesos del organismo y bases de la enfermedad.',
    materias: [
      { id: 'fisiologia', nombre: 'Fisiología', examenes: [] },
      { id: 'microbiologia', nombre: 'Microbiología', examenes: [] },
      { id: 'farmacologia', nombre: 'Farmacología', examenes: [] }
    ]
  },
  {
    id: 'tercer_ano',
    titulo: 'Tercer año',
    subtitulo: 'Pensar como médica',
    descripcion: 'Aplicar conocimientos y desarrollar criterio clínico.',
    materias: [
      { id: 'epidemiologia', nombre: 'Epidemiología', examenes: [
        { id: 'examen_01_epidemiologia', nombre: 'Examen 1 · Epidemiología', descripcion: '50 preguntas · Dificultad moderada · 90 minutos', archivo: 'examenes/tercer_ano/epidemiologia/examen_01_epidemiologia.json' }
      ] },
      { id: 'patologia', nombre: 'Patología', examenes: [] },
      { id: 'propedeutica', nombre: 'Propedéutica', examenes: [] },
      { id: 'medicina_interna', nombre: 'Medicina interna', examenes: [] }
    ]
  }
];
