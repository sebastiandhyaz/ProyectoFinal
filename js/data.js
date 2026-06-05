// ============================================================================
// data.js — Datos predefinidos para el proyecto de simulación de crisis
// ============================================================================
// Este archivo contiene todos los datos de ejemplo organizados por módulo
// numérico: sistemas lineales, raíces, interpolación, integración y EDOs.
// Se exporta en el objeto global window.AppData.
// ============================================================================

window.AppData = {

  // ==========================================================================
  // Módulo 1: Sistemas de Ecuaciones Lineales
  // Contexto: Distribución de combustible desde 3 plantas a 3 zonas
  // ==========================================================================
  sistemasLineales: {
    nombre: 'Distribución de Combustible',
    descripcion:
      'Distribución óptima de combustible desde 3 plantas hacia zonas Norte, Centro y Sur. ' +
      'El sistema Ax = b modela las restricciones de capacidad y demanda de cada ruta.',

    // Matriz de coeficientes A (3×3) — restricciones de distribución
    matrizA: [
      [4, -1, 0],
      [-1, 4, -1],
      [0, -1, 3]
    ],

    // Vector de términos independientes — demandas de cada zona
    vectorB: [15, 10, 10],

    // Vector inicial para métodos iterativos
    x0: [0, 0, 0],

    // Parámetros de convergencia
    tolerancia: 0.0001,
    maxIteraciones: 100,

    // Factor de relajación para el método SOR
    omega: 1.25,

    // Etiquetas descriptivas
    plantas: ['Planta A', 'Planta B', 'Planta C'],
    zonas: ['Norte', 'Centro', 'Sur'],

    // Escenario alternativo: ruta bloqueada
    escenarioBloqueo: {
      matrizA: [
        [4, -1, 0],
        [-1, 4, 0],   // Ruta Centro→Sur bloqueada (coeficiente 0)
        [0, 0, 3]
      ],
      vectorB: [15, 10, 5],
      descripcion: 'Ruta Centro-Sur bloqueada por desastre natural'
    }
  },

  // ==========================================================================
  // Módulo 2: Búsqueda de Raíces
  // Contexto: Encontrar puntos críticos en modelos económicos de crisis
  // ==========================================================================
  raices: {
    funciones: [
      {
        id: 'reservas',
        nombre: 'Reservas Críticas',
        expresion: '1000*exp(-0.1*x) + 50*x - 500',
        expresionTexto: 'f(x) = 1000·e^(-0.1x) + 50x - 500',
        derivada: '-100*exp(-0.1*x) + 50',
        intervalo: [0, 20],
        x0: 5,
        x1: 10,
        descripcion:
          'Punto donde las reservas de combustible alcanzan un nivel crítico. ' +
          'La exponencial modela el agotamiento natural y el término lineal la reposición.'
      },
      {
        id: 'precio',
        nombre: 'Equilibrio de Precio',
        expresion: 'x^3 - 20*x^2 + 100*x - 100',
        expresionTexto: 'f(x) = x³ - 20x² + 100x - 100',
        derivada: '3*x^2 - 40*x + 100',
        intervalo: [0, 5],
        x0: 2,
        x1: 4,
        descripcion:
          'Punto de equilibrio en el modelo cúbico de precios. ' +
          'Las raíces representan los precios donde oferta y demanda se igualan.'
      },
      {
        id: 'demanda',
        nombre: 'Umbral de Demanda',
        expresion: '200/(1+exp(-0.5*(x-10))) - 150',
        expresionTexto: 'f(x) = 200/(1+e^(-0.5(x-10))) - 150',
        derivada: '100*exp(-0.5*(x-10))/1+exp(-0.5*(x-10))^2',
        intervalo: [0, 25],
        x0: 8,
        x1: 15,
        descripcion:
          'Punto donde la demanda supera el umbral de capacidad de distribución. ' +
          'La sigmoide modela el crecimiento acelerado de la demanda durante la crisis.'
      }
    ],

    // Parámetros globales de convergencia
    tolerancia: 0.00001,
    maxIteraciones: 100
  },

  // ==========================================================================
  // Módulo 3: Interpolación
  // Contexto: Evolución de precios de alimentos básicos durante la crisis
  // ==========================================================================
  interpolacion: {
    productos: [
      {
        id: 'papa',
        nombre: 'Papa',
        unidad: 'Bs/kg',
        // Pares [día, precio] — datos observados
        datos: [
          [1, 8],
          [5, 10],
          [10, 13],
          [15, 16],
          [20, 19],
          [30, 22]
        ],
        color: '#e53e3e'   // Rojo
      },
      {
        id: 'arroz',
        nombre: 'Arroz',
        unidad: 'Bs/kg',
        datos: [
          [1, 12],
          [7, 15],
          [14, 18],
          [21, 22],
          [28, 26]
        ],
        color: '#38b2ac'   // Verde azulado
      },
      {
        id: 'azucar',
        nombre: 'Azúcar',
        unidad: 'Bs/kg',
        datos: [
          [1, 6],
          [10, 9],
          [20, 14],
          [30, 20]
        ],
        color: '#ed8936'   // Naranja
      }
    ]
  },

  // ==========================================================================
  // Módulo 4: Integración Numérica
  // Contexto: Cálculo de costos acumulados durante el período de crisis
  // ==========================================================================
  integracion: {
    funciones: [
      {
        id: 'precio_papa',
        nombre: 'Precio Papa p(t)',
        expresion: '8 + 0.5*t + 0.01*t*t',
        expresionTexto: 'p(t) = 8 + 0.5t + 0.01t²',
        a: 1,                   // Límite inferior (día 1)
        b: 30,                  // Límite superior (día 30)
        n: 10,                  // Número de subintervalos por defecto
        precioConstante: 8,     // Precio de referencia sin inflación
        descripcion:
          'Costo acumulado del kilogramo de papa durante 30 días de crisis. ' +
          'El término cuadrático refleja la aceleración inflacionaria.'
      },
      {
        id: 'canasta',
        nombre: 'Canasta Básica c(t)',
        expresion: '150 + 5*t + 0.1*t*t',
        expresionTexto: 'c(t) = 150 + 5t + 0.1t²',
        a: 1,
        b: 30,
        n: 12,
        precioConstante: 150,
        descripcion:
          'Costo acumulado de la canasta básica familiar durante un mes. ' +
          'La función cuadrática modela el encarecimiento progresivo de los alimentos.'
      }
    ]
  },

  // ==========================================================================
  // Módulo 5: Ecuaciones Diferenciales Ordinarias (EDOs)
  // Contexto: Evolución temporal de variables de crisis
  // ==========================================================================
  edo: {
    modelos: [
      {
        id: 'reservas',
        nombre: 'Vaciado de Reservas',
        descripcion:
          "R'(t) = E - C(t), donde E=entrada constante de suministro, " +
          "C(t)=50+5t representa el consumo creciente por la crisis. " +
          "Modela cómo se agotan las reservas cuando la demanda supera el abastecimiento.",

        // Parámetros del modelo
        parametros: { E: 100 },

        // Condición inicial: R(0) = 1000 unidades de reserva
        condicionInicial: { R: 1000 },

        // Horizonte temporal
        tFinal: 30,
        h: 1,         // Paso de integración (1 día)

        // Variables del sistema
        variables: ['R'],

        // Alerta cuando las reservas caen bajo el umbral
        umbralCritico: {
          variable: 'R',
          valor: 100,
          mensaje: 'Las reservas han caído por debajo del nivel crítico (100 unidades)'
        },

        // No es un sistema acoplado
        sistema: false
      },
      {
        id: 'social',
        nombre: 'Difusión Social (NMD)',
        descripcion:
          "N'=-aNM+bD, M'=aNM-cMD, D'=kM-rD. " +
          "Modelo epidemiológico de difusión de opinión y descontento social. " +
          "N=neutrales, M=movilizados, D=descontentos.",

        // Tasas del modelo
        parametros: {
          a: 0.001,   // Tasa de movilización (contacto neutral-movilizado)
          b: 0.01,    // Tasa de recuperación de descontentos a neutrales
          c: 0.005,   // Tasa de desmovilización por descontento
          k: 0.02,    // Tasa de generación de descontento
          r: 0.01     // Tasa de resolución de descontento
        },

        // Condiciones iniciales — población segmentada
        condicionInicial: { N: 10000, M: 100, D: 50 },

        tFinal: 60,
        h: 0.5,      // Paso de integración (medio día)

        variables: ['N', 'M', 'D'],

        umbralCritico: {
          variable: 'M',
          valor: 5000,
          mensaje: 'El nivel de movilización supera el umbral crítico (5000 personas)'
        },

        // Es un sistema acoplado de 3 ecuaciones
        sistema: true
      }
    ]
  },

  // ==========================================================================
  // Textos de teoría para cada módulo
  // Descripciones completas del fundamento matemático
  // ==========================================================================
  teoria: {
    sistemasLineales:
      'Los sistemas de ecuaciones lineales Ax = b aparecen naturalmente al modelar ' +
      'redes de distribución, donde cada ecuación representa una restricción de ' +
      'balance en un nodo de la red. En el contexto de crisis, la distribución ' +
      'eficiente de recursos escasos (combustible, alimentos, medicinas) requiere ' +
      'resolver estos sistemas para encontrar las cantidades óptimas a enviar por ' +
      'cada ruta.\n\n' +
      'Métodos directos como la eliminación de Gauss resuelven el sistema en un ' +
      'número finito de pasos, pero pueden ser costosos para sistemas grandes. ' +
      'Los métodos iterativos (Jacobi, Gauss-Seidel, SOR) parten de una ' +
      'aproximación inicial y la refinan sucesivamente, lo cual es ventajoso ' +
      'cuando la matriz es dispersa (muchos ceros) como ocurre en redes reales.\n\n' +
      'El método de Jacobi actualiza cada variable usando los valores de la ' +
      'iteración anterior. Gauss-Seidel mejora la convergencia usando valores ' +
      'ya actualizados en la misma iteración. SOR (Sobre-Relajación Sucesiva) ' +
      'acelera Gauss-Seidel mediante un factor de relajación ω ∈ (0, 2).',

    raices:
      'Encontrar las raíces de una ecuación f(x) = 0 permite identificar puntos ' +
      'críticos en modelos de crisis: el momento en que las reservas se agotan, ' +
      'el precio de equilibrio entre oferta y demanda, o el umbral donde la ' +
      'demanda supera la capacidad del sistema.\n\n' +
      'El método de Bisección divide repetidamente un intervalo [a,b] donde ' +
      'f cambia de signo, garantizando convergencia pero con velocidad lineal. ' +
      'El método de Newton-Raphson usa la derivada f\'(x) para hacer ' +
      'aproximaciones tangenciales con convergencia cuadrática, pero requiere ' +
      'una buena estimación inicial y que f\'(x) ≠ 0. El método de la Secante ' +
      'aproxima la derivada con diferencias finitas, evitando calcularla ' +
      'explícitamente.\n\n' +
      'En el contexto de la crisis, estos métodos permiten responder preguntas ' +
      'como: ¿En qué día se agotarán las reservas? ¿A qué precio se estabilizará ' +
      'el mercado? ¿Cuándo la demanda superará la capacidad de respuesta?',

    interpolacion:
      'La interpolación permite construir una función continua a partir de datos ' +
      'discretos observados, como los precios diarios de alimentos durante una ' +
      'crisis. Esto permite estimar valores en puntos intermedios donde no se ' +
      'tienen mediciones directas.\n\n' +
      'La interpolación de Lagrange construye un polinomio que pasa exactamente ' +
      'por todos los puntos dados usando una combinación de polinomios base. ' +
      'La interpolación de Newton utiliza diferencias divididas para construir ' +
      'el polinomio de forma incremental, facilitando agregar nuevos puntos. ' +
      'Los splines cúbicos dividen el dominio en subintervalos y ajustan ' +
      'polinomios cúbicos que se unen suavemente en los nodos.\n\n' +
      'En la gestión de crisis, la interpolación ayuda a estimar precios en ' +
      'días sin registro, detectar tendencias de aceleración y proyectar el ' +
      'comportamiento a corto plazo del mercado de alimentos.',

    integracion:
      'La integración numérica permite calcular el valor acumulado de una ' +
      'función cuando la integral analítica no está disponible o la función ' +
      'se conoce solo en puntos discretos. En crisis económicas, calcular ' +
      '∫p(t)dt da el costo total acumulado de un producto durante un período.\n\n' +
      'El método del Trapecio aproxima el área bajo la curva con trapecios, ' +
      'tiene error O(h²). La regla de Simpson usa parábolas para una mejor ' +
      'aproximación con error O(h⁴), pero requiere un número par de ' +
      'subintervalos. Simpson 3/8 usa polinomios cúbicos con número de ' +
      'subintervalos múltiplo de 3.\n\n' +
      'La comparación entre el costo acumulado real (integral de p(t)) y el ' +
      'costo con precio constante (precio_base × días) cuantifica el impacto ' +
      'económico de la inflación durante la crisis.',

    edo:
      'Las ecuaciones diferenciales ordinarias modelan la evolución temporal de ' +
      'sistemas dinámicos. En crisis, permiten simular cómo cambian las reservas, ' +
      'la población afectada o el descontento social a lo largo del tiempo.\n\n' +
      'El método de Euler (orden 1) avanza la solución usando la pendiente en el ' +
      'punto actual: y_{n+1} = y_n + h·f(t_n, y_n). Es simple pero puede ser ' +
      'impreciso con pasos grandes. Runge-Kutta de orden 2 (Heun) promedia ' +
      'pendientes al inicio y al final del paso. Runge-Kutta de orden 4 (RK4) ' +
      'combina 4 evaluaciones de la pendiente para lograr error O(h⁴), ' +
      'ofreciendo un excelente balance entre precisión y costo computacional.\n\n' +
      'El modelo de vaciado de reservas muestra cómo el consumo creciente agota ' +
      'los suministros. El modelo social NMD (Neutrales-Movilizados-Descontentos) ' +
      'captura la dinámica de propagación del descontento social en crisis, ' +
      'análogo a modelos epidemiológicos SIR.'
  }
};

