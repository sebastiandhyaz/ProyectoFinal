/**
 * ============================================================
 * main.js — Controlador principal de la aplicación SPA
 * Maneja: routing, scrollspy, menú móvil, animaciones,
 * y la lógica de cada módulo (formularios, cálculos, gráficos)
 * ============================================================
 */

// ============================================================
// UTILIDADES GENERALES
// ============================================================

/** Formatear número con decimales fijos */
function formatearNumero(n, decimales = 6) {
  if (n === undefined || n === null || isNaN(n)) return 'N/A';
  if (!isFinite(n)) return n > 0 ? '+∞' : '-∞';
  return Number(n).toFixed(decimales);
}

/** Mostrar u ocultar elemento */
function mostrar(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function ocultar(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/** Mostrar alerta dentro de un contenedor */
function mostrarAlerta(tipo, mensaje, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="alert-${tipo}">${mensaje}</div>`;
  container.classList.remove('hidden');
}

/** Mostrar estado de carga en botón */
function mostrarCarga(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.add('btn-loading');
  btn.disabled = true;
}
function ocultarCarga(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.remove('btn-loading');
  btn.disabled = false;
}

/** Crear tabla HTML a partir de datos */
function crearTablaHTML(columnas, filas, opciones = {}) {
  const { maxFilas = 50, highlightFn = null } = opciones;
  let html = '<table class="results-table"><thead><tr>';
  columnas.forEach(c => html += `<th>${c}</th>`);
  html += '</tr></thead><tbody>';
  const filasVisibles = filas.slice(0, maxFilas);
  filasVisibles.forEach((fila, idx) => {
    const highlight = highlightFn && highlightFn(fila, idx) ? ' class="highlight-row"' : '';
    html += `<tr${highlight}>`;
    fila.forEach(val => {
      const display = typeof val === 'number' ? formatearNumero(val) : val;
      html += `<td>${display}</td>`;
    });
    html += '</tr>';
  });
  if (filas.length > maxFilas) {
    html += `<tr><td colspan="${columnas.length}" class="text-center"><em>... ${filas.length - maxFilas} filas más omitidas</em></td></tr>`;
  }
  html += '</tbody></table>';
  return html;
}

/** Scroll suave a sección */
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const navHeight = document.querySelector('.navbar')?.offsetHeight || 70;
  const top = el.offsetTop - navHeight - 10;
  window.scrollTo({ top, behavior: 'smooth' });
}

// Variable global para almacenar últimos resultados (para exportación CSV)
let ultimosResultados = {};

// ============================================================
// INICIALIZACIÓN DE NAVEGACIÓN
// ============================================================

function initRouter() {
  // Manejar clic en enlaces del nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').replace('#', '');
      scrollToSection(target);
      // Cerrar menú móvil
      document.getElementById('nav-links')?.classList.remove('active');
      document.getElementById('hamburger')?.classList.remove('active');
    });
  });

  // Footer links
  document.querySelectorAll('.footer a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').replace('#', '');
      scrollToSection(target);
    });
  });
}

function initScrollspy() {
  const sections = document.querySelectorAll('.section, .hero-section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-70px 0px 0px 0px' });

  sections.forEach(section => observer.observe(section));
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section, .module-card').forEach(el => {
    observer.observe(el);
  });
}

function initTheoryToggles() {
  document.querySelectorAll('.theory-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const content = document.getElementById(targetId);
      if (!content) return;
      const isOpen = !content.classList.contains('hidden');
      content.classList.toggle('hidden', isOpen);
      const icon = btn.querySelector('.toggle-icon');
      if (icon) icon.textContent = isOpen ? '▼' : '▲';
    });
  });
  // Inicialmente ocultar contenido teórico
  document.querySelectorAll('.theory-content').forEach(el => el.classList.add('hidden'));
}

// ============================================================
// MÓDULO 1: SISTEMAS DE ECUACIONES LINEALES
// ============================================================

function initSistemasLineales() {
  const tamanoSelect = document.getElementById('sistemas-tamano');
  const metodoSelect = document.getElementById('sistemas-metodo');
  const omegaGroup = document.getElementById('sistemas-omega-group');

  // Generar inputs de matriz iniciales
  generarMatrizInputs(3);
  cargarEjemploSistemas();

  // Cambio de tamaño
  tamanoSelect?.addEventListener('change', () => {
    generarMatrizInputs(parseInt(tamanoSelect.value));
  });

  // Mostrar/ocultar omega para SOR
  metodoSelect?.addEventListener('change', () => {
    if (omegaGroup) {
      omegaGroup.style.display = metodoSelect.value === 'sor' ? '' : 'none';
    }
  });
  // Estado inicial omega
  if (omegaGroup && metodoSelect) {
    omegaGroup.style.display = metodoSelect.value === 'sor' ? '' : 'none';
  }

  // Botones
  document.getElementById('btn-sistemas-ejemplo')?.addEventListener('click', cargarEjemploSistemas);
  document.getElementById('btn-sistemas-bloqueo')?.addEventListener('click', simularBloqueoSistemas);
  document.getElementById('btn-sistemas-calcular')?.addEventListener('click', calcularSistemas);
  document.getElementById('btn-sistemas-exportar')?.addEventListener('click', () => {
    if (ultimosResultados.sistemas && window.Visualizacion) {
      const datos = ultimosResultados.sistemas;
      if (datos.historial) {
        const cols = ['Iteración', ...datos.historial[0].x.map((_, i) => `x${i+1}`), 'Error'];
        const filas = datos.historial.map(h => [h.iter, ...h.x, h.error]);
        window.Visualizacion.exportarCSV(filas, cols, 'sistemas_lineales_resultados');
      }
    }
  });
}

function generarMatrizInputs(n) {
  const matrizContainer = document.getElementById('sistemas-matriz-container');
  const x0Container = document.getElementById('sistemas-x0-container');
  if (!matrizContainer || !x0Container) return;

  // Matriz A con vector b
  let html = '<div class="matrix-input">';
  html += '<div class="matrix-bracket left"></div>';
  html += '<div class="matrix-grid" style="grid-template-columns: repeat(' + n + ', 1fr)">';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      html += `<input type="number" id="mat-a-${i}-${j}" class="matrix-cell" value="0" step="any">`;
    }
  }
  html += '</div>';
  html += '<div class="matrix-bracket right"></div>';
  html += '<div class="matrix-separator">=</div>';
  html += '<div class="matrix-bracket left"></div>';
  html += '<div class="matrix-grid" style="grid-template-columns: 1fr">';
  for (let i = 0; i < n; i++) {
    html += `<input type="number" id="vec-b-${i}" class="matrix-cell" value="0" step="any">`;
  }
  html += '</div>';
  html += '<div class="matrix-bracket right"></div>';
  html += '</div>';
  matrizContainer.innerHTML = html;

  // Vector x0
  let htmlX0 = '<div class="vector-input" style="display:flex;gap:8px;flex-wrap:wrap">';
  for (let i = 0; i < n; i++) {
    htmlX0 += `<div class="input-group" style="flex:1;min-width:80px"><label>x₀<sub>${i+1}</sub></label><input type="number" id="vec-x0-${i}" value="0" step="any"></div>`;
  }
  htmlX0 += '</div>';
  x0Container.innerHTML = htmlX0;
}

function leerMatriz(n) {
  const A = [];
  for (let i = 0; i < n; i++) {
    A[i] = [];
    for (let j = 0; j < n; j++) {
      A[i][j] = parseFloat(document.getElementById(`mat-a-${i}-${j}`)?.value) || 0;
    }
  }
  return A;
}

function leerVectorB(n) {
  const b = [];
  for (let i = 0; i < n; i++) {
    b[i] = parseFloat(document.getElementById(`vec-b-${i}`)?.value) || 0;
  }
  return b;
}

function leerVectorX0(n) {
  const x0 = [];
  for (let i = 0; i < n; i++) {
    x0[i] = parseFloat(document.getElementById(`vec-x0-${i}`)?.value) || 0;
  }
  return x0;
}

function cargarEjemploSistemas() {
  const data = window.AppData?.sistemasLineales;
  if (!data) return;
  const n = data.matrizA.length;
  document.getElementById('sistemas-tamano').value = n;
  generarMatrizInputs(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const el = document.getElementById(`mat-a-${i}-${j}`);
      if (el) el.value = data.matrizA[i][j];
    }
    const elB = document.getElementById(`vec-b-${i}`);
    if (elB) elB.value = data.vectorB[i];
    const elX0 = document.getElementById(`vec-x0-${i}`);
    if (elX0) elX0.value = data.x0[i];
  }
}

function simularBloqueoSistemas() {
  const data = window.AppData?.sistemasLineales?.escenarioBloqueo;
  if (!data) return;
  const n = data.matrizA.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const el = document.getElementById(`mat-a-${i}-${j}`);
      if (el) el.value = data.matrizA[i][j];
    }
    const elB = document.getElementById(`vec-b-${i}`);
    if (elB) elB.value = data.vectorB[i];
  }
  mostrarAlerta('warning', '⚠️ Escenario de bloqueo cargado: ' + data.descripcion, 'sistemas-interpretacion');
  mostrar('resultados-sistemas');
}

function calcularSistemas() {
  mostrarCarga('btn-sistemas-calcular');
  setTimeout(() => {
    try {
      const SL = window.SistemasLineales;
      if (!SL) throw new Error('Módulo de Sistemas Lineales no cargado');

      const n = parseInt(document.getElementById('sistemas-tamano').value);
      const metodo = document.getElementById('sistemas-metodo').value;
      const tol = parseFloat(document.getElementById('sistemas-tolerancia').value);
      const maxIter = parseInt(document.getElementById('sistemas-maxiter').value);
      const omega = parseFloat(document.getElementById('sistemas-omega').value);
      const A = leerMatriz(n);
      const b = leerVectorB(n);
      const x0 = leerVectorX0(n);

      let resultado;
      switch (metodo) {
        case 'jacobi': resultado = SL.jacobi(A, b, x0, tol, maxIter); break;
        case 'gaussSeidel': resultado = SL.gaussSeidel(A, b, x0, tol, maxIter); break;
        case 'sor': resultado = SL.sor(A, b, x0, tol, maxIter, omega); break;
        case 'lu': resultado = SL.descomposicionLU(A, b); break;
        case 'gradienteConjugado': resultado = SL.gradienteConjugado(A, b, x0, tol, maxIter); break;
      }

      ultimosResultados.sistemas = resultado;

      // Mostrar solución
      const solDiv = document.getElementById('sistemas-solucion');
      if (solDiv && resultado.solucion) {
        const zonas = window.AppData?.sistemasLineales?.zonas || resultado.solucion.map((_, i) => `x${i+1}`);
        solDiv.innerHTML = resultado.solucion.map((val, i) => 
          `<div class="result-value"><strong>${zonas[i] || 'x'+(i+1)}:</strong> ${formatearNumero(val, 4)}</div>`
        ).join('');
        if (resultado.iteraciones !== undefined) {
          solDiv.innerHTML += `<div class="result-value"><strong>Iteraciones:</strong> ${resultado.iteraciones}</div>`;
          solDiv.innerHTML += `<div class="result-value"><strong>Convergió:</strong> ${resultado.convergencia ? 'Sí ✅' : 'No ❌'}</div>`;
        }
      }

      // Número de condición
      const condDiv = document.getElementById('sistemas-condicion');
      if (condDiv) {
        try {
          const cond = SL.calcularNumeroCondicion(A);
          condDiv.innerHTML = `<div class="result-value"><strong>κ(A) ≈</strong> ${formatearNumero(cond.valor, 2)}</div>
            <div class="result-value"><em>${cond.interpretacion}</em></div>`;
        } catch (e) {
          condDiv.innerHTML = '<em>No se pudo calcular</em>';
        }
      }

      // Tabla de iteraciones
      const tablaDiv = document.getElementById('sistemas-tabla');
      if (tablaDiv && resultado.historial && resultado.historial.length > 0) {
        const cols = ['Iter', ...resultado.solucion.map((_, i) => `x${i+1}`), 'Error'];
        const filas = resultado.historial.map(h => [h.iter, ...h.x, h.error]);
        tablaDiv.innerHTML = crearTablaHTML(cols, filas);
      } else if (tablaDiv && resultado.pasos) {
        // LU: mostrar pasos
        tablaDiv.innerHTML = resultado.pasos.map(p => `<p><strong>${p.descripcion}</strong></p>`).join('');
      }

      // Gráfico de convergencia
      if (resultado.historial && resultado.historial.length > 0 && window.Visualizacion) {
        const errores = resultado.historial.map(h => h.error);
        const iters = resultado.historial.map(h => h.iter);
        window.Visualizacion.crearGraficoConvergencia('chart-sistemas-convergencia', iters, errores, metodo);
      }

      // Interpretación
      const interpDiv = document.getElementById('sistemas-interpretacion');
      if (interpDiv) {
        try {
          const contexto = { plantas: window.AppData?.sistemasLineales?.plantas || [], zonas: window.AppData?.sistemasLineales?.zonas || [] };
          const texto = SL.generarInterpretacion(metodo, resultado, contexto);
          interpDiv.innerHTML = `<p>${texto}</p>`;
        } catch (e) {
          interpDiv.innerHTML = `<p>Cálculo completado exitosamente con el método ${metodo}.</p>`;
        }
      }

      mostrar('resultados-sistemas');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'sistemas-interpretacion');
      mostrar('resultados-sistemas');
    } finally {
      ocultarCarga('btn-sistemas-calcular');
    }
  }, 50);
}

// ============================================================
// MÓDULO 2: RAÍCES DE ECUACIONES
// ============================================================

function initRaices() {
  const funcionSelect = document.getElementById('raices-funcion');
  const metodoSelect = document.getElementById('raices-metodo');

  // Función personalizada toggle
  funcionSelect?.addEventListener('change', () => {
    const isCustom = funcionSelect.value === 'custom';
    document.getElementById('raices-custom-group')?.classList.toggle('hidden', !isCustom);
    // Actualizar parámetros según la función seleccionada
    if (!isCustom) {
      const funcData = window.AppData?.raices?.funciones?.find(f => f.id === funcionSelect.value);
      if (funcData) {
        document.getElementById('raices-a').value = funcData.intervalo[0];
        document.getElementById('raices-b').value = funcData.intervalo[1];
        document.getElementById('raices-x0').value = funcData.x0;
        document.getElementById('raices-x0s').value = funcData.x0;
        document.getElementById('raices-x1s').value = funcData.x1;
      }
    }
  });

  // Método cambia inputs visibles
  metodoSelect?.addEventListener('change', () => {
    const m = metodoSelect.value;
    document.getElementById('raices-params-biseccion')?.classList.toggle('hidden', m !== 'biseccion');
    document.getElementById('raices-params-newton')?.classList.toggle('hidden', m !== 'newton');
    document.getElementById('raices-params-secante')?.classList.toggle('hidden', m !== 'secante');
  });

  // Botones
  document.getElementById('btn-raices-calcular')?.addEventListener('click', calcularRaices);
  document.getElementById('btn-raices-comparar')?.addEventListener('click', compararRaices);
  document.getElementById('btn-raices-exportar')?.addEventListener('click', () => {
    if (ultimosResultados.raices?.historial && window.Visualizacion) {
      const h = ultimosResultados.raices.historial;
      const cols = Object.keys(h[0]);
      const filas = h.map(r => cols.map(c => r[c]));
      window.Visualizacion.exportarCSV(filas, cols, 'raices_resultados');
    }
  });
}

function obtenerFuncionRaices() {
  const R = window.Raices;
  const funcId = document.getElementById('raices-funcion').value;
  if (funcId === 'custom') {
    const expr = document.getElementById('raices-custom').value;
    if (!expr) throw new Error('Ingrese una función personalizada');
    const f = R.parsearFuncion(expr);
    const df = null; // usar derivada numérica
    return { f, df, nombre: 'Personalizada', descripcion: expr };
  }
  const funcData = window.AppData?.raices?.funciones?.find(fn => fn.id === funcId);
  if (!funcData) throw new Error('Función no encontrada');
  const f = R.parsearFuncion(funcData.expresion);
  const df = R.parsearFuncion(funcData.derivada);
  return { f, df, nombre: funcData.nombre, descripcion: funcData.descripcion, expresionTexto: funcData.expresionTexto };
}

function calcularRaices() {
  mostrarCarga('btn-raices-calcular');
  setTimeout(() => {
    try {
      const R = window.Raices;
      if (!R) throw new Error('Módulo de Raíces no cargado');

      const { f, df, nombre, descripcion } = obtenerFuncionRaices();
      const metodo = document.getElementById('raices-metodo').value;
      const tol = parseFloat(document.getElementById('raices-tolerancia').value);
      const maxIter = parseInt(document.getElementById('raices-maxiter').value);

      let resultado;
      switch (metodo) {
        case 'biseccion': {
          const a = parseFloat(document.getElementById('raices-a').value);
          const b = parseFloat(document.getElementById('raices-b').value);
          resultado = R.biseccion(f, a, b, tol, maxIter);
          break;
        }
        case 'newton': {
          const x0 = parseFloat(document.getElementById('raices-x0').value);
          resultado = R.newtonRaphson(f, df, x0, tol, maxIter);
          break;
        }
        case 'secante': {
          const x0 = parseFloat(document.getElementById('raices-x0s').value);
          const x1 = parseFloat(document.getElementById('raices-x1s').value);
          resultado = R.secante(f, x0, x1, tol, maxIter);
          break;
        }
      }

      ultimosResultados.raices = resultado;

      // Raíz encontrada
      document.getElementById('raices-raiz').innerHTML = `<div class="result-value" style="font-size:1.5em"><strong>x = ${formatearNumero(resultado.raiz, 8)}</strong></div>
        <div class="result-value">f(x) = ${formatearNumero(f(resultado.raiz), 10)}</div>
        <div class="result-value">Iteraciones: ${resultado.iteraciones}</div>`;

      // Orden de convergencia
      document.getElementById('raices-orden').innerHTML = `<div class="result-value">${formatearNumero(resultado.ordenConvergencia, 3)}</div>`;

      // Tabla
      const tablaDiv = document.getElementById('raices-tabla');
      if (tablaDiv && resultado.historial) {
        const cols = Object.keys(resultado.historial[0]).map(k => k);
        const filas = resultado.historial.map(r => cols.map(c => r[c]));
        tablaDiv.innerHTML = crearTablaHTML(cols, filas);
      }

      // Gráfico de función
      if (window.Visualizacion) {
        const funcId = document.getElementById('raices-funcion').value;
        const funcData = window.AppData?.raices?.funciones?.find(fn => fn.id === funcId);
        const xMin = funcData ? funcData.intervalo[0] : resultado.raiz - 10;
        const xMax = funcData ? funcData.intervalo[1] : resultado.raiz + 10;

        window.Visualizacion.crearGraficoFuncion('chart-raices-funcion', {
          funcion: f, xMin, xMax, raiz: resultado.raiz,
          titulo: 'Gráfico de f(x)', ejeX: 'x', ejeY: 'f(x)'
        });

        // Gráfico de convergencia
        if (resultado.errores || resultado.historial) {
          const errores = resultado.errores || resultado.historial.map(h => h.error);
          const iters = errores.map((_, i) => i + 1);
          window.Visualizacion.crearGraficoConvergencia('chart-raices-convergencia', iters, errores, metodo);
        }
      }

      // Interpretación
      const interpDiv = document.getElementById('raices-interpretacion');
      if (interpDiv) {
        try {
          const texto = R.generarInterpretacion(metodo, resultado, { nombreFuncion: nombre, descripcion });
          interpDiv.innerHTML = `<p>${texto}</p>`;
        } catch (e) {
          interpDiv.innerHTML = `<p>Se encontró la raíz x ≈ ${formatearNumero(resultado.raiz, 6)} después de ${resultado.iteraciones} iteraciones.</p>`;
        }
      }

      ocultar('raices-comparacion-container');
      mostrar('resultados-raices');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'raices-interpretacion');
      mostrar('resultados-raices');
    } finally {
      ocultarCarga('btn-raices-calcular');
    }
  }, 50);
}

function compararRaices() {
  mostrarCarga('btn-raices-comparar');
  setTimeout(() => {
    try {
      const R = window.Raices;
      if (!R) throw new Error('Módulo no cargado');
      const { f, df } = obtenerFuncionRaices();
      const tol = parseFloat(document.getElementById('raices-tolerancia').value);
      const maxIter = parseInt(document.getElementById('raices-maxiter').value);
      const a = parseFloat(document.getElementById('raices-a').value);
      const b = parseFloat(document.getElementById('raices-b').value);
      const x0 = parseFloat(document.getElementById('raices-x0').value || document.getElementById('raices-x0s').value);
      const x1 = parseFloat(document.getElementById('raices-x1s').value);

      const comp = R.compararMetodos(f, df, a, b, x0, x1, tol, maxIter);

      // Tabla comparativa
      const tablaDiv = document.getElementById('raices-comparacion-tabla');
      if (tablaDiv) {
        const cols = ['Método', 'Raíz', 'Iteraciones', 'Error', 'Orden', 'Tiempo (ms)'];
        const filas = comp.comparacion.map(c => [c.metodo, c.raiz, c.iteraciones, c.error, c.orden, c.tiempo?.toFixed(3) || 'N/A']);
        tablaDiv.innerHTML = crearTablaHTML(cols, filas);
        tablaDiv.innerHTML += `<p class="mt-2"><strong>Mejor método:</strong> ${comp.mejor} (menor número de iteraciones)</p>`;
      }

      // Gráfico comparativo
      if (window.Visualizacion) {
        window.Visualizacion.crearGraficoComparacion('chart-raices-comparacion', {
          metodos: comp.comparacion.map(c => c.metodo),
          valores: comp.comparacion.map(c => c.iteraciones),
          titulo: 'Comparación: Iteraciones por Método',
          ejeY: 'Iteraciones'
        });
      }

      mostrar('raices-comparacion-container');
      mostrar('resultados-raices');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'raices-interpretacion');
      mostrar('resultados-raices');
    } finally {
      ocultarCarga('btn-raices-comparar');
    }
  }, 50);
}

// ============================================================
// MÓDULO 3: INTERPOLACIÓN
// ============================================================

function initInterpolacion() {
  const productoSelect = document.getElementById('interp-producto');

  // Cargar datos iniciales
  cargarDatosInterpolacion();

  productoSelect?.addEventListener('change', cargarDatosInterpolacion);

  document.getElementById('btn-interp-cargar')?.addEventListener('click', cargarDatosInterpolacion);
  document.getElementById('btn-interp-agregar')?.addEventListener('click', agregarPuntoInterpolacion);
  document.getElementById('btn-interp-calcular')?.addEventListener('click', calcularInterpolacion);
  document.getElementById('btn-interp-comparar')?.addEventListener('click', compararInterpolacion);
  document.getElementById('btn-interp-exportar')?.addEventListener('click', () => {
    if (ultimosResultados.interpolacion && window.Visualizacion) {
      const cols = ['x (día)', 'y (precio)'];
      const filas = ultimosResultados.interpolacion;
      window.Visualizacion.exportarCSV(filas, cols, 'interpolacion_resultados');
    }
  });
}

function cargarDatosInterpolacion() {
  const productoId = document.getElementById('interp-producto')?.value;
  const container = document.getElementById('interp-puntos-container');
  if (!container) return;

  let puntos;
  if (productoId === 'custom') {
    puntos = [[0, 0], [1, 1]]; // Datos mínimos
  } else {
    const producto = window.AppData?.interpolacion?.productos?.find(p => p.id === productoId);
    puntos = producto?.datos || [[1, 8], [5, 10], [10, 13]];
  }

  renderPuntosInterpolacion(puntos);
}

function renderPuntosInterpolacion(puntos) {
  const container = document.getElementById('interp-puntos-container');
  if (!container) return;

  let html = '';
  puntos.forEach((p, i) => {
    html += `<div class="data-point-row" style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
      <input type="number" class="interp-x" value="${p[0]}" step="any" style="width:80px" placeholder="x">
      <input type="number" class="interp-y" value="${p[1]}" step="any" style="width:80px" placeholder="y">
      <button class="btn-sm btn-danger btn-remove-point" onclick="this.parentElement.remove()">✕</button>
    </div>`;
  });
  container.innerHTML = html;
}

function agregarPuntoInterpolacion() {
  const container = document.getElementById('interp-puntos-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'data-point-row';
  div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:4px';
  div.innerHTML = `<input type="number" class="interp-x" value="" step="any" style="width:80px" placeholder="x">
    <input type="number" class="interp-y" value="" step="any" style="width:80px" placeholder="y">
    <button class="btn-sm btn-danger btn-remove-point" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(div);
}

function leerPuntosInterpolacion() {
  const xs = document.querySelectorAll('.interp-x');
  const ys = document.querySelectorAll('.interp-y');
  const puntos = [];
  xs.forEach((xEl, i) => {
    const x = parseFloat(xEl.value);
    const y = parseFloat(ys[i]?.value);
    if (!isNaN(x) && !isNaN(y)) puntos.push([x, y]);
  });
  return puntos;
}

function calcularInterpolacion() {
  mostrarCarga('btn-interp-calcular');
  setTimeout(() => {
    try {
      const I = window.Interpolacion;
      if (!I) throw new Error('Módulo de Interpolación no cargado');

      const metodo = document.getElementById('interp-metodo').value;
      const xEval = parseFloat(document.getElementById('interp-xeval').value);
      const puntos = leerPuntosInterpolacion();
      if (puntos.length < 2) throw new Error('Se necesitan al menos 2 puntos de datos');

      let resultado;
      switch (metodo) {
        case 'lagrange': resultado = I.lagrange(puntos, xEval); break;
        case 'newton': resultado = I.newtonDiferencias(puntos, xEval); break;
        case 'splines': resultado = I.splinesCubicos(puntos, xEval); break;
      }

      // Valor interpolado
      const valor = Array.isArray(resultado.valor) ? resultado.valor[0] : resultado.valor;
      document.getElementById('interp-valor').innerHTML = `<div class="result-value" style="font-size:1.5em">
        <strong>P(${xEval}) = ${formatearNumero(valor, 4)}</strong></div>`;

      // Polinomio
      document.getElementById('interp-polinomio').innerHTML = resultado.polinomio ? `<p>${resultado.polinomio}</p>` : '';

      // Tabla
      const tablaDiv = document.getElementById('interp-tabla');
      if (tablaDiv && resultado.tablaDiferencias) {
        let html = '<h4>Tabla de Diferencias Divididas</h4><table class="results-table"><thead><tr><th>Orden</th>';
        for (let i = 0; i < resultado.tablaDiferencias[0].length; i++) html += `<th>Δ${i}</th>`;
        html += '</tr></thead><tbody>';
        resultado.tablaDiferencias.forEach((fila, idx) => {
          html += `<tr><td>${idx}</td>`;
          fila.forEach(val => html += `<td>${val !== undefined ? formatearNumero(val, 6) : ''}</td>`);
          html += '</tr>';
        });
        html += '</tbody></table>';
        tablaDiv.innerHTML = html;
      } else if (tablaDiv && resultado.pasos) {
        tablaDiv.innerHTML = resultado.pasos.map(p => `<p><strong>${p.descripcion}</strong></p>`).join('');
      }

      // Gráfico
      if (window.Visualizacion) {
        const curva = I.generarCurva(metodo, puntos, Math.min(...puntos.map(p=>p[0])), Math.max(...puntos.map(p=>p[0])));
        window.Visualizacion.crearGraficoInterpolacion('chart-interpolacion', {
          puntosOriginales: puntos,
          curvas: [{ nombre: metodo.charAt(0).toUpperCase() + metodo.slice(1), puntos: curva, color: '#3182ce' }],
          titulo: 'Interpolación - ' + metodo
        });
      }

      // Interpretación
      const interpDiv = document.getElementById('interp-interpretacion');
      if (interpDiv) {
        const productoId = document.getElementById('interp-producto').value;
        const producto = window.AppData?.interpolacion?.productos?.find(p => p.id === productoId);
        try {
          const texto = I.generarInterpretacion(metodo, resultado, { producto: producto?.nombre || 'Producto', unidad: producto?.unidad || '', xEval });
          interpDiv.innerHTML = `<p>${texto}</p>`;
        } catch (e) {
          interpDiv.innerHTML = `<p>Valor interpolado en x=${xEval}: ${formatearNumero(valor, 4)}</p>`;
        }
      }

      ultimosResultados.interpolacion = puntos;
      mostrar('resultados-interpolacion');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'interp-interpretacion');
      mostrar('resultados-interpolacion');
    } finally {
      ocultarCarga('btn-interp-calcular');
    }
  }, 50);
}

function compararInterpolacion() {
  mostrarCarga('btn-interp-comparar');
  setTimeout(() => {
    try {
      const I = window.Interpolacion;
      if (!I) throw new Error('Módulo no cargado');
      const xEval = parseFloat(document.getElementById('interp-xeval').value);
      const puntos = leerPuntosInterpolacion();
      if (puntos.length < 2) throw new Error('Se necesitan al menos 2 puntos');

      const comp = I.compararMetodos(puntos, xEval);

      // Gráfico con todas las curvas
      if (window.Visualizacion) {
        const colores = { lagrange: '#e53e3e', newton: '#38b2ac', splines: '#3182ce' };
        const curvas = Object.entries(comp.curvas).map(([m, pts]) => ({
          nombre: m.charAt(0).toUpperCase() + m.slice(1), puntos: pts, color: colores[m] || '#333'
        }));
        window.Visualizacion.crearGraficoInterpolacion('chart-interpolacion', {
          puntosOriginales: puntos, curvas, titulo: 'Comparación de Métodos de Interpolación'
        });
      }

      // Tabla comparativa
      const interpDiv = document.getElementById('interp-interpretacion');
      if (interpDiv && comp.comparacion) {
        let html = '<table class="results-table"><thead><tr><th>Método</th><th>Valor en x=' + xEval + '</th><th>Grado</th></tr></thead><tbody>';
        comp.comparacion.forEach(c => {
          html += `<tr><td>${c.metodo}</td><td>${formatearNumero(c.valorEn_x, 6)}</td><td>${c.gradoPolinomio || '-'}</td></tr>`;
        });
        html += '</tbody></table>';
        interpDiv.innerHTML = html;
      }

      mostrar('resultados-interpolacion');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'interp-interpretacion');
      mostrar('resultados-interpolacion');
    } finally {
      ocultarCarga('btn-interp-comparar');
    }
  }, 50);
}

