// =============================================================================
// edo.js — Métodos numéricos para resolver Ecuaciones Diferenciales Ordinarias
// Simulación de dinámicas de crisis: agotamiento de reservas y difusión social.
// Se exporta como window.EDO
// =============================================================================

(function () {
  'use strict';

  // ===========================================================================
  // FUNCIONES AUXILIARES PARA OPERACIONES VECTORIALES
  // ===========================================================================

  /**
   * Determina si el valor dado es un arreglo (sistema) o un escalar.
   * @param {*} v - Valor a verificar
   * @returns {boolean} true si es arreglo
   */
  function esArray(v) {
    return Array.isArray(v);
  }

  /**
   * Suma elemento a elemento de dos vectores (o dos escalares).
   * @param {number|number[]} a - Primer operando
   * @param {number|number[]} b - Segundo operando
   * @returns {number|number[]} Resultado de la suma
   */
  function sumarVectores(a, b) {
    if (esArray(a)) {
      return a.map(function (ai, i) {
        return ai + b[i];
      });
    }
    return a + b;
  }

  /**
   * Multiplica un escalar por un vector (o por otro escalar).
   * @param {number} s - Escalar multiplicador
   * @param {number|number[]} v - Vector o escalar
   * @returns {number|number[]} Resultado del producto
   */
  function escalarVector(s, v) {
    if (esArray(v)) {
      return v.map(function (vi) {
        return s * vi;
      });
    }
    return s * v;
  }

  /**
   * Clona un valor: copia profunda si es arreglo, devuelve el escalar directamente.
   * @param {number|number[]} v - Valor a clonar
   * @returns {number|number[]} Copia del valor
   */
  function clonar(v) {
    if (esArray(v)) {
      return v.slice();
    }
    return v;
  }

  /**
   * Verifica estabilidad numérica: reemplaza NaN/Infinity con el último valor
   * conocido y emite una advertencia en consola.
   * @param {number|number[]} v - Valor a verificar
   * @param {number|number[]} ultimoValido - Último valor estable conocido
   * @param {number} t - Tiempo actual (para el mensaje de advertencia)
   * @returns {number|number[]} Valor corregido si fue necesario
   */
  function verificarEstabilidad(v, ultimoValido, t) {
    if (esArray(v)) {
      return v.map(function (vi, i) {
        if (!isFinite(vi) || isNaN(vi)) {
          console.warn(
            '[EDO] Inestabilidad numérica detectada en t=' +
              t.toFixed(4) +
              ', variable índice ' +
              i +
              '. Se usa último valor válido.'
          );
          return esArray(ultimoValido) ? ultimoValido[i] : ultimoValido;
        }
        return vi;
      });
    }
    if (!isFinite(v) || isNaN(v)) {
      console.warn(
        '[EDO] Inestabilidad numérica detectada en t=' +
          t.toFixed(4) +
          '. Se usa último valor válido.'
      );
      return ultimoValido;
    }
    return v;
  }

  /**
   * Extrae el valor de una variable específica de un estado (escalar o vector).
   * @param {number|number[]} y - Estado actual
   * @param {number|string} variable - Índice numérico o nombre de variable
   * @param {string[]} [nombres] - Lista de nombres de variables del modelo
   * @returns {number} Valor de la variable solicitada
   */
  function obtenerVariable(y, variable, nombres) {
    // Si es escalar, devolver directamente
    if (!esArray(y)) {
      return y;
    }
    // Si la variable es un string, buscar su índice por nombre
    if (typeof variable === 'string' && nombres) {
      var idx = nombres.indexOf(variable);
      if (idx !== -1) {
        return y[idx];
      }
    }
    // Si es un índice numérico
    if (typeof variable === 'number') {
      return y[variable];
    }
    // Por defecto, devolver la primera componente
    return y[0];
  }

  // ===========================================================================
  // MÉTODO DE EULER
  // ===========================================================================

  /**
   * Método de Euler para resolver EDOs (escalares o sistemas).
   *
   * Fórmula: y_{n+1} = y_n + h * f(t_n, y_n)
   *
   * @param {Function} f - Función f(t, y) que define la EDO: dy/dt = f(t, y)
   * @param {number|number[]} y0 - Condición inicial
   * @param {number} t0 - Tiempo inicial
   * @param {number} tFinal - Tiempo final de simulación
   * @param {number} h - Tamaño de paso
   * @returns {Object} Resultado con t, y, pasos y metadatos
   */
  function euler(f, y0, t0, tFinal, h) {
    var tActual = t0;
    var yActual = clonar(y0);
    var esSistema = esArray(y0);

    // Arreglos para almacenar la trayectoria completa
    var tArr = [t0];
    var yArr = esSistema ? [clonar(y0)] : [y0];
    var pasos = [];

    // Número de pasos a realizar
    var numPasos = Math.ceil((tFinal - t0) / h);

    for (var i = 0; i < numPasos; i++) {
      // Evaluar la derivada en el punto actual
      var fi = f(tActual, yActual);

      // Calcular el siguiente valor: y_{n+1} = y_n + h * f(t_n, y_n)
      var yNext = sumarVectores(clonar(yActual), escalarVector(h, fi));

      // Verificar estabilidad numérica
      yNext = verificarEstabilidad(yNext, yActual, tActual + h);

      // Registrar el paso con detalles completos
      pasos.push({
        ti: parseFloat(tActual.toFixed(10)),
        yi: clonar(yActual),
        fi: clonar(fi),
        yi_next: clonar(yNext)
      });

      // Avanzar al siguiente punto
      tActual = t0 + (i + 1) * h;
      yActual = yNext;

      tArr.push(parseFloat(tActual.toFixed(10)));
      yArr.push(clonar(yActual));
    }

    // Formatear la salida de y según si es sistema o escalar
    var ySalida;
    if (esSistema) {
      // Transponer: de array de vectores a array de arrays por variable
      var numVars = y0.length;
      ySalida = [];
      for (var v = 0; v < numVars; v++) {
        ySalida.push(
          yArr.map(function (yi) {
            return yi[v];
          })
        );
      }
    } else {
      ySalida = yArr;
    }

    return {
      t: tArr,
      y: ySalida,
      pasos: pasos,
      metodo: 'Euler'
    };
  }

  // ===========================================================================
  // MÉTODO DE HEUN (Euler Mejorado / RK2)
  // ===========================================================================

  /**
   * Método de Heun (predictor-corrector) para resolver EDOs.
   *
   * Predictor:  y*_{n+1} = y_n + h * f(t_n, y_n)
   * Corrector:  y_{n+1} = y_n + (h/2) * [f(t_n, y_n) + f(t_{n+1}, y*_{n+1})]
   *
   * @param {Function} f - Función f(t, y) que define la EDO
   * @param {number|number[]} y0 - Condición inicial
   * @param {number} t0 - Tiempo inicial
   * @param {number} tFinal - Tiempo final
   * @param {number} h - Tamaño de paso
   * @returns {Object} Resultado con t, y, pasos (incluyendo predictor y corrector)
   */
  function heun(f, y0, t0, tFinal, h) {
    var tActual = t0;
    var yActual = clonar(y0);
    var esSistema = esArray(y0);

    var tArr = [t0];
    var yArr = esSistema ? [clonar(y0)] : [y0];
    var pasos = [];

    var numPasos = Math.ceil((tFinal - t0) / h);

    for (var i = 0; i < numPasos; i++) {
      // Etapa 1: Evaluar la pendiente al inicio del intervalo
      var f1 = f(tActual, yActual);

      // Predictor (Euler hacia adelante)
      var yPredictor = sumarVectores(clonar(yActual), escalarVector(h, f1));

      // Etapa 2: Evaluar la pendiente al final del intervalo usando el predictor
      var tSiguiente = t0 + (i + 1) * h;
      var f2 = f(tSiguiente, yPredictor);

      // Corrector: promedio de las dos pendientes
      var pendientePromedio = escalarVector(0.5, sumarVectores(f1, f2));
      var yNext = sumarVectores(clonar(yActual), escalarVector(h, pendientePromedio));

      // Verificar estabilidad numérica
      yNext = verificarEstabilidad(yNext, yActual, tSiguiente);

      // Registrar paso con predictor y corrector
      pasos.push({
        ti: parseFloat(tActual.toFixed(10)),
        yi: clonar(yActual),
        fi: clonar(f1),
        predictor: clonar(yPredictor),
        f_predictor: clonar(f2),
        corrector: clonar(yNext),
        yi_next: clonar(yNext)
      });

      tActual = tSiguiente;
      yActual = yNext;

      tArr.push(parseFloat(tActual.toFixed(10)));
      yArr.push(clonar(yActual));
    }

    // Formatear salida
    var ySalida;
    if (esSistema) {
      var numVars = y0.length;
      ySalida = [];
      for (var v = 0; v < numVars; v++) {
        ySalida.push(
          yArr.map(function (yi) {
            return yi[v];
          })
        );
      }
    } else {
      ySalida = yArr;
    }

    return {
      t: tArr,
      y: ySalida,
      pasos: pasos,
      metodo: 'Heun'
    };
  }

  // ===========================================================================
  // MÉTODO DE RUNGE-KUTTA DE 4° ORDEN (RK4)
  // ===========================================================================

  /**
   * Método clásico de Runge-Kutta de cuarto orden.
   *
   * k1 = f(t_n, y_n)
   * k2 = f(t_n + h/2, y_n + h/2 * k1)
   * k3 = f(t_n + h/2, y_n + h/2 * k2)
   * k4 = f(t_n + h, y_n + h * k3)
   * y_{n+1} = y_n + (h/6)(k1 + 2k2 + 2k3 + k4)
   *
   * @param {Function} f - Función f(t, y)
   * @param {number|number[]} y0 - Condición inicial
   * @param {number} t0 - Tiempo inicial
   * @param {number} tFinal - Tiempo final
   * @param {number} h - Tamaño de paso
   * @returns {Object} Resultado con t, y, pasos (incluyendo k1..k4)
   */
  function rk4(f, y0, t0, tFinal, h) {
    var tActual = t0;
    var yActual = clonar(y0);
    var esSistema = esArray(y0);

    var tArr = [t0];
    var yArr = esSistema ? [clonar(y0)] : [y0];
    var pasos = [];

    var numPasos = Math.ceil((tFinal - t0) / h);

    for (var i = 0; i < numPasos; i++) {
      // Etapa 1: pendiente al inicio
      var k1 = f(tActual, yActual);

      // Etapa 2: pendiente en el punto medio usando k1
      var yK2 = sumarVectores(clonar(yActual), escalarVector(h / 2, k1));
      var k2 = f(tActual + h / 2, yK2);

      // Etapa 3: pendiente en el punto medio usando k2
      var yK3 = sumarVectores(clonar(yActual), escalarVector(h / 2, k2));
      var k3 = f(tActual + h / 2, yK3);

      // Etapa 4: pendiente al final del intervalo usando k3
      var yK4 = sumarVectores(clonar(yActual), escalarVector(h, k3));
      var k4 = f(tActual + h, yK4);

      // Combinar las cuatro pendientes con pesos 1:2:2:1
      var suma = sumarVectores(
        sumarVectores(k1, escalarVector(2, k2)),
        sumarVectores(escalarVector(2, k3), k4)
      );
      var yNext = sumarVectores(clonar(yActual), escalarVector(h / 6, suma));

      // Verificar estabilidad numérica
      var tSiguiente = t0 + (i + 1) * h;
      yNext = verificarEstabilidad(yNext, yActual, tSiguiente);

      // Registrar paso con las cuatro etapas de RK
      pasos.push({
        ti: parseFloat(tActual.toFixed(10)),
        yi: clonar(yActual),
        k1: clonar(k1),
        k2: clonar(k2),
        k3: clonar(k3),
        k4: clonar(k4),
        yi_next: clonar(yNext)
      });

      tActual = tSiguiente;
      yActual = yNext;

      tArr.push(parseFloat(tActual.toFixed(10)));
      yArr.push(clonar(yActual));
    }

    // Formatear salida
    var ySalida;
    if (esSistema) {
      var numVars = y0.length;
      ySalida = [];
      for (var v = 0; v < numVars; v++) {
        ySalida.push(
          yArr.map(function (yi) {
            return yi[v];
          })
        );
      }
    } else {
      ySalida = yArr;
    }

    return {
      t: tArr,
      y: ySalida,
      pasos: pasos,
      metodo: 'RK4'
    };
  }

  // ===========================================================================
  // MODELO A — AGOTAMIENTO DE RESERVAS
  // ===========================================================================

  /**
   * Crea el modelo de agotamiento de reservas para simulación de crisis.
   *
   * Ecuación: dR/dt = E - C(t) = E - (consumoBase + tasaConsumo * t)
   *
   * La entrada E es constante, pero el consumo C(t) crece linealmente,
   * lo que provoca un agotamiento progresivo de las reservas.
   *
   * @param {Object} params - Parámetros del modelo
   * @param {number} params.E - Entrada constante de recursos (por defecto 100)
   * @param {number} params.consumoBase - Consumo base inicial (por defecto 50)
   * @param {number} params.tasaConsumo - Tasa de incremento del consumo (por defecto 5)
   * @param {number} [params.R0] - Condición inicial R(0) (por defecto 1000)
   * @param {number} [params.tFinal] - Tiempo final de simulación (por defecto 30)
   * @returns {Object} Modelo listo para usar con resolver()
   */
  function modeloReservas(params) {
    // Valores por defecto para los parámetros
    var E = params && params.E !== undefined ? params.E : 100;
    var consumoBase =
      params && params.consumoBase !== undefined ? params.consumoBase : 50;
    var tasaConsumo =
      params && params.tasaConsumo !== undefined ? params.tasaConsumo : 5;
    var R0 = params && params.R0 !== undefined ? params.R0 : 1000;
    var tFin = params && params.tFinal !== undefined ? params.tFinal : 30;

    return {
      f: function (t, R) {
        // dR/dt = Entrada - Consumo(t)
        // El consumo aumenta linealmente con el tiempo debido a la crisis
        return E - (consumoBase + tasaConsumo * t);
      },
      y0: R0,
      t0: 0,
      tFinal: tFin,
      variables: ['R'],
      nombre: 'Reservas'
    };
  }

  // ===========================================================================
  // MODELO B — DIFUSIÓN SOCIAL (SISTEMA NMD)
  // ===========================================================================

  /**
   * Crea el modelo de difusión social NMD para simulación de crisis.
   *
   * Sistema de ecuaciones:
   *   dN/dt = -a·N·M + b·D   (Normales: se convierten en movilizados, algunos retornan)
   *   dM/dt =  a·N·M - c·M·D (Movilizados: crecen por contagio, se desmovilizan)
   *   dD/dt =  k·M - r·D      (Desmovilizados: provienen de M, se disipan)
   *
   * @param {Object} params - Parámetros del modelo
   * @param {number} params.a - Tasa de contagio social (N→M)
   * @param {number} params.b - Tasa de retorno (D→N)
   * @param {number} params.c - Tasa de desmovilización por contacto (M→D)
   * @param {number} params.k - Tasa de transición directa (M→D)
   * @param {number} params.r - Tasa de disipación de desmovilizados
   * @param {number} params.N0 - Población normal inicial
   * @param {number} params.M0 - Movilizados iniciales
   * @param {number} params.D0 - Desmovilizados iniciales
   * @param {number} [params.tFinal] - Tiempo final (por defecto 60)
   * @returns {Object} Modelo listo para usar con resolver()
   */
  function modeloSocial(params) {
    // Parámetros de tasas de interacción
    var a = params && params.a !== undefined ? params.a : 0.001;
    var b = params && params.b !== undefined ? params.b : 0.01;
    var c = params && params.c !== undefined ? params.c : 0.005;
    var k = params && params.k !== undefined ? params.k : 0.02;
    var r = params && params.r !== undefined ? params.r : 0.01;

    // Condiciones iniciales de cada población
    var N0 = params && params.N0 !== undefined ? params.N0 : 10000;
    var M0 = params && params.M0 !== undefined ? params.M0 : 100;
    var D0 = params && params.D0 !== undefined ? params.D0 : 50;
    var tFin = params && params.tFinal !== undefined ? params.tFinal : 60;

    return {
      f: function (t, Y) {
        var N = Y[0]; // Población normal
        var M = Y[1]; // Movilizados
        var D = Y[2]; // Desmovilizados

        // Interacciones entre poblaciones
        var dN = -a * N * M + b * D; // Pérdida por contagio + retorno desde D
        var dM = a * N * M - c * M * D; // Ganancia por contagio - desmovilización
        var dD = k * M - r * D; // Ingreso desde M - disipación natural

        return [dN, dM, dD];
      },
      y0: [N0, M0, D0],
      t0: 0,
      tFinal: tFin,
      variables: ['N', 'M', 'D'],
      nombre: 'Difusión Social'
    };
  }

  // ===========================================================================
  // RESOLUTOR UNIVERSAL
  // ===========================================================================

  /**
   * Resuelve un modelo usando el método numérico especificado.
   *
   * @param {string} metodo - Nombre del método: 'euler', 'heun' o 'rk4'
   * @param {Object} modelo - Modelo generado por modeloReservas() o modeloSocial()
   * @param {number} h - Tamaño de paso temporal
   * @returns {Object} Resultado del método numérico seleccionado
   */
  function resolver(metodo, modelo, h) {
    // Mapa de métodos disponibles
    var metodos = {
      euler: euler,
      heun: heun,
      rk4: rk4
    };

    // Normalizar el nombre del método a minúsculas
    var nombreMetodo = metodo.toLowerCase();

    if (!metodos[nombreMetodo]) {
      throw new Error(
        '[EDO] Método "' +
          metodo +
          '" no reconocido. Use: euler, heun o rk4.'
      );
    }

    // Ejecutar el método seleccionado con los parámetros del modelo
    var resultado = metodos[nombreMetodo](
      modelo.f,
      modelo.y0,
      modelo.t0,
      modelo.tFinal,
      h
    );

    // Agregar información del modelo al resultado
    resultado.variables = modelo.variables;
    resultado.nombreModelo = modelo.nombre;
    resultado.h = h;

    return resultado;
  }

  // ===========================================================================
  // COMPARACIÓN DE MÉTODOS
  // ===========================================================================

  /**
   * Compara todos los métodos numéricos disponibles con varios tamaños de paso.
   *
   * Permite evaluar la precisión relativa y el coste computacional de cada
   * combinación método-paso.
   *
   * @param {Object} modelo - Modelo a resolver
   * @param {number[]} hValues - Arreglo de tamaños de paso (ej. [1, 0.5, 0.25])
   * @returns {Object} Resultados organizados por método y paso, más tabla comparativa
   */
  function compararMetodos(modelo, hValues) {
    var nombresMetodos = ['euler', 'heun', 'rk4'];
    var resultados = {};
    var comparacion = [];

    // Iterar sobre cada método numérico
    nombresMetodos.forEach(function (nombreMetodo) {
      resultados[nombreMetodo] = {};

      // Para cada tamaño de paso
      hValues.forEach(function (h) {
        // Crear clave legible para el paso (reemplazar punto por nada)
        var claveH = 'h' + String(h).replace('.', '');
        var res = resolver(nombreMetodo, modelo, h);
        resultados[nombreMetodo][claveH] = res;

        // Obtener valor final para la tabla comparativa
        var valorFinal;
        if (esArray(modelo.y0)) {
          // Para sistemas, tomar el último valor de cada variable
          valorFinal = modelo.y0.map(function (_, idx) {
            return res.y[idx][res.y[idx].length - 1];
          });
        } else {
          valorFinal = res.y[res.y.length - 1];
        }

        // Agregar entrada a la tabla comparativa
        comparacion.push({
          metodo: res.metodo,
          h: h,
          valorFinal: valorFinal,
          pasos: res.pasos.length
        });
      });
    });

    return {
      resultados: resultados,
      comparacion: comparacion
    };
  }

  // ===========================================================================
  // DETECCIÓN DE UMBRALES CRÍTICOS
  // ===========================================================================

  /**
   * Detecta el momento exacto en que una variable cruza un umbral crítico.
   * Utiliza interpolación lineal entre pasos consecutivos para encontrar
   * el punto de cruce con mayor precisión.
   *
   * @param {Object} resultado - Resultado de un método numérico
   * @param {number|string} variable - Índice o nombre de la variable a monitorear
   * @param {number} umbral - Valor crítico a detectar
   * @param {string} direccion - 'below' (cae por debajo) o 'above' (sube por encima)
   * @returns {Object} Información del cruce: detectado, dia, valor, mensaje
   */
  function detectarUmbral(resultado, variable, umbral, direccion) {
    var t = resultado.t;
    var nombres = resultado.variables || [];

    // Extraer la serie temporal de la variable seleccionada
    var valores;
    if (esArray(resultado.y[0]) || (resultado.y.length > 0 && esArray(resultado.y[0]))) {
      // Sistema de EDOs: y es un array de arrays [varIdx][timeIdx]
      var idx = typeof variable === 'string' ? nombres.indexOf(variable) : variable;
      if (idx === -1) idx = 0;
      valores = resultado.y[idx];
    } else {
      // EDO escalar: y es un array simple [timeIdx]
      valores = resultado.y;
    }

    // Buscar el cruce del umbral recorriendo los datos
    for (var i = 1; i < valores.length; i++) {
      var cruce = false;

      if (direccion === 'below') {
        // Detectar cuando el valor cae por debajo del umbral
        cruce = valores[i - 1] >= umbral && valores[i] < umbral;
      } else {
        // Detectar cuando el valor sube por encima del umbral
        cruce = valores[i - 1] <= umbral && valores[i] > umbral;
      }

      if (cruce) {
        // Interpolación lineal para encontrar el día exacto del cruce
        var v0 = valores[i - 1];
        var v1 = valores[i];
        var t0 = t[i - 1];
        var t1 = t[i];

        // Fracción del intervalo donde ocurre el cruce
        var fraccion = (umbral - v0) / (v1 - v0);
        var diaCruce = t0 + fraccion * (t1 - t0);

        var nombreVar =
          typeof variable === 'string'
            ? variable
            : nombres[variable] || 'variable';

        return {
          detectado: true,
          dia: parseFloat(diaCruce.toFixed(4)),
          valor: umbral,
          mensaje:
            'La variable "' +
            nombreVar +
            '" cruza el umbral de ' +
            umbral +
            ' el día ' +
            diaCruce.toFixed(2) +
            ' (' +
            (direccion === 'below' ? 'por debajo' : 'por encima') +
            ').'
        };
      }
    }

    // No se detectó cruce en el rango simulado
    var nombreVarFin =
      typeof variable === 'string'
        ? variable
        : nombres[variable] || 'variable';

    return {
      detectado: false,
      dia: null,
      valor: valores[valores.length - 1],
      mensaje:
        'La variable "' +
        nombreVarFin +
        '" no alcanzó el umbral de ' +
        umbral +
        ' durante la simulación. Valor final: ' +
        valores[valores.length - 1].toFixed(2) +
        '.'
    };
  }

  // ===========================================================================
  // ERROR RELATIVO ENTRE DOS RESULTADOS
  // ===========================================================================

  /**
   * Calcula el error relativo punto a punto entre dos resultados numéricos.
   *
   * El error relativo se define como |y1 - y2| / |y2| cuando y2 ≠ 0,
   * y como |y1 - y2| cuando y2 = 0 (para evitar división por cero).
   *
   * @param {Object} resultado1 - Primer resultado (referencia o menos preciso)
   * @param {Object} resultado2 - Segundo resultado (referencia o más preciso)
   * @returns {number[]|number[][]} Arreglo de errores relativos por paso
   */
  function errorRelativo(resultado1, resultado2) {
    var y1 = resultado1.y;
    var y2 = resultado2.y;

    // Determinar si estamos con un sistema o una EDO escalar
    var esSistemaResult = esArray(y1[0]);

    if (esSistemaResult) {
      // Para sistemas: calcular error por cada variable
      var numVars = y1.length;
      var errores = [];

      for (var v = 0; v < numVars; v++) {
        var errorVar = [];
        // Usar la longitud mínima entre ambos resultados
        var len = Math.min(y1[v].length, y2[v].length);
        for (var i = 0; i < len; i++) {
          var ref = Math.abs(y2[v][i]);
          if (ref > 1e-15) {
            // Evitar división por valores muy pequeños
            errorVar.push(Math.abs(y1[v][i] - y2[v][i]) / ref);
          } else {
            errorVar.push(Math.abs(y1[v][i] - y2[v][i]));
          }
        }
        errores.push(errorVar);
      }
      return errores;
    } else {
      // Para EDOs escalares: un solo arreglo de errores
      var errorArr = [];
      var longitud = Math.min(y1.length, y2.length);
      for (var j = 0; j < longitud; j++) {
        var referencia = Math.abs(y2[j]);
        if (referencia > 1e-15) {
          errorArr.push(Math.abs(y1[j] - y2[j]) / referencia);
        } else {
          errorArr.push(Math.abs(y1[j] - y2[j]));
        }
      }
      return errorArr;
    }
  }

  // ===========================================================================
  // GENERACIÓN DE INTERPRETACIÓN AUTOMÁTICA
  // ===========================================================================

  /**
   * Genera una interpretación textual automática de los resultados de simulación.
   *
   * Analiza los resultados de distintos métodos y produce un texto descriptivo
   * que compara predicciones y destaca hallazgos clave.
   *
   * @param {Object} modelo - Modelo utilizado (reservas o social)
   * @param {Object} resultados - Objeto con resultados por método (clave=nombre del método)
   * @param {number} [umbral] - Valor umbral para análisis de cruce
   * @returns {string} Texto interpretativo en español
   */
  function generarInterpretacion(modelo, resultados, umbral) {
    var texto = '';
    var esReservas = modelo.nombre === 'Reservas';

    if (esReservas) {
      // --- Interpretación para el modelo de reservas ---
      texto += 'Análisis del Modelo de Agotamiento de Reservas:\n\n';

      // Valor umbral por defecto: nivel crítico en 0
      var umbralR = umbral !== undefined ? umbral : 0;
      var predicciones = [];

      // Analizar cada método para detectar el día crítico
      var metodoKeys = Object.keys(resultados);
      metodoKeys.forEach(function (clave) {
        var res = resultados[clave];
        var det = detectarUmbral(res, 0, umbralR, 'below');
        predicciones.push({
          metodo: res.metodo,
          h: res.h,
          deteccion: det,
          valorFinal: res.y[res.y.length - 1]
        });
      });

      // Construir el texto de interpretación
      if (predicciones.length > 1) {
        // Comparar predicciones de distintos métodos
        var conDeteccion = predicciones.filter(function (p) {
          return p.deteccion.detectado;
        });

        if (conDeteccion.length > 0) {
          texto += 'La reserva alcanza nivel crítico (' + umbralR + '):\n';
          conDeteccion.forEach(function (p) {
            texto +=
              '  - Según ' +
              p.metodo +
              ' (h=' +
              p.h +
              '): día ' +
              p.deteccion.dia.toFixed(2) +
              '\n';
          });

          // Comparar precisión entre métodos
          if (conDeteccion.length >= 2) {
            var primero = conDeteccion[0];
            var ultimo = conDeteccion[conDeteccion.length - 1];
            var diff = Math.abs(primero.deteccion.dia - ultimo.deteccion.dia);
            texto +=
              '\nLa diferencia entre ' +
              primero.metodo +
              ' y ' +
              ultimo.metodo +
              ' es de ' +
              diff.toFixed(2) +
              ' días, mostrando que el método de mayor orden es más estable y proporciona estimaciones más precisas.\n';
          }
        } else {
          texto +=
            'Las reservas no se agotan durante el período simulado. Valor final: ' +
            predicciones[0].valorFinal.toFixed(2) +
            '.\n';
        }
      } else if (predicciones.length === 1) {
        // Solo un método
        var p = predicciones[0];
        if (p.deteccion.detectado) {
          texto += p.deteccion.mensaje + '\n';
        } else {
          texto += p.deteccion.mensaje + '\n';
        }
      }
    } else {
      // --- Interpretación para el modelo de difusión social ---
      texto += 'Análisis del Modelo de Difusión Social (NMD):\n\n';

      var umbralM = umbral !== undefined ? umbral : 5000;
      var prediccionesS = [];

      var clavesMetodo = Object.keys(resultados);
      clavesMetodo.forEach(function (clave) {
        var res = resultados[clave];
        // Monitorear la variable M (movilizados, índice 1)
        var det = detectarUmbral(res, 'M', umbralM, 'above');
        // Obtener valor máximo de movilizados
        var valoresM = res.y[1]; // Índice 1 = Movilizados
        var maxM = Math.max.apply(null, valoresM);
        var diaMax = res.t[valoresM.indexOf(maxM)];

        prediccionesS.push({
          metodo: res.metodo,
          h: res.h,
          deteccion: det,
          maxM: maxM,
          diaMax: diaMax,
          valorFinalN: res.y[0][res.y[0].length - 1],
          valorFinalM: res.y[1][res.y[1].length - 1],
          valorFinalD: res.y[2][res.y[2].length - 1]
        });
      });

      // Descripción general de la dinámica
      if (prediccionesS.length > 0) {
        var ref = prediccionesS[0];
        texto +=
          'El nivel de movilización alcanza un máximo de ' +
          ref.maxM.toFixed(0) +
          ' personas aproximadamente el día ' +
          ref.diaMax.toFixed(1) +
          '.\n';

        // Fase inicial
        texto +=
          'La fase inicial muestra crecimiento exponencial en la movilización debido al efecto de contagio social (término a·N·M).\n';

        // Detección de umbral
        var conUmbral = prediccionesS.filter(function (p) {
          return p.deteccion.detectado;
        });
        if (conUmbral.length > 0) {
          texto +=
            '\nEl nivel de movilización supera las ' +
            umbralM +
            ' personas:\n';
          conUmbral.forEach(function (p) {
            texto +=
              '  - ' + p.metodo + ' (h=' + p.h + '): día ' + p.deteccion.dia.toFixed(2) + '\n';
          });
        }

        // Estado final
        texto +=
          '\nEstado final de la simulación (' +
          ref.metodo +
          '):\n' +
          '  - Normales (N): ' +
          ref.valorFinalN.toFixed(0) +
          '\n' +
          '  - Movilizados (M): ' +
          ref.valorFinalM.toFixed(0) +
          '\n' +
          '  - Desmovilizados (D): ' +
          ref.valorFinalD.toFixed(0) +
          '\n';

        // Comparación de métodos si hay varios
        if (prediccionesS.length > 1) {
          texto += '\nComparación de métodos para el valor máximo de M:\n';
          prediccionesS.forEach(function (p) {
            texto +=
              '  - ' +
              p.metodo +
              ' (h=' +
              p.h +
              '): máximo = ' +
              p.maxM.toFixed(0) +
              ' el día ' +
              p.diaMax.toFixed(1) +
              '\n';
          });
        }
      }
    }

    return texto;
  }

  // ===========================================================================
  // DATOS PARA RETRATO DE FASES
  // ===========================================================================

  /**
   * Extrae datos para graficar un retrato de fases (una variable vs otra).
   *
   * Útil para visualizar la trayectoria del sistema en el espacio de fases,
   * por ejemplo M vs N en el modelo de difusión social.
   *
   * @param {Object} resultado - Resultado de un método numérico (debe ser un sistema)
   * @param {number|string} varX - Índice o nombre de la variable para el eje X
   * @param {number|string} varY - Índice o nombre de la variable para el eje Y
   * @returns {Object} Datos {x: [], y: []} para graficar
   */
  function generarDatosFases(resultado, varX, varY) {
    var nombres = resultado.variables || [];

    // Resolver índices de las variables
    var idxX = typeof varX === 'string' ? nombres.indexOf(varX) : varX;
    var idxY = typeof varY === 'string' ? nombres.indexOf(varY) : varY;

    // Validar que los índices sean válidos
    if (idxX === -1) idxX = 0;
    if (idxY === -1) idxY = 1;

    // Verificar que el resultado contenga datos de sistema
    if (!esArray(resultado.y[0]) && !esArray(resultado.y)) {
      console.warn(
        '[EDO] generarDatosFases requiere un resultado de sistema de EDOs.'
      );
      return { x: [], y: [] };
    }

    // Extraer las series de ambas variables
    var datosX = resultado.y[idxX] || [];
    var datosY = resultado.y[idxY] || [];

    return {
      x: datosX.slice(),
      y: datosY.slice()
    };
  }

  // ===========================================================================
  // EXPORTACIÓN GLOBAL — window.EDO
  // ===========================================================================

  window.EDO = {
    // Métodos numéricos principales
    euler: euler,
    heun: heun,
    rk4: rk4,

    // Modelos de simulación de crisis
    modeloReservas: modeloReservas,
    modeloSocial: modeloSocial,

    // Resolutor universal
    resolver: resolver,

    // Utilidades de análisis
    compararMetodos: compararMetodos,
    detectarUmbral: detectarUmbral,
    errorRelativo: errorRelativo,
    generarInterpretacion: generarInterpretacion,
    generarDatosFases: generarDatosFases,

    // Funciones auxiliares de vectores (expuestas para uso externo)
    sumarVectores: sumarVectores,
    escalarVector: escalarVector,
    esArray: esArray
  };
})();