// ============================================================================
// Evaluador de expresiones matemáticas
// Permite evaluar de forma segura las expresiones almacenadas como texto
// ============================================================================

/**
 * Evalúa una expresión matemática reemplazando la variable indicada por su valor.
 * @param {string} expr - Expresión JavaScript válida (ej: '1000*exp(-0.1*x)')
 * @param {string} varName - Nombre de la variable a sustituir (ej: 'x', 't')
 * @param {number} value - Valor numérico para la variable
 * @returns {number} Resultado de la evaluación, o NaN si ocurre un error
 */
window.AppData.evalExpresion = function(expr, varName, value) {
  try {
    // Construir una función dinámica que recibe la variable y devuelve el resultado
    // Se utiliza new Function para evitar eval() directo y permitir scope controlado
    var fn = new Function(varName, 'return ' + expr);
    var resultado = fn(value);

    // Validar que el resultado sea un número finito
    if (typeof resultado !== 'number' || !isFinite(resultado)) {
      return NaN;
    }
    return resultado;
  } catch (e) {
    // Registrar error en consola para depuración sin romper la aplicación
    console.warn('Error al evaluar expresión "' + expr + '" con ' + varName + '=' + value + ':', e.message);
    return NaN;
  }
};

/**
 * Evalúa la expresión con múltiples variables (útil para sistemas de EDOs).
 * @param {string} expr - Expresión JavaScript válida
 * @param {Object} variables - Objeto con pares nombre:valor (ej: {N:1000, M:100, D:50})
 * @returns {number} Resultado de la evaluación, o NaN si ocurre un error
 */