// ============================================================
// MÓDULO 4: INTEGRACIÓN NUMÉRICA
// ============================================================

function initIntegracion() {
  const funcionSelect = document.getElementById('integ-funcion');

  funcionSelect?.addEventListener('change', () => {
    const isCustom = funcionSelect.value === 'custom';
    document.getElementById('integ-custom-group')?.classList.toggle('hidden', !isCustom);
    if (!isCustom) {
      const funcData = window.AppData?.integracion?.funciones?.find(f => f.id === funcionSelect.value);
      if (funcData) {
        document.getElementById('integ-a').value = funcData.a;
        document.getElementById('integ-b').value = funcData.b;
        document.getElementById('integ-n').value = funcData.n;
      }
    }
  });

  document.getElementById('btn-integ-calcular')?.addEventListener('click', calcularIntegracion);
  document.getElementById('btn-integ-comparar')?.addEventListener('click', compararIntegracion);
  document.getElementById('btn-integ-poder')?.addEventListener('click', calcularPerdidaPoder);
  document.getElementById('btn-integ-exportar')?.addEventListener('click', () => {
    if (ultimosResultados.integracion && window.Visualizacion) {
      const cols = ['i', 'xi', 'f(xi)', 'Área parcial'];
      const filas = ultimosResultados.integracion.sumatoria?.map(s => [s.i, s.xi, s.fxi, s.area_parcial]) || [];
      window.Visualizacion.exportarCSV(filas, cols, 'integracion_resultados');
    }
  });
}

