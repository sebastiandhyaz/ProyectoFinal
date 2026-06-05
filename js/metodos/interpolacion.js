// ============================================================================
// interpolacion.js
// Métodos de interpolación para predicción de precios de alimentos en crisis
// Incluye: Lagrange, Newton (diferencias divididas), Splines cúbicos naturales
// Utilidades: curva suave, comparación, error, formato, interpretación
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Helpers internos
  // --------------------------------------------------------------------------

  /**
   * Valida que los puntos sean un arreglo válido y sin valores x duplicados.
   * Lanza un Error descriptivo si hay problemas.
   * @param {number[][]} puntos - Arreglo de pares [x, y]
   */
  function _validarPuntos(puntos) {
    if (!Array.isArray(puntos) || puntos.length < 2) {
      throw new Error('Se requieren al menos 2 puntos para interpolar.');
    }
    // Verificar duplicados en x
    var xs = puntos.map(function (p) { return p[0]; });
    var vistos = {};
    for (var i = 0; i < xs.length; i++) {
      if (vistos[xs[i]] !== undefined) {
        throw new Error(
          'Valor x duplicado detectado: x = ' + xs[i] +
          '. Cada punto debe tener un valor x único.'
        );
      }
      vistos[xs[i]] = true;
    }
  }

  /**
   * Ordena los puntos por su coordenada x de menor a mayor.
   * Retorna una copia ordenada sin mutar el original.
   * @param {number[][]} puntos
   * @returns {number[][]}
   */
  function _ordenarPuntos(puntos) {
    return puntos.slice().sort(function (a, b) { return a[0] - b[0]; });
  }

  /**
   * Envuelve xEval para que siempre sea un arreglo.
   * Retorna { esArreglo, valores }.
   */
  function _normalizarXEval(xEval) {
    if (Array.isArray(xEval)) {
      return { esArreglo: true, valores: xEval };
    }
    return { esArreglo: false, valores: [xEval] };
  }

  /**
   * Redondea un número a 'dec' decimales para presentación.
   */
  function _redondear(val, dec) {
    if (dec === undefined) dec = 6;
    var factor = Math.pow(10, dec);
    return Math.round(val * factor) / factor;
  }

  /**
   * Formatea un coeficiente con signo para construir cadenas de polinomio.
   * @param {number} coef - Coeficiente numérico
   * @param {string} termino - Representación del término (ej. 'x²')
   * @param {boolean} esPrimero - Si es el primer término (sin signo '+' inicial)
   * @returns {string}
   */
  function _formatearTermino(coef, termino, esPrimero) {
    if (Math.abs(coef) < 1e-12) return '';
    var signo = coef >= 0 ? (esPrimero ? '' : ' + ') : (esPrimero ? '-' : ' - ');
    var abs = _redondear(Math.abs(coef), 4);
    if (termino === '') {
      return signo + abs;
    }
    if (abs === 1) {
      return signo + termino;
    }
    return signo + abs + termino;
  }

  /**
   * Genera una cadena de superíndice Unicode para exponentes.
   */
  function _superindice(n) {
    if (n === 0) return '⁰';
    if (n === 1) return '';
    var mapa = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
                 '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    var s = String(n);
    var resultado = '';
    for (var i = 0; i < s.length; i++) {
      resultado += mapa[s[i]] || s[i];
    }
    return resultado;
  }

  // ==========================================================================
  // 1. INTERPOLACIÓN DE LAGRANGE
  // ==========================================================================

  /**
   * Calcula la interpolación de Lagrange en uno o varios puntos.
   *
   * @param {number[][]} puntos - Datos [[x0,y0], [x1,y1], ...]
   * @param {number|number[]} xEval - Valor(es) de x donde evaluar
   * @returns {{
   *   valor: number|number[],
   *   polinomio: string,
   *   coeficientesL: number[],
   *   pasos: Array<{descripcion: string, Li: string, valor: number}>
   * }}
   */
  function lagrange(puntos, xEval) {
    _validarPuntos(puntos);
    var pts = _ordenarPuntos(puntos);
    var n = pts.length;
    var info = _normalizarXEval(xEval);

    // --- Construir los coeficientes de base de Lagrange (para el primer xEval) ---
    var primerX = info.valores[0];
    var coeficientesL = [];
    var pasos = [];

    // Calcular cada L_i(primerX) para documentar pasos
    for (var i = 0; i < n; i++) {
      var Li = 1;
      var partes = [];
      for (var j = 0; j < n; j++) {
        if (j === i) continue;
        var num = primerX - pts[j][0];
        var den = pts[i][0] - pts[j][0];
        Li *= num / den;
        partes.push('(' + _redondear(primerX) + ' - ' + _redondear(pts[j][0]) + ')/(' +
                     _redondear(pts[i][0]) + ' - ' + _redondear(pts[j][0]) + ')');
      }
      coeficientesL.push(_redondear(Li));
      pasos.push({
        descripcion: 'Base de Lagrange L' + _superindice(i) + '(' + _redondear(primerX) + ')',
        Li: 'L' + i + '(x) = ' + partes.join(' · '),
        valor: _redondear(Li)
      });
    }

    // --- Evaluar el polinomio en todos los xEval ---
    var resultados = info.valores.map(function (x) {
      var suma = 0;
      for (var i = 0; i < n; i++) {
        var Li = 1;
        for (var j = 0; j < n; j++) {
          if (j !== i) {
            Li *= (x - pts[j][0]) / (pts[i][0] - pts[j][0]);
          }
        }
        suma += pts[i][1] * Li;
      }
      return _redondear(suma);
    });

    // --- Construir representación legible del polinomio ---
    var terminosPoly = [];
    for (var i = 0; i < n; i++) {
      var factores = [];
      for (var j = 0; j < n; j++) {
        if (j !== i) {
          var xj = pts[j][0];
          factores.push(xj >= 0 ? '(x - ' + xj + ')' : '(x + ' + Math.abs(xj) + ')');
        }
      }
      // Denominador numérico
      var den = 1;
      for (var j = 0; j < n; j++) {
        if (j !== i) den *= (pts[i][0] - pts[j][0]);
      }
      var coef = _redondear(pts[i][1] / den, 6);
      if (Math.abs(coef) > 1e-12) {
        terminosPoly.push(coef + '·' + factores.join(''));
      }
    }
    var polinomio = 'P(x) = ' + (terminosPoly.length > 0 ? terminosPoly.join(' + ') : '0');

    return {
      valor: info.esArreglo ? resultados : resultados[0],
      polinomio: polinomio,
      coeficientesL: coeficientesL,
      pasos: pasos
    };
  }

  // ==========================================================================
  // 2. INTERPOLACIÓN DE NEWTON (Diferencias Divididas)
  // ==========================================================================

  /**
   * Calcula la interpolación de Newton con diferencias divididas.
   *
   * @param {number[][]} puntos - Datos [[x0,y0], [x1,y1], ...]
   * @param {number|number[]} xEval - Valor(es) de x donde evaluar
   * @returns {{
   *   valor: number|number[],
   *   polinomio: string,
   *   tablaDiferencias: number[][],
   *   coeficientes: number[],
   *   pasos: Array<{descripcion: string, tabla: number[][]}>
   * }}
   */
  function newtonDiferencias(puntos, xEval) {
    _validarPuntos(puntos);
    var pts = _ordenarPuntos(puntos);
    var n = pts.length;
    var info = _normalizarXEval(xEval);

    // --- Construir la tabla de diferencias divididas ---
    // tabla[i][j] = f[xi, xi+1, ..., xi+j]
    var tabla = [];
    for (var i = 0; i < n; i++) {
      tabla[i] = new Array(n).fill(0);
      tabla[i][0] = pts[i][1]; // Columna 0 = f(xi)
    }

    var pasos = [];
    // Copia de la tabla después de la columna 0
    pasos.push({
      descripcion: 'Columna 0: valores f(xᵢ)',
      tabla: tabla.map(function (fila) { return fila.slice(); })
    });

    // Llenar columnas 1..n-1
    for (var j = 1; j < n; j++) {
      for (var i = 0; i < n - j; i++) {
        tabla[i][j] = (tabla[i + 1][j - 1] - tabla[i][j - 1]) /
                      (pts[i + j][0] - pts[i][0]);
        tabla[i][j] = _redondear(tabla[i][j], 10);
      }
      pasos.push({
        descripcion: 'Columna ' + j + ': diferencias divididas de orden ' + j,
        tabla: tabla.map(function (fila) { return fila.slice(); })
      });
    }

    // Los coeficientes de Newton son la primera fila: tabla[0][0..n-1]
    var coeficientes = [];
    for (var j = 0; j < n; j++) {
      coeficientes.push(_redondear(tabla[0][j], 10));
    }

    // --- Evaluar el polinomio de Newton en todos los xEval ---
    var resultados = info.valores.map(function (x) {
      var resultado = coeficientes[0];
      var producto = 1;
      for (var j = 1; j < n; j++) {
        producto *= (x - pts[j - 1][0]);
        resultado += coeficientes[j] * producto;
      }
      return _redondear(resultado);
    });

    // --- Construir representación legible del polinomio de Newton ---
    var terminosPoly = [];
    for (var j = 0; j < n; j++) {
      if (Math.abs(coeficientes[j]) < 1e-12) continue;
      var termino = _redondear(coeficientes[j], 4).toString();
      for (var k = 0; k < j; k++) {
        var xk = pts[k][0];
        termino += xk >= 0 ? '(x - ' + xk + ')' : '(x + ' + Math.abs(xk) + ')';
      }
      terminosPoly.push(termino);
    }
    var polinomio = 'P(x) = ' + (terminosPoly.length > 0 ? terminosPoly.join(' + ') : '0');

    // Tabla completa para retorno (solo filas relevantes por columna)
    var tablaDiferencias = tabla.map(function (fila) {
      return fila.map(function (v) { return _redondear(v, 6); });
    });

    return {
      valor: info.esArreglo ? resultados : resultados[0],
      polinomio: polinomio,
      tablaDiferencias: tablaDiferencias,
      coeficientes: coeficientes,
      pasos: pasos
    };
  }

  // ==========================================================================
  // 3. SPLINES CÚBICOS NATURALES
  // ==========================================================================

  /**
   * Algoritmo de Thomas para resolver un sistema tridiagonal.
   * Resuelve Ax = d donde A es tridiagonal con sub-diagonal 'a',
   * diagonal principal 'b', super-diagonal 'c'.
   *
   * @param {number[]} a - Sub-diagonal (longitud n-1), a[0] no se usa
   * @param {number[]} b - Diagonal principal (longitud n)
   * @param {number[]} c - Super-diagonal (longitud n-1)
   * @param {number[]} d - Lado derecho (longitud n)
   * @returns {number[]} - Solución x
   */
  function resolverTridiagonal(a, b, c, d) {
    var n = b.length;
    // Copias para no mutar los originales
    var cp = new Array(n);
    var dp = new Array(n);
    var x = new Array(n);

    // Fase de eliminación hacia adelante (barrido forward)
    cp[0] = c[0] / b[0];
    dp[0] = d[0] / b[0];

    for (var i = 1; i < n; i++) {
      var ai = (i < a.length) ? a[i] : 0;
      var ci = (i < c.length) ? c[i] : 0;
      var m = b[i] - ai * cp[i - 1];
      cp[i] = ci / m;
      dp[i] = (d[i] - ai * dp[i - 1]) / m;
    }

    // Fase de sustitución hacia atrás (barrido backward)
    x[n - 1] = dp[n - 1];
    for (var i = n - 2; i >= 0; i--) {
      x[i] = dp[i] - cp[i] * x[i + 1];
    }

    return x;
  }

  /**
   * Calcula la interpolación por splines cúbicos naturales.
   * Condiciones de frontera natural: S''(x0) = 0, S''(xn) = 0.
   *
   * @param {number[][]} puntos - Datos [[x0,y0], [x1,y1], ...]
   * @param {number|number[]} xEval - Valor(es) de x donde evaluar
   * @returns {{
   *   valor: number|number[],
   *   coeficientes: Array<{a:number, b:number, c:number, d:number, xi:number, xi1:number}>,
   *   sistema: {A:number[][], b:number[], solucion:number[]},
   *   pasos: Array<{descripcion:string, detalle:string}>
   * }}
   */
  function splinesCubicos(puntos, xEval) {
    _validarPuntos(puntos);
    var pts = _ordenarPuntos(puntos);
    var n = pts.length;
    var m = n - 1; // Número de intervalos
    var info = _normalizarXEval(xEval);
    var pasos = [];

    // Extraer x e y
    var xs = pts.map(function (p) { return p[0]; });
    var ys = pts.map(function (p) { return p[1]; });

    // Paso 1: Calcular los h_i (anchos de intervalo)
    var h = [];
    for (var i = 0; i < m; i++) {
      h.push(xs[i + 1] - xs[i]);
    }
    pasos.push({
      descripcion: 'Cálculo de intervalos h_i',
      detalle: 'h = [' + h.map(function (v) { return _redondear(v, 4); }).join(', ') + ']'
    });

    // Paso 2: Construir el sistema tridiagonal para los coeficientes c_i
    // Para splines naturales: c_0 = 0, c_n = 0
    // El sistema tiene n-2 incógnitas (c_1, ..., c_{n-2}) si n > 2
    var tamSistema = n - 2;
    var A_sub = [];  // Sub-diagonal
    var A_diag = []; // Diagonal principal
    var A_sup = [];  // Super-diagonal
    var rhs = [];    // Lado derecho

    if (tamSistema > 0) {
      for (var i = 0; i < tamSistema; i++) {
        var idx = i + 1; // Índice real del nodo
        A_diag.push(2 * (h[idx - 1] + h[idx]));
        rhs.push(3 * ((ys[idx + 1] - ys[idx]) / h[idx] - (ys[idx] - ys[idx - 1]) / h[idx - 1]));
        if (i > 0) {
          A_sub.push(h[idx - 1]);
        }
        if (i < tamSistema - 1) {
          A_sup.push(h[idx]);
        }
      }

      // Construir la matriz A completa para referencia
      var A_completa = [];
      for (var i = 0; i < tamSistema; i++) {
        var fila = new Array(tamSistema).fill(0);
        fila[i] = A_diag[i];
        if (i > 0) fila[i - 1] = A_sub[i - 1];
        if (i < tamSistema - 1) fila[i + 1] = A_sup[i];
        A_completa.push(fila);
      }

      pasos.push({
        descripcion: 'Sistema tridiagonal construido (' + tamSistema + '×' + tamSistema + ')',
        detalle: 'Diagonal principal: [' + A_diag.map(function (v) { return _redondear(v, 4); }).join(', ') + ']\n' +
                 'Lado derecho: [' + rhs.map(function (v) { return _redondear(v, 4); }).join(', ') + ']'
      });

      // Preparar arreglos para Thomas (con índice 0-based ajustado)
      var a_thomas = [0].concat(A_sub); // Sub-diagonal, a[0] no se usa
      var b_thomas = A_diag;
      var c_thomas = A_sup;

      // Resolver con el algoritmo de Thomas
      var solucionInterna = resolverTridiagonal(a_thomas, b_thomas, c_thomas, rhs);

      // Armar vector completo de c (incluyendo c_0 = 0 y c_n = 0)
      var c_vec = [0];
      for (var i = 0; i < solucionInterna.length; i++) {
        c_vec.push(solucionInterna[i]);
      }
      c_vec.push(0);

      pasos.push({
        descripcion: 'Solución del sistema: coeficientes c_i',
        detalle: 'c = [' + c_vec.map(function (v) { return _redondear(v, 6); }).join(', ') + ']'
      });
    } else {
      // Solo 2 puntos: spline lineal
      var c_vec = [0, 0];
      var A_completa = [];
      var solucionInterna = [];
      pasos.push({
        descripcion: 'Solo 2 puntos: spline lineal (todos los c_i = 0)',
        detalle: 'c = [0, 0]'
      });
    }

    // Paso 3: Calcular coeficientes a, b, c, d para cada segmento
    var segmentos = [];
    for (var i = 0; i < m; i++) {
      var ai = ys[i];
      var ci = c_vec[i];
      var bi = (ys[i + 1] - ys[i]) / h[i] - h[i] * (2 * c_vec[i] + c_vec[i + 1]) / 3;
      var di = (c_vec[i + 1] - c_vec[i]) / (3 * h[i]);
      segmentos.push({
        a: _redondear(ai, 8),
        b: _redondear(bi, 8),
        c: _redondear(ci, 8),
        d: _redondear(di, 8),
        xi: xs[i],
        xi1: xs[i + 1]
      });
    }

    pasos.push({
      descripcion: 'Coeficientes de cada segmento S_i(x) = a_i + b_i(x-x_i) + c_i(x-x_i)² + d_i(x-x_i)³',
      detalle: segmentos.map(function (s, i) {
        return 'S' + i + ': a=' + s.a + ', b=' + s.b + ', c=' + s.c + ', d=' + s.d +
               ' en [' + s.xi + ', ' + s.xi1 + ']';
      }).join('\n')
    });

    // --- Función interna para evaluar el spline en un punto x ---
    function _evaluarSpline(x) {
      // Encontrar el segmento apropiado
      var idx = 0;
      for (var i = 0; i < m; i++) {
        if (x >= segmentos[i].xi && x <= segmentos[i].xi1) {
          idx = i;
          break;
        }
        // Si x está más allá del último intervalo, usar el último segmento
        if (i === m - 1) {
          idx = i;
        }
      }
      // Si x < x0, usar el primer segmento (extrapolación)
      if (x < segmentos[0].xi) idx = 0;

      var s = segmentos[idx];
      var dx = x - s.xi;
      return s.a + s.b * dx + s.c * dx * dx + s.d * dx * dx * dx;
    }

    // --- Evaluar en todos los xEval ---
    var resultados = info.valores.map(function (x) {
      return _redondear(_evaluarSpline(x));
    });

    // Construir representación del sistema para retorno
    var sistemaRetorno = {
      A: A_completa || [],
      b: rhs || [],
      solucion: (solucionInterna || []).map(function (v) { return _redondear(v, 6); })
    };

    return {
      valor: info.esArreglo ? resultados : resultados[0],
      coeficientes: segmentos,
      sistema: sistemaRetorno,
      pasos: pasos
    };
  }

  // ==========================================================================
  // 4. GENERAR CURVA SUAVE
  // ==========================================================================

  /**
   * Genera una serie de puntos evaluando el interpolante para graficar curvas suaves.
   *
   * @param {'lagrange'|'newton'|'splines'} metodo - Método de interpolación
   * @param {number[][]} puntos - Datos originales
   * @param {number} xMin - Límite inferior del rango
   * @param {number} xMax - Límite superior del rango
   * @param {number} [numPuntos=100] - Cantidad de puntos a generar
   * @returns {number[][]} - Arreglo de pares [[x, y], ...]
   */
  function generarCurva(metodo, puntos, xMin, xMax, numPuntos) {
    if (numPuntos === undefined) numPuntos = 100;
    _validarPuntos(puntos);

    var paso = (xMax - xMin) / (numPuntos - 1);
    var xValores = [];
    for (var i = 0; i < numPuntos; i++) {
      xValores.push(xMin + i * paso);
    }

    // Seleccionar la función de interpolación adecuada
    var funcionInterp;
    switch (metodo) {
      case 'lagrange':
        funcionInterp = lagrange;
        break;
      case 'newton':
        funcionInterp = newtonDiferencias;
        break;
      case 'splines':
        funcionInterp = splinesCubicos;
        break;
      default:
        throw new Error('Método desconocido: ' + metodo + '. Use "lagrange", "newton" o "splines".');
    }

    // Evaluar en todos los puntos de una vez (eficiente)
    var resultado = funcionInterp(puntos, xValores);
    var yValores = resultado.valor; // Será un arreglo porque xValores es arreglo

    // Construir pares [x, y]
    var curva = [];
    for (var i = 0; i < numPuntos; i++) {
      curva.push([_redondear(xValores[i], 4), _redondear(yValores[i], 4)]);
    }

    return curva;
  }

  // ==========================================================================
  // 5. COMPARAR MÉTODOS
  // ==========================================================================

  /**
   * Compara los tres métodos de interpolación para los mismos datos y punto(s).
   *
   * @param {number[][]} puntos - Datos originales
   * @param {number|number[]} xEval - Valor(es) de x donde evaluar
   * @returns {{
   *   resultados: { lagrange: object, newton: object, splines: object },
   *   curvas: { lagrange: number[][], newton: number[][], splines: number[][] },
   *   comparacion: Array<{metodo:string, valorEn_x:number|number[], gradoPolinomio:number, error_estimado:number}>
   * }}
   */
  function compararMetodos(puntos, xEval) {
    _validarPuntos(puntos);
    var pts = _ordenarPuntos(puntos);
    var xMin = pts[0][0];
    var xMax = pts[pts.length - 1][0];

    // Ejecutar los tres métodos
    var resLagrange = lagrange(puntos, xEval);
    var resNewton = newtonDiferencias(puntos, xEval);
    var resSplines = splinesCubicos(puntos, xEval);

    // Generar curvas suaves para cada método
    var curvaLagrange = generarCurva('lagrange', puntos, xMin, xMax, 100);
    var curvaNewton = generarCurva('newton', puntos, xMin, xMax, 100);
    var curvaSplines = generarCurva('splines', puntos, xMin, xMax, 100);

    // Estimar errores con validación cruzada
    var errLagrange = estimarError(puntos, 'lagrange', xEval);
    var errNewton = estimarError(puntos, 'newton', xEval);
    var errSplines = estimarError(puntos, 'splines', xEval);

    // Grado del polinomio según método
    var gradoLagrange = puntos.length - 1;
    var gradoNewton = puntos.length - 1;
    var gradoSplines = 3; // Cada segmento es cúbico

    var comparacion = [
      {
        metodo: 'Lagrange',
        valorEn_x: resLagrange.valor,
        gradoPolinomio: gradoLagrange,
        error_estimado: _redondear(errLagrange.errorMedio, 4)
      },
      {
        metodo: 'Newton (Diferencias Divididas)',
        valorEn_x: resNewton.valor,
        gradoPolinomio: gradoNewton,
        error_estimado: _redondear(errNewton.errorMedio, 4)
      },
      {
        metodo: 'Splines Cúbicos Naturales',
        valorEn_x: resSplines.valor,
        gradoPolinomio: gradoSplines,
        error_estimado: _redondear(errSplines.errorMedio, 4)
      }
    ];

    return {
      resultados: {
        lagrange: resLagrange,
        newton: resNewton,
        splines: resSplines
      },
      curvas: {
        lagrange: curvaLagrange,
        newton: curvaNewton,
        splines: curvaSplines
      },
      comparacion: comparacion
    };
  }

  // ==========================================================================
  // 6. ESTIMACIÓN DE ERROR (Leave-One-Out Cross-Validation)
  // ==========================================================================

  /**
   * Estima el error de un método de interpolación usando validación cruzada
   * dejando un punto fuera (Leave-One-Out).
   *
   * @param {number[][]} puntos - Datos originales
   * @param {'lagrange'|'newton'|'splines'} metodo - Método a evaluar
   * @param {number|number[]} xEval - Punto(s) para contexto (no afecta el LOO)
   * @returns {{
   *   errorMedio: number,
   *   errorMax: number,
   *   erroresPorPunto: Array<{xOmitido:number, yReal:number, yEstimado:number, error:number}>
   * }}
   */
  function estimarError(puntos, metodo, xEval) {
    _validarPuntos(puntos);
    var pts = _ordenarPuntos(puntos);
    var n = pts.length;

    // Necesitamos al menos 3 puntos para Leave-One-Out
    if (n < 3) {
      return {
        errorMedio: 0,
        errorMax: 0,
        erroresPorPunto: []
      };
    }

    // Seleccionar la función de interpolación
    var funcionInterp;
    switch (metodo) {
      case 'lagrange': funcionInterp = lagrange; break;
      case 'newton': funcionInterp = newtonDiferencias; break;
      case 'splines': funcionInterp = splinesCubicos; break;
      default: throw new Error('Método desconocido: ' + metodo);
    }

    var errores = [];
    var sumaError = 0;
    var maxError = 0;

    // Para cada punto, omitirlo, interpolar con el resto, y medir el error
    for (var i = 0; i < n; i++) {
      // No omitir el primero ni el último para splines (necesita extremos)
      // Para Lagrange y Newton funciona con cualquiera
      var puntosReducidos = pts.filter(function (_, idx) { return idx !== i; });

      // Solo proceder si quedan al menos 2 puntos
      if (puntosReducidos.length < 2) continue;

      var xOmitido = pts[i][0];
      var yReal = pts[i][1];

      try {
        var resultado = funcionInterp(puntosReducidos, xOmitido);
        var yEstimado = resultado.valor;
        var error = Math.abs(yReal - yEstimado);

        errores.push({
          xOmitido: _redondear(xOmitido, 4),
          yReal: _redondear(yReal, 4),
          yEstimado: _redondear(yEstimado, 4),
          error: _redondear(error, 4)
        });

        sumaError += error;
        if (error > maxError) maxError = error;
      } catch (e) {
        // Si falla (ej. puntos insuficientes para splines), omitir este punto
        continue;
      }
    }

    var errorMedio = errores.length > 0 ? sumaError / errores.length : 0;

    return {
      errorMedio: _redondear(errorMedio, 4),
      errorMax: _redondear(maxError, 4),
      erroresPorPunto: errores
    };
  }

  // ==========================================================================
  // 7. FORMATEAR POLINOMIO
  // ==========================================================================

  /**
   * Formatea un polinomio como cadena legible según la forma especificada.
   *
   * @param {number[]} coeficientes - Coeficientes del polinomio
   * @param {'lagrange'|'newton'|'estandar'} forma - Forma de representación
   * @param {number[][]} [puntos] - Puntos originales (necesario para forma Newton)
   * @returns {string} - Cadena formateada, ej. 'P(x) = 0.023x³ - 1.45x² + 12.3x + 5.67'
   */
  function formatearPolinomio(coeficientes, forma, puntos) {
    if (!coeficientes || coeficientes.length === 0) {
      return 'P(x) = 0';
    }

    var resultado = 'P(x) = ';
    var terminos = [];

    switch (forma) {
      case 'estandar':
        // Coeficientes en orden descendente: [a_n, a_{n-1}, ..., a_1, a_0]
        var grado = coeficientes.length - 1;
        for (var i = 0; i < coeficientes.length; i++) {
          var c = coeficientes[i];
          if (Math.abs(c) < 1e-12) continue;
          var exp = grado - i;
          var varTermino = '';
          if (exp > 1) {
            varTermino = 'x' + _superindice(exp);
          } else if (exp === 1) {
            varTermino = 'x';
          }
          var t = _formatearTermino(c, varTermino, terminos.length === 0);
          if (t) terminos.push(t);
        }
        break;

      case 'newton':
        // Forma de Newton: c0 + c1(x-x0) + c2(x-x0)(x-x1) + ...
        if (!puntos) {
          // Sin puntos, mostrar forma genérica
          for (var i = 0; i < coeficientes.length; i++) {
            if (Math.abs(coeficientes[i]) < 1e-12) continue;
            var t = _redondear(coeficientes[i], 4).toString();
            var factores = '';
            for (var k = 0; k < i; k++) {
              factores += '(x - x' + k + ')';
            }
            terminos.push(t + factores);
          }
        } else {
          var pts = _ordenarPuntos(puntos);
          for (var i = 0; i < coeficientes.length; i++) {
            if (Math.abs(coeficientes[i]) < 1e-12) continue;
            var t = _redondear(coeficientes[i], 4).toString();
            var factores = '';
            for (var k = 0; k < i; k++) {
              var xk = pts[k][0];
              factores += xk >= 0 ? '(x - ' + xk + ')' : '(x + ' + Math.abs(xk) + ')';
            }
            terminos.push(t + factores);
          }
        }
        break;

      case 'lagrange':
        // Forma de Lagrange: suma de y_i * L_i(x)
        if (!puntos) {
          for (var i = 0; i < coeficientes.length; i++) {
            terminos.push(_redondear(coeficientes[i], 4) + '·L' + i + '(x)');
          }
        } else {
          var pts = _ordenarPuntos(puntos);
          for (var i = 0; i < Math.min(coeficientes.length, pts.length); i++) {
            var yi = pts[i][1];
            if (Math.abs(yi) < 1e-12) continue;
            // Construir L_i(x)
            var factores = [];
            for (var j = 0; j < pts.length; j++) {
              if (j === i) continue;
              var xj = pts[j][0];
              var den = pts[i][0] - xj;
              factores.push('(x - ' + xj + ')/(' + pts[i][0] + ' - ' + xj + ')');
            }
            terminos.push(_redondear(yi, 4) + '·[' + factores.join('·') + ']');
          }
        }
        break;

      default:
        return 'P(x) = (forma desconocida)';
    }

    return resultado + (terminos.length > 0 ? terminos.join(' + ') : '0');
  }

  // ==========================================================================
  // 8. GENERAR INTERPRETACIÓN AUTOMÁTICA
  // ==========================================================================

  /**
   * Genera un texto interpretativo en español sobre el resultado de una interpolación.
   *
   * @param {'lagrange'|'newton'|'splines'} metodo - Método utilizado
   * @param {object} resultado - Objeto de resultado del método
   * @param {{producto:string, unidad:string, xEval:number}} contexto - Información contextual
   * @returns {string} - Texto interpretativo en español
   */
  function generarInterpretacion(metodo, resultado, contexto) {
    var producto = contexto.producto || 'producto';
    var unidad = contexto.unidad || 'Bs/kg';
    var xEval = contexto.xEval;
    var valor = typeof resultado.valor === 'number' ? resultado.valor :
                (Array.isArray(resultado.valor) ? resultado.valor[0] : resultado.valor);

    // Nombre legible del método
    var nombreMetodo;
    switch (metodo) {
      case 'lagrange':
        nombreMetodo = 'interpolación de Lagrange';
        break;
      case 'newton':
        nombreMetodo = 'diferencias divididas de Newton';
        break;
      case 'splines':
        nombreMetodo = 'splines cúbicos naturales';
        break;
      default:
        nombreMetodo = metodo;
    }

    // Construir la interpretación
    var partes = [];

    // Frase principal con el resultado
    partes.push(
      'Usando ' + nombreMetodo + ', se estima que el precio de ' +
      producto + ' en el día ' + xEval + ' será de ' +
      _redondear(valor, 2) + ' ' + unidad + '.'
    );

    // Comentario según el método
    switch (metodo) {
      case 'lagrange':
        partes.push(
          'El polinomio de Lagrange de grado ' + (resultado.coeficientesL ? resultado.coeficientesL.length - 1 : '?') +
          ' pasa exactamente por todos los puntos de datos.'
        );
        if (resultado.coeficientesL && resultado.coeficientesL.length > 5) {
          partes.push(
            'Nota: Con ' + resultado.coeficientesL.length + ' puntos, el polinomio de grado alto puede presentar ' +
            'oscilaciones (fenómeno de Runge) fuera del rango de los datos.'
          );
        }
        break;

      case 'newton':
        partes.push(
          'La tabla de diferencias divididas permite construir el polinomio de forma incremental. ' +
          'Este método es numéricamente equivalente a Lagrange pero más eficiente computacionalmente.'
        );
        break;

      case 'splines':
        partes.push(
          'Los splines cúbicos proporcionan una curva suave que evita las oscilaciones ' +
          'típicas de los polinomios de grado alto. Cada segmento es un polinomio cúbico ' +
          'con continuidad en la primera y segunda derivada.'
        );
        if (resultado.coeficientes) {
          partes.push(
            'Se generaron ' + resultado.coeficientes.length +
            ' segmentos cúbicos para ' + (resultado.coeficientes.length + 1) + ' puntos de datos.'
          );
        }
        break;
    }

    // Advertencia sobre extrapolación
    if (typeof xEval === 'number') {
      // No tenemos acceso directo a los puntos aquí, pero podemos verificar con los coeficientes
      partes.push(
        'Los resultados son más confiables dentro del rango de los datos originales. ' +
        'La extrapolación más allá de este rango puede producir estimaciones poco realistas.'
      );
    }

    return partes.join(' ');
  }

  // ==========================================================================
  // EXPORTACIÓN GLOBAL
  // ==========================================================================

  /**
   * Objeto público expuesto en window.Interpolacion.
   * Contiene todos los métodos de interpolación y utilidades.
   */
  window.Interpolacion = {
    // Métodos principales de interpolación
    lagrange: lagrange,
    newtonDiferencias: newtonDiferencias,
    splinesCubicos: splinesCubicos,

    // Solucionador de sistema tridiagonal
    resolverTridiagonal: resolverTridiagonal,

    // Utilidades
    generarCurva: generarCurva,
    compararMetodos: compararMetodos,
    estimarError: estimarError,
    formatearPolinomio: formatearPolinomio,
    generarInterpretacion: generarInterpretacion
  };

})();