window.AppData.evalExpresionMultiple = function(expr, variables) {
  try {
    // Obtener nombres y valores de las variables
    var nombres = Object.keys(variables);
    var valores = Object.values(variables);

    // Construir la función con todas las variables como parámetros
    var fn = new Function(...nombres, 'return ' + expr);
    var resultado = fn(...valores);

    if (typeof resultado !== 'number' || !isFinite(resultado)) {
      return NaN;
    }
    return resultado;
  } catch (e) {
    console.warn('Error al evaluar expresión múltiple:', e.message);
    return NaN;
  }
};

// ============================================================================
// Funciones auxiliares para acceso rápido a datos
// ============================================================================

/**
 * Obtiene una función de raíces por su identificador.
 * @param {string} id - Identificador de la función ('reservas', 'precio', 'demanda')
 * @returns {Object|null} Objeto con la configuración de la función, o null si no existe
 */
window.AppData.obtenerFuncionRaiz = function(id) {
  var funciones = window.AppData.raices.funciones;
  for (var i = 0; i < funciones.length; i++) {
    if (funciones[i].id === id) {
      return funciones[i];
    }
  }
  return null;
};

/**
 * Obtiene un producto de interpolación por su identificador.
 * @param {string} id - Identificador del producto ('papa', 'arroz', 'azucar')
 * @returns {Object|null} Objeto con los datos del producto, o null si no existe
 */