function obtenerFuncionIntegracion() {
  const funcId = document.getElementById('integ-funcion').value;
  if (funcId === 'custom') {
    const expr = document.getElementById('integ-custom').value;
    if (!expr) throw new Error('Ingrese una función');
    // Convertir ^ a Math.pow y soportar t como variable
    let jsExpr = expr.replace(/\^/g, '**').replace(/exp\(/g, 'Math.exp(').replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(');
    return { f: new Function('t', 'return ' + jsExpr), nombre: 'Personalizada', precioConstante: 0 };
  }
  const funcData = window.AppData?.integracion?.funciones?.find(f => f.id === funcId);
  if (!funcData) throw new Error('Función no encontrada');
  const f = new Function('t', 'return ' + funcData.expresion);
  return { f, nombre: funcData.nombre, precioConstante: funcData.precioConstante, descripcion: funcData.descripcion };
}

function calcularIntegracion() {
  mostrarCarga('btn-integ-calcular');
  setTimeout(() => {
    try {
      const INT = window.Integracion;
      if (!INT) throw new Error('Módulo de Integración no cargado');

      const { f, nombre } = obtenerFuncionIntegracion();
      const metodo = document.getElementById('integ-metodo').value;
      const a = parseFloat(document.getElementById('integ-a').value);
      const b = parseFloat(document.getElementById('integ-b').value);
      const n = parseInt(document.getElementById('integ-n').value);

      let resultado;
      switch (metodo) {
        case 'trapecio': resultado = INT.trapecio(f, a, b, n); break;
        case 'simpson13': resultado = INT.simpson13(f, a, b, n); break;
        case 'simpson38': resultado = INT.simpson38(f, a, b, n); break;
      }

      ultimosResultados.integracion = resultado;

      // Valor integral
      document.getElementById('integ-valor').innerHTML = `<div class="result-value" style="font-size:1.5em">
        <strong>∫ ≈ ${formatearNumero(resultado.valor, 6)}</strong></div>
        <div class="result-value">h = ${formatearNumero(resultado.h, 4)}</div>`;

      // Error estimado
      document.getElementById('integ-error').innerHTML = `<div class="result-value">±${formatearNumero(resultado.errorEstimado, 8)}</div>`;

      // Tabla paso a paso
      const tablaDiv = document.getElementById('integ-tabla');
      if (tablaDiv && resultado.sumatoria) {
        const cols = ['i', 'x_i', 'f(x_i)', 'Área parcial'];
        const filas = resultado.sumatoria.map(s => [s.i, s.xi, s.fxi, s.area_parcial]);
        tablaDiv.innerHTML = crearTablaHTML(cols, filas);
      }

      // Gráfico del área
      if (window.Visualizacion) {
        window.Visualizacion.crearGraficoAreaIntegral('chart-integracion', {
          funcion: f, a, b, n, metodo, titulo: `Integral de ${nombre} [${a}, ${b}]`
        });
      }

      // Interpretación
      const interpDiv = document.getElementById('integ-interpretacion');
      if (interpDiv) {
        try {
          const texto = INT.generarInterpretacion(metodo, resultado, { nombreFuncion: nombre, unidad: 'Bs', a, b });
          interpDiv.innerHTML = `<p>${texto}</p>`;
        } catch (e) {
          interpDiv.innerHTML = `<p>El valor de la integral es ${formatearNumero(resultado.valor, 4)}.</p>`;
        }
      }

      ocultar('integ-poder-container');
      ocultar('integ-comparacion-container');
      mostrar('resultados-integracion');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'integ-interpretacion');
      mostrar('resultados-integracion');
    } finally {
      ocultarCarga('btn-integ-calcular');
    }
  }, 50);
}

function compararIntegracion() {
  mostrarCarga('btn-integ-comparar');
  setTimeout(() => {
    try {
      const INT = window.Integracion;
      if (!INT) throw new Error('Módulo no cargado');
      const { f } = obtenerFuncionIntegracion();
      const a = parseFloat(document.getElementById('integ-a').value);
      const b = parseFloat(document.getElementById('integ-b').value);
      const n = parseInt(document.getElementById('integ-n').value);

      const comp = INT.compararMetodos(f, a, b, n);

      const tablaDiv = document.getElementById('integ-comparacion-tabla');
      if (tablaDiv) {
        const cols = ['Método', 'Valor', 'Error Estimado', 'Puntos de Evaluación'];
        const filas = comp.comparacion.map(c => [c.metodo, formatearNumero(c.valor, 8), formatearNumero(c.error_estimado, 10), c.puntos_evaluacion]);
        tablaDiv.innerHTML = crearTablaHTML(cols, filas);
        tablaDiv.innerHTML += `<p class="mt-2"><strong>Mejor método (menor error):</strong> ${comp.mejor}</p>`;
      }

      if (window.Visualizacion) {
        window.Visualizacion.crearGraficoComparacion('chart-integ-comparacion', {
          metodos: comp.comparacion.map(c => c.metodo),
          valores: comp.comparacion.map(c => c.valor),
          titulo: 'Comparación de Valores de Integral',
          ejeY: 'Valor'
        });
      }

      mostrar('integ-comparacion-container');
      mostrar('resultados-integracion');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'integ-interpretacion');
      mostrar('resultados-integracion');
    } finally {
      ocultarCarga('btn-integ-comparar');
    }
  }, 50);
}

