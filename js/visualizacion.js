// ============================================================================
// visualizacion.js — Biblioteca de visualización basada en Chart.js
// ============================================================================
// Proporciona funciones de alto nivel para crear gráficos específicos del
// proyecto de simulación de crisis. Todos los gráficos se registran en un
// mapa interno para permitir destrucción y reutilización de canvas.
// Se exporta en el objeto global window.Visualizacion.
// ============================================================================

(function() {
  'use strict';

  // ==========================================================================
  // Registro global de instancias de gráficos (Map: canvasId → Chart)
  // ==========================================================================
  var registroGraficos = new Map();

  // ==========================================================================
  // Configuración por defecto para todos los gráficos
  // ==========================================================================
  var CONFIG_DEFECTO = {
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    animacionDuracion: 500,
    alphaRelleno: 0.2,
    alphaBorde: 1.0
  };

  // ==========================================================================
  // Utilidades internas
  // ==========================================================================

  /**
   * Convierte un color hexadecimal o RGB a formato rgba con transparencia.
   * @param {string} color - Color en formato hex (#rrggbb) o nombre CSS
   * @param {number} alpha - Valor de transparencia (0 a 1)
   * @returns {string} Color en formato rgba
   */
  function colorConAlpha(color, alpha) {
    // Si ya es rgba, reemplazar el alpha
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/, alpha + ')');
    }

    // Convertir hex a rgb
    if (color.startsWith('#')) {
      var hex = color.replace('#', '');
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    // Intentar usar canvas para convertir colores con nombre
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      var data = ctx.getImageData(0, 0, 1, 1).data;
      return 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + alpha + ')';
    } catch (e) {
      return 'rgba(100, 100, 100, ' + alpha + ')';
    }
  }

  /**
   * Obtiene el contexto 2D del canvas especificado.
   * @param {string} canvasId - ID del elemento canvas
   * @returns {CanvasRenderingContext2D|null} Contexto 2D o null si no existe
   */
  function obtenerContexto(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('Canvas con ID "' + canvasId + '" no encontrado.');
      return null;
    }
    return canvas.getContext('2d');
  }

  /**
   * Destruye el gráfico existente en un canvas antes de crear uno nuevo.
   * Evita conflictos al reutilizar el mismo canvas.
   * @param {string} canvasId - ID del canvas a limpiar
   */
  function destruirExistente(canvasId) {
    if (registroGraficos.has(canvasId)) {
      registroGraficos.get(canvasId).destroy();
      registroGraficos.delete(canvasId);
    }
  }

  /**
   * Registra una nueva instancia de gráfico en el mapa.
   * @param {string} canvasId - ID del canvas
   * @param {Chart} instancia - Instancia de Chart.js
   */
  function registrarGrafico(canvasId, instancia) {
    registroGraficos.set(canvasId, instancia);
  }

  /**
   * Paleta de colores predeterminada para datasets múltiples.
   */
  var PALETA_COLORES = [
    '#3b82f6', // Azul
    '#ef4444', // Rojo
    '#10b981', // Verde
    '#f59e0b', // Ámbar
    '#8b5cf6', // Violeta
    '#ec4899', // Rosa
    '#06b6d4', // Cian
    '#f97316', // Naranja
    '#14b8a6', // Turquesa
    '#6366f1'  // Índigo
  ];

  // ==========================================================================
  // Configurar fuente por defecto de Chart.js
  // ==========================================================================
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = CONFIG_DEFECTO.fontFamily;
    Chart.defaults.font.size = 13;
    Chart.defaults.animation.duration = CONFIG_DEFECTO.animacionDuracion;
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(51,65,85,0.5)';
    Chart.defaults.plugins.legend.labels.color = '#94a3b8';
    Chart.defaults.plugins.title.color = '#f1f5f9';
    if (Chart.defaults.scale) {
      Chart.defaults.scale.grid = { color: 'rgba(51,65,85,0.4)' };
      Chart.defaults.scale.ticks = { color: '#64748b' };
    }
  }

  // ==========================================================================
  // 1. Gráfico de línea genérico
  // ==========================================================================

  /**
   * Crea un gráfico de líneas con múltiples datasets.
   * @param {string} canvasId - ID del elemento canvas
   * @param {Object} config - Configuración del gráfico
   * @param {string} config.titulo - Título del gráfico
   * @param {string[]} config.etiquetas - Etiquetas del eje X
   * @param {Object[]} config.datasets - Array de datasets
   * @param {string} config.datasets[].nombre - Nombre del dataset (leyenda)
   * @param {number[]} config.datasets[].datos - Valores del dataset
   * @param {string} config.datasets[].color - Color de la línea
   * @param {boolean} [config.datasets[].dashed] - Línea discontinua
   * @param {string} config.ejeX - Etiqueta del eje X
   * @param {string} config.ejeY - Etiqueta del eje Y
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoLinea(canvasId, config) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    // Construir los datasets de Chart.js
    var datasets = config.datasets.map(function(ds, i) {
      var color = ds.color || PALETA_COLORES[i % PALETA_COLORES.length];
      return {
        label: ds.nombre,
        data: ds.datos,
        borderColor: color,
        backgroundColor: colorConAlpha(color, CONFIG_DEFECTO.alphaRelleno),
        borderWidth: 2,
        borderDash: ds.dashed ? [6, 4] : [],
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });

    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: config.etiquetas,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!config.titulo,
            text: config.titulo || '',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: {
            display: datasets.length > 1,
            position: 'top',
            labels: { usePointStyle: true, padding: 15 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleFont: { size: 13 },
            bodyFont: { size: 12 }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: !!config.ejeX,
              text: config.ejeX || '',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          y: {
            display: true,
            title: {
              display: !!config.ejeY,
              text: config.ejeY || '',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 2. Gráfico de convergencia (error vs iteración)
  // ==========================================================================

  /**
   * Crea un gráfico de convergencia con escala logarítmica en Y.
   * @param {string} canvasId - ID del elemento canvas
   * @param {number[]} iteraciones - Números de iteración (eje X)
   * @param {number[]} errores - Valores de error en cada iteración (eje Y)
   * @param {string} metodo - Nombre del método numérico
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoConvergencia(canvasId, iteraciones, errores, metodo) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    // Filtrar valores cero o negativos que no se pueden mostrar en escala log
    var datosValidos = errores.map(function(err) {
      return err > 0 ? err : null;
    });

    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: iteraciones,
        datasets: [{
          label: 'Error',
          data: datosValidos,
          borderColor: '#ef4444',
          backgroundColor: colorConAlpha('#ef4444', 0.15),
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ef4444',
          spanGaps: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Convergencia — ' + metodo,
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              // Formato científico para valores muy pequeños
              label: function(context) {
                var valor = context.parsed.y;
                if (valor < 0.001) {
                  return 'Error: ' + valor.toExponential(4);
                }
                return 'Error: ' + valor.toFixed(6);
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Iteración',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          y: {
            type: 'logarithmic',
            display: true,
            title: {
              display: true,
              text: 'Error (escala logarítmica)',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: {
              callback: function(value) {
                if (value < 0.001) return value.toExponential(1);
                if (value < 1) return value.toFixed(4);
                return value;
              }
            }
          }
        }
      }
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 3. Gráfico de función con marcador de raíz
  // ==========================================================================

  /**
   * Crea un gráfico de una función f(x) con línea de referencia y=0.
   * @param {string} canvasId - ID del elemento canvas
   * @param {Object} config - Configuración del gráfico
   * @param {Function} config.funcion - Función f(x) a graficar
   * @param {number} config.xMin - Valor mínimo de x
   * @param {number} config.xMax - Valor máximo de x
   * @param {number} [config.puntos=200] - Número de puntos de muestreo
   * @param {number} [config.raiz] - Valor x de la raíz (marcador rojo)
   * @param {string} config.titulo - Título del gráfico
   * @param {string} config.ejeX - Etiqueta del eje X
   * @param {string} config.ejeY - Etiqueta del eje Y
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoFuncion(canvasId, config) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    var numPuntos = config.puntos || 200;
    var paso = (config.xMax - config.xMin) / numPuntos;

    // Generar puntos de la función
    var puntosX = [];
    var puntosY = [];
    for (var i = 0; i <= numPuntos; i++) {
      var x = config.xMin + i * paso;
      var y = config.funcion(x);
      puntosX.push(parseFloat(x.toFixed(6)));
      // Proteger contra valores infinitos o NaN
      puntosY.push(isFinite(y) ? y : null);
    }

    // Línea de referencia y = 0
    var lineaCero = new Array(puntosX.length).fill(0);

    // Datasets del gráfico
    var datasets = [
      {
        label: 'f(x)',
        data: puntosY,
        borderColor: '#3b82f6',
        backgroundColor: colorConAlpha('#3b82f6', 0.1),
        borderWidth: 2.5,
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      {
        label: 'y = 0',
        data: lineaCero,
        borderColor: 'rgba(100, 100, 100, 0.4)',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ];

    // Agregar marcador de raíz si se proporcionó
    if (config.raiz !== undefined && config.raiz !== null) {
      var raizY = config.funcion(config.raiz);
      // Crear dataset con punto único para la raíz
      datasets.push({
        label: 'Raíz: x = ' + config.raiz.toFixed(6),
        data: puntosX.map(function(x, idx) {
          // Encontrar el índice más cercano a la raíz
          if (idx === 0) return null;
          var xPrev = puntosX[idx - 1];
          if (xPrev <= config.raiz && x >= config.raiz) {
            return isFinite(raizY) ? raizY : 0;
          }
          return null;
        }),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        borderWidth: 0,
        pointRadius: function(context) {
          return context.raw !== null ? 8 : 0;
        },
        pointHoverRadius: 10,
        pointStyle: 'circle',
        fill: false,
        showLine: false
      });
    }

    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: puntosX,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!config.titulo,
            text: config.titulo || '',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              // Filtrar la línea y=0 de la leyenda
              filter: function(item) {
                return item.text !== 'y = 0';
              }
            }
          },
          tooltip: {
            callbacks: {
              title: function(items) {
                return 'x = ' + parseFloat(items[0].label).toFixed(4);
              },
              label: function(context) {
                if (context.parsed.y === null) return '';
                return context.dataset.label + ': ' + context.parsed.y.toFixed(6);
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: !!config.ejeX,
              text: config.ejeX || '',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: {
              maxTicksLimit: 15,
              callback: function(value, index) {
                // Mostrar solo algunas etiquetas para evitar saturación
                if (index % Math.ceil(numPuntos / 15) === 0) {
                  return parseFloat(this.getLabelForValue(value)).toFixed(1);
                }
                return '';
              }
            }
          },
          y: {
            display: true,
            title: {
              display: !!config.ejeY,
              text: config.ejeY || '',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          }
        }
      }
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 4. Gráfico de interpolación (puntos + curvas)
  // ==========================================================================

  /**
   * Crea un gráfico combinando puntos originales (scatter) y curvas interpoladas (líneas).
   * @param {string} canvasId - ID del elemento canvas
   * @param {Object} config - Configuración del gráfico
   * @param {number[][]} config.puntosOriginales - Puntos originales [[x,y],...]
   * @param {Object[]} config.curvas - Curvas interpoladas
   * @param {string} config.curvas[].nombre - Nombre de la curva
   * @param {number[][]} config.curvas[].puntos - Puntos de la curva [[x,y],...]
   * @param {string} config.curvas[].color - Color de la curva
   * @param {string} config.titulo - Título del gráfico
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoInterpolacion(canvasId, config) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    var datasets = [];

    // Dataset de puntos originales (scatter)
    if (config.puntosOriginales && config.puntosOriginales.length > 0) {
      datasets.push({
        label: 'Datos originales',
        data: config.puntosOriginales.map(function(p) {
          return { x: p[0], y: p[1] };
        }),
        borderColor: '#1a202c',
        backgroundColor: '#1a202c',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'rectRot',
        showLine: false,
        order: 0   // Se dibuja encima de las curvas
      });
    }

    // Datasets de curvas interpoladas
    if (config.curvas) {
      config.curvas.forEach(function(curva, i) {
        var color = curva.color || PALETA_COLORES[i % PALETA_COLORES.length];
        datasets.push({
          label: curva.nombre,
          data: curva.puntos.map(function(p) {
            return { x: p[0], y: p[1] };
          }),
          borderColor: color,
          backgroundColor: colorConAlpha(color, 0.08),
          borderWidth: 2,
          fill: false,
          tension: 0,           // Sin suavizado (la interpolación ya lo proporciona)
          pointRadius: 0,
          pointHoverRadius: 3,
          order: 1
        });
      });
    }

    var chart = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!config.titulo,
            text: config.titulo || '',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 15 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': (' +
                  context.parsed.x.toFixed(2) + ', ' +
                  context.parsed.y.toFixed(4) + ')';
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: config.ejeX || 'Día',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: config.ejeY || 'Precio (Bs/kg)',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          }
        }
      }
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 5. Gráfico de área integral (área bajo la curva rellenada)
  // ==========================================================================

  /**
   * Crea un gráfico con el área bajo la curva rellenada para visualizar integrales.
   * @param {string} canvasId - ID del elemento canvas
   * @param {Object} config - Configuración del gráfico
   * @param {Function} config.funcion - Función f(x) a integrar
   * @param {number} config.a - Límite inferior de integración
   * @param {number} config.b - Límite superior de integración
   * @param {number} config.n - Número de subintervalos
   * @param {string} config.metodo - Nombre del método ('Trapecio', 'Simpson', etc.)
   * @param {string} config.titulo - Título del gráfico
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoAreaIntegral(canvasId, config) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    var a = config.a;
    var b = config.b;
    var n = config.n;
    var h = (b - a) / n;

    // Generar puntos suaves de la función (200 puntos)
    var numPuntosSuaves = 200;
    var pasoSuave = (b - a) / numPuntosSuaves;
    var puntosXSuaves = [];
    var puntosYSuaves = [];
    for (var i = 0; i <= numPuntosSuaves; i++) {
      var x = a + i * pasoSuave;
      var y = config.funcion(x);
      puntosXSuaves.push(parseFloat(x.toFixed(4)));
      puntosYSuaves.push(isFinite(y) ? y : null);
    }

    // Generar puntos de los trapecios/segmentos (en los nodos del método)
    var puntosXNodos = [];
    var puntosYNodos = [];
    for (var j = 0; j <= n; j++) {
      var xn = a + j * h;
      var yn = config.funcion(xn);
      puntosXNodos.push(parseFloat(xn.toFixed(4)));
      puntosYNodos.push(isFinite(yn) ? yn : null);
    }

    // Crear los segmentos del trapecio como dataset separado
    // Mapear los valores del trapecio a la escala de puntos suaves
    var puntosYTrapecio = puntosXSuaves.map(function(x) {
      // Encontrar el segmento del trapecio que contiene este x
      for (var k = 0; k < n; k++) {
        var x0 = puntosXNodos[k];
        var x1 = puntosXNodos[k + 1];
        if (x >= x0 - 0.001 && x <= x1 + 0.001) {
          // Interpolación lineal entre nodos (trapecio)
          var t = (x - x0) / (x1 - x0);
          return puntosYNodos[k] + t * (puntosYNodos[k + 1] - puntosYNodos[k]);
        }
      }
      return null;
    });

    var datasets = [
      // Área rellenada (región del trapecio)
      {
        label: 'Área (' + config.metodo + ')',
        data: puntosYTrapecio,
        borderColor: colorConAlpha('#10b981', 0.6),
        backgroundColor: colorConAlpha('#10b981', 0.25),
        borderWidth: 1,
        fill: 'origin',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 2
      },
      // Curva suave de la función
      {
        label: 'f(x)',
        data: puntosYSuaves,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        order: 0
      },
      // Nodos del método numérico
      {
        label: 'Nodos (n=' + n + ')',
        data: puntosXSuaves.map(function(x) {
          // Mostrar punto solo en las posiciones de nodos
          var idx = puntosXNodos.indexOf(x);
          if (idx !== -1) {
            return puntosYNodos[idx];
          }
          // Buscar nodo cercano (tolerancia por redondeo)
          for (var k = 0; k < puntosXNodos.length; k++) {
            if (Math.abs(x - puntosXNodos[k]) < pasoSuave * 0.5) {
              return puntosYNodos[k];
            }
          }
          return null;
        }),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        borderWidth: 0,
        pointRadius: function(context) {
          return context.raw !== null ? 5 : 0;
        },
        pointHoverRadius: 7,
        pointStyle: 'circle',
        fill: false,
        showLine: false,
        order: -1
      }
    ];

    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: puntosXSuaves,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!config.titulo,
            text: config.titulo || 'Integración Numérica',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 15 }
          },
          tooltip: {
            callbacks: {
              title: function(items) {
                return 'x = ' + parseFloat(items[0].label).toFixed(3);
              },
              label: function(context) {
                if (context.parsed.y === null) return '';
                return context.dataset.label + ': ' + context.parsed.y.toFixed(4);
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: config.ejeX || 't (días)',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: {
              maxTicksLimit: 15,
              callback: function(value, index) {
                if (index % Math.ceil(numPuntosSuaves / 15) === 0) {
                  return parseFloat(this.getLabelForValue(value)).toFixed(1);
                }
                return '';
              }
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: config.ejeY || 'f(x)',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
            beginAtZero: true
          }
        }
      }
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 6. Gráfico de EDOs (evolución temporal)
  // ==========================================================================

  /**
   * Crea un gráfico de evolución temporal para soluciones de EDOs.
   * @param {string} canvasId - ID del elemento canvas
   * @param {Object} config - Configuración del gráfico
   * @param {Object[]} config.datos - Datos de cada variable
   * @param {string} config.datos[].nombre - Nombre de la variable
   * @param {number[]} config.datos[].t - Valores de tiempo
   * @param {number[]} config.datos[].y - Valores de la variable
   * @param {string} config.datos[].color - Color de la línea
   * @param {string} config.titulo - Título del gráfico
   * @param {string} config.ejeX - Etiqueta del eje X
   * @param {string} config.ejeY - Etiqueta del eje Y
   * @param {number} [config.umbral] - Valor de umbral (línea horizontal)
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoEDO(canvasId, config) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    // Usar los valores de t del primer dataset como etiquetas
    var etiquetasT = config.datos[0].t.map(function(t) {
      return parseFloat(t.toFixed(2));
    });

    var datasets = config.datos.map(function(variable, i) {
      var color = variable.color || PALETA_COLORES[i % PALETA_COLORES.length];
      return {
        label: variable.nombre,
        data: variable.y,
        borderColor: color,
        backgroundColor: colorConAlpha(color, 0.1),
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 0,          // Sin puntos para curvas suaves con muchos datos
        pointHoverRadius: 4
      };
    });

    // Agregar línea de umbral si se especificó
    if (config.umbral !== undefined && config.umbral !== null) {
      var valUmbral = typeof config.umbral === 'object' ? config.umbral.valor : config.umbral;
      var etiquetaUmbral = typeof config.umbral === 'object' ? (config.umbral.label || 'Umbral crítico') : ('Umbral crítico (' + config.umbral + ')');
      datasets.push({
        label: etiquetaUmbral,
        data: new Array(etiquetasT.length).fill(valUmbral),
        borderColor: '#ef4444',
        borderWidth: 2,
        borderDash: [8, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      });
    }

    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: etiquetasT,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!config.titulo,
            text: config.titulo || 'Solución de EDO',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 15 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(items) {
                return 't = ' + items[0].label;
              },
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y.toFixed(4);
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: config.ejeX || 't (tiempo)',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: {
              maxTicksLimit: 20
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: config.ejeY || 'Valor',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 7. Gráfico de retrato de fases
  // ==========================================================================

  /**
   * Crea un retrato de fases (diagrama x vs y) con líneas y flechas de dirección.
   * @param {string} canvasId - ID del elemento canvas
   * @param {Object} config - Configuración del gráfico
   * @param {number[]} config.x - Valores de la variable X
   * @param {number[]} config.y - Valores de la variable Y
   * @param {string} config.ejeX - Etiqueta del eje X
   * @param {string} config.ejeY - Etiqueta del eje Y
   * @param {string} config.titulo - Título del gráfico
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoFases(canvasId, config) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    // Construir datos como pares {x, y}
    var datosXY = config.x.map(function(xi, i) {
      return { x: xi, y: config.y[i] };
    });

    // Plugin personalizado para dibujar flechas de dirección
    var pluginFlechas = {
      id: 'flechasDireccion',
      afterDatasetsDraw: function(chart) {
        var meta = chart.getDatasetMeta(0);
        if (!meta || meta.data.length < 2) return;

        var ctx2 = chart.ctx;
        ctx2.save();

        // Dibujar flechas cada ciertos puntos para indicar dirección
        var intervaloFlechas = Math.max(1, Math.floor(meta.data.length / 12));
        for (var i = 0; i < meta.data.length - 1; i += intervaloFlechas) {
          var punto = meta.data[i];
          var puntoSig = meta.data[Math.min(i + 1, meta.data.length - 1)];

          var dx = puntoSig.x - punto.x;
          var dy = puntoSig.y - punto.y;
          var longitud = Math.sqrt(dx * dx + dy * dy);

          if (longitud < 2) continue;   // Saltar si los puntos están muy cerca

          var angulo = Math.atan2(dy, dx);
          var tamFlecha = 8;

          // Posición intermedia para la flecha
          var cx = (punto.x + puntoSig.x) / 2;
          var cy = (punto.y + puntoSig.y) / 2;

          ctx2.beginPath();
          ctx2.moveTo(cx, cy);
          ctx2.lineTo(
            cx - tamFlecha * Math.cos(angulo - Math.PI / 6),
            cy - tamFlecha * Math.sin(angulo - Math.PI / 6)
          );
          ctx2.moveTo(cx, cy);
          ctx2.lineTo(
            cx - tamFlecha * Math.cos(angulo + Math.PI / 6),
            cy - tamFlecha * Math.sin(angulo + Math.PI / 6)
          );
          ctx2.strokeStyle = '#6366f1';
          ctx2.lineWidth = 2;
          ctx2.stroke();
        }

        ctx2.restore();
      }
    };

    var chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Trayectoria',
            data: datosXY,
            borderColor: '#6366f1',
            backgroundColor: colorConAlpha('#6366f1', 0.15),
            borderWidth: 2,
            showLine: true,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 4
          },
          // Punto inicial
          {
            label: 'Inicio',
            data: [datosXY[0]],
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            pointRadius: 8,
            pointHoverRadius: 10,
            pointStyle: 'triangle',
            showLine: false
          },
          // Punto final
          {
            label: 'Final',
            data: [datosXY[datosXY.length - 1]],
            borderColor: '#ef4444',
            backgroundColor: '#ef4444',
            pointRadius: 8,
            pointHoverRadius: 10,
            pointStyle: 'rect',
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!config.titulo,
            text: config.titulo || 'Retrato de Fases',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 15 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return '(' + context.parsed.x.toFixed(2) + ', ' + context.parsed.y.toFixed(2) + ')';
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: config.ejeX || 'Variable X',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: config.ejeY || 'Variable Y',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          }
        }
      },
      plugins: [pluginFlechas]
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 8. Gráfico de comparación (barras)
  // ==========================================================================

  /**
   * Crea un gráfico de barras para comparar resultados de diferentes métodos.
   * @param {string} canvasId - ID del elemento canvas
   * @param {Object} config - Configuración del gráfico
   * @param {string[]} config.metodos - Nombres de los métodos
   * @param {number[]} config.valores - Valores a comparar
   * @param {string} config.titulo - Título del gráfico
   * @param {string} config.ejeY - Etiqueta del eje Y
   * @returns {Chart|null} Instancia del gráfico o null si falla
   */
  function crearGraficoComparacion(canvasId, config) {
    destruirExistente(canvasId);
    var ctx = obtenerContexto(canvasId);
    if (!ctx) return null;

    // Asignar color distinto a cada barra
    var coloresFondo = config.metodos.map(function(_, i) {
      return colorConAlpha(PALETA_COLORES[i % PALETA_COLORES.length], 0.7);
    });
    var coloresBorde = config.metodos.map(function(_, i) {
      return PALETA_COLORES[i % PALETA_COLORES.length];
    });

    var chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: config.metodos,
        datasets: [{
          label: config.ejeY || 'Valor',
          data: config.valores,
          backgroundColor: coloresFondo,
          borderColor: coloresBorde,
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!config.titulo,
            text: config.titulo || 'Comparación de Métodos',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 15 }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                var valor = context.parsed.y;
                // Formato adaptativo según la magnitud
                if (Math.abs(valor) < 0.001) {
                  return (config.ejeY || 'Valor') + ': ' + valor.toExponential(4);
                }
                return (config.ejeY || 'Valor') + ': ' + valor.toFixed(6);
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: {
              font: { size: 12, weight: 'bold' }
            }
          },
          y: {
            display: true,
            title: {
              display: !!config.ejeY,
              text: config.ejeY || '',
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
            beginAtZero: true
          }
        }
      }
    });

    registrarGrafico(canvasId, chart);
    return chart;
  }

  // ==========================================================================
  // 9. Destruir gráfico existente
  // ==========================================================================

  /**
   * Destruye un gráfico existente para liberar recursos y reutilizar el canvas.
   * @param {string} canvasId - ID del canvas cuyo gráfico se quiere destruir
   * @returns {boolean} true si se destruyó un gráfico, false si no existía
   */
  function destruirGrafico(canvasId) {
    if (registroGraficos.has(canvasId)) {
      registroGraficos.get(canvasId).destroy();
      registroGraficos.delete(canvasId);
      return true;
    }
    return false;
  }

  // ==========================================================================
  // 10. Exportar gráfico como PNG
  // ==========================================================================

  /**
   * Exporta el gráfico de un canvas como archivo PNG descargable.
   * @param {string} canvasId - ID del canvas a exportar
   * @param {string} nombre - Nombre del archivo (sin extensión)
   * @returns {boolean} true si se inició la descarga, false si falló
   */
  function exportarGrafico(canvasId, nombre) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('Canvas con ID "' + canvasId + '" no encontrado para exportar.');
      return false;
    }

    try {
      // Convertir el canvas a imagen PNG en base64
      var imagenURL = canvas.toDataURL('image/png', 1.0);

      // Crear enlace temporal para descargar
      var enlace = document.createElement('a');
      enlace.download = (nombre || 'grafico') + '.png';
      enlace.href = imagenURL;

      // Simular clic para iniciar descarga
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);

      return true;
    } catch (e) {
      console.error('Error al exportar gráfico:', e.message);
      return false;
    }
  }

  // ==========================================================================
  // 11. Exportar datos a CSV
  // ==========================================================================

  /**
   * Exporta datos tabulares a un archivo CSV descargable.
   * @param {Array} datos - Array de objetos o array de arrays con los datos
   * @param {string[]} columnas - Nombres de las columnas (encabezados)
   * @param {string} nombreArchivo - Nombre del archivo (sin extensión)
   */
  function exportarCSV(datos, columnas, nombreArchivo) {
    if (!datos || datos.length === 0) {
      console.warn('No hay datos para exportar a CSV.');
      return;
    }

    var lineas = [];

    // Encabezados
    lineas.push(columnas.join(','));

    // Filas de datos
    datos.forEach(function(fila) {
      var valores;

      if (Array.isArray(fila)) {
        // Si la fila es un array, usarla directamente
        valores = fila.map(function(v) {
          return formatearValorCSV(v);
        });
      } else {
        // Si la fila es un objeto, extraer valores en el orden de las columnas
        valores = columnas.map(function(col) {
          return formatearValorCSV(fila[col]);
        });
      }

      lineas.push(valores.join(','));
    });

    // Construir el contenido CSV con BOM para compatibilidad con Excel
    var contenido = '\uFEFF' + lineas.join('\n');

    // Crear blob y enlace de descarga
    var blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);

    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = (nombreArchivo || 'datos') + '.csv';

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // Liberar el URL del blob
    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Formatea un valor para inclusión segura en CSV.
   * Maneja cadenas con comas, comillas y saltos de línea.
   * @param {*} valor - Valor a formatear
   * @returns {string} Valor formateado para CSV
   */
  function formatearValorCSV(valor) {
    if (valor === null || valor === undefined) {
      return '';
    }

    if (typeof valor === 'number') {
      // Números: usar punto decimal (estándar CSV)
      return isFinite(valor) ? valor.toString() : '';
    }

    // Convertir a cadena y escapar
    var str = String(valor);

    // Si contiene comas, comillas o saltos de línea, envolver en comillas
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }

    return str;
  }

  // ==========================================================================
  // Exportar API pública en el espacio global
  // ==========================================================================

  window.Visualizacion = {
    // Funciones de creación de gráficos
    crearGraficoLinea: crearGraficoLinea,
    crearGraficoConvergencia: crearGraficoConvergencia,
    crearGraficoFuncion: crearGraficoFuncion,
    crearGraficoInterpolacion: crearGraficoInterpolacion,
    crearGraficoAreaIntegral: crearGraficoAreaIntegral,
    crearGraficoEDO: crearGraficoEDO,
    crearGraficoFases: crearGraficoFases,
    crearGraficoComparacion: crearGraficoComparacion,

    // Gestión de gráficos
    destruirGrafico: destruirGrafico,
    exportarGrafico: exportarGrafico,

    // Exportación de datos
    exportarCSV: exportarCSV,

    // Acceso al registro (solo lectura, para depuración)
    obtenerRegistro: function() {
      return registroGraficos;
    },

    // Destruir todos los gráficos activos
    destruirTodos: function() {
      registroGraficos.forEach(function(chart, id) {
        chart.destroy();
      });
      registroGraficos.clear();
    }
  };

})();
