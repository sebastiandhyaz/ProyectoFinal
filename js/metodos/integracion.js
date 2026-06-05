/**
 * ==========================================================
 * MÓDULO DE INTEGRACIÓN NUMÉRICA
 * ==========================================================
 * Implementa métodos de integración numérica para calcular
 * costos acumulados durante periodos de crisis económica.
 *
 * Métodos implementados:
 *  - Regla del Trapecio Compuesta
 *  - Regla de Simpson 1/3 Compuesta
 *  - Regla de Simpson 3/8 Compuesta
 *
 * Funciones de contexto económico (de data.js):
 *  - p(t) = 8 + 0.5t + 0.01t²  (precio de la papa en el tiempo)
 *  - c(t) = 150 + 5t + 0.1t²   (costo de la canasta básica)
 *
 * Todas las funciones exportan en window.Integracion
 * ==========================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------
  // UTILIDADES INTERNAS
  // --------------------------------------------------------

  /**
   * Valida los parámetros comunes de integración.
   * Lanza un Error descriptivo si algo es inválido.
   * @param {Function} f - Función a integrar
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} n - Número de subintervalos
   */
  function _validarParametros(f, a, b, n) {
    if (typeof f !== 'function') {
      throw new Error('El primer argumento debe ser una función.');
    }
    if (typeof a !== 'number' || isNaN(a)) {
      throw new Error('El límite inferior "a" debe ser un número válido.');
    }
    if (typeof b !== 'number' || isNaN(b)) {
      throw new Error('El límite superior "b" debe ser un número válido.');
    }
    if (a >= b) {
      throw new Error('El límite inferior "a" debe ser menor que el límite superior "b".');
    }
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error('El número de subintervalos "n" debe ser un entero positivo.');
    }
  }

  /**
   * Estima la segunda derivada de f en un punto x usando
   * diferencias finitas centradas: f''(x) ≈ [f(x+h) - 2f(x) + f(x-h)] / h²
   * @param {Function} f - Función original
   * @param {number} x - Punto de evaluación
   * @param {number} h - Paso para la diferencia finita
   * @returns {number} Aproximación de f''(x)
   */
  function _segundaDerivada(f, x, h) {
    if (!h) h = 1e-4;
    return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
  }

  /**
   * Estima la cuarta derivada de f en un punto x usando
   * diferencias finitas centradas:
   * f⁴(x) ≈ [f(x+2h) - 4f(x+h) + 6f(x) - 4f(x-h) + f(x-2h)] / h⁴
   * @param {Function} f - Función original
   * @param {number} x - Punto de evaluación
   * @param {number} h - Paso para la diferencia finita
   * @returns {number} Aproximación de f⁴(x)
   */
  function _cuartaDerivada(f, x, h) {
    if (!h) h = 1e-3;
    return (
      f(x + 2 * h) -
      4 * f(x + h) +
      6 * f(x) -
      4 * f(x - h) +
      f(x - 2 * h)
    ) / Math.pow(h, 4);
  }

  /**
   * Encuentra el valor máximo absoluto de una función derivada
   * muestreando en múltiples puntos del intervalo [a, b].
   * @param {Function} derivadaFn - Función derivada a maximizar
   * @param {Function} f - Función original (se pasa a derivadaFn)
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} muestras - Número de puntos de muestreo
   * @returns {number} Máximo valor absoluto encontrado
   */
  function _maxAbsDerivada(derivadaFn, f, a, b, muestras) {
    if (!muestras) muestras = 100;
    var maxVal = 0;
    var paso = (b - a) / muestras;
    for (var i = 0; i <= muestras; i++) {
      var x = a + i * paso;
      var val = Math.abs(derivadaFn(f, x));
      if (val > maxVal) {
        maxVal = val;
      }
    }
    return maxVal;
  }

  /**
   * Redondea un número a la cantidad de decimales especificada.
   * @param {number} valor - Número a redondear
   * @param {number} decimales - Cantidad de decimales (por defecto 8)
   * @returns {number}
   */
  function _redondear(valor, decimales) {
    if (decimales === undefined) decimales = 8;
    var factor = Math.pow(10, decimales);
    return Math.round(valor * factor) / factor;
  }

  // --------------------------------------------------------
  // 1. REGLA DEL TRAPECIO COMPUESTA
  // --------------------------------------------------------

  /**
   * Aplica la regla del trapecio compuesta para aproximar ∫[a,b] f(x)dx
   *
   * Fórmula: T = (h/2) * [f(x₀) + 2·Σf(xᵢ) + f(xₙ)]
   * donde h = (b-a)/n y xᵢ = a + i·h
   *
   * @param {Function} f - Función a integrar
   * @param {number} a - Límite inferior de integración
   * @param {number} b - Límite superior de integración
   * @param {number} n - Número de subintervalos
   * @returns {Object} Resultado detallado con valor, puntos, sumatoria y error
   */
  function trapecio(f, a, b, n) {
    _validarParametros(f, a, b, n);
    n = Math.floor(n);

    // Tamaño de paso
    var h = (b - a) / n;

    // Evaluar la función en todos los puntos
    var puntos = [];
    for (var i = 0; i <= n; i++) {
      var x = a + i * h;
      // Evitar errores de punto flotante en el último punto
      if (i === n) x = b;
      puntos.push({ x: _redondear(x, 10), fx: f(x) });
    }

    // Construir la sumatoria paso a paso
    var sumatoria = [];
    var suma = 0;

    for (var i = 0; i <= n; i++) {
      var coef = (i === 0 || i === n) ? 1 : 2;
      var areaContribucion = coef * puntos[i].fx;
      suma += areaContribucion;

      // Calcular el área parcial del trapecio (entre i-1 e i)
      var areaParcial = 0;
      if (i > 0) {
        areaParcial = (h / 2) * (puntos[i - 1].fx + puntos[i].fx);
      }

      sumatoria.push({
        i: i,
        xi: puntos[i].x,
        fxi: _redondear(puntos[i].fx, 8),
        coeficiente: coef,
        area_parcial: _redondear(areaParcial, 8)
      });
    }

    // Valor final de la integral
    var valor = (h / 2) * suma;

    // Estimación del error de truncamiento
    var errorEst = errorTrapecio(f, a, b, n);

    return {
      valor: _redondear(valor, 8),
      h: _redondear(h, 10),
      puntos: puntos,
      sumatoria: sumatoria,
      errorEstimado: _redondear(errorEst, 8)
    };
  }

  // --------------------------------------------------------
  // 2. REGLA DE SIMPSON 1/3 COMPUESTA
  // --------------------------------------------------------

  /**
   * Aplica la regla de Simpson 1/3 compuesta para aproximar ∫[a,b] f(x)dx
   *
   * Fórmula: S = (h/3) * [f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + ... + f(xₙ)]
   * Requiere n par; si es impar, se ajusta a n+1.
   *
   * @param {Function} f - Función a integrar
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} n - Número de subintervalos (se ajusta a par si es impar)
   * @returns {Object} Resultado detallado con valor, puntos, sumatoria, pesos y error
   */
  function simpson13(f, a, b, n) {
    _validarParametros(f, a, b, n);
    n = Math.floor(n);

    // Ajustar n para que sea par (requisito de Simpson 1/3)
    if (n % 2 !== 0) {
      n = n + 1;
    }

    var h = (b - a) / n;

    // Evaluar la función en todos los puntos
    var puntos = [];
    for (var i = 0; i <= n; i++) {
      var x = a + i * h;
      if (i === n) x = b;
      puntos.push({ x: _redondear(x, 10), fx: f(x) });
    }

    // Construir los pesos/coeficientes: 1, 4, 2, 4, 2, ..., 4, 1
    var pesos = [];
    for (var i = 0; i <= n; i++) {
      if (i === 0 || i === n) {
        pesos.push(1);
      } else if (i % 2 !== 0) {
        pesos.push(4);
      } else {
        pesos.push(2);
      }
    }

    // Sumatoria paso a paso
    var sumatoria = [];
    var suma = 0;

    for (var i = 0; i <= n; i++) {
      var contribucion = pesos[i] * puntos[i].fx;
      suma += contribucion;

      // Área parcial: cada par de subintervalos forma un bloque de Simpson
      var areaParcial = 0;
      if (i >= 2 && i % 2 === 0) {
        areaParcial = (h / 3) * (puntos[i - 2].fx + 4 * puntos[i - 1].fx + puntos[i].fx);
      }

      sumatoria.push({
        i: i,
        xi: puntos[i].x,
        fxi: _redondear(puntos[i].fx, 8),
        peso: pesos[i],
        area_parcial: _redondear(areaParcial, 8)
      });
    }

    // Valor final
    var valor = (h / 3) * suma;

    // Estimación del error
    var errorEst = errorSimpson(f, a, b, n);

    return {
      valor: _redondear(valor, 8),
      h: _redondear(h, 10),
      puntos: puntos,
      sumatoria: sumatoria,
      pesos: pesos,
      errorEstimado: _redondear(errorEst, 8)
    };
  }

  // --------------------------------------------------------
  // 3. REGLA DE SIMPSON 3/8 COMPUESTA
  // --------------------------------------------------------

  /**
   * Aplica la regla de Simpson 3/8 compuesta para aproximar ∫[a,b] f(x)dx
   *
   * Fórmula: S = (3h/8) * [f(x₀) + 3f(x₁) + 3f(x₂) + 2f(x₃) + 3f(x₄) + ... + f(xₙ)]
   * Requiere n múltiplo de 3; se ajusta si no lo es.
   *
   * @param {Function} f - Función a integrar
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} n - Número de subintervalos (se ajusta a múltiplo de 3)
   * @returns {Object} Resultado detallado
   */
  function simpson38(f, a, b, n) {
    _validarParametros(f, a, b, n);
    n = Math.floor(n);

    // Ajustar n para que sea múltiplo de 3
    if (n % 3 !== 0) {
      n = n + (3 - (n % 3));
    }

    var h = (b - a) / n;

    // Evaluar la función en todos los puntos
    var puntos = [];
    for (var i = 0; i <= n; i++) {
      var x = a + i * h;
      if (i === n) x = b;
      puntos.push({ x: _redondear(x, 10), fx: f(x) });
    }

    // Construir los pesos: 1, 3, 3, 2, 3, 3, 2, ..., 3, 3, 1
    var pesos = [];
    for (var i = 0; i <= n; i++) {
      if (i === 0 || i === n) {
        pesos.push(1);
      } else if (i % 3 === 0) {
        pesos.push(2);
      } else {
        pesos.push(3);
      }
    }

    // Sumatoria paso a paso
    var sumatoria = [];
    var suma = 0;

    for (var i = 0; i <= n; i++) {
      var contribucion = pesos[i] * puntos[i].fx;
      suma += contribucion;

      // Área parcial: cada trío de subintervalos forma un bloque de Simpson 3/8
      var areaParcial = 0;
      if (i >= 3 && i % 3 === 0) {
        areaParcial = (3 * h / 8) * (
          puntos[i - 3].fx +
          3 * puntos[i - 2].fx +
          3 * puntos[i - 1].fx +
          puntos[i].fx
        );
      }

      sumatoria.push({
        i: i,
        xi: puntos[i].x,
        fxi: _redondear(puntos[i].fx, 8),
        peso: pesos[i],
        area_parcial: _redondear(areaParcial, 8)
      });
    }

    // Valor final
    var valor = (3 * h / 8) * suma;

    // Estimación del error (usa la misma fórmula de Simpson como aproximación)
    var errorEst = errorSimpson(f, a, b, n);

    return {
      valor: _redondear(valor, 8),
      h: _redondear(h, 10),
      puntos: puntos,
      sumatoria: sumatoria,
      pesos: pesos,
      errorEstimado: _redondear(errorEst, 8)
    };
  }

  // --------------------------------------------------------
  // 4. INTEGRACIÓN DESDE PUNTOS DISCRETOS
  // --------------------------------------------------------

  /**
   * Integra a partir de un conjunto de puntos discretos [[x0,y0], [x1,y1], ...]
   * usando el método especificado. Los puntos deben estar ordenados por x.
   *
   * Soporta espaciado uniforme y no uniforme. Para espaciado no uniforme,
   * se usa la regla del trapecio por tramos.
   *
   * @param {Array<Array<number>>} puntos - Arreglo de pares [x, y]
   * @param {string} metodo - 'trapecio', 'simpson13' o 'simpson38'
   * @returns {Object} { valor, detalles }
   */
  function integrarDesdePuntos(puntos, metodo) {
    // Validaciones
    if (!Array.isArray(puntos) || puntos.length < 2) {
      throw new Error('Se necesitan al menos 2 puntos para integrar.');
    }

    if (!metodo) metodo = 'trapecio';

    // Ordenar los puntos por x
    var pts = puntos.slice().sort(function (a, b) { return a[0] - b[0]; });

    // Verificar si el espaciado es uniforme
    var n = pts.length - 1;
    var h0 = pts[1][0] - pts[0][0];
    var esUniforme = true;
    var tolerancia = 1e-8;

    for (var i = 1; i < n; i++) {
      var hi = pts[i + 1][0] - pts[i][0];
      if (Math.abs(hi - h0) > tolerancia) {
        esUniforme = false;
        break;
      }
    }

    // Si no es uniforme, usar trapecio por tramos
    if (!esUniforme) {
      var valor = 0;
      var detallesTramos = [];

      for (var i = 0; i < n; i++) {
        var dx = pts[i + 1][0] - pts[i][0];
        var areaTrapecio = (dx / 2) * (pts[i][1] + pts[i + 1][1]);
        valor += areaTrapecio;

        detallesTramos.push({
          tramo: i,
          x0: pts[i][0],
          x1: pts[i + 1][0],
          y0: pts[i][1],
          y1: pts[i + 1][1],
          area: _redondear(areaTrapecio, 8)
        });
      }

      return {
        valor: _redondear(valor, 8),
        detalles: {
          metodoUsado: 'trapecio (espaciado no uniforme)',
          numPuntos: pts.length,
          tramos: detallesTramos
        }
      };
    }

    // Espaciado uniforme: construir función interpolada y usar el método
    var a = pts[0][0];
    var b = pts[n][0];

    // Crear función que interpola linealmente entre los puntos
    var fInterp = function (x) {
      // Encontrar el intervalo correcto
      for (var j = 0; j < n; j++) {
        if (x >= pts[j][0] - tolerancia && x <= pts[j + 1][0] + tolerancia) {
          var t = (x - pts[j][0]) / (pts[j + 1][0] - pts[j][0]);
          return pts[j][1] + t * (pts[j + 1][1] - pts[j][1]);
        }
      }
      // Si está fuera de rango, extrapolar con el último tramo
      return pts[n][1];
    };

    // Usar el método especificado con los mismos n subintervalos
    var resultado;
    switch (metodo.toLowerCase()) {
      case 'simpson13':
        resultado = simpson13(fInterp, a, b, n);
        break;
      case 'simpson38':
        resultado = simpson38(fInterp, a, b, n);
        break;
      default:
        resultado = trapecio(fInterp, a, b, n);
        break;
    }

    return {
      valor: resultado.valor,
      detalles: {
        metodoUsado: metodo,
        numPuntos: pts.length,
        numSubintervalos: n,
        h: resultado.h,
        resultado: resultado
      }
    };
  }

  // --------------------------------------------------------
  // 5. COMPARAR MÉTODOS
  // --------------------------------------------------------

  /**
   * Compara los tres métodos de integración para la misma función e intervalo.
   * Determina cuál ofrece la mejor aproximación basándose en el error estimado.
   *
   * @param {Function} f - Función a integrar
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} n - Número base de subintervalos
   * @returns {Object} Resultados detallados y comparación
   */
  function compararMetodos(f, a, b, n) {
    _validarParametros(f, a, b, n);

    // Ejecutar cada método
    var resTrapecio = trapecio(f, a, b, n);
    var resSimpson13 = simpson13(f, a, b, n);
    var resSimpson38 = simpson38(f, a, b, n);

    // Construir tabla comparativa
    var comparacion = [
      {
        metodo: 'Trapecio',
        valor: resTrapecio.valor,
        error_estimado: Math.abs(resTrapecio.errorEstimado),
        puntos_evaluacion: resTrapecio.puntos.length
      },
      {
        metodo: 'Simpson 1/3',
        valor: resSimpson13.valor,
        error_estimado: Math.abs(resSimpson13.errorEstimado),
        puntos_evaluacion: resSimpson13.puntos.length
      },
      {
        metodo: 'Simpson 3/8',
        valor: resSimpson38.valor,
        error_estimado: Math.abs(resSimpson38.errorEstimado),
        puntos_evaluacion: resSimpson38.puntos.length
      }
    ];

    // Determinar el mejor método (menor error estimado)
    var mejorIdx = 0;
    for (var i = 1; i < comparacion.length; i++) {
      if (comparacion[i].error_estimado < comparacion[mejorIdx].error_estimado) {
        mejorIdx = i;
      }
    }

    return {
      resultados: {
        trapecio: resTrapecio,
        simpson13: resSimpson13,
        simpson38: resSimpson38
      },
      comparacion: comparacion,
      mejor: comparacion[mejorIdx].metodo
    };
  }

  // --------------------------------------------------------
  // 6. ERROR DEL TRAPECIO
  // --------------------------------------------------------

  /**
   * Estima el error de truncamiento de la regla del trapecio.
   *
   * Fórmula: E ≈ -(b-a)³ / (12n²) · max|f''(c)|
   *
   * La segunda derivada se estima numéricamente usando diferencias finitas.
   *
   * @param {Function} f - Función original
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} n - Número de subintervalos
   * @returns {number} Estimación del error absoluto
   */
  function errorTrapecio(f, a, b, n) {
    // Encontrar el máximo de |f''(x)| en [a, b]
    var maxF2 = _maxAbsDerivada(
      function (func, x) { return _segundaDerivada(func, x); },
      f, a, b, 200
    );

    // E = -(b-a)³ / (12n²) * max|f''|
    var error = Math.abs(Math.pow(b - a, 3) / (12 * n * n) * maxF2);
    return error;
  }

  // --------------------------------------------------------
  // 7. ERROR DE SIMPSON
  // --------------------------------------------------------

  /**
   * Estima el error de truncamiento de la regla de Simpson 1/3.
   *
   * Fórmula: E ≈ -(b-a)⁵ / (180n⁴) · max|f⁴(c)|
   *
   * La cuarta derivada se estima numéricamente.
   *
   * @param {Function} f - Función original
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} n - Número de subintervalos
   * @returns {number} Estimación del error absoluto
   */
  function errorSimpson(f, a, b, n) {
    // Encontrar el máximo de |f⁴(x)| en [a, b]
    var maxF4 = _maxAbsDerivada(
      function (func, x) { return _cuartaDerivada(func, x); },
      f, a, b, 200
    );

    // E = -(b-a)⁵ / (180n⁴) * max|f⁴|
    var error = Math.abs(Math.pow(b - a, 5) / (180 * Math.pow(n, 4)) * maxF4);
    return error;
  }

  // --------------------------------------------------------
  // 8. PÉRDIDA DE PODER ADQUISITIVO
  // --------------------------------------------------------

  /**
   * Calcula la pérdida de poder adquisitivo comparando el costo real
   * acumulado (con inflación) contra un escenario de precios constantes.
   *
   * @param {Function} f - Función de costo en el tiempo f(t)
   * @param {number} precioConstante - Precio base constante (sin inflación)
   * @param {number} a - Inicio del período
   * @param {number} b - Fin del período
   * @param {number} n - Número de subintervalos para la integración
   * @returns {Object} Análisis detallado de la pérdida de poder adquisitivo
   */
  function calcularPerdidaPoder(f, precioConstante, a, b, n) {
    _validarParametros(f, a, b, n);

    if (typeof precioConstante !== 'number' || isNaN(precioConstante) || precioConstante <= 0) {
      throw new Error('El precio constante debe ser un número positivo.');
    }

    // Costo real acumulado (integral del costo variable)
    var resultadoIntegral = simpson13(f, a, b, n);
    var costoReal = resultadoIntegral.valor;

    // Costo si los precios se hubieran mantenido constantes
    var costoSinInflacion = precioConstante * (b - a);

    // Diferencia y porcentaje
    var perdida = costoReal - costoSinInflacion;
    var porcentajePerdida = costoSinInflacion !== 0
      ? (perdida / costoSinInflacion) * 100
      : 0;

    // Generar interpretación en lenguaje natural
    var interpretacion =
      'La familia gastó ' + _redondear(costoReal, 2) + ' Bs en total, ' +
      'que es ' + _redondear(Math.abs(porcentajePerdida), 2) + '% ' +
      (perdida >= 0 ? 'más' : 'menos') +
      ' que si los precios se hubieran mantenido constantes. ' +
      'Esto representa una ' +
      (perdida >= 0 ? 'pérdida' : 'ganancia') +
      ' de poder adquisitivo de ' +
      _redondear(Math.abs(perdida), 2) + ' Bs.';

    return {
      costoReal: _redondear(costoReal, 4),
      costoSinInflacion: _redondear(costoSinInflacion, 4),
      perdida: _redondear(perdida, 4),
      porcentajePerdida: _redondear(porcentajePerdida, 4),
      interpretacion: interpretacion
    };
  }

  // --------------------------------------------------------
  // 9. GENERAR PUNTOS PARA GRÁFICA DE ÁREA
  // --------------------------------------------------------

  /**
   * Genera puntos formateados para una visualización de área con Chart.js.
   * Incluye los límites de subintervalos para mostrar la aproximación geométrica.
   *
   * @param {Function} f - Función a graficar
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {number} n - Número de subintervalos
   * @param {string} metodo - 'trapecio', 'simpson13' o 'simpson38'
   * @returns {Object} Datos formateados para Chart.js
   */
  function generarPuntosArea(f, a, b, n, metodo) {
    _validarParametros(f, a, b, n);
    if (!metodo) metodo = 'trapecio';

    // Obtener resultado del método para tener los puntos de evaluación
    var resultado;
    switch (metodo.toLowerCase()) {
      case 'simpson13':
        resultado = simpson13(f, a, b, n);
        break;
      case 'simpson38':
        resultado = simpson38(f, a, b, n);
        break;
      default:
        resultado = trapecio(f, a, b, n);
        break;
    }

    // Puntos de la curva real (muestreo denso para suavidad)
    var numMuestras = Math.max(200, n * 10);
    var pasoFino = (b - a) / numMuestras;
    var curvaLabels = [];
    var curvaData = [];

    for (var i = 0; i <= numMuestras; i++) {
      var x = a + i * pasoFino;
      if (i === numMuestras) x = b;
      curvaLabels.push(_redondear(x, 4));
      curvaData.push(_redondear(f(x), 6));
    }

    // Puntos de la aproximación (según el método)
    var aproxLabels = [];
    var aproxData = [];

    for (var i = 0; i < resultado.puntos.length; i++) {
      aproxLabels.push(resultado.puntos[i].x);
      aproxData.push(_redondear(resultado.puntos[i].fx, 6));
    }

    // Generar los subintervalos como datasets separados para fill-between
    var subintervalos = [];
    var hActual = resultado.h;

    for (var i = 0; i < resultado.puntos.length - 1; i++) {
      var x0 = resultado.puntos[i].x;
      var x1 = resultado.puntos[i + 1].x;
      var y0 = resultado.puntos[i].fx;
      var y1 = resultado.puntos[i + 1].fx;

      // Puntos del subintervalo para el relleno
      var puntosSubInt = [];
      var numPuntosInternos = 20;
      var dx = (x1 - x0) / numPuntosInternos;

      for (var j = 0; j <= numPuntosInternos; j++) {
        var xj = x0 + j * dx;
        if (j === numPuntosInternos) xj = x1;

        var yAprox;
        if (metodo.toLowerCase() === 'trapecio') {
          // Para el trapecio, la aproximación es lineal
          var t = (xj - x0) / (x1 - x0);
          yAprox = y0 + t * (y1 - y0);
        } else {
          // Para Simpson, la aproximación sigue la curva
          yAprox = f(xj);
        }

        puntosSubInt.push({
          x: _redondear(xj, 6),
          yReal: _redondear(f(xj), 6),
          yAprox: _redondear(yAprox, 6)
        });
      }

      subintervalos.push({
        indice: i,
        x0: x0,
        x1: x1,
        puntos: puntosSubInt
      });
    }

    return {
      curva: {
        labels: curvaLabels,
        data: curvaData
      },
      aproximacion: {
        labels: aproxLabels,
        data: aproxData
      },
      subintervalos: subintervalos,
      metodo: metodo,
      valor: resultado.valor,
      h: resultado.h
    };
  }

  // --------------------------------------------------------
  // 10. GENERAR INTERPRETACIÓN AUTOMÁTICA
  // --------------------------------------------------------

  /**
   * Genera un texto interpretativo del resultado de la integración,
   * adaptado al contexto económico del problema.
   *
   * @param {string} metodo - Nombre del método usado
   * @param {Object} resultado - Resultado de la integración
   * @param {Object} contexto - { nombreFuncion, unidad, a, b }
   * @returns {string} Texto descriptivo de la interpretación
   */
  function generarInterpretacion(metodo, resultado, contexto) {
    if (!contexto) contexto = {};

    var nombreFuncion = contexto.nombreFuncion || 'f(x)';
    var unidad = contexto.unidad || 'Bs';
    var a = contexto.a !== undefined ? contexto.a : '?';
    var b = contexto.b !== undefined ? contexto.b : '?';

    // Determinar nombre legible del método
    var nombreMetodo;
    switch (metodo.toLowerCase()) {
      case 'trapecio':
        nombreMetodo = 'Trapecio Compuesto';
        break;
      case 'simpson13':
        nombreMetodo = 'Simpson 1/3';
        break;
      case 'simpson38':
        nombreMetodo = 'Simpson 3/8';
        break;
      default:
        nombreMetodo = metodo;
    }

    // Número de subintervalos
    var nSub = resultado.puntos ? resultado.puntos.length - 1 : '?';

    // Construir la interpretación
    var texto =
      'Usando el método de ' + nombreMetodo +
      ' con n=' + nSub + ' subintervalos, ' +
      'el costo acumulado de ' + nombreFuncion +
      ' entre los días ' + a + ' y ' + b +
      ' es de ' + _redondear(resultado.valor, 2) + ' ' + unidad + '. ';

    // Agregar información del error
    if (resultado.errorEstimado !== undefined && resultado.errorEstimado !== null) {
      texto += 'El error estimado es de ±' +
        _redondear(Math.abs(resultado.errorEstimado), 6) + ' ' + unidad + '. ';
    }

    // Agregar información del paso
    if (resultado.h !== undefined) {
      texto += 'Se utilizó un tamaño de paso h=' +
        _redondear(resultado.h, 4) + ' ' +
        (contexto.unidadTiempo || 'unidades') + '.';
    }

    return texto;
  }

  // --------------------------------------------------------
  // 11. TABLA DE CONVERGENCIA
  // --------------------------------------------------------

  /**
   * Genera una tabla de convergencia que muestra cómo mejora
   * la aproximación al aumentar el número de subintervalos.
   *
   * @param {Function} f - Función a integrar
   * @param {number} a - Límite inferior
   * @param {number} b - Límite superior
   * @param {string} metodo - 'trapecio', 'simpson13' o 'simpson38'
   * @param {Array<number>} nValues - Arreglo de valores de n a probar
   * @returns {Array<Object>} Tabla de convergencia [{n, valor, error_estimado, cambio}]
   */
  function tablaConvergencia(f, a, b, metodo, nValues) {
    _validarParametros(f, a, b, 1);

    // Valores por defecto de n
    if (!nValues || !Array.isArray(nValues) || nValues.length === 0) {
      nValues = [4, 8, 16, 32, 64, 128];
    }

    // Ordenar los valores de n
    nValues = nValues.slice().sort(function (x, y) { return x - y; });

    if (!metodo) metodo = 'trapecio';

    var tabla = [];
    var valorAnterior = null;

    for (var idx = 0; idx < nValues.length; idx++) {
      var nActual = nValues[idx];

      // Seleccionar el método
      var resultado;
      switch (metodo.toLowerCase()) {
        case 'simpson13':
          resultado = simpson13(f, a, b, nActual);
          break;
        case 'simpson38':
          resultado = simpson38(f, a, b, nActual);
          break;
        default:
          resultado = trapecio(f, a, b, nActual);
          break;
      }

      // Calcular el cambio respecto al valor anterior
      var cambio = valorAnterior !== null
        ? Math.abs(resultado.valor - valorAnterior)
        : null;

      tabla.push({
        n: nActual,
        valor: resultado.valor,
        error_estimado: resultado.errorEstimado,
        cambio: cambio !== null ? _redondear(cambio, 10) : null
      });

      valorAnterior = resultado.valor;
    }

    return tabla;
  }

  // --------------------------------------------------------
  // EXPORTACIÓN GLOBAL
  // --------------------------------------------------------

  /**
   * Objeto global que expone todos los métodos de integración
   * numérica al espacio de nombres window.
   */
  window.Integracion = {
    // Métodos principales de integración
    trapecio: trapecio,
    simpson13: simpson13,
    simpson38: simpson38,

    // Integración desde puntos discretos
    integrarDesdePuntos: integrarDesdePuntos,

    // Comparación de métodos
    compararMetodos: compararMetodos,

    // Estimación de errores
    errorTrapecio: errorTrapecio,
    errorSimpson: errorSimpson,

    // Análisis económico
    calcularPerdidaPoder: calcularPerdidaPoder,

    // Generación de datos para gráficas
    generarPuntosArea: generarPuntosArea,

    // Interpretación automática
    generarInterpretacion: generarInterpretacion,

    // Tabla de convergencia
    tablaConvergencia: tablaConvergencia
  };

})();