function calcularPerdidaPoder() {
  mostrarCarga('btn-integ-poder');
  setTimeout(() => {
    try {
      const INT = window.Integracion;
      if (!INT) throw new Error('Módulo no cargado');
      const { f, precioConstante } = obtenerFuncionIntegracion();
      const a = parseFloat(document.getElementById('integ-a').value);
      const b = parseFloat(document.getElementById('integ-b').value);
      const n = parseInt(document.getElementById('integ-n').value);

      const resultado = INT.calcularPerdidaPoder(f, precioConstante, a, b, n);

      const resDiv = document.getElementById('integ-poder-resultado');
      if (resDiv) {
        resDiv.innerHTML = `
          <div class="results-grid">
            <div class="result-card"><h4>Costo Real</h4><div class="result-value" style="font-size:1.3em">${formatearNumero(resultado.costoReal, 2)} Bs</div></div>
            <div class="result-card"><h4>Costo Sin Inflación</h4><div class="result-value" style="font-size:1.3em">${formatearNumero(resultado.costoSinInflacion, 2)} Bs</div></div>
            <div class="result-card"><h4>Pérdida</h4><div class="result-value" style="font-size:1.3em;color:#e53e3e">${formatearNumero(resultado.perdida, 2)} Bs (${formatearNumero(resultado.porcentajePerdida, 1)}%)</div></div>
          </div>
          <div class="interpretation-box"><p>${resultado.interpretacion}</p></div>`;
      }

      // Gráfico comparativo
      if (window.Visualizacion) {
        const puntos = 100;
        const labels = [];
        const datosReal = [];
        const datosConst = [];
        for (let i = 0; i <= puntos; i++) {
          const t = a + (b - a) * i / puntos;
          labels.push(t.toFixed(1));
          datosReal.push(f(t));
          datosConst.push(precioConstante);
        }
        window.Visualizacion.crearGraficoLinea('chart-integ-poder', {
          titulo: 'Precio Real vs. Precio Constante',
          etiquetas: labels,
          datasets: [
            { nombre: 'Precio Real', datos: datosReal, color: '#e53e3e' },
            { nombre: 'Precio Constante', datos: datosConst, color: '#38b2ac', dashed: true }
          ],
          ejeX: 'Día', ejeY: 'Precio (Bs)'
        });
      }

      mostrar('integ-poder-container');
      mostrar('resultados-integracion');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'integ-interpretacion');
      mostrar('resultados-integracion');
    } finally {
      ocultarCarga('btn-integ-poder');
    }
  }, 50);
}

