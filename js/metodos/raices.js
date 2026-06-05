// =============================================================================
// raices.js — Métodos numéricos para encontrar raíces de funciones
// Proyecto de simulación de crisis: reservas críticas, equilibrio de precios
// y umbrales de demanda.
// =============================================================================

(function () {
  'use strict';

  // =========================================================================
  // 1. DERIVADA NUMÉRICA — Diferencia central
  // =========================================================================

  /**
   * Calcula la derivada numérica de f en el punto x usando diferencias
   * centrales: f'(x) ≈ (f(x+h) - f(x-h)) / (2h).
   * @param {Function} f  - Función a derivar.
   * @param {number}   x  - Punto donde se evalúa la derivada.
   * @param {number}  [h=0.0001] - Tamaño del paso.
   * @returns {number} Aproximación de f'(x).
   */
  function derivadaNumerica(f, x, h) {
    // Valor por defecto del paso
    if (h === undefined || h === null || h === 0) h = 0.0001;

    var fAdelante = f(x + h);
    var fAtras    = f(x - h);

    // Protección contra valores no numéricos
    if (!isFinite(fAdelante) || !isFinite(fAtras)) {
      return NaN;
    }

    return (fAdelante - fAtras) / (2 * h);
  }

  // =========================================================================
  // 2. ESTIMACIÓN DEL ORDEN DE CONVERGENCIA
  // =========================================================================

  /**
   * Estima el orden de convergencia p a partir de un arreglo de errores
   * sucesivos usando la fórmula:
   *   p ≈ ln(e_{n+1} / e_n) / ln(e_n / e_{n-1})
   *
   * Para bisección se espera p ≈ 1, Newton p ≈ 2, secante p ≈ 1.618.
   * @param {number[]} errores - Arreglo de errores absolutos por iteración.
   * @returns {number} Orden estimado (NaN si no hay suficientes datos).
   */
  function estimarOrdenConvergencia(errores) {
    // Necesitamos al menos 3 errores consecutivos válidos
    if (!errores || errores.length < 3) return NaN;

    // Filtrar errores que sean estrictamente positivos y finitos
    var validos = errores.filter(function (e) {
      return isFinite(e) && e > 0;
    });

    if (validos.length < 3) return NaN;

    // Tomamos los últimos tres errores para mayor estabilidad numérica
    var estimaciones = [];

    for (var i = 2; i < validos.length; i++) {
      var eN1  = validos[i];
      var eN   = validos[i - 1];
      var eNm1 = validos[i - 2];

      // Evitar logaritmo de cero o valores negativos
      var ratio1 = eN1 / eN;
      var ratio2 = eN  / eNm1;

      if (ratio1 <= 0 || ratio2 <= 0 || ratio2 === 1) continue;

      var lnR1 = Math.log(ratio1);
      var lnR2 = Math.log(ratio2);

      if (lnR2 === 0 || !isFinite(lnR1) || !isFinite(lnR2)) continue;

      var p = lnR1 / lnR2;

      // Solo aceptar valores razonables (entre 0.5 y 4)
      if (isFinite(p) && p > 0.5 && p < 4) {
        estimaciones.push(p);
      }
    }

    if (estimaciones.length === 0) return NaN;

    // Promedio de las estimaciones válidas
    var suma = estimaciones.reduce(function (acc, v) { return acc + v; }, 0);
    return Math.round((suma / estimaciones.length) * 1000) / 1000;
  }

  // =========================================================================
  // 3. MÉTODO DE BISECCIÓN
  // =========================================================================

  /**
   * Método de Bisección para encontrar raíces.
   * Requiere que f(a) y f(b) tengan signos opuestos.
   *
   * @param {Function} f       - Función continua.
   * @param {number}   a       - Extremo izquierdo del intervalo.
   * @param {number}   b       - Extremo derecho del intervalo.
   * @param {number}   tol     - Tolerancia deseada.
   * @param {number}   maxIter - Número máximo de iteraciones.
   * @returns {Object} Resultado estructurado con raíz, historial, etc.
   */
  function biseccion(f, a, b, tol, maxIter) {
    // Valores por defecto
    tol     = (tol !== undefined && tol !== null)     ? tol     : 1e-6;
    maxIter = (maxIter !== undefined && maxIter !== null) ? maxIter : 100;

    var historial = [];
    var fa = f(a);
    var fb = f(b);

    // -----------------------------------------------------------------------
    // Verificación del teorema de Bolzano: f(a)·f(b) < 0
    // -----------------------------------------------------------------------
    if (fa * fb >= 0) {
      return {
        raiz: NaN,
        iteraciones: 0,
        historial: [],
        convergencia: false,
        ordenConvergencia: NaN,
        error: 'No se cumple el teorema de Bolzano: f(a)·f(b) debe ser < 0. ' +
               'f(' + a + ') = ' + fa.toFixed(6) + ', f(' + b + ') = ' + fb.toFixed(6)
      };
    }

    var c, fc, errorAbs;
    var errores = [];
    var convergencia = false;

    for (var i = 1; i <= maxIter; i++) {
      // Punto medio del intervalo
      c  = (a + b) / 2;
      fc = f(c);

      // Error absoluto: |f(c)|
      errorAbs = Math.abs(fc);
      errores.push(errorAbs);

      // Protección contra NaN/Infinity
      if (!isFinite(fc)) {
        historial.push({
          iter: i, a: a, b: b, c: c, fc: NaN, error: NaN
        });
        break;
      }

      // Registrar la iteración en el historial
      historial.push({
        iter:  i,
        a:     parseFloat(a.toFixed(10)),
        b:     parseFloat(b.toFixed(10)),
        c:     parseFloat(c.toFixed(10)),
        fc:    parseFloat(fc.toFixed(10)),
        error: parseFloat(errorAbs.toFixed(10))
      });

      // Verificar convergencia
      if (errorAbs < tol || (b - a) / 2 < tol) {
        convergencia = true;
        break;
      }

      // Actualizar el intervalo según el signo de f(c)
      if (fa * fc < 0) {
        b  = c;
        fb = fc;
      } else {
        a  = c;
        fa = fc;
      }
    }

    // Calcular orden de convergencia estimado
    var orden = estimarOrdenConvergencia(errores);

    return {
      raiz:              parseFloat(c.toFixed(10)),
      iteraciones:       historial.length,
      historial:         historial,
      convergencia:      convergencia,
      ordenConvergencia: isNaN(orden) ? 1 : orden,  // Bisección: orden teórico 1
      errores:           errores
    };
  }

  // =========================================================================
  // 4. MÉTODO DE NEWTON-RAPHSON
  // =========================================================================

  /**
   * Método de Newton-Raphson para encontrar raíces.
   * Si no se proporciona la derivada, se usa derivada numérica por
   * diferencias centrales.
   *
   * @param {Function}      f       - Función.
   * @param {Function|null} df      - Derivada de f (o null para numérica).
   * @param {number}        x0      - Aproximación inicial.
   * @param {number}        tol     - Tolerancia deseada.
   * @param {number}        maxIter - Número máximo de iteraciones.
   * @returns {Object} Resultado estructurado.
   */
  function newtonRaphson(f, df, x0, tol, maxIter) {
    tol     = (tol !== undefined && tol !== null)     ? tol     : 1e-6;
    maxIter = (maxIter !== undefined && maxIter !== null) ? maxIter : 100;

    // Si no se proporcionó la derivada, usar derivada numérica
    var usarDerivadaNum = (df === null || df === undefined);
    if (usarDerivadaNum) {
      df = function (x) { return derivadaNumerica(f, x); };
    }

    var historial = [];
    var errores   = [];
    var xi        = x0;
    var convergencia = false;

    for (var i = 1; i <= maxIter; i++) {
      var fxi  = f(xi);
      var dfxi = df(xi);

      // Error absoluto: |f(xi)|
      var errorAbs = Math.abs(fxi);
      errores.push(errorAbs);

      // Registrar iteración
      historial.push({
        iter:  i,
        xi:    parseFloat(xi.toFixed(10)),
        fxi:   parseFloat(fxi.toFixed(10)),
        dfxi:  parseFloat(dfxi.toFixed(10)),
        error: parseFloat(errorAbs.toFixed(10))
      });

      // ---------------------------------------------------------------
      // Protección contra derivada cero (división por cero)
      // ---------------------------------------------------------------
      if (Math.abs(dfxi) < 1e-14) {
        return {
          raiz:              xi,
          iteraciones:       i,
          historial:         historial,
          convergencia:      false,
          ordenConvergencia: NaN,
          errores:           errores,
          error:             'La derivada es cero o casi cero en x = ' + xi.toFixed(6) +
                             '. El método de Newton-Raphson no puede continuar.'
        };
      }

      // Protección contra NaN/Infinity
      if (!isFinite(fxi) || !isFinite(dfxi)) {
        return {
          raiz:              NaN,
          iteraciones:       i,
          historial:         historial,
          convergencia:      false,
          ordenConvergencia: NaN,
          errores:           errores,
          error:             'Se encontró un valor no numérico en la iteración ' + i + '.'
        };
      }

      // Verificar convergencia
      if (errorAbs < tol) {
        convergencia = true;
        break;
      }

      // Fórmula de Newton: x_{i+1} = x_i - f(x_i) / f'(x_i)
      xi = xi - fxi / dfxi;

      // Protección adicional contra divergencia
      if (!isFinite(xi)) {
        return {
          raiz:              NaN,
          iteraciones:       i,
          historial:         historial,
          convergencia:      false,
          ordenConvergencia: NaN,
          errores:           errores,
          error:             'El método divergió en la iteración ' + i + '.'
        };
      }
    }

    // Si salió del bucle sin converger, registrar última evaluación
    if (!convergencia && historial.length < maxIter) {
      var fFinal = f(xi);
      errores.push(Math.abs(fFinal));
    }

    var orden = estimarOrdenConvergencia(errores);

    return {
      raiz:              parseFloat(xi.toFixed(10)),
      iteraciones:       historial.length,
      historial:         historial,
      convergencia:      convergencia,
      ordenConvergencia: isNaN(orden) ? 2 : orden,  // Newton: orden teórico 2
      errores:           errores
    };
  }

  // =========================================================================
  // 5. MÉTODO DE LA SECANTE
  // =========================================================================

  /**
   * Método de la Secante para encontrar raíces.
   * No requiere la derivada, usa dos puntos iniciales.
   *
   * @param {Function} f       - Función.
   * @param {number}   x0      - Primera aproximación inicial.
   * @param {number}   x1      - Segunda aproximación inicial.
   * @param {number}   tol     - Tolerancia deseada.
   * @param {number}   maxIter - Número máximo de iteraciones.
   * @returns {Object} Resultado estructurado.
   */
  function secante(f, x0, x1, tol, maxIter) {
    tol     = (tol !== undefined && tol !== null)     ? tol     : 1e-6;
    maxIter = (maxIter !== undefined && maxIter !== null) ? maxIter : 100;

    var historial    = [];
    var errores      = [];
    var xi_1         = x0;   // x_{i-1}
    var xi           = x1;   // x_i
    var convergencia = false;

    for (var i = 1; i <= maxIter; i++) {
      var fxi_1 = f(xi_1);
      var fxi   = f(xi);

      // Error absoluto: |f(xi)|
      var errorAbs = Math.abs(fxi);
      errores.push(errorAbs);

      // Registrar iteración
      historial.push({
        iter:  i,
        xi:    parseFloat(xi.toFixed(10)),
        xi_1:  parseFloat(xi_1.toFixed(10)),
        fxi:   parseFloat(fxi.toFixed(10)),
        error: parseFloat(errorAbs.toFixed(10))
      });

      // Protección contra NaN/Infinity
      if (!isFinite(fxi) || !isFinite(fxi_1)) {
        return {
          raiz:              NaN,
          iteraciones:       i,
          historial:         historial,
          convergencia:      false,
          ordenConvergencia: NaN,
          errores:           errores,
          error:             'Se encontró un valor no numérico en la iteración ' + i + '.'
        };
      }

      // Verificar convergencia
      if (errorAbs < tol) {
        convergencia = true;
        break;
      }

      // Denominador de la fórmula de la secante
      var denominador = fxi - fxi_1;

      // Protección contra denominador cero
      if (Math.abs(denominador) < 1e-14) {
        return {
          raiz:              xi,
          iteraciones:       i,
          historial:         historial,
          convergencia:      false,
          ordenConvergencia: NaN,
          errores:           errores,
          error:             'El denominador f(xi) - f(xi_1) es cero. ' +
                             'El método de la Secante no puede continuar.'
        };
      }

      // Fórmula de la secante: x_{i+1} = xi - f(xi)·(xi - xi_1) / (f(xi) - f(xi_1))
      var xiNuevo = xi - fxi * (xi - xi_1) / denominador;

      // Protección contra divergencia
      if (!isFinite(xiNuevo)) {
        return {
          raiz:              NaN,
          iteraciones:       i,
          historial:         historial,
          convergencia:      false,
          ordenConvergencia: NaN,
          errores:           errores,
          error:             'El método divergió en la iteración ' + i + '.'
        };
      }

      // Actualizar valores para la siguiente iteración
      xi_1 = xi;
      xi   = xiNuevo;
    }

    var orden = estimarOrdenConvergencia(errores);

    return {
      raiz:              parseFloat(xi.toFixed(10)),
      iteraciones:       historial.length,
      historial:         historial,
      convergencia:      convergencia,
      ordenConvergencia: isNaN(orden) ? 1.618 : orden, // Secante: orden teórico φ ≈ 1.618
      errores:           errores
    };
  }

  // =========================================================================
  // 6. EVALUAR FUNCIÓN DESDE CADENA DE TEXTO
  // =========================================================================

  /**
   * Evalúa una expresión matemática dada como cadena de texto en un punto x.
   * Soporta funciones de Math (exp, pow, log, sin, cos, sqrt, abs, etc.).
   *
   * @param {string} expresion - Expresión matemática, p.ej. "x^2 - 4".
   * @param {number} x        - Valor de la variable.
   * @returns {number} Resultado de la evaluación.
   */
  function evaluarFuncion(expresion, x) {
    try {
      // Preparar la expresión para evaluación
      var expr = _prepararExpresion(expresion);

      // Crear función anónima con x como parámetro
      var fn = new Function('x', 'return (' + expr + ');');
      var resultado = fn(x);

      return isFinite(resultado) ? resultado : NaN;
    } catch (e) {
      console.error('Error al evaluar la expresión "' + expresion + '" con x=' + x + ':', e);
      return NaN;
    }
  }

  // =========================================================================
  // 7. PARSEAR FUNCIÓN — Convertir cadena a función invocable
  // =========================================================================

  /**
   * Convierte una expresión matemática en cadena a una función de JavaScript
   * invocable. Soporta: +, -, *, /, ^, exp(), sin(), cos(), log(), sqrt(),
   * abs(), pi, e.
   *
   * @param {string} expresion - Expresión como "1000*exp(-0.1*x) + 50*x - 500".
   * @returns {Function} Función f(x) => number.
   */
  function parsearFuncion(expresion) {
    // Preparar la expresión una sola vez
    var exprPreparada = _prepararExpresion(expresion);

    return function (x) {
      try {
        var fn = new Function('x', 'return (' + exprPreparada + ');');
        var resultado = fn(x);
        return isFinite(resultado) ? resultado : NaN;
      } catch (e) {
        console.error('Error al evaluar función parseada con x=' + x + ':', e);
        return NaN;
      }
    };
  }

  /**
   * Función auxiliar interna que transforma una expresión con notación
   * matemática estándar a sintaxis válida de JavaScript.
   *
   * @param {string} expr - Expresión original.
   * @returns {string} Expresión transformada lista para new Function().
   * @private
   */
  function _prepararExpresion(expr) {
    var resultado = expr.trim();

    // Reemplazar constantes comunes
    resultado = resultado.replace(/\bpi\b/gi, 'Math.PI');
    resultado = resultado.replace(/\be\b/g, 'Math.E');

    // Reemplazar operador potencia ^ por Math.pow(base, exp)
    // Manejo iterativo para potencias anidadas
    var intentos = 0;
    while (resultado.indexOf('^') !== -1 && intentos < 20) {
      resultado = resultado.replace(
        /([a-zA-Z0-9_.()]+)\^([a-zA-Z0-9_.()]+)/,
        'Math.pow($1,$2)'
      );
      intentos++;
    }

    // Reemplazar funciones matemáticas comunes con Math.*
    var funciones = ['exp', 'sin', 'cos', 'tan', 'log', 'sqrt', 'abs',
                     'asin', 'acos', 'atan', 'ceil', 'floor', 'round'];

    funciones.forEach(function (fn) {
      // Solo reemplazar si no está ya precedido por "Math."
      var regex = new RegExp('(?<!Math\\.)\\b' + fn + '\\s*\\(', 'g');
      resultado = resultado.replace(regex, 'Math.' + fn + '(');
    });

    // Limpiar posibles duplicados "Math.Math."
    resultado = resultado.replace(/Math\.Math\./g, 'Math.');

    return resultado;
  }

  // =========================================================================
  // 8. GENERAR PUNTOS PARA GRÁFICA
  // =========================================================================

  /**
   * Genera un arreglo de puntos (x, y) para graficar la función f en el
   * intervalo [xMin, xMax] con el número especificado de puntos.
   *
   * @param {Function} f         - Función a evaluar.
   * @param {number}   xMin      - Límite inferior del dominio.
   * @param {number}   xMax      - Límite superior del dominio.
   * @param {number}  [numPuntos=200] - Cantidad de puntos a generar.
   * @returns {{ x: number[], y: number[] }} Arreglos de coordenadas.
   */
  function generarPuntosFuncion(f, xMin, xMax, numPuntos) {
    numPuntos = numPuntos || 200;

    var xArr = [];
    var yArr = [];
    var paso = (xMax - xMin) / (numPuntos - 1);

    for (var i = 0; i < numPuntos; i++) {
      var x = xMin + i * paso;
      var y = f(x);

      xArr.push(parseFloat(x.toFixed(8)));

      // Reemplazar valores no finitos con null para que Chart.js los omita
      if (isFinite(y)) {
        yArr.push(parseFloat(y.toFixed(8)));
      } else {
        yArr.push(null);
      }
    }

    return { x: xArr, y: yArr };
  }

  // =========================================================================
  // 9. COMPARAR MÉTODOS — Ejecuta los 3 y genera resumen comparativo
  // =========================================================================

  /**
   * Ejecuta los tres métodos (Bisección, Newton-Raphson, Secante) sobre la
   * misma función y compara rendimiento, precisión y orden de convergencia.
   *
   * @param {Function}      f       - Función objetivo.
   * @param {Function|null} df      - Derivada (null = numérica).
   * @param {number}        a       - Extremo izquierdo (bisección).
   * @param {number}        b       - Extremo derecho (bisección).
   * @param {number}        x0      - Aproximación inicial (Newton/Secante).
   * @param {number}        x1      - Segunda aproximación (Secante).
   * @param {number}        tol     - Tolerancia.
   * @param {number}        maxIter - Máximo de iteraciones.
   * @returns {Object} Objeto con resultados, mejor método y comparación.
   */
  function compararMetodos(f, df, a, b, x0, x1, tol, maxIter) {
    var resultados = {};
    var comparacion = [];

    // -------------------------------------------------------------------
    // Ejecutar Bisección con medición de tiempo
    // -------------------------------------------------------------------
    var t0 = performance.now();
    var resBiseccion = biseccion(f, a, b, tol, maxIter);
    var t1 = performance.now();
    resultados.biseccion = resBiseccion;
    comparacion.push({
      metodo:      'Bisección',
      raiz:        resBiseccion.raiz,
      iteraciones: resBiseccion.iteraciones,
      error:       resBiseccion.historial.length > 0
                     ? resBiseccion.historial[resBiseccion.historial.length - 1].error
                     : NaN,
      orden:       resBiseccion.ordenConvergencia,
      tiempo:      parseFloat((t1 - t0).toFixed(4)),
      convergencia: resBiseccion.convergencia
    });

    // -------------------------------------------------------------------
    // Ejecutar Newton-Raphson con medición de tiempo
    // -------------------------------------------------------------------
    t0 = performance.now();
    var resNewton = newtonRaphson(f, df, x0, tol, maxIter);
    t1 = performance.now();
    resultados.newton = resNewton;
    comparacion.push({
      metodo:      'Newton-Raphson',
      raiz:        resNewton.raiz,
      iteraciones: resNewton.iteraciones,
      error:       resNewton.historial.length > 0
                     ? resNewton.historial[resNewton.historial.length - 1].error
                     : NaN,
      orden:       resNewton.ordenConvergencia,
      tiempo:      parseFloat((t1 - t0).toFixed(4)),
      convergencia: resNewton.convergencia
    });

    // -------------------------------------------------------------------
    // Ejecutar Secante con medición de tiempo
    // -------------------------------------------------------------------
    t0 = performance.now();
    var resSecante = secante(f, x0, x1, tol, maxIter);
    t1 = performance.now();
    resultados.secante = resSecante;
    comparacion.push({
      metodo:      'Secante',
      raiz:        resSecante.raiz,
      iteraciones: resSecante.iteraciones,
      error:       resSecante.historial.length > 0
                     ? resSecante.historial[resSecante.historial.length - 1].error
                     : NaN,
      orden:       resSecante.ordenConvergencia,
      tiempo:      parseFloat((t1 - t0).toFixed(4)),
      convergencia: resSecante.convergencia
    });

    // -------------------------------------------------------------------
    // Determinar el mejor método (menor número de iteraciones con convergencia)
    // -------------------------------------------------------------------
    var mejor = null;
    var menorIter = Infinity;

    comparacion.forEach(function (item) {
      if (item.convergencia && item.iteraciones < menorIter) {
        menorIter = item.iteraciones;
        mejor = item.metodo;
      }
    });

    // Si ninguno convergió, elegir el de menor error final
    if (!mejor) {
      var menorError = Infinity;
      comparacion.forEach(function (item) {
        if (isFinite(item.error) && item.error < menorError) {
          menorError = item.error;
          mejor = item.metodo;
        }
      });
    }

    return {
      resultados:  resultados,
      mejor:       mejor || 'Ninguno convergió',
      comparacion: comparacion
    };
  }

  // =========================================================================
  // 10. GENERAR INTERPRETACIÓN EN ESPAÑOL
  // =========================================================================

  /**
   * Genera un texto interpretativo en español sobre el resultado de un
   * método numérico, incluyendo análisis de convergencia y contexto de
   * la simulación de crisis.
   *
   * @param {string} metodo    - Nombre del método ("Bisección", "Newton-Raphson", "Secante").
   * @param {Object} resultado - Objeto resultado del método.
   * @param {Object} contexto  - { nombreFuncion: string, descripcion: string }.
   * @returns {string} Texto interpretativo en español.
   */
  function generarInterpretacion(metodo, resultado, contexto) {
    // Valores por defecto para el contexto
    contexto = contexto || {};
    var nombreFuncion = contexto.nombreFuncion || 'la función analizada';
    var descripcion   = contexto.descripcion   || 'el análisis numérico';

    // -------------------------------------------------------------------
    // Caso de no convergencia
    // -------------------------------------------------------------------
    if (!resultado.convergencia) {
      var textoNoConv = 'El método de ' + metodo + ' no convergió después de ' +
        resultado.iteraciones + ' iteraciones al analizar ' + nombreFuncion + '. ';

      if (resultado.error) {
        textoNoConv += resultado.error + ' ';
      }

      textoNoConv += 'Se recomienda ajustar los parámetros iniciales o utilizar ' +
        'un método alternativo para ' + descripcion + '.';

      return textoNoConv;
    }

    // -------------------------------------------------------------------
    // Caso de convergencia exitosa
    // -------------------------------------------------------------------
    var raizFormateada = resultado.raiz.toFixed(6);
    var errorFinal = resultado.historial.length > 0
      ? resultado.historial[resultado.historial.length - 1].error
      : 0;

    var texto = 'El método de ' + metodo + ' encontró la raíz en x = ' +
      raizFormateada + ' después de ' + resultado.iteraciones + ' iteraciones. ';

    // Análisis del error
    texto += 'El error absoluto final fue de ' + errorFinal.toExponential(4) + '. ';

    // Análisis de convergencia
    var orden = resultado.ordenConvergencia;
    if (isFinite(orden)) {
      texto += 'El orden de convergencia estimado es p ≈ ' + orden.toFixed(3) + ', ';

      if (orden < 1.2) {
        texto += 'lo que corresponde a convergencia lineal (esperado para Bisección). ';
      } else if (orden >= 1.2 && orden < 1.8) {
        texto += 'lo que corresponde a convergencia superlineal (esperado para la Secante, p ≈ 1.618). ';
      } else if (orden >= 1.8) {
        texto += 'lo que corresponde a convergencia cuadrática (esperado para Newton-Raphson). ';
      }
    }

    // Interpretación contextual según la descripción
    texto += '\n\nInterpretación en contexto de crisis: ';

    if (descripcion.toLowerCase().indexOf('reserva') !== -1 ||
        nombreFuncion.toLowerCase().indexOf('reserva') !== -1) {
      texto += 'Esto indica que las reservas alcanzan su nivel crítico cuando el ' +
        'parámetro x = ' + raizFormateada + '. A partir de este punto, el sistema ' +
        'de reservas entra en una fase de agotamiento que requiere intervención inmediata.';
    } else if (descripcion.toLowerCase().indexOf('precio') !== -1 ||
               descripcion.toLowerCase().indexOf('equilibrio') !== -1) {
      texto += 'El equilibrio de precios se alcanza en x = ' + raizFormateada + '. ' +
        'Este valor representa el punto donde la oferta y la demanda se igualan, ' +
        'indicando estabilidad temporal en el mercado bajo las condiciones modeladas.';
    } else if (descripcion.toLowerCase().indexOf('demanda') !== -1 ||
               descripcion.toLowerCase().indexOf('umbral') !== -1) {
      texto += 'El umbral de demanda se cruza en x = ' + raizFormateada + '. ' +
        'Esto señala el momento en que la demanda supera la capacidad de respuesta ' +
        'del sistema, activando los protocolos de gestión de crisis.';
    } else {
      texto += 'El valor x = ' + raizFormateada + ' representa un punto crítico ' +
        'en ' + descripcion + '. Este resultado permite identificar umbrales de ' +
        'acción para la toma de decisiones en escenarios de crisis.';
    }

    return texto;
  }

  // =========================================================================
  // FUNCIONES PREDEFINIDAS DEL PROYECTO
  // =========================================================================

  /**
   * Las tres funciones predefinidas del proyecto de simulación de crisis.
   * Cada una incluye su función, derivada analítica, nombre y descripción.
   */
  var funcionesPredefinidas = {
    // Función 1: Reservas críticas
    reservasCriticas: {
      nombre:      'Reservas Críticas',
      expresion:   '1000*exp(-0.1*x) + 50*x - 500',
      descripcion: 'Modelo de reservas críticas: f(x) = 1000·e^(-0.1x) + 50x - 500',
      f: function (x) {
        return 1000 * Math.exp(-0.1 * x) + 50 * x - 500;
      },
      df: function (x) {
        return -100 * Math.exp(-0.1 * x) + 50;
      },
      // Intervalo sugerido para bisección
      intervalo: { a: 0, b: 20 },
      // Punto inicial sugerido para Newton/Secante
      x0: 5, x1: 10
    },

    // Función 2: Equilibrio de precios
    equilibrioPrecios: {
      nombre:      'Equilibrio de Precios',
      expresion:   'x^3 - 20*x^2 + 100*x - 100',
      descripcion: 'Modelo de equilibrio de precios: f(x) = x³ - 20x² + 100x - 100',
      f: function (x) {
        return Math.pow(x, 3) - 20 * Math.pow(x, 2) + 100 * x - 100;
      },
      df: function (x) {
        return 3 * Math.pow(x, 2) - 40 * x + 100;
      },
      intervalo: { a: 0, b: 5 },
      x0: 1, x1: 3
    },

    // Función 3: Umbral de demanda (sigmoide desplazada)
    umbralDemanda: {
      nombre:      'Umbral de Demanda',
      expresion:   '200/(1+exp(-0.5*(x-10))) - 150',
      descripcion: 'Modelo de umbral de demanda: f(x) = 200/(1+e^(-0.5(x-10))) - 150',
      f: function (x) {
        return 200 / (1 + Math.exp(-0.5 * (x - 10))) - 150;
      },
      df: function (x) {
        var expTerm = Math.exp(-0.5 * (x - 10));
        var denom   = 1 + expTerm;
        return (200 * 0.5 * expTerm) / (denom * denom);
      },
      intervalo: { a: 5, b: 20 },
      x0: 8, x1: 15
    }
  };

  // =========================================================================
  // EXPORTAR AL ESPACIO GLOBAL — window.Raices
  // =========================================================================

  window.Raices = {
    // Métodos principales
    biseccion:       biseccion,
    newtonRaphson:   newtonRaphson,
    secante:         secante,

    // Utilidades numéricas
    derivadaNumerica:          derivadaNumerica,
    estimarOrdenConvergencia:  estimarOrdenConvergencia,

    // Comparación y análisis
    compararMetodos:           compararMetodos,
    generarInterpretacion:     generarInterpretacion,

    // Manejo de expresiones
    evaluarFuncion:            evaluarFuncion,
    parsearFuncion:            parsearFuncion,

    // Generación de datos para gráficas
    generarPuntosFuncion:      generarPuntosFuncion,

    // Funciones predefinidas del proyecto
    funcionesPredefinidas:     funcionesPredefinidas
  };

  console.log('✅ Módulo Raices cargado correctamente — Métodos: Bisección, Newton-Raphson, Secante');

})();
