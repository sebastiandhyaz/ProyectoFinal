// =============================================================================
// sistemas_lineales.js
// Módulo de métodos numéricos para resolver sistemas de ecuaciones lineales.
// Contexto: Distribución de combustible desde 3 plantas a 3 zonas
// (Norte, Centro, Sur) en simulación de crisis.
// =============================================================================

(function () {
  'use strict';

  // ===========================================================================
  // FUNCIONES UTILITARIAS
  // ===========================================================================

  /**
   * Calcula la norma euclidiana (L2) de un vector.
   * @param {number[]} v - Vector de entrada.
   * @returns {number} Norma euclidiana del vector.
   */
  function normaVector(v) {
    if (!v || v.length === 0) {
      throw new Error('Error: el vector está vacío o no está definido.');
    }
    let suma = 0;
    for (let i = 0; i < v.length; i++) {
      suma += v[i] * v[i];
    }
    return Math.sqrt(suma);
  }

  /**
   * Multiplica una matriz por un vector: resultado = A * x.
   * @param {number[][]} A - Matriz de coeficientes (NxN).
   * @param {number[]} x - Vector (N).
   * @returns {number[]} Vector resultado (N).
   */
  function multiplicarMatrizVector(A, x) {
    const n = A.length;
    // Validar dimensiones
    if (x.length !== n) {
      throw new Error(
        'Error: las dimensiones de la matriz y el vector no son compatibles. ' +
        'Matriz: ' + n + 'x' + A[0].length + ', Vector: ' + x.length
      );
    }
    const resultado = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < A[i].length; j++) {
        resultado[i] += A[i][j] * x[j];
      }
    }
    return resultado;
  }

  /**
   * Verifica si una matriz es cuadrada.
   * @param {number[][]} A - Matriz a verificar.
   */
  function validarMatrizCuadrada(A) {
    if (!A || A.length === 0) {
      throw new Error('Error: la matriz está vacía o no está definida.');
    }
    const n = A.length;
    for (let i = 0; i < n; i++) {
      if (!A[i] || A[i].length !== n) {
        throw new Error(
          'Error: la matriz no es cuadrada. Se esperaban ' + n +
          ' columnas en la fila ' + i + ', pero se encontraron ' +
          (A[i] ? A[i].length : 0) + '.'
        );
      }
    }
  }

  /**
   * Verifica que el vector b tenga la dimensión correcta respecto a la matriz A.
   * @param {number[][]} A - Matriz de coeficientes.
   * @param {number[]} b - Vector de términos independientes.
   */
  function validarDimensiones(A, b) {
    validarMatrizCuadrada(A);
    if (!b || b.length !== A.length) {
      throw new Error(
        'Error: la dimensión del vector b (' + (b ? b.length : 0) +
        ') no coincide con la dimensión de la matriz A (' + A.length + ').'
      );
    }
  }

  /**
   * Crea una copia profunda de un vector numérico.
   * @param {number[]} v - Vector a copiar.
   * @returns {number[]} Copia independiente del vector.
   */
  function copiarVector(v) {
    return v.slice();
  }

  /**
   * Crea una copia profunda de una matriz numérica.
   * @param {number[][]} M - Matriz a copiar.
   * @returns {number[][]} Copia independiente de la matriz.
   */
  function copiarMatriz(M) {
    return M.map(function (fila) {
      return fila.slice();
    });
  }

  /**
   * Calcula el error relativo entre dos vectores sucesivos.
   * Si la norma del nuevo vector es cero, retorna la norma de la diferencia.
   * @param {number[]} xNuevo - Vector de la iteración actual.
   * @param {number[]} xAnterior - Vector de la iteración anterior.
   * @returns {number} Error relativo.
   */
  function calcularErrorRelativo(xNuevo, xAnterior) {
    const n = xNuevo.length;
    const diferencia = new Array(n);
    for (let i = 0; i < n; i++) {
      diferencia[i] = xNuevo[i] - xAnterior[i];
    }
    const normaDif = normaVector(diferencia);
    const normaNuevo = normaVector(xNuevo);
    // Evitar división por cero
    if (normaNuevo === 0) {
      return normaDif;
    }
    return normaDif / normaNuevo;
  }

  /**
   * Verifica si la matriz es diagonalmente dominante.
   * Una matriz es diagonalmente dominante si |a_ii| > Σ|a_ij| para todo i (j≠i).
   * @param {number[][]} A - Matriz a verificar.
   * @returns {boolean} true si la matriz es diagonalmente dominante.
   */
  function esDiagonalmenteDominante(A) {
    validarMatrizCuadrada(A);
    const n = A.length;
    for (let i = 0; i < n; i++) {
      let sumFila = 0;
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          sumFila += Math.abs(A[i][j]);
        }
      }
      // Dominancia estricta: el elemento diagonal debe ser mayor
      if (Math.abs(A[i][i]) <= sumFila) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifica si los métodos iterativos (Jacobi, Gauss-Seidel, SOR) convergerán.
   * Comprueba dominancia diagonal y elementos diagonales no nulos.
   * @param {number[][]} A - Matriz de coeficientes.
   * @returns {{ convergera: boolean, razon: string }}
   */
  function verificarConvergencia(A) {
    validarMatrizCuadrada(A);
    const n = A.length;

    // Verificar si hay ceros en la diagonal principal
    for (let i = 0; i < n; i++) {
      if (A[i][i] === 0) {
        return {
          convergera: false,
          razon: 'La diagonal principal contiene un cero en la posición (' +
                 (i + 1) + ',' + (i + 1) + '). Los métodos iterativos requieren ' +
                 'elementos diagonales no nulos.'
        };
      }
    }

    // Verificar dominancia diagonal
    if (esDiagonalmenteDominante(A)) {
      return {
        convergera: true,
        razon: 'La matriz es diagonalmente dominante, lo que garantiza la ' +
               'convergencia de los métodos iterativos (Jacobi, Gauss-Seidel, SOR).'
      };
    }

    // Si no es diagonalmente dominante, la convergencia no está garantizada
    return {
      convergera: false,
      razon: 'La matriz NO es diagonalmente dominante. La convergencia de los ' +
             'métodos iterativos no está garantizada, aunque podría converger ' +
             'dependiendo del radio espectral de la matriz de iteración.'
    };
  }

  /**
   * Calcula el número de condición de una matriz usando iteración de potencias.
   * El número de condición se aproxima como |λ_max| / |λ_min|.
   * @param {number[][]} A - Matriz cuadrada.
   * @returns {{ valor: number, interpretacion: string }}
   */
  function calcularNumeroCondicion(A) {
    validarMatrizCuadrada(A);
    const n = A.length;
    const maxIterPotencia = 200;
    const tolPotencia = 1e-10;

    // --- Iteración de potencias para encontrar el mayor valor propio ---
    let v = new Array(n);
    for (let i = 0; i < n; i++) {
      v[i] = 1.0; // Vector inicial uniforme
    }
    let lambdaMax = 0;

    for (let iter = 0; iter < maxIterPotencia; iter++) {
      // Multiplicar A * v
      var w = multiplicarMatrizVector(A, v);
      // Encontrar el componente de mayor magnitud (valor propio aproximado)
      var lambdaNuevo = 0;
      for (let i = 0; i < n; i++) {
        if (Math.abs(w[i]) > Math.abs(lambdaNuevo)) {
          lambdaNuevo = w[i];
        }
      }
      // Evitar división por cero
      if (lambdaNuevo === 0) {
        break;
      }
      // Normalizar el vector
      for (let i = 0; i < n; i++) {
        v[i] = w[i] / lambdaNuevo;
      }
      // Verificar convergencia del autovalor
      if (Math.abs(lambdaNuevo - lambdaMax) < tolPotencia) {
        lambdaMax = lambdaNuevo;
        break;
      }
      lambdaMax = lambdaNuevo;
    }

    // --- Iteración de potencias inversa para encontrar el menor valor propio ---
    // Necesitamos resolver A*w = v en cada iteración, usamos LU para eficiencia
    var lambdaMin = 0;
    try {
      // Descomponer A en LU para resolver sistemas rápidamente
      var luData = _descomponerLU(A);
      var vMin = new Array(n);
      for (let i = 0; i < n; i++) {
        vMin[i] = 1.0;
      }

      for (let iter = 0; iter < maxIterPotencia; iter++) {
        // Resolver A * w = vMin mediante sustitución con LU
        var y = _sustitucionAdelante(luData.L, vMin);
        var wMin = _sustitucionAtras(luData.U, y);

        // Encontrar el componente de mayor magnitud
        var lambdaInvNuevo = 0;
        for (let i = 0; i < n; i++) {
          if (Math.abs(wMin[i]) > Math.abs(lambdaInvNuevo)) {
            lambdaInvNuevo = wMin[i];
          }
        }
        if (lambdaInvNuevo === 0) {
          break;
        }
        // Normalizar
        for (let i = 0; i < n; i++) {
          vMin[i] = wMin[i] / lambdaInvNuevo;
        }
        // El valor propio más pequeño de A es 1/lambdaInvNuevo
        var lambdaMinActual = 1.0 / lambdaInvNuevo;
        if (Math.abs(lambdaMinActual - lambdaMin) < tolPotencia) {
          lambdaMin = lambdaMinActual;
          break;
        }
        lambdaMin = lambdaMinActual;
      }
    } catch (e) {
      // Si la descomposición LU falla, la matriz es singular → condición infinita
      return {
        valor: Infinity,
        interpretacion: 'mal condicionada (la matriz es singular o casi singular)'
      };
    }

    // Número de condición = |λ_max| / |λ_min|
    var condicion;
    if (Math.abs(lambdaMin) < 1e-15) {
      condicion = Infinity;
    } else {
      condicion = Math.abs(lambdaMax) / Math.abs(lambdaMin);
    }

    // Generar interpretación según el valor
    var interpretacion;
    if (condicion < 100) {
      interpretacion = 'bien condicionada';
    } else if (condicion < 1000) {
      interpretacion = 'moderadamente condicionada';
    } else {
      interpretacion = 'mal condicionada';
    }

    return {
      valor: condicion,
      interpretacion: interpretacion
    };
  }

  // ===========================================================================
  // MÉTODOS ITERATIVOS
  // ===========================================================================

  /**
   * Método de Jacobi para resolver Ax = b.
   * En cada iteración, calcula todos los componentes usando los valores
   * de la iteración anterior (no usa valores actualizados).
   *
   * @param {number[][]} A - Matriz de coeficientes (NxN).
   * @param {number[]} b - Vector de términos independientes (N).
   * @param {number[]} x0 - Vector inicial de aproximación (N).
   * @param {number} tol - Tolerancia para el criterio de convergencia.
   * @param {number} maxIter - Número máximo de iteraciones permitidas.
   * @returns {{ solucion: number[], iteraciones: number, historial: Array, convergencia: boolean }}
   */
  function jacobi(A, b, x0, tol, maxIter) {
    validarDimensiones(A, b);
    const n = A.length;

    // Verificar que la diagonal no tenga ceros
    for (let i = 0; i < n; i++) {
      if (A[i][i] === 0) {
        throw new Error(
          'Error en Jacobi: el elemento diagonal A[' + i + '][' + i +
          '] es cero. El método de Jacobi requiere elementos diagonales no nulos.'
        );
      }
    }

    let xAnterior = copiarVector(x0);
    let xNuevo = new Array(n).fill(0);
    const historial = [];
    let convergencia = false;

    for (let iter = 1; iter <= maxIter; iter++) {
      // Calcular cada componente del nuevo vector
      for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            // Usar valores de la iteración ANTERIOR (característica de Jacobi)
            suma += A[i][j] * xAnterior[j];
          }
        }
        xNuevo[i] = (b[i] - suma) / A[i][i];
      }

      // Calcular el error relativo de esta iteración
      const error = calcularErrorRelativo(xNuevo, xAnterior);

      // Registrar en el historial para graficar después
      historial.push({
        iter: iter,
        x: copiarVector(xNuevo),
        error: error
      });

      // Verificar si se alcanzó la tolerancia deseada
      if (error < tol) {
        convergencia = true;
        return {
          solucion: copiarVector(xNuevo),
          iteraciones: iter,
          historial: historial,
          convergencia: true
        };
      }

      // Preparar la siguiente iteración
      xAnterior = copiarVector(xNuevo);
    }

    // Se alcanzó el máximo de iteraciones sin converger
    return {
      solucion: copiarVector(xNuevo),
      iteraciones: maxIter,
      historial: historial,
      convergencia: false
    };
  }

  /**
   * Método de Gauss-Seidel para resolver Ax = b.
   * Similar a Jacobi, pero usa los valores actualizados inmediatamente
   * conforme se van calculando dentro de la misma iteración.
   *
   * @param {number[][]} A - Matriz de coeficientes (NxN).
   * @param {number[]} b - Vector de términos independientes (N).
   * @param {number[]} x0 - Vector inicial de aproximación (N).
   * @param {number} tol - Tolerancia para el criterio de convergencia.
   * @param {number} maxIter - Número máximo de iteraciones permitidas.
   * @returns {{ solucion: number[], iteraciones: number, historial: Array, convergencia: boolean }}
   */
  function gaussSeidel(A, b, x0, tol, maxIter) {
    validarDimensiones(A, b);
    const n = A.length;

    // Verificar que la diagonal no tenga ceros
    for (let i = 0; i < n; i++) {
      if (A[i][i] === 0) {
        throw new Error(
          'Error en Gauss-Seidel: el elemento diagonal A[' + i + '][' + i +
          '] es cero. Se requieren elementos diagonales no nulos.'
        );
      }
    }

    let x = copiarVector(x0);
    const historial = [];

    for (let iter = 1; iter <= maxIter; iter++) {
      const xAnterior = copiarVector(x);

      for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            // Usar el valor más reciente disponible (ya actualizado si j < i)
            suma += A[i][j] * x[j];
          }
        }
        x[i] = (b[i] - suma) / A[i][i];
      }

      // Calcular el error relativo
      const error = calcularErrorRelativo(x, xAnterior);

      historial.push({
        iter: iter,
        x: copiarVector(x),
        error: error
      });

      // Verificar convergencia
      if (error < tol) {
        return {
          solucion: copiarVector(x),
          iteraciones: iter,
          historial: historial,
          convergencia: true
        };
      }
    }

    // No convergió dentro del límite de iteraciones
    return {
      solucion: copiarVector(x),
      iteraciones: maxIter,
      historial: historial,
      convergencia: false
    };
  }

  /**
   * Método SOR (Sobre-Relajación Sucesiva) para resolver Ax = b.
   * Es una variante de Gauss-Seidel con un factor de relajación omega.
   * omega = 1 equivale a Gauss-Seidel; omega > 1 es sobre-relajación;
   * omega < 1 es sub-relajación.
   *
   * @param {number[][]} A - Matriz de coeficientes (NxN).
   * @param {number[]} b - Vector de términos independientes (N).
   * @param {number[]} x0 - Vector inicial de aproximación (N).
   * @param {number} tol - Tolerancia para el criterio de convergencia.
   * @param {number} maxIter - Número máximo de iteraciones permitidas.
   * @param {number} omega - Factor de relajación (0 < omega < 2).
   * @returns {{ solucion: number[], iteraciones: number, historial: Array, convergencia: boolean }}
   */
  function sor(A, b, x0, tol, maxIter, omega) {
    validarDimensiones(A, b);
    const n = A.length;

    // Validar el factor de relajación
    if (omega <= 0 || omega >= 2) {
      throw new Error(
        'Error en SOR: el factor de relajación omega (' + omega +
        ') debe estar en el intervalo abierto (0, 2) para garantizar convergencia.'
      );
    }

    // Verificar que la diagonal no tenga ceros
    for (let i = 0; i < n; i++) {
      if (A[i][i] === 0) {
        throw new Error(
          'Error en SOR: el elemento diagonal A[' + i + '][' + i +
          '] es cero. Se requieren elementos diagonales no nulos.'
        );
      }
    }

    let x = copiarVector(x0);
    const historial = [];

    for (let iter = 1; iter <= maxIter; iter++) {
      const xAnterior = copiarVector(x);

      for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            suma += A[i][j] * x[j];
          }
        }
        // Calcular el valor de Gauss-Seidel
        const xGS = (b[i] - suma) / A[i][i];
        // Aplicar la relajación: mezcla entre valor anterior y Gauss-Seidel
        x[i] = (1 - omega) * xAnterior[i] + omega * xGS;
      }

      // Calcular el error relativo
      const error = calcularErrorRelativo(x, xAnterior);

      historial.push({
        iter: iter,
        x: copiarVector(x),
        error: error
      });

      // Verificar convergencia
      if (error < tol) {
        return {
          solucion: copiarVector(x),
          iteraciones: iter,
          historial: historial,
          convergencia: true
        };
      }
    }

    return {
      solucion: copiarVector(x),
      iteraciones: maxIter,
      historial: historial,
      convergencia: false
    };
  }

  // ===========================================================================
  // DESCOMPOSICIÓN LU (Doolittle)
  // ===========================================================================

  /**
   * Realiza la descomposición LU de Doolittle (función interna).
   * L: triangular inferior con 1s en la diagonal.
   * U: triangular superior.
   * @param {number[][]} A - Matriz cuadrada a descomponer.
   * @returns {{ L: number[][], U: number[][] }}
   */
  function _descomponerLU(A) {
    const n = A.length;
    // Inicializar L como identidad y U como copia de A
    const L = [];
    const U = [];
    for (let i = 0; i < n; i++) {
      L.push(new Array(n).fill(0));
      U.push(new Array(n).fill(0));
      L[i][i] = 1; // Diagonal de L es siempre 1 en Doolittle
    }

    for (let i = 0; i < n; i++) {
      // Calcular los elementos de la fila i de U
      for (let j = i; j < n; j++) {
        let suma = 0;
        for (let k = 0; k < i; k++) {
          suma += L[i][k] * U[k][j];
        }
        U[i][j] = A[i][j] - suma;
      }

      // Verificar que el pivote no sea cero
      if (Math.abs(U[i][i]) < 1e-15) {
        throw new Error(
          'Error en descomposición LU: pivote nulo o casi nulo en la posición (' +
          (i + 1) + ',' + (i + 1) + '). La matriz puede ser singular.'
        );
      }

      // Calcular los elementos de la columna i de L (debajo de la diagonal)
      for (let j = i + 1; j < n; j++) {
        let suma = 0;
        for (let k = 0; k < i; k++) {
          suma += L[j][k] * U[k][i];
        }
        L[j][i] = (A[j][i] - suma) / U[i][i];
      }
    }

    return { L: L, U: U };
  }

  /**
   * Sustitución hacia adelante: resuelve Ly = b donde L es triangular inferior.
   * @param {number[][]} L - Matriz triangular inferior.
   * @param {number[]} b - Vector de términos independientes.
   * @returns {number[]} Vector solución y.
   */
  function _sustitucionAdelante(L, b) {
    const n = L.length;
    const y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < i; j++) {
        suma += L[i][j] * y[j];
      }
      y[i] = (b[i] - suma) / L[i][i];
    }
    return y;
  }

  /**
   * Sustitución hacia atrás: resuelve Ux = y donde U es triangular superior.
   * @param {number[][]} U - Matriz triangular superior.
   * @param {number[]} y - Vector de términos independientes.
   * @returns {number[]} Vector solución x.
   */
  function _sustitucionAtras(U, y) {
    const n = U.length;
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      if (Math.abs(U[i][i]) < 1e-15) {
        throw new Error(
          'Error en sustitución hacia atrás: el pivote U[' + i + '][' + i +
          '] es cero o casi cero. La matriz es singular.'
        );
      }
      let suma = 0;
      for (let j = i + 1; j < n; j++) {
        suma += U[i][j] * x[j];
      }
      x[i] = (y[i] - suma) / U[i][i];
    }
    return x;
  }

  /**
   * Descomposición LU completa con pasos detallados para resolver Ax = b.
   * Algoritmo de Doolittle: L tiene 1s en la diagonal, U es triangular superior.
   *
   * @param {number[][]} A - Matriz de coeficientes (NxN).
   * @param {number[]} b - Vector de términos independientes (N).
   * @returns {{ solucion: number[], L: number[][], U: number[][], pasos: Array }}
   */
  function descomposicionLU(A, b) {
    validarDimensiones(A, b);
    const n = A.length;
    const pasos = [];

    // Paso 1: Realizar la descomposición
    pasos.push({
      descripcion: 'Inicio de la descomposición LU (Doolittle). Descomponiendo A = L·U...',
      matrizL: null,
      matrizU: null
    });

    const luResultado = _descomponerLU(A);
    const L = luResultado.L;
    const U = luResultado.U;

    pasos.push({
      descripcion: 'Descomposición completada. L es triangular inferior con 1s en la diagonal; U es triangular superior.',
      matrizL: copiarMatriz(L),
      matrizU: copiarMatriz(U)
    });

    // Paso 2: Sustitución hacia adelante (Ly = b)
    pasos.push({
      descripcion: 'Resolviendo Ly = b mediante sustitución hacia adelante...',
      matrizL: copiarMatriz(L),
      matrizU: copiarMatriz(U)
    });

    const y = _sustitucionAdelante(L, b);

    pasos.push({
      descripcion: 'Sustitución hacia adelante completada. Vector intermedio y = [' +
                   y.map(function (v) { return v.toFixed(6); }).join(', ') + '].',
      matrizL: copiarMatriz(L),
      matrizU: copiarMatriz(U)
    });

    // Paso 3: Sustitución hacia atrás (Ux = y)
    pasos.push({
      descripcion: 'Resolviendo Ux = y mediante sustitución hacia atrás...',
      matrizL: copiarMatriz(L),
      matrizU: copiarMatriz(U)
    });

    const x = _sustitucionAtras(U, y);

    pasos.push({
      descripcion: 'Sustitución hacia atrás completada. Solución x = [' +
                   x.map(function (v) { return v.toFixed(6); }).join(', ') + '].',
      matrizL: copiarMatriz(L),
      matrizU: copiarMatriz(U)
    });

    return {
      solucion: x,
      L: L,
      U: U,
      pasos: pasos
    };
  }

  // ===========================================================================
  // GRADIENTE CONJUGADO
  // ===========================================================================

  /**
   * Método del Gradiente Conjugado para resolver Ax = b.
   * Diseñado para matrices simétricas y definidas positivas.
   * Converge en a lo sumo N iteraciones para una matriz NxN (en aritmética exacta).
   *
   * @param {number[][]} A - Matriz de coeficientes (NxN), debe ser simétrica y definida positiva.
   * @param {number[]} b - Vector de términos independientes (N).
   * @param {number[]} x0 - Vector inicial de aproximación (N).
   * @param {number} tol - Tolerancia para el criterio de convergencia.
   * @param {number} maxIter - Número máximo de iteraciones permitidas.
   * @returns {{ solucion: number[], iteraciones: number, historial: Array, convergencia: boolean }}
   */
  function gradienteConjugado(A, b, x0, tol, maxIter) {
    validarDimensiones(A, b);
    const n = A.length;

    let x = copiarVector(x0);
    // Calcular el residuo inicial: r = b - A*x0
    let Ax = multiplicarMatrizVector(A, x);
    let r = new Array(n);
    for (let i = 0; i < n; i++) {
      r[i] = b[i] - Ax[i];
    }

    // Dirección de búsqueda inicial: p = r
    let p = copiarVector(r);
    // Producto punto del residuo consigo mismo
    let rsViejo = _productoPunto(r, r);

    const historial = [];

    // Verificar si la solución inicial ya es suficientemente buena
    if (Math.sqrt(rsViejo) < tol) {
      historial.push({
        iter: 0,
        x: copiarVector(x),
        error: Math.sqrt(rsViejo)
      });
      return {
        solucion: copiarVector(x),
        iteraciones: 0,
        historial: historial,
        convergencia: true
      };
    }

    for (let iter = 1; iter <= maxIter; iter++) {
      // Calcular A * p (dirección de búsqueda)
      var Ap = multiplicarMatrizVector(A, p);
      // Calcular el tamaño del paso: alpha = (r^T * r) / (p^T * A * p)
      var pAp = _productoPunto(p, Ap);

      if (Math.abs(pAp) < 1e-15) {
        // Evitar división por cero; la dirección de búsqueda se agotó
        historial.push({
          iter: iter,
          x: copiarVector(x),
          error: Math.sqrt(rsViejo)
        });
        return {
          solucion: copiarVector(x),
          iteraciones: iter,
          historial: historial,
          convergencia: Math.sqrt(rsViejo) < tol
        };
      }

      var alpha = rsViejo / pAp;

      // Actualizar la solución: x = x + alpha * p
      var xAnterior = copiarVector(x);
      for (let i = 0; i < n; i++) {
        x[i] = x[i] + alpha * p[i];
      }
      // Actualizar el residuo: r = r - alpha * A * p
      for (let i = 0; i < n; i++) {
        r[i] = r[i] - alpha * Ap[i];
      }

      var rsNuevo = _productoPunto(r, r);
      var error = calcularErrorRelativo(x, xAnterior);

      historial.push({
        iter: iter,
        x: copiarVector(x),
        error: error
      });

      // Verificar convergencia basada en la norma del residuo
      if (Math.sqrt(rsNuevo) < tol) {
        return {
          solucion: copiarVector(x),
          iteraciones: iter,
          historial: historial,
          convergencia: true
        };
      }

      // Calcular el factor beta para la nueva dirección conjugada
      var beta = rsNuevo / rsViejo;
      // Actualizar la dirección de búsqueda: p = r + beta * p
      for (let i = 0; i < n; i++) {
        p[i] = r[i] + beta * p[i];
      }

      rsViejo = rsNuevo;
    }

    return {
      solucion: copiarVector(x),
      iteraciones: maxIter,
      historial: historial,
      convergencia: false
    };
  }

  /**
   * Producto punto (producto escalar) de dos vectores.
   * @param {number[]} a - Primer vector.
   * @param {number[]} b - Segundo vector.
   * @returns {number} Producto punto a · b.
   */
  function _productoPunto(a, b) {
    let suma = 0;
    for (let i = 0; i < a.length; i++) {
      suma += a[i] * b[i];
    }
    return suma;
  }

  // ===========================================================================
  // GENERACIÓN DE INTERPRETACIONES
  // ===========================================================================

  /**
   * Genera un texto de interpretación automática de los resultados.
   * Incluye análisis de estabilidad y condicionamiento del sistema.
   *
   * @param {string} metodo - Nombre del método utilizado ('Jacobi', 'Gauss-Seidel', etc.).
   * @param {object} resultado - Objeto resultado del método (debe tener solucion, etc.).
   * @param {object} contexto - Información contextual { plantas: string[], zonas: string[] }.
   * @returns {string} Texto interpretativo en español.
   */
  function generarInterpretacion(metodo, resultado, contexto) {
    const zonas = (contexto && contexto.zonas) || ['Norte', 'Centro', 'Sur'];
    const plantas = (contexto && contexto.plantas) || ['Planta 1', 'Planta 2', 'Planta 3'];
    const solucion = resultado.solucion;

    // Construir la parte de distribución de combustible
    let textoDistribucion = 'La distribución óptima de combustible asigna ';
    const partes = [];
    for (let i = 0; i < solucion.length && i < zonas.length; i++) {
      partes.push(solucion[i].toFixed(2) + ' litros a Zona ' + zonas[i]);
    }
    // Si hay más incógnitas que zonas definidas, añadir las extras
    for (let i = zonas.length; i < solucion.length; i++) {
      partes.push(solucion[i].toFixed(2) + ' litros a Variable ' + (i + 1));
    }
    textoDistribucion += partes.join(', ') + '.';

    // Información de convergencia (para métodos iterativos)
    let textoConvergencia = '';
    if (resultado.iteraciones !== undefined) {
      if (resultado.convergencia) {
        textoConvergencia = ' El sistema convergió en ' + resultado.iteraciones +
          ' iteraciones usando el método de ' + metodo + '.';
      } else {
        textoConvergencia = ' ADVERTENCIA: El sistema NO convergió tras ' +
          resultado.iteraciones + ' iteraciones con el método de ' + metodo +
          '. Los resultados pueden no ser precisos.';
      }
    } else {
      // Método directo (LU)
      textoConvergencia = ' La solución fue calculada de forma directa mediante ' +
        metodo + '.';
    }

    // Análisis de estabilidad basado en el número de condición (si el contexto lo provee)
    let textoEstabilidad = '';
    if (contexto && contexto.matrizA) {
      try {
        var condicion = calcularNumeroCondicion(contexto.matrizA);
        textoEstabilidad = ' Análisis de estabilidad: el número de condición es ' +
          condicion.valor.toFixed(2) + ', lo que indica que la matriz está ' +
          condicion.interpretacion + '.';
        if (condicion.interpretacion === 'mal condicionada') {
          textoEstabilidad += ' Se recomienda precaución: pequeños cambios en los ' +
            'datos de entrada podrían provocar grandes variaciones en la solución.';
        } else if (condicion.interpretacion === 'bien condicionada') {
          textoEstabilidad += ' El sistema es numéricamente estable y la solución ' +
            'es confiable.';
        }
      } catch (e) {
        textoEstabilidad = ' No se pudo calcular el número de condición: ' + e.message;
      }
    }

    // Análisis de valores negativos (no tiene sentido distribuir litros negativos)
    let textoAdvertencias = '';
    const valoresNegativos = solucion.filter(function (v) { return v < 0; });
    if (valoresNegativos.length > 0) {
      textoAdvertencias = ' NOTA: Se encontraron valores negativos en la solución (' +
        valoresNegativos.map(function (v) { return v.toFixed(2); }).join(', ') +
        '). Esto podría indicar un exceso de oferta o restricciones inconsistentes ' +
        'en la distribución de combustible.';
    }

    return textoDistribucion + textoConvergencia + textoEstabilidad + textoAdvertencias;
  }

  // ===========================================================================
  // SIMULACIÓN DE BLOQUEO DE RUTA
  // ===========================================================================

  /**
   * Simula el bloqueo de una ruta entre una planta y una zona.
   * Establece en cero los coeficientes correspondientes a la ruta bloqueada.
   *
   * @param {number[][]} A - Matriz original de coeficientes.
   * @param {number[]} b - Vector original de términos independientes.
   * @param {number} rutaBloqueada - Índice de la ruta a bloquear (0-indexed).
   *   Se interpreta como la fila/columna correspondiente.
   * @returns {{ A: number[][], b: number[] }} Matrices modificadas.
   */
  function simularBloqueo(A, b, rutaBloqueada) {
    validarDimensiones(A, b);
    const n = A.length;

    // Validar índice de la ruta
    if (rutaBloqueada < 0 || rutaBloqueada >= n) {
      throw new Error(
        'Error en simulación de bloqueo: índice de ruta (' + rutaBloqueada +
        ') fuera de rango. Debe estar entre 0 y ' + (n - 1) + '.'
      );
    }

    // Crear copias para no modificar los originales
    const Amod = copiarMatriz(A);
    const bMod = copiarVector(b);

    // Poner en cero la fila de la ruta bloqueada (la planta no puede enviar)
    for (let j = 0; j < n; j++) {
      Amod[rutaBloqueada][j] = 0;
    }
    // Poner en cero la columna de la ruta bloqueada (la zona no recibe de esa ruta)
    for (let i = 0; i < n; i++) {
      Amod[i][rutaBloqueada] = 0;
    }

    // Mantener un 1 en la diagonal para evitar singularidad completa
    // Esto permite que el sistema aún sea resoluble (la variable toma valor 0)
    Amod[rutaBloqueada][rutaBloqueada] = 1;
    // El término independiente se anula para que la solución sea 0 en esa ruta
    bMod[rutaBloqueada] = 0;

    return {
      A: Amod,
      b: bMod
    };
  }

  // ===========================================================================
  // EXPORTACIÓN DEL MÓDULO AL ESPACIO GLOBAL
  // ===========================================================================

  /**
   * Objeto principal del módulo exportado en window.SistemasLineales.
   * Contiene todos los métodos de resolución y funciones utilitarias.
   */
  window.SistemasLineales = {
    // --- Métodos de resolución ---
    jacobi: jacobi,
    gaussSeidel: gaussSeidel,
    sor: sor,
    descomposicionLU: descomposicionLU,
    gradienteConjugado: gradienteConjugado,

    // --- Funciones utilitarias ---
    calcularNumeroCondicion: calcularNumeroCondicion,
    esDiagonalmenteDominante: esDiagonalmenteDominante,
    verificarConvergencia: verificarConvergencia,
    multiplicarMatrizVector: multiplicarMatrizVector,
    normaVector: normaVector,
    generarInterpretacion: generarInterpretacion,
    simularBloqueo: simularBloqueo
  };

})();