// ============================================================
// MÓDULO 5: ECUACIONES DIFERENCIALES ORDINARIAS
// ============================================================

function initEDO() {
  const modeloSelect = document.getElementById('edo-modelo');

  // Cambio de modelo: mostrar/ocultar parámetros
  modeloSelect?.addEventListener('change', () => {
    const isReservas = modeloSelect.value === 'reservas';
    document.getElementById('edo-params-reservas')?.classList.toggle('hidden', !isReservas);
    document.getElementById('edo-params-social')?.classList.toggle('hidden', isReservas);
    document.getElementById('edo-tfinal').value = isReservas ? 30 : 60;
    document.getElementById('edo-h').value = isReservas ? 1 : 0.5;
  });

  // Sliders en tiempo real
  const sliders = ['edo-E', 'edo-consumoBase', 'edo-tasaConsumo', 'edo-a', 'edo-b-param', 'edo-c', 'edo-k', 'edo-r'];
  sliders.forEach(id => {
    const slider = document.getElementById(id);
    if (!slider) return;
    slider.addEventListener('input', () => {
      const valId = id.replace('edo-', 'edo-') + '-val';
      // Mapeo especial para b-param
      const displayId = id === 'edo-b-param' ? 'edo-b-val' : id + '-val';
      const display = document.getElementById(displayId);
      if (display) display.textContent = slider.value;
    });
  });

  // Botones
  document.getElementById('btn-edo-calcular')?.addEventListener('click', calcularEDO);
  document.getElementById('btn-edo-comparar')?.addEventListener('click', compararEDO);
  document.getElementById('btn-edo-fases')?.addEventListener('click', diagramaFases);
  document.getElementById('btn-edo-exportar')?.addEventListener('click', () => {
    if (ultimosResultados.edo && window.Visualizacion) {
      const r = ultimosResultados.edo;
      const isSystem = Array.isArray(r.y[0]);
      if (isSystem) {
        const cols = ['t', ...r.y.map((_, i) => `Variable ${i + 1}`)];
        const filas = r.t.map((t, i) => [t, ...r.y.map(v => v[i])]);
        window.Visualizacion.exportarCSV(filas, cols, 'edo_resultados');
      } else {
        const cols = ['t', 'y'];
        const filas = r.t.map((t, i) => [t, r.y[i]]);
        window.Visualizacion.exportarCSV(filas, cols, 'edo_resultados');
      }
    }
  });
}