window.AppData.obtenerProducto = function(id) {
  var productos = window.AppData.interpolacion.productos;
  for (var i = 0; i < productos.length; i++) {
    if (productos[i].id === id) {
      return productos[i];
    }
  }
  return null;
};

/**
 * Obtiene una función de integración por su identificador.
 * @param {string} id - Identificador ('precio_papa', 'canasta')
 * @returns {Object|null} Objeto con la configuración de la función, o null si no existe
 */
window.AppData.obtenerFuncionIntegracion = function(id) {
  var funciones = window.AppData.integracion.funciones;
  for (var i = 0; i < funciones.length; i++) {
    if (funciones[i].id === id) {
      return funciones[i];
    }
  }
  return null;
};

/**
 * Obtiene un modelo de EDO por su identificador.
 * @param {string} id - Identificador del modelo ('reservas', 'social')
 * @returns {Object|null} Objeto con la configuración del modelo, o null si no existe
 */
window.AppData.obtenerModeloEDO = function(id) {
  var modelos = window.AppData.edo.modelos;
  for (var i = 0; i < modelos.length; i++) {
    if (modelos[i].id === id) {
      return modelos[i];
    }
  }
  return null;
};

/**
 * Obtiene el texto teórico de un módulo.
 * @param {string} modulo - Nombre del módulo ('sistemasLineales', 'raices', etc.)
 * @returns {string} Texto de la teoría, o cadena vacía si no existe
 */
window.AppData.obtenerTeoria = function(modulo) {
  return window.AppData.teoria[modulo] || '';
};
