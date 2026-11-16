/* Simuladores para Momo | Versión ligera y sin dependencias.
   Compatible con el formato JSON de preguntas de Simulador ELITE. */
(() => {
  'use strict';
  const catalogo = window.MOMO_CATALOGO || [];
  const app = document.getElementById('app');
  const inputArchivo = document.getElementById('selector-json');
  const toast = document.getElementById('toast');
  // Los botones de cada materia se obtienen de los JSON que existen en GitHub.
  // GitHub Pages no puede listar carpetas directamente: usamos una sola consulta
  // pública a la API de GitHub y conservamos catalogo.js como respaldo.
  const githubConfiguracion = (() => {
    const host = window.location.hostname;
    const esPages = host.toLowerCase().endsWith('.github.io');
    const propietario = esPages ? host.slice(0, -'.github.io'.length) : 'Misael-kross';
    const repositorio = esPages
      ? decodeURIComponent(window.location.pathname.split('/').filter(Boolean)[0] || 'Simulador_Momo')
      : 'Simulador_Momo';
    return { propietario, repositorio, rama: 'main' };
  })();
  let estadoCatalogo = 'cargando'; // cargando | listo | error
  let actualizandoCatalogo = false;
  let mensajeCatalogo = '';
  let reloj = null;
  let estado = { vista: 'inicio', ano: null, materia: null, examen: null, datos: null,
    respuestas: [], indice: 0, fin: null, terminado: false, inicio: null };

  const escapar = texto => String(texto ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const accion = (nombre, label, extra = '', clase = 'boton') => `<button type="button" class="${clase}" data-accion="${nombre}" ${extra}>${label}</button>`;
  const anioActual = () => catalogo.find(a => a.id === estado.ano);
  const materiaActual = () => anioActual()?.materias.find(m => m.id === estado.materia);
  const examenActual = () => materiaActual()?.examenes.find(e => e.id === estado.examen);
  const activa = () => estado.vista === 'pregunta' && !estado.terminado;
  function detenerReloj(){ if (reloj !== null) clearInterval(reloj); reloj = null; }
  function aviso(mensaje){ toast.textContent = mensaje; toast.hidden = false; clearTimeout(aviso.id); aviso.id = setTimeout(()=>toast.hidden=true, 4200); }
  function confirmarSalida(){
    return !activa() || window.confirm('¿Quieres salir del examen?\n\nEl intento está en curso. Perderás las respuestas que hayas marcado y tendrás que empezar de nuevo.\n\nPulsa «Cancelar» para continuar respondiendo.');
  }
  // Mantiene una entrada de historial temporal: Atrás desde un examen pide confirmación.
  function protegerAtras(){
    window.history.pushState({momoGuardia:true}, '', '#examen');
  }
  function retirarGuardia(vista){
    if(window.history.state?.momoGuardia){
      window.history.replaceState({momoVista:vista}, '', `#${vista}`);
    }
  }
  function navegar(vista, cambio = {}, salidaYaConfirmada = false){
    if(!salidaYaConfirmada && !confirmarSalida()) return;
    retirarGuardia(vista);
    detenerReloj();
    estado = { ...estado, ...cambio, vista, datos: null, respuestas: [], indice: 0, fin: null, terminado: false, inicio: null };
    render();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function encabezado(titulo, descripcion){ return `<div class="cabecera-pagina"><h1>${escapar(titulo)}</h1><p>${escapar(descripcion)}</p></div>`; }
  function ruta(fragmentos){
    const contenido = [{ titulo: 'Inicio',accion:'inicio' }, ...fragmentos];
    return `<nav class="miga" aria-label="Ruta">${contenido.map((elemento,i)=> `${i ? '<span class="separador">/</span>' : ''}${elemento.accion ? `<button type="button" data-accion="${elemento.accion}">${escapar(elemento.titulo)}</button>`:`<span aria-current="page">${escapar(elemento.titulo)}</span>`}`).join('')}</nav>`;
  }
  function svgLazo(){ return `<svg class="lazo" viewBox="0 0 320 280" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="rosaLazo"><stop stop-color="#fff3f8"/><stop offset=".66" stop-color="#f7accb" stop-opacity=".6"/><stop offset="1" stop-color="#dc78aa" stop-opacity=".32"/></radialGradient><filter id="borroso"><feGaussianBlur stdDeviation="2.7"/></filter></defs><g fill="url(#rosaLazo)" stroke="#d880a8" stroke-width="3.5" stroke-opacity=".5"><path d="M151 103C101 22 10 22 25 89s78 59 128 40c-24-20-37-24-65-28m78 4C231 21 322 33 299 96s-80 49-129 33c27-21 55-29 77-30"/><path d="M146 126c-20 55-64 99-49 145 11 6 44-12 62-44 7 22 28 36 48 33 18-30-14-104-38-140Z"/><ellipse cx="161" cy="123" rx="25" ry="19" fill="#f4a9c9"/></g><path d="M153 135c-17 35-25 68-24 103M172 136c18 33 26 63 25 94M147 116C103 73 70 68 37 77M180 115c49-41 80-43 109-40" fill="none" stroke="#fbf0f6" stroke-width="6" stroke-linecap="round" opacity=".8"/><g fill="#e88cae" opacity=".65"><circle cx="35" cy="191" r="3"/><path d="M265 173v14m-7-7h14" stroke="#e88cae" stroke-width="2"/></g></svg>`; }
  function inicio(){
    const tarjetas = catalogo.map((a,i)=>`<button type="button" class="tarjeta" data-accion="anio" data-ano="${escapar(a.id)}"><span class="n-numero">0${i+1}</span><span class="t-titulo">${escapar(a.titulo)}</span><span class="t-descripcion">${escapar(a.descripcion)}</span><span class="ir">Ver materias &nbsp; →</span></button>`).join('');
    app.innerHTML = `<section class="hero"><div class="hero-contenido"><span class="mini-titulo">Un espacio de estudio hecho con cariño</span><h1>Simuladores<br><em>para Momo</em></h1><p>Estudia a tu ritmo, practica lo que sabes y descubre cuánto has aprendido. Una pregunta a la vez.</p></div>${svgLazo()}<div class="hero-cinta" aria-hidden="true"></div></section><div class="section-top"><h2>¿Qué vamos a repasar hoy?</h2><span class="nota">Elige tu año de Medicina</span></div><section class="tarjetas" aria-label="Años de Medicina">${tarjetas}</section><p class="cita">“Aprender también puede ser un momento bonito.”</p>`;
  }
  function anio(){
    const a=anioActual(); if(!a){navegar('inicio');return;}
    const materias = a.materias.map(m=>`<button type="button" class="materia" data-accion="materia" data-materia="${escapar(m.id)}"><span class="icono-materia" aria-hidden="true">✿</span><span class="nombre">${escapar(m.nombre)}</span><span class="detalle">${m.examenes.length} ${m.examenes.length===1?'examen disponible':'exámenes disponibles'} &nbsp; →</span></button>`).join('');
    app.innerHTML = `${ruta([{titulo:a.titulo}])}<span class="mini-titulo">${escapar(a.subtitulo)}</span>${encabezado(a.titulo,'Elige la materia que quieras practicar.')}<div class="rejilla">${materias}</div>`;
  }
  function materia(){
    const a=anioActual(),m=materiaActual(); if(!a||!m){navegar('inicio');return;}
    const exs=m.examenes.map(e=>`<button type="button" class="examen" data-accion="cargar" data-examen="${escapar(e.id)}"><span><strong>${escapar(e.nombre)}</strong><small>${escapar(e.descripcion || 'Examen de práctica')}</small></span><span class="flecha" aria-hidden="true">→</span></button>`).join('');
    const textoCatalogo = estadoCatalogo==='cargando'
      ? 'Buscando exámenes publicados en GitHub…'
      : estadoCatalogo==='error'
        ? mensajeCatalogo
        : `${m.examenes.length} ${m.examenes.length===1?'examen detectado':'exámenes detectados'} en esta materia.`;
    app.innerHTML = `${ruta([{titulo:a.titulo,accion:'anio'},{titulo:m.nombre}])}${encabezado(m.nombre,'Selecciona un examen o abre un archivo JSON desde tu dispositivo.')}<p class="nota-carga" role="status">${escapar(textoCatalogo)}</p><div class="lista-examenes">${exs || '<div class="vacio"><strong>Aquí habrá exámenes muy pronto</strong>Esta materia ya tiene su espacio preparado. Solo falta agregar el primer archivo JSON.</div>'}</div><div class="botones" style="margin-top:18px">${accion('actualizar-catalogo','↻ Actualizar lista de exámenes','','boton secundario')}</div><p class="nota-carga">¿Tienes un examen en formato JSON?</p><div class="botones" style="margin-top:10px">${accion('archivo','Abrir un JSON de mi dispositivo','','boton secundario')}</div>`;
  }
  // A partir del árbol público de GitHub descubre TODOS los JSON bajo
  // examenes/<año>/<materia>/... y añade también materias nuevas.
  function nombreLegible(texto){
    return String(texto).replace(/\.json$/i,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim()
      .replace(/\b\p{L}/gu, letra => letra.toLocaleUpperCase('es'));
  }
  function entradaExamen(ruta,materia,anterior){
    if(anterior) return {...anterior,archivo:ruta};
    const archivo = ruta.split('/').pop().replace(/\.json$/i,'');
    const numerado = archivo.match(/^(?:examen|simulador)[_-]?(\d+)(?:[_-]|$)/i);
    const nombre = numerado
      ? `Examen ${Number(numerado[1])} · ${materia.nombre}`
      : /^(?:examen[_-]?)?demo/i.test(archivo)
        ? 'Examen de demostración'
        : nombreLegible(archivo);
    const id = 'auto_' + ruta.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'_').toLowerCase();
    return { id, nombre, descripcion:'Examen disponible · Ver preguntas y duración al abrirlo', archivo:ruta };
  }
  function incorporarArchivosDeGitHub(arbol){
    if(!arbol || !Array.isArray(arbol.tree) || arbol.truncated) {
      throw Error('GitHub no devolvió la lista completa de archivos.');
    }
    const anteriores = new Map();
    for (const ano of catalogo){
      for (const materia of ano.materias){
        for(const examen of materia.examenes){
          anteriores.set(examen.archivo.toLowerCase(), examen);
        }
      }
    }
    const rutas = new Map();
    for (const item of arbol.tree) {
      if(item.type !== 'blob' || typeof item.path !== 'string') continue;
      const partes = item.path.match(/^examenes\/(primer_ano|segundo_ano|tercer_ano)\/([^/]+)\/(.+\.json)$/i);
      if(!partes) continue;
      const ano = catalogo.find(a => a.id === partes[1]);
      if(!ano) continue;
      let materia = ano.materias.find(m => m.id === partes[2]);
      if(!materia){
        materia = {id:partes[2], nombre:nombreLegible(partes[2]), examenes:[]};
        ano.materias.push(materia);
      }
      const clave = `${ano.id}/${materia.id}`;
      if(!rutas.has(clave)) rutas.set(clave, new Set());
      rutas.get(clave).add(item.path);
    }
    // En una sincronización exitosa NO conservamos botones de JSON borrados.
    for(const ano of catalogo){
      for(const materia of ano.materias){
        const archivos = [...(rutas.get(`${ano.id}/${materia.id}`) || [])];
        archivos.sort((a,b)=>a.localeCompare(b,'es',{numeric:true,sensitivity:'base'}));
        materia.examenes = archivos.map(ruta => entradaExamen(ruta,materia,anteriores.get(ruta.toLowerCase())));
      }
    }
  }
  async function sincronizarCatalogo(){
    if(actualizandoCatalogo) return;
    actualizandoCatalogo=true; estadoCatalogo='cargando'; mensajeCatalogo='';
    if(['inicio','anio','materia'].includes(estado.vista)) render();
    const {propietario,repositorio,rama}=githubConfiguracion;
    const url=`https://api.github.com/repos/${encodeURIComponent(propietario)}/${encodeURIComponent(repositorio)}/git/trees/${encodeURIComponent(rama)}?recursive=1`;
    try {
      const respuesta=await fetch(url,{cache:'no-store',headers:{'Accept':'application/vnd.github+json'}});
      if(!respuesta.ok)throw Error(`GitHub API respondió ${respuesta.status}`);
      incorporarArchivosDeGitHub(await respuesta.json());
      estadoCatalogo='listo';
    }catch(error){
      estadoCatalogo='error';
      mensajeCatalogo='No fue posible consultar los archivos de GitHub. Se muestra el catálogo de respaldo.';
      console.warn('Momo: consulta automática no disponible:',error);
    }finally{
      actualizandoCatalogo=false;
      // No interrumpir a quien ya esté resolviendo o revisando un examen.
      if(['inicio','anio','materia'].includes(estado.vista)) render();
    }
  }
  function segundos(ms){return Math.max(0,Math.ceil(ms/1000));}
  function duracion(){const n=Number(estado.datos?.configuracion?.duracion_minutos);return Number.isFinite(n)&&n>0?n:0;}
  function configurarFin(){
    detenerReloj();
    const mins=duracion();
    if (mins && estado.datos.configuracion?.contador_permitido !== false){ estado.fin=Date.now()+mins*60000; reloj=setInterval(actualizarTiempo,1000); }
    else estado.fin=null;
  }
  function actualizarTiempo(){
    if(!activa())return;
    const segundosRestantes=segundos(estado.fin-Date.now());
    const elemento=document.getElementById('tiempo-examen');
    if(elemento){elemento.textContent=`⏱ ${String(Math.floor(segundosRestantes/60)).padStart(2,'0')}:${String(segundosRestantes%60).padStart(2,'0')}`;elemento.classList.toggle('urgente',segundosRestantes<60);}
    if(segundosRestantes<=0){
      detenerReloj();
      if(estado.datos?.configuracion?.cerrar_automaticamente!==false){finalizar(true);} else aviso('El tiempo terminó. Puedes terminar cuando quieras.');
    }
  }
  function opciones(p){return Array.isArray(p.opciones)?p.opciones:[];}
  function indiceCorrecto(p){
    const op=opciones(p), resp=p.respuesta_correcta;
    if(typeof resp==='number')return resp>=0&&resp<op.length?resp:(resp>=1&&resp<=op.length?resp-1:-1);
    const valor=String(resp??'').trim().toUpperCase();
    return op.findIndex((o,i)=>String(o.inciso||String.fromCharCode(65+i)).toUpperCase()===valor || String(o.texto??o).trim().toUpperCase()===valor);
  }
  function validar(datos){
    if(!datos || !Array.isArray(datos.preguntas) || !datos.preguntas.length)throw Error('El archivo debe tener una lista «preguntas» con al menos una pregunta.');
    datos.preguntas.forEach((p,i)=>{
      if(!p || !p.pregunta || opciones(p).length<2)throw Error(`La pregunta ${i+1} necesita enunciado y al menos dos opciones.`);
      if(indiceCorrecto(p)<0)throw Error(`No se reconoce la respuesta_correcta de la pregunta ${i+1}.`);
    });
    return datos;
  }
  async function cargar(archivo, nombre){
    app.innerHTML = `<div class="pre-examen"><p>Abriendo el examen…</p></div>`;
    try{
      const res=await fetch(archivo,{cache:'no-store'});
      if(!res.ok)throw Error(`No se encontró ${archivo} (${res.status}).`);
      mostrarPreparacion(validar(await res.json()),nombre);
    }catch(error){
      app.innerHTML=`${ruta([{titulo:anioActual()?.titulo||'Año',accion:'anio'},{titulo:materiaActual()?.nombre||'Materia',accion:'materia'},{titulo:'Error'}])}<div class="error"><h2>No se pudo abrir el examen</h2><p>${escapar(error.message)}</p><p>Si abriste <b>index.html</b> directamente sin servidor, usa «Abrir un JSON de mi dispositivo» o inicia un servidor local (consulta README.md). Si estás en GitHub Pages, revisa la ruta y el nombre del archivo.</p>${accion('materia','Volver a la materia','','boton secundario')}</div>`;
    }
  }
  function mostrarPreparacion(datos,nombre){
    detenerReloj();
    estado.datos=datos;estado.vista='preparacion';estado.terminado=false;estado.indice=0;
    const minutos=Number(datos.configuracion?.duracion_minutos)||0;
    const textoTiempo=(minutos>0 && datos.configuracion?.contador_permitido!==false)?`${minutos} minutos`:'Sin límite de tiempo';
    const a=anioActual(),m=materiaActual();
    app.innerHTML=`${ruta([{titulo:a?.titulo||'Año',accion:'anio'},{titulo:m?.nombre||'Materia',accion:'materia'},{titulo:'Preparación'}])}<div class="panel"><div class="pre-examen"><span class="mini-titulo">Antes de empezar</span><h2>${escapar(datos.nombre||nombre||'Examen de práctica')}</h2><p>Lee con calma y elige una opción por pregunta. Podrás revisar tus respuestas cuando termines${datos.configuracion?.permitir_revision===false?' (revisión desactivada en este examen)':''}.</p><p><span class="pildora">✿ ${datos.preguntas.length} preguntas</span>&nbsp; <span class="pildora">${escapar(textoTiempo)}</span></p><div class="botones" style="margin-top:27px">${accion('empezar','Comenzar examen')}${accion('materia','← Volver a la materia','','boton secundario')}${accion('inicio','⌂ Inicio','','boton secundario')}</div></div></div>`;
  }
  function normalizarTexto(v){
    // Permite formato sencillo del JSON ELITE; elimina etiquetas no permitidas y atributos peligrosos.
    const plantilla=document.createElement('template');plantilla.innerHTML=String(v??'');
    const seguros=new Set(['B','STRONG','I','EM','U','SUP','SUB','BR','P','DIV','UL','OL','LI','SPAN']);
    const salida=document.createElement('div');
    function recorrer(n,padre){
      if(n.nodeType===Node.TEXT_NODE){padre.append(document.createTextNode(n.textContent));return;}
      if(n.nodeType!==Node.ELEMENT_NODE)return;
      if(n.tagName==='SCRIPT'||n.tagName==='STYLE'||n.tagName==='IFRAME'||n.tagName==='SVG')return;
      const nuevo=seguros.has(n.tagName)?document.createElement(n.tagName.toLowerCase()):padre;
      if(nuevo!==padre)padre.append(nuevo);
      n.childNodes.forEach(h=>recorrer(h,nuevo));
    }
    plantilla.content.childNodes.forEach(n=>recorrer(n,salida));
    return salida.innerHTML;
  }
  function imagenSegura(ruta){
    if(typeof ruta!=='string'||!ruta||ruta.includes('..')||!/^([\p{L}\p{N}_\-. /%()]+)$/u.test(ruta)||ruta.startsWith('/'))return '';
    return `<img src="${escapar(ruta)}" alt="Imagen de apoyo de la pregunta" loading="lazy">`;
  }
  function contenidoPregunta(p){const q=p.pregunta;return typeof q==='string'?normalizarTexto(q):normalizarTexto(q?.contenido||'')+imagenSegura(q?.imagen);}
  function contenidoOpcion(o){return typeof o==='string'?normalizarTexto(o):normalizarTexto(o.texto||'')+imagenSegura(o.imagen);}
  function renderPregunta(){
    if(!estado.datos)return;
    const total=estado.datos.preguntas.length,i=estado.indice,p=estado.datos.preguntas[i];
    const marcadas=estado.respuestas.filter(v=>v!==null).length;
    const lista=opciones(p).map((o,j)=>`<button type="button" class="opcion ${estado.respuestas[i]===j?'elegida':''}" data-accion="responder" data-indice="${j}" aria-pressed="${estado.respuestas[i]===j?'true':'false'}"><span class="letra">${escapar(o.inciso||String.fromCharCode(65+j))}</span><span class="contenido">${contenidoOpcion(o)}</span></button>`).join('');
    const mapa=estado.datos.preguntas.map((_,k)=>`<button class="mini-pregunta ${estado.respuestas[k]!==null?'marcada':''} ${k===i?'actual':''}" type="button" data-accion="saltar" data-indice="${k}" aria-label="Ir a pregunta ${k+1}" ${k===i?'aria-current="step"':''}>${k+1}</button>`).join('');
    app.innerHTML=`<div class="panel panel-examen">
      <nav class="barra-examen" aria-label="Acciones del examen">
        <div class="barra-enlaces">
          ${accion('inicio','⌂ Inicio','','boton secundario boton-salir')}
          ${accion('salir','← Volver a la materia','','boton secundario boton-salir')}
        </div>
        ${accion('finalizar','Terminar examen','','boton boton-terminar')}
      </nav>
      <div class="examen-top"><h1>${escapar(estado.datos.nombre||'Examen de práctica')}</h1>${estado.fin!==null?'<div id="tiempo-examen" class="tiempo" role="timer">⏱ --:--</div>':''}</div>
      <div class="barra" aria-label="Avance del examen"><div style="width:${Math.round(marcadas/total*100)}%"></div></div>
      <div class="tarjeta-pregunta"><div class="numero-pregunta"><span>Pregunta ${i+1} de ${total}</span><span>${escapar(p.materia||materiaActual()?.nombre||'Medicina')}</span></div><div class="enunciado">${contenidoPregunta(p)}</div><div class="opciones">${lista}</div></div>
      <div class="navegacion" aria-label="Cambiar de pregunta">
        ${accion('anterior','← Pregunta anterior',i===0?'disabled':'','boton secundario')}
        ${accion('siguiente','Siguiente pregunta →',i===total-1?'disabled':'','boton')}
      </div>
      <div class="cierre-examen">${accion('finalizar','Terminar examen y ver resultados','','boton boton-terminar')}<p>Puedes terminar en cualquier pregunta. Se te pedirá confirmación antes de calificar.</p></div>
      <div class="estado-avance">${marcadas} de ${total} preguntas respondidas · Selecciona un número para saltar a otra pregunta.</div>
      <nav class="mapa-preguntas" aria-label="Navegación entre preguntas">${mapa}</nav>
    </div>`;
    if(estado.fin!==null)actualizarTiempo();
  }
  function empezar(){
    if(!estado.datos)return;
    estado.vista='pregunta';estado.respuestas=Array(estado.datos.preguntas.length).fill(null);estado.indice=0;estado.terminado=false;estado.inicio=Date.now();
    protegerAtras();
    configurarFin();renderPregunta();
  }
  function finalizar(automatico=false){
    if(!activa())return;
    const pendientes=estado.respuestas.filter(v=>v===null).length;
    if(!automatico){
      const mensaje=pendientes
        ? `¿Terminar el examen ahora?\n\nTienes ${pendientes} ${pendientes===1?'pregunta sin contestar':'preguntas sin contestar'}; se calificarán como incorrectas.\n\nPulsa «Cancelar» si deseas continuar.`
        : '¿Terminar el examen ahora y ver tus resultados?\n\nDespués de confirmar ya no podrás modificar las respuestas.';
      if(!window.confirm(mensaje))return;
    }
    retirarGuardia('resultados');
    detenerReloj();estado.terminado=true;estado.vista='resultado';
    const total=estado.datos.preguntas.length;
    const aciertos=estado.datos.preguntas.filter((p,i)=>estado.respuestas[i]===indiceCorrecto(p)).length;
    const porcentaje=Math.round(100*aciertos/total);
    try{localStorage.setItem('momo_ultimo_resultado',JSON.stringify({nombre:estado.datos.nombre,porcentaje,aciertos,total,fecha:new Date().toISOString()}));}catch(_e){}
    const revisar=estado.datos.configuracion?.permitir_revision!==false;
    const detalles=estado.datos.preguntas.map((p,i)=>{
      const correcta=indiceCorrecto(p),elegida=estado.respuestas[i],bien=elegida===correcta,ops=opciones(p);
      const letra=j=>j===null?'Sin responder':`${ops[j]?.inciso||String.fromCharCode(65+j)}. ${typeof ops[j]==='string'?ops[j]:(ops[j]?.texto||'[Opción con imagen]')}`;
      return `<article class="revision"><small class="${bien?'bien':'mal'}">${bien?'✓ Correcta':'✕ Por repasar'} · Pregunta ${i+1}</small><h3>${contenidoPregunta(p)}</h3><p><b>Tu respuesta:</b> ${normalizarTexto(letra(elegida))}</p><p class="bien"><b>Respuesta correcta:</b> ${normalizarTexto(letra(correcta))}</p>${p.explicacion?`<div class="explicacion"><strong>Explicación</strong><div>${normalizarTexto(p.explicacion)}</div></div>`:''}</article>`;
    }).join('');
    app.innerHTML=`<div class="panel"><div class="resultado-cabecera"><span class="nota">Examen terminado ${automatico?'· Se agotó el tiempo':''}</span><div class="calificacion">${porcentaje}%</div><h1>${escapar(estado.datos.nombre||'Tus resultados')}</h1><p>${aciertos} respuestas correctas de ${total} · Calificación equivalente: ${(10*aciertos/total).toFixed(1)} / 10</p><div class="botones" style="justify-content:center;margin-top:22px">${accion('repetir','Intentarlo de nuevo')}${accion('materia','← Volver a la materia','','boton secundario')}${accion('inicio','⌂ Inicio','','boton secundario')}</div></div>${revisar?`<div class="section-top"><h2>Repaso de respuestas</h2></div>${detalles}`:'<div class="alerta">La revisión de respuestas está desactivada en este examen.</div>'}</div>`;
  }
  function render(){if(estado.vista==='inicio')inicio();else if(estado.vista==='anio')anio();else if(estado.vista==='materia')materia();else if(estado.vista==='pregunta')renderPregunta();}
  app.addEventListener('click',e=>{
    const b=e.target.closest('button[data-accion]');if(!b)return;
    const act=b.dataset.accion;
    switch(act){
      case 'inicio':navegar('inicio',{ano:null,materia:null,examen:null});break;
      case 'anio':navegar('anio',{ano:b.dataset.ano||estado.ano,materia:null,examen:null});break;
      case 'materia':navegar('materia',{materia:b.dataset.materia||estado.materia,examen:null});break;
      case 'cargar':{
        const id=b.dataset.examen,e=materiaActual()?.examenes.find(x=>x.id===id);
        if(e){estado.examen=id;cargar(e.archivo,e.nombre)}break;
      }
      case 'archivo':inputArchivo.value='';inputArchivo.click();break;
      case 'actualizar-catalogo':sincronizarCatalogo();break;
      case 'empezar':empezar();break;
      case 'responder':estado.respuestas[estado.indice]=Number(b.dataset.indice);renderPregunta();break;
      case 'anterior':estado.indice=Math.max(0,estado.indice-1);renderPregunta();window.scrollTo({top:0,behavior:'instant'});break;
      case 'siguiente':estado.indice=Math.min(estado.datos.preguntas.length-1,estado.indice+1);renderPregunta();window.scrollTo({top:0,behavior:'instant'});break;
      case 'saltar':estado.indice=Number(b.dataset.indice);renderPregunta();window.scrollTo({top:0,behavior:'instant'});break;
      case 'finalizar':finalizar();break;
      case 'repetir':mostrarPreparacion(estado.datos,estado.datos.nombre);break;
      case 'salir':navegar('materia');break;
    }
  });
  inputArchivo.addEventListener('change',async()=>{
    const archivo=inputArchivo.files?.[0];if(!archivo)return;
    try{mostrarPreparacion(validar(JSON.parse(await archivo.text())),archivo.name);}catch(error){aviso(`No se pudo cargar el archivo: ${error.message}`);}
  });
  document.getElementById('link-inicio').addEventListener('click',e=>{e.preventDefault();navegar('inicio',{ano:null,materia:null,examen:null});});
  // El navegador solo permite mostrar su advertencia estándar al recargar,
  // cerrar la pestaña o abandonar el sitio; no permite personalizar ese texto.
  window.addEventListener('beforeunload',e=>{
    if(activa()){e.preventDefault();e.returnValue='';}
  });
  window.addEventListener('popstate',()=>{
    if(!activa())return;
    // Volver desde la entrada temporal #examen: preguntar antes de perder respuestas.
    if(!confirmarSalida()){
      protegerAtras();
      return;
    }
    navegar('materia',{examen:null},true);
  });
  render();
  sincronizarCatalogo();
})();