function crearModeloEDO() {
  const E = window.EDO;
  if (!E) throw new Error('Módulo EDO no cargado');
  const modeloId = document.getElementById('edo-modelo').value;

  if (modeloId === 'reservas') {
    return E.modeloReservas({
      E: parseFloat(document.getElementById('edo-E').value),
      consumoBase: parseFloat(document.getElementById('edo-consumoBase').value),
      tasaConsumo: parseFloat(document.getElementById('edo-tasaConsumo').value),
      R0: parseFloat(document.getElementById('edo-R0').value)
    });
  } else {
    return E.modeloSocial({
      a: parseFloat(document.getElementById('edo-a').value),
      b: parseFloat(document.getElementById('edo-b-param').value),
      c: parseFloat(document.getElementById('edo-c').value),
      k: parseFloat(document.getElementById('edo-k').value),
      r: parseFloat(document.getElementById('edo-r').value),
      N0: parseFloat(document.getElementById('edo-N0').value),
      M0: parseFloat(document.getElementById('edo-M0').value),
      D0: parseFloat(document.getElementById('edo-D0').value)
    });
  }
}

function calcularEDO() {
  mostrarCarga('btn-edo-calcular');
  setTimeout(() => {
    try {
      const E = window.EDO;
      if (!E) throw new Error('Módulo EDO no cargado');

      const modelo = crearModeloEDO();
      const metodo = document.getElementById('edo-metodo').value;
      const h = parseFloat(document.getElementById('edo-h').value);
      const tFinal = parseFloat(document.getElementById('edo-tfinal').value);

      // Sobrescribir tFinal del modelo
      modelo.tFinal = tFinal;
      const resultado = E.resolver(metodo, modelo, h);
      ultimosResultados.edo = resultado;

      const modeloId = document.getElementById('edo-modelo').value;
      const isSystem = modeloId === 'social';
      const variables = modelo.variables || ['y'];

      // Tabla de resultados
      const tablaDiv = document.getElementById('edo-tabla');
      if (tablaDiv) {
        const cols = ['t', ...variables];
        let filas;
        if (isSystem) {
          // resultado.y es [varArray0, varArray1, ...] para sistemas
          filas = resultado.t.map((t, i) => [t, ...resultado.y.map(v => v[i])]);
        } else {
          filas = resultado.t.map((t, i) => [t, resultado.y[i]]);
        }
        tablaDiv.innerHTML = crearTablaHTML(cols, filas, { maxFilas: 35 });
      }

      // Gráfico de evolución
      if (window.Visualizacion) {
        const colores = ['#3182ce', '#e53e3e', '#ed8936', '#38b2ac'];
        let datasets;
        if (isSystem) {
          datasets = variables.map((v, idx) => ({
            nombre: v, t: resultado.t, y: resultado.y[idx], color: colores[idx % colores.length]
          }));
        } else {
          datasets = [{ nombre: variables[0], t: resultado.t, y: resultado.y, color: colores[0] }];
        }

        // Obtener umbral
        const modeloData = window.AppData?.edo?.modelos?.find(m => m.id === modeloId);
        const umbral = modeloData?.umbralCritico;

        window.Visualizacion.crearGraficoEDO('chart-edo-evolucion', {
          datos: datasets, titulo: `Evolución temporal - ${metodo.toUpperCase()}`,
          ejeX: 'Tiempo (días)', ejeY: 'Valor',
          umbral: umbral ? { valor: umbral.valor, label: `Umbral: ${umbral.valor}` } : null
        });
      }

      // Detección de umbral crítico
      const alertaDiv = document.getElementById('edo-alerta-critico');
      const modeloData = window.AppData?.edo?.modelos?.find(m => m.id === modeloId);
      if (alertaDiv && modeloData?.umbralCritico) {
        const uc = modeloData.umbralCritico;
        const varIdx = isSystem ? variables.indexOf(uc.variable) : 0;
        const yData = isSystem ? resultado.y[varIdx] : resultado.y;
        const direccion = uc.variable === 'R' ? 'below' : 'above';

        const deteccion = E.detectarUmbral(resultado, varIdx, uc.valor, direccion);
        if (deteccion.detectado) {
          alertaDiv.innerHTML = `⚠️ <strong>¡Alerta!</strong> ${uc.mensaje}. Día crítico: <strong>${formatearNumero(deteccion.dia, 1)}</strong>`;
          alertaDiv.classList.remove('hidden');
        } else {
          alertaDiv.classList.add('hidden');
        }
      }

      // Interpretación
      const interpDiv = document.getElementById('edo-interpretacion');
      if (interpDiv) {
        try {
          const texto = E.generarInterpretacion(modeloId, { [metodo]: resultado }, modeloData?.umbralCritico);
          interpDiv.innerHTML = `<p>${texto}</p>`;
        } catch (e) {
          interpDiv.innerHTML = `<p>Simulación completada con el método ${metodo}. ${resultado.t.length} pasos calculados.</p>`;
        }
      }

      ocultar('edo-comparacion-container');
      document.getElementById('chart-edo-fases-container')?.classList.add('hidden');
      mostrar('resultados-edo');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'edo-interpretacion');
      mostrar('resultados-edo');
    } finally {
      ocultarCarga('btn-edo-calcular');
    }
  }, 50);
}

function compararEDO() {
  mostrarCarga('btn-edo-comparar');
  setTimeout(() => {
    try {
      const E = window.EDO;
      if (!E) throw new Error('Módulo no cargado');
      const modelo = crearModeloEDO();
      const tFinal = parseFloat(document.getElementById('edo-tfinal').value);
      modelo.tFinal = tFinal;
      const h = parseFloat(document.getElementById('edo-h').value);

      const comp = E.compararMetodos(modelo, [h]);
      const modeloId = document.getElementById('edo-modelo').value;
      const isSystem = modeloId === 'social';
      const variables = modelo.variables || ['y'];

      // Tabla
      const tablaDiv = document.getElementById('edo-comparacion-tabla');
      if (tablaDiv) {
        const cols = ['Método', 'h', 'Valor Final', 'Pasos'];
        const filas = comp.comparacion.map(c => [c.metodo, c.h, 
          typeof c.valorFinal === 'object' ? JSON.stringify(c.valorFinal.map(v => +v.toFixed(2))) : formatearNumero(c.valorFinal, 2), 
          c.pasos]);
        tablaDiv.innerHTML = crearTablaHTML(cols, filas);
      }

      // Gráfico comparativo — superponer curvas de cada método
      if (window.Visualizacion) {
        const colores = { euler: '#e53e3e', heun: '#ed8936', rk4: '#3182ce' };
        const datasets = [];
        Object.entries(comp.resultados).forEach(([metodo, resultByH]) => {
          const hKey = Object.keys(resultByH)[0];
          const r = resultByH[hKey];
          if (isSystem) {
            // Solo la primera variable para comparación
            datasets.push({ nombre: `${metodo} (${variables[0]})`, t: r.t, y: r.y[0], color: colores[metodo] });
          } else {
            datasets.push({ nombre: metodo, t: r.t, y: r.y, color: colores[metodo] });
          }
        });

        window.Visualizacion.crearGraficoEDO('chart-edo-comparacion', {
          datos: datasets, titulo: 'Comparación de Métodos',
          ejeX: 'Tiempo (días)', ejeY: variables[0]
        });
      }

      mostrar('edo-comparacion-container');
      mostrar('resultados-edo');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'edo-interpretacion');
      mostrar('resultados-edo');
    } finally {
      ocultarCarga('btn-edo-comparar');
    }
  }, 50);
}

function diagramaFases() {
  mostrarCarga('btn-edo-fases');
  setTimeout(() => {
    try {
      const E = window.EDO;
      const modeloId = document.getElementById('edo-modelo').value;
      if (modeloId !== 'social') {
        throw new Error('El diagrama de fases solo está disponible para el modelo de Difusión Social');
      }

      // Calcular si no hay resultado previo
      if (!ultimosResultados.edo) {
        calcularEDO();
        return;
      }

      const resultado = ultimosResultados.edo;
      const fases = E.generarDatosFases(resultado, 0, 1); // N vs M

      if (window.Visualizacion) {
        window.Visualizacion.crearGraficoFases('chart-edo-fases', {
          x: fases.x, y: fases.y,
          ejeX: 'N (Neutrales)', ejeY: 'M (Movilizados)',
          titulo: 'Diagrama de Fases: N vs M'
        });
      }

      document.getElementById('chart-edo-fases-container')?.classList.remove('hidden');
      mostrar('resultados-edo');
    } catch (error) {
      mostrarAlerta('danger', '❌ Error: ' + error.message, 'edo-interpretacion');
      mostrar('resultados-edo');
    } finally {
      ocultarCarga('btn-edo-fases');
    }
  }, 50);
}

// ============================================================
// INICIALIZACIÓN GENERAL
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Navegación y UI
  initRouter();
  initScrollspy();
  initMobileMenu();
  initAnimations();
  initTheoryToggles();

  // Módulos
  initSistemasLineales();
  initRaices();
  initInterpolacion();
  initIntegracion();
  initEDO();

  console.log('✅ Aplicación de Métodos Numéricos inicializada correctamente');
});
